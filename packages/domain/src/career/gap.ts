/**
 * Skill-gap analysis.
 *
 * Compares the profile's skill vector against a target role's weighted
 * requirements. Pure set algebra over taxonomy ids — no AI, no network.
 *
 * Partition:
 *   matched — present at or above the required level;
 *   partial — present but below the required level;
 *   missing — absent entirely.
 *
 * `readiness` weights each requirement by its importance so that being strong
 * where the role is strong matters more than totalling many weak matches.
 */

import type { ProfileSkill, RoleRequirement } from '../profile/aggregate';

export type GapStatus = 'MATCHED' | 'PARTIAL' | 'MISSING';

export interface GapItem {
  readonly skillId: string;
  readonly skillSlug: string;
  readonly skillName: string;
  readonly importance: number;
  readonly minLevel: number;
  /** The profile's level, absent when missing. */
  readonly level?: number;
  readonly status: GapStatus;
  readonly prerequisiteSlugs: readonly string[];
}

export interface SkillGap {
  readonly matched: readonly GapItem[];
  readonly partial: readonly GapItem[];
  readonly missing: readonly GapItem[];
  /** Share of requirements matched or partially matched. 0..100. */
  readonly coverage: number;
  /** Importance-weighted readiness. 0..100. Partial matches count half. */
  readonly readiness: number;
}

export interface SkillGapInput {
  readonly profileSkills: readonly Pick<ProfileSkill, 'skillId' | 'proficiency'>[];
  readonly requirements: readonly RoleRequirement[];
  /** skillId → slugs of skills it builds on, used to annotate missing items. */
  readonly prerequisitesBySkillId: ReadonlyMap<string, readonly { skillId: string; slug: string; name: string }[]>;
}

export function computeSkillGap(input: SkillGapInput): SkillGap {
  const { profileSkills, requirements, prerequisitesBySkillId } = input;

  const levels = new Map(profileSkills.map((skill) => [skill.skillId, skill.proficiency]));

  const matched: GapItem[] = [];
  const partial: GapItem[] = [];
  const missing: GapItem[] = [];

  let totalWeight = 0;
  let weightedScore = 0;

  for (const requirement of requirements) {
    const level = levels.get(requirement.skillId);
    const prerequisites = prerequisitesBySkillId.get(requirement.skillId) ?? [];

    totalWeight += requirement.importance;

    if (level === undefined) {
      missing.push({
        skillId: requirement.skillId,
        skillSlug: requirement.skillSlug,
        skillName: requirement.skillName,
        importance: requirement.importance,
        minLevel: requirement.minLevel,
        status: 'MISSING',
        prerequisiteSlugs: prerequisites.map((prereq) => prereq.slug),
      });
      continue;
    }

    if (level >= requirement.minLevel) {
      matched.push({
        skillId: requirement.skillId,
        skillSlug: requirement.skillSlug,
        skillName: requirement.skillName,
        importance: requirement.importance,
        minLevel: requirement.minLevel,
        level,
        status: 'MATCHED',
        prerequisiteSlugs: prerequisites.map((prereq) => prereq.slug),
      });
      weightedScore += requirement.importance;
    } else {
      partial.push({
        skillId: requirement.skillId,
        skillSlug: requirement.skillSlug,
        skillName: requirement.skillName,
        importance: requirement.importance,
        minLevel: requirement.minLevel,
        level,
        status: 'PARTIAL',
        prerequisiteSlugs: prerequisites.map((prereq) => prereq.slug),
      });
      // A partial match counts half: it is worth something, but not a claim.
      weightedScore += requirement.importance * 0.5;
    }
  }

  const coverage = requirements.length === 0 ? 0 : Math.round(((matched.length + partial.length) / requirements.length) * 100);
  const readiness = totalWeight === 0 ? 0 : Math.round((weightedScore / totalWeight) * 100);

  const byImportanceThenName = (a: GapItem, b: GapItem): number =>
    b.importance - a.importance || a.skillName.localeCompare(b.skillName);

  return {
    matched: matched.sort(byImportanceThenName),
    partial: partial.sort(byImportanceThenName),
    missing: missing.sort(byImportanceThenName),
    coverage,
    readiness,
  };
}
