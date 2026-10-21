/**
 * Career repository — goals, score snapshots and persisted roadmaps.
 *
 * The engines in @neevpass/domain are pure; this file persists their outputs
 * under the same ownership rules as every other profile write.
 */

import { AppError, type CareerScore, type RoadmapPlan } from '@neevpass/domain';

import type { ProfileScope } from './access';
import { assertRevisionCurrent } from './profile';
import { prisma, type Prisma } from './index';

export interface StoredGoal {
  readonly id: string;
  readonly roleId: string;
  readonly roleSlug: string;
  readonly roleName: string;
  readonly status: 'ACTIVE' | 'ACHIEVED' | 'PAUSED' | 'DROPPED';
  readonly targetDate?: string;
  readonly note?: string;
}

export async function findActiveGoal(profileId: string): Promise<StoredGoal | undefined> {
  const row = await prisma.careerGoal.findFirst({
    where: { profileId, status: 'ACTIVE', deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    include: { role: { select: { slug: true, name: true } } },
  });
  if (!row) return undefined;

  return {
    id: row.id,
    roleId: row.roleId,
    roleSlug: row.role.slug,
    roleName: row.role.name,
    status: row.status,
    ...(row.targetDate ? { targetDate: row.targetDate.toISOString().slice(0, 7) } : {}),
    ...(row.note ? { note: row.note } : {}),
  };
}

export async function findLatestGoal(profileId: string): Promise<StoredGoal | undefined> {
  const row = await prisma.careerGoal.findFirst({
    where: { profileId, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    include: { role: { select: { slug: true, name: true } } },
  });
  if (!row) return undefined;

  return {
    id: row.id,
    roleId: row.roleId,
    roleSlug: row.role.slug,
    roleName: row.role.name,
    status: row.status,
    ...(row.targetDate ? { targetDate: row.targetDate.toISOString().slice(0, 7) } : {}),
    ...(row.note ? { note: row.note } : {}),
  };
}

/**
 * Sets (or replaces) the student's active target role. Any previous ACTIVE
 * goal is marked PAUSED — the history stays, one goal is front-of-mind.
 *
 * A goal is profile-relevant intent, so the write carries the same
 * compare-and-swap as every profile edit: two tabs cannot silently re-goal
 * behind each other.
 */
export async function setActiveGoal(
  scope: ProfileScope,
  input: { roleId: string; note?: string },
): Promise<StoredGoal> {
  const role = await prisma.role.findUnique({ where: { id: input.roleId }, select: { id: true, slug: true, name: true } });
  if (!role) throw AppError.validation('That role does not exist.', { roleId: input.roleId });

  try {
    const goal = await prisma.$transaction(async (tx) => {
      await tx.careerGoal.updateMany({
        where: { profileId: scope.profileId, status: 'ACTIVE', deletedAt: null },
        data: { status: 'PAUSED' },
      });

      const existing = await tx.careerGoal.findFirst({
        where: { profileId: scope.profileId, roleId: input.roleId, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
      });

      const result = existing
        ? await tx.careerGoal.update({ where: { id: existing.id }, data: { status: 'ACTIVE', note: input.note ?? null } })
        : await tx.careerGoal.create({
            data: {
              profileId: scope.profileId,
              roleId: input.roleId,
              status: 'ACTIVE',
              note: input.note ?? null,
            },
          });

      await assertRevisionCurrent(tx, scope);
      return result;
    });

    return {
      id: goal.id,
      roleId: role.id,
      roleSlug: role.slug,
      roleName: role.name,
      status: goal.status,
      ...(goal.note ? { note: goal.note } : {}),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.internal('Failed while setting the career goal.', error);
  }
}

/**
 * Appends a score snapshot. History is never overwritten — the rubric version
 * and the profile revision travel with every row so a diff is explainable.
 */
export async function saveScoreSnapshot(scope: ProfileScope, score: CareerScore, profileRevision: number): Promise<void> {
  await prisma.careerScoreSnapshot.create({
    data: {
      profileId: scope.profileId,
      score: score.score,
      breakdown: score.factors as unknown as Prisma.InputJsonValue,
      rubricVersion: score.rubricVersion,
      profileRevision,
    },
  });
}

export interface StoredScoreSnapshot {
  readonly score: number;
  readonly rubricVersion: number;
  readonly profileRevision: number;
  readonly computedAt: Date;
}

export async function listScoreHistory(profileId: string, limit = 30): Promise<readonly StoredScoreSnapshot[]> {
  const rows = await prisma.careerScoreSnapshot.findMany({
    where: { profileId },
    orderBy: { computedAt: 'desc' },
    take: limit,
    select: { score: true, rubricVersion: true, profileRevision: true, computedAt: true },
  });
  return rows;
}

// ---------------------------------------------------------------------------
// Roadmap persistence
// ---------------------------------------------------------------------------

export interface StoredRoadmap {
  readonly version: number;
  readonly items: readonly {
    readonly skillId: string;
    readonly order: number;
    readonly status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED';
    readonly reason: string;
    readonly resourceId?: string;
    readonly resourceTitle?: string;
    readonly resourceUrl?: string;
  }[];
}

/** The roadmap for one goal; undefined when the goal has never been generated. */
export async function findRoadmapForGoal(goalId: string): Promise<StoredRoadmap | undefined> {
  const row = await prisma.roadmap.findUnique({
    where: { goalId },
    include: {
      items: {
        orderBy: { order: 'asc' },
        include: { resource: { select: { title: true, url: true } } },
      },
    },
  });
  if (!row) return undefined;

  return {
    version: row.version,
    items: row.items.map((item) => ({
      skillId: item.skillId,
      order: item.order,
      status: item.status,
      reason: item.reason,
      ...(item.resourceId ? { resourceId: item.resourceId } : {}),
      ...(item.resource ? { resourceTitle: item.resource.title, resourceUrl: item.resource.url } : {}),
    })),
  };
}

/**
 * Persists (or regenerates) the roadmap for a goal. Regeneration merges
 * statuses by skill id — checking an item off survives a recompute — and bumps
 * the roadmap version. Pure db layer; the caller computed the plan.
 */
export async function persistRoadmap(
  scope: ProfileScope,
  goalId: string,
  roleId: string,
  plan: RoadmapPlan,
): Promise<StoredRoadmap> {
  const roadmap = await prisma.$transaction(async (tx) => {
    const existing = await tx.roadmap.findUnique({
      where: { goalId },
      include: { items: { select: { skillId: true, status: true } } },
    });

    if (!existing) {
      await tx.roadmap.create({
        data: {
          profileId: scope.profileId,
          goalId,
          roleId,
          version: 1,
          items: {
            create: plan.items.map((item) => ({
              skillId: item.skillId,
              order: item.order,
              status: item.status,
              reason: item.reason,
              ...(item.resourceId ? { resourceId: item.resourceId } : {}),
            })),
          },
        },
      });
      return { version: 1 };
    }

    const statuses = new Map(existing.items.map((item) => [item.skillId, item.status]));
    await tx.roadmapItem.deleteMany({ where: { roadmapId: existing.id } });
    await tx.roadmapItem.createMany({
      data: plan.items.map((item) => ({
        roadmapId: existing.id,
        skillId: item.skillId,
        order: item.order,
        status: statuses.get(item.skillId) ?? item.status,
        reason: item.reason,
        ...(item.resourceId ? { resourceId: item.resourceId } : {}),
      })),
    });
    await tx.roadmap.update({ where: { id: existing.id }, data: { version: { increment: 1 } } });
    return { version: existing.version + 1 };
  });

  const stored = await findRoadmapForGoal(goalId);
  if (!stored) throw AppError.internal('Roadmap disappeared during generation.', { goalId });
  return { version: roadmap.version, items: stored.items };
}

/** Flips one item's status on the goal's roadmap. */
export async function updateRoadmapItemStatus(
  scope: ProfileScope,
  goalId: string,
  skillId: string,
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED',
): Promise<boolean> {
  const roadmap = await prisma.roadmap.findFirst({
    where: { goalId, profileId: scope.profileId },
    select: { id: true },
  });
  if (!roadmap) return false;

  const updated = await prisma.roadmapItem.updateMany({
    where: { roadmapId: roadmap.id, skillId },
    data: { status },
  });
  return updated.count > 0;
}
