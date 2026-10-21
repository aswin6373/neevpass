/**
 * Career engines wired to the database.
 *
 * The engines in @neevpass/domain are pure functions over the aggregate and
 * taxonomy. This module is the single place that resolves the inputs (goal,
 * role, skill graph, resources) so the career page, its server actions and the
 * snapshot recorder all compute from exactly the same builder.
 */
import {
  AppError,
  computeCareerScore,
  computeSkillGap,
  generateRoadmap,
  type CareerScore,
  type ProfileAggregate,
  type RoleDefinition,
  type SkillGap,
} from '@neevpass/domain';
import {
  findActiveGoal,
  findRoadmapForGoal,
  findRole,
  loadSkillGraph,
  persistRoadmap,
  requireProfileAggregate,
  resourcesBySkillId,
  saveScoreSnapshot,
  type ProfileScope,
  type StoredGoal,
  type StoredRoadmap,
} from '@neevpass/db';

export interface CareerState {
  readonly aggregate: ProfileAggregate;
  /** Convenience alias of `aggregate.revision`. */
  readonly revision: number;
  readonly goal?: StoredGoal;
  readonly role?: RoleDefinition;
  readonly score: CareerScore;
  readonly gap?: SkillGap;
}

/**
 * Everything the career screen needs: the aggregate, the active goal with its
 * role definition, the score, and — when a goal exists — the skill gap.
 */
export async function computeCareerState(scope: ProfileScope): Promise<CareerState> {
  const aggregate = await requireProfileAggregate(scope.profileId);
  const goal = await findActiveGoal(scope.profileId);
  const score = computeCareerScore({
    aggregate,
    hasActiveGoal: Boolean(goal),
    now: new Date(),
  });

  if (!goal) {
    return { aggregate, revision: aggregate.revision, score };
  }

  const role = await findRole(goal.roleId);
  if (!role) {
    // The taxonomy changed under a stored goal: degrade gracefully to the score.
    return { aggregate, revision: aggregate.revision, goal, score };
  }

  const graph = await loadSkillGraph();
  const gap = computeSkillGap({
    profileSkills: aggregate.skills.map((skill) => ({
      skillId: skill.skillId,
      proficiency: skill.proficiency,
    })),
    requirements: role.requirements,
    prerequisitesBySkillId: graph.prerequisitesBySkillId,
  });

  return { aggregate, revision: aggregate.revision, goal, role, score, gap };
}

/**
 * The roadmap for the active goal, generating and persisting it on first view.
 * Once stored, the roadmap is served as-is — visiting a page must not keep
 * rewriting history; regeneration happens only when the goal changes.
 */
export async function roadmapFor(scope: ProfileScope, state: CareerState): Promise<StoredRoadmap | undefined> {
  if (!state.goal || !state.gap) return undefined;

  const stored = await findRoadmapForGoal(state.goal.id);
  if (stored) return stored;

  const graph = await loadSkillGraph();
  const plan = generateRoadmap({
    gap: state.gap,
    prerequisitesBySkillId: graph.prerequisitesBySkillId,
    unlocksBySkillId: graph.unlocksBySkillId,
    resourcesBySkillId: await resourcesBySkillId(),
  });

  try {
    return await persistRoadmap(scope, state.goal.id, state.goal.roleId, plan);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.internal('Failed while storing the roadmap.', error);
  }
}

/** Records a score snapshot against the current aggregate revision. */
export async function recordScoreSnapshot(scope: ProfileScope): Promise<number> {
  const state = await computeCareerState(scope);
  await saveScoreSnapshot(scope, state.score, state.aggregate.revision);
  return state.score.score;
}
