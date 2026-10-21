/**
 * Roadmap generation.
 *
 * Orders the missing and partial skills from a gap analysis into a study plan:
 *
 *   priority = importance × prerequisite pressure
 *
 * A skill the role needs urgently (importance 5) that also blocks several
 * other missing skills comes first; an optional skill that unlocks nothing
 * comes last. Learning resources are attached where the curated catalog has
 * one for the skill.
 *
 * Deterministic given the same inputs. The cycle guard makes a malformed
 * prerequisite graph fail soft (treated as depth 0) rather than hang.
 */

import type { ResourceDefinition } from '../profile/aggregate';

import type { SkillGap } from './gap';

export interface RoadmapItem {
  readonly skillId: string;
  readonly skillName: string;
  readonly order: number;
  readonly status: 'TODO';
  /** Why this item is on the roadmap. Never empty — an unexplained item is a bug. */
  readonly reason: string;
  readonly resourceId?: string;
  readonly resourceUrl?: string;
  readonly resourceTitle?: string;
}

export interface RoadmapPlan {
  readonly items: readonly RoadmapItem[];
}

export interface RoadmapInput {
  readonly gap: SkillGap;
  /** skillId → the skills it builds on (its prerequisites in the taxonomy). */
  readonly prerequisitesBySkillId: ReadonlyMap<string, readonly { skillId: string; slug: string }[]>;
  /** skillId → skills that build on it (its unlocks). */
  readonly unlocksBySkillId: ReadonlyMap<string, readonly { skillId: string }[]>;
  /** Curated resources keyed by the skill they teach. */
  readonly resourcesBySkillId: ReadonlyMap<string, readonly ResourceDefinition[]>;
}

/**
 * Depth of the prerequisite chain below a skill, capped to keep a pathological
 * (or cyclic) graph from doing real work. Memoised per computation.
 */
function createDepthResolver(
  prerequisitesBySkillId: RoadmapInput['prerequisitesBySkillId'],
): (skillId: string) => number {
  const MAX_DEPTH = 6;
  const cache = new Map<string, number>();
  const inProgress = new Set<string>();

  function depth(skillId: string): number {
    const cached = cache.get(skillId);
    if (cached !== undefined) return cached;
    // A cycle contributes nothing; returning 0 for the re-entrant call breaks it.
    if (inProgress.has(skillId)) return 0;

    inProgress.add(skillId);
    const prerequisites = prerequisitesBySkillId.get(skillId) ?? [];
    const result =
      prerequisites.length === 0
        ? 0
        : Math.min(MAX_DEPTH, 1 + Math.max(...prerequisites.map((prereq) => depth(prereq.skillId))));
    inProgress.delete(skillId);

    cache.set(skillId, result);
    return result;
  }

  return depth;
}

function missingCountOf(
  skillId: string,
  input: RoadmapInput,
): number {
  const unlocks = input.unlocksBySkillId.get(skillId) ?? [];
  const gapSkillIds = new Set(
    [...input.gap.missing, ...input.gap.partial].map((item) => item.skillId),
  );
  return unlocks.filter((unlocked) => gapSkillIds.has(unlocked.skillId)).length;
}

export function generateRoadmap(input: RoadmapInput): RoadmapPlan {
  const { gap } = input;
  const depthOf = createDepthResolver(input.prerequisitesBySkillId);

  interface ScoredItem {
    readonly item: {
      readonly skillId: string;
      readonly skillName: string;
      readonly importance: number;
      readonly minLevel: number;
      readonly status: 'MISSING' | 'PARTIAL';
      readonly level?: number;
    };
    readonly priority: number;
  }

  const scored: ScoredItem[] = [
    ...gap.missing.map((item) => ({ item, isMissing: true as const })),
    ...gap.partial.map((item) => ({ item, isMissing: false as const })),
  ].map(({ item, isMissing }) => {
    const depth = depthOf(item.skillId);
    const unlocks = missingCountOf(item.skillId, input);
    // Missing skills rank ahead of partial ones at equal priority.
    const missingBoost = isMissing ? 1.2 : 1;
    const priority = item.importance * missingBoost * (1 + depth / 10) * (1 + unlocks / 10);

    return {
      item: {
        skillId: item.skillId,
        skillName: item.skillName,
        importance: item.importance,
        minLevel: item.minLevel,
        status: isMissing ? ('MISSING' as const) : ('PARTIAL' as const),
        level: item.level,
      },
      priority,
    };
  });

  scored.sort((a, b) => b.priority - a.priority || a.item.skillName.localeCompare(b.item.skillName));

  const items: RoadmapItem[] = scored.map(({ item }, index) => {
    const resources = input.resourcesBySkillId.get(item.skillId) ?? [];
    const resource = resources[0];

    const gapPhrase =
      item.status === 'MISSING'
        ? `not on your profile yet, and the role needs it at level ${item.minLevel}/5`
        : `present at level ${item.level}/5, and the role needs level ${item.minLevel}/5`;

    const importancePhrase =
      item.importance >= 4 ? 'core to the role' : item.importance >= 2 ? 'important to the role' : 'a bonus for the role';

    return {
      skillId: item.skillId,
      skillName: item.skillName,
      order: index,
      status: 'TODO',
      reason: `For your target role this skill is ${gapPhrase} — ${importancePhrase}.`,
      ...(resource
        ? {
            resourceId: resource.resourceId,
            resourceUrl: resource.url,
            resourceTitle: `${resource.title}${resource.provider ? ` (${resource.provider})` : ''}`,
          }
        : {}),
    };
  });

  return { items };
}
