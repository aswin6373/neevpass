/**
 * Documents repository — resumes and portfolios.
 *
 * A resume row holds document CONFIGURATION (normalised at read time by
 * @neevpass/docgen), never a copy of the profile: rendering always runs from
 * the current aggregate, so a resume can never go stale.
 *
 * A profile owns at most one live portfolio; publishing claims an address
 * (unique slug) that is synced onto the profile's career page at the same
 * time, so both public URLs agree about who owns them.
 */

import { AppError } from '@neevpass/domain';

import type { ProfileScope } from './access';

import { DEFAULT_PORTFOLIO_CONFIG, DEFAULT_RESUME_CONFIG } from '@neevpass/docgen';

import { assertRevisionCurrent } from './profile';
import { prisma, type Prisma } from './index';

// ---------------------------------------------------------------------------
// Resumes
// ---------------------------------------------------------------------------

export interface StoredResume {
  readonly id: string;
  readonly title: string;
  readonly templateKey: string;
  readonly config: unknown;
  readonly targetRoleId?: string;
  readonly updatedAt: Date;
}

export async function createResume(scope: ProfileScope, input: { title: string; targetRoleId?: string }): Promise<StoredResume> {
  const row = await prisma.resume.create({
    data: {
      profileId: scope.profileId,
      title: input.title,
      templateKey: 'classic',
      config: DEFAULT_RESUME_CONFIG as unknown as Prisma.InputJsonValue,
      ...(input.targetRoleId ? { targetRoleId: input.targetRoleId } : {}),
    },
    select: { id: true, title: true, templateKey: true, config: true, targetRoleId: true, updatedAt: true },
  });

  return {
    id: row.id,
    title: row.title,
    templateKey: row.templateKey,
    config: row.config,
    ...(row.targetRoleId ? { targetRoleId: row.targetRoleId } : {}),
    updatedAt: row.updatedAt,
  };
}

export async function listResumes(profileId: string): Promise<readonly StoredResume[]> {
  const rows = await prisma.resume.findMany({
    where: { profileId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, templateKey: true, config: true, targetRoleId: true, updatedAt: true },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    templateKey: row.templateKey,
    config: row.config,
    ...(row.targetRoleId ? { targetRoleId: row.targetRoleId } : {}),
    updatedAt: row.updatedAt,
  }));
}

export async function findResume(profileId: string, resumeId: string): Promise<StoredResume | undefined> {
  const row = await prisma.resume.findFirst({
    where: { id: resumeId, profileId, deletedAt: null },
    select: { id: true, title: true, templateKey: true, config: true, targetRoleId: true, updatedAt: true },
  });
  if (!row) return undefined;

  return {
    id: row.id,
    title: row.title,
    templateKey: row.templateKey,
    config: row.config,
    ...(row.targetRoleId ? { targetRoleId: row.targetRoleId } : {}),
    updatedAt: row.updatedAt,
  };
}

export async function renameResume(scope: ProfileScope, resumeId: string, title: string): Promise<boolean> {
  const result = await prisma.resume.updateMany({
    where: { id: resumeId, profileId: scope.profileId, deletedAt: null },
    data: { title },
  });
  return result.count > 0;
}

export async function updateResumeConfig(scope: ProfileScope, resumeId: string, config: unknown): Promise<boolean> {
  const result = await prisma.resume.updateMany({
    where: { id: resumeId, profileId: scope.profileId, deletedAt: null },
    data: { config: config as Prisma.InputJsonValue },
  });
  return result.count > 0;
}

export async function deleteResume(scope: ProfileScope, resumeId: string): Promise<boolean> {
  const result = await prisma.resume.updateMany({
    where: { id: resumeId, profileId: scope.profileId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------

export interface StoredPortfolio {
  readonly id: string;
  readonly profileId: string;
  readonly title: string;
  readonly templateKey: string;
  readonly config: unknown;
  readonly publicSlug?: string;
  readonly published: boolean;
  readonly publishedAt?: Date;
  readonly updatedAt: Date;
}

/** The profile's one live portfolio, creating the row lazily on first use. */
export async function ensurePortfolio(scope: ProfileScope, title: string): Promise<StoredPortfolio> {
  const existing = await prisma.portfolio.findFirst({
    where: { profileId: scope.profileId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, profileId: true, title: true, templateKey: true, config: true, publicSlug: true, published: true, publishedAt: true, updatedAt: true },
  });
  if (existing) {
    return {
      id: existing.id,
      profileId: existing.profileId,
      title: existing.title,
      templateKey: existing.templateKey,
      config: existing.config,
      ...(existing.publicSlug ? { publicSlug: existing.publicSlug } : {}),
      published: existing.published,
      ...(existing.publishedAt ? { publishedAt: existing.publishedAt } : {}),
      updatedAt: existing.updatedAt,
    };
  }

  const row = await prisma.portfolio.create({
    data: {
      profileId: scope.profileId,
      title,
      templateKey: DEFAULT_PORTFOLIO_CONFIG.templateKey,
      config: DEFAULT_PORTFOLIO_CONFIG as unknown as Prisma.InputJsonValue,
    },
    select: { id: true, profileId: true, title: true, templateKey: true, config: true, publicSlug: true, published: true, publishedAt: true, updatedAt: true },
  });

  return {
    id: row.id,
    profileId: row.profileId,
    title: row.title,
    templateKey: row.templateKey,
    config: row.config,
    published: row.published,
    updatedAt: row.updatedAt,
  };
}

function mapPortfolio(row: {
  id: string;
  profileId: string;
  title: string;
  templateKey: string;
  config: unknown;
  publicSlug: string | null;
  published: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
}): StoredPortfolio {
  return {
    id: row.id,
    profileId: row.profileId,
    title: row.title,
    templateKey: row.templateKey,
    config: row.config,
    ...(row.publicSlug ? { publicSlug: row.publicSlug } : {}),
    published: row.published,
    ...(row.publishedAt ? { publishedAt: row.publishedAt } : {}),
    updatedAt: row.updatedAt,
  };
}

export interface PortfolioUpdate {
  readonly title?: string;
  readonly templateKey?: string;
  readonly publicSlug?: string;
  readonly published?: boolean;
  readonly config?: unknown;
}

/**
 * Updates the portfolio. When an address is claimed, the profile's public slug
 * is synced in the same transaction: one claimable identity, not two that can
 * drift apart.
 */
export async function updatePortfolio(scope: ProfileScope, portfolioId: string, update: PortfolioUpdate): Promise<StoredPortfolio> {
  try {
    return await prisma.$transaction(async (tx) => {
      const data: Record<string, unknown> = {};
      if (update.title !== undefined) data.title = update.title;
      if (update.templateKey !== undefined) data.templateKey = update.templateKey;
      if (update.publicSlug !== undefined) data.publicSlug = update.publicSlug;
      if (update.config !== undefined) data.config = update.config;
      if (update.published !== undefined) {
        data.published = update.published;
        data.publishedAt = update.published ? new Date() : null;
      }

      const row = await tx.portfolio.update({
        where: { id: portfolioId },
        data,
        select: { id: true, profileId: true, title: true, templateKey: true, config: true, publicSlug: true, published: true, publishedAt: true, updatedAt: true },
      });

      if (row.profileId !== scope.profileId) {
        throw AppError.forbidden('That portfolio belongs to a different account.');
      }

      if (update.publicSlug !== undefined) {
        await tx.profile.update({
          where: { id: scope.profileId },
          data: { publicSlug: update.publicSlug },
        });
      }

      // Publishing changes the public face of the profile, so it carries the
      // same compare-and-swap as every other profile write.
      await assertRevisionCurrent(tx, scope);

      return mapPortfolio(row);
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') {
      throw AppError.conflict('Someone already claimed that address. Try another one.');
    }
    throw AppError.internal('The portfolio update failed.', error);
  }
}

/** The published portfolio for a public address — the /p/[slug] data source. */
export async function findPublishedPortfolio(publicSlug: string): Promise<StoredPortfolio | undefined> {
  const row = await prisma.portfolio.findFirst({
    where: { publicSlug, published: true, deletedAt: null },
    select: { id: true, title: true, templateKey: true, config: true, publicSlug: true, published: true, publishedAt: true, updatedAt: true, profileId: true },
  });
  if (!row) return undefined;
  return mapPortfolio(row);
}
