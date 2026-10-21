/**
 * Opportunity recommendations.
 *
 * Scores the active opportunity catalog against a profile. Deterministic, and
 * every recommendation carries a reason string — an unexplained recommendation
 * is a bug, by the same rule as roadmap items.
 *
 * Signals, in order of weight:
 *   1. Skill match — how many of the opportunity's skills are on the profile.
 *   2. Deadline proximity — sooner ranks higher; closed ones are excluded.
 *   3. The student's own feedback — dismissed items drop out, applied and
 *      saved ones are labelled rather than re-sold.
 */

import type { OpportunityInput } from '../profile/aggregate';

export type SavedStatus = 'SAVED' | 'APPLIED' | 'DISMISSED';

export interface OpportunityRecommendation {
  readonly opportunity: OpportunityInput;
  readonly matchedSkillNames: readonly string[];
  readonly skillMatchCount: number;
  /** 0..100. */
  readonly score: number;
  readonly reason: string;
  readonly savedStatus?: SavedStatus;
  readonly daysUntilDeadline?: number;
}

/** What matching needs to know about a profile skill: its taxonomy id and name. */
export interface RecommenderSkill {
  readonly skillId: string;
  readonly skillName: string;
}

export interface RecommendationInput {
  readonly opportunities: readonly OpportunityInput[];
  readonly profileSkills: readonly RecommenderSkill[];
  /** SavedOpportunity rows keyed by opportunity id. */
  readonly feedbackByOpportunityId: ReadonlyMap<string, SavedStatus>;
  readonly now: Date;
  /** Opportunities matching fewer skills than this are left out entirely. */
  readonly minSkillMatch?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function deadlinePhrase(days: number): string {
  if (days <= 0) return 'closes today';
  if (days === 1) return 'closes tomorrow';
  if (days <= 14) return `closes in ${days} days`;
  if (days <= 60) return `closes in about ${Math.round(days / 7)} weeks`;
  return 'open for a while yet';
}

export function recommendOpportunities(input: RecommendationInput): OpportunityRecommendation[] {
  const { opportunities, profileSkills, feedbackByOpportunityId, now, minSkillMatch = 1 } = input;

  const skillsById = new Map(profileSkills.map((skill) => [skill.skillId, skill.skillName]));

  const results: OpportunityRecommendation[] = [];

  for (const opportunity of opportunities) {
    const feedback = feedbackByOpportunityId.get(opportunity.id);
    if (feedback === 'DISMISSED') continue;

    const matchedNames = opportunity.skillIds
      .map((skillId) => skillsById.get(skillId))
      .filter((name): name is string => name !== undefined);

    if (matchedNames.length < minSkillMatch) continue;

    const skillScore = (matchedNames.length / Math.max(opportunity.skillIds.length, 1)) * 70;

    let deadlineScore = 15; // rolling deadline: neutral
    let days: number | undefined;
    if (opportunity.deadline) {
      days = Math.ceil((new Date(opportunity.deadline).getTime() - now.getTime()) / DAY_MS);
      if (days < 0) continue; // closed
      deadlineScore = days <= 7 ? 30 : days <= 21 ? 20 : days <= 60 ? 10 : 5;
    }

    const score = Math.min(100, Math.round(skillScore + deadlineScore));

    const skillPhrase =
      matchedNames.length === 1
        ? `matches 1 of your skills: ${matchedNames[0]}`
        : `matches ${matchedNames.length} of your skills: ${matchedNames.slice(0, 3).join(', ')}${
            matchedNames.length > 3 ? ` and ${matchedNames.length - 3} more` : ''
          }`;

    const deadline = opportunity.deadline ? ` · ${deadlinePhrase(days ?? 0)}` : ' · rolling deadline';

    const feedbackPhrase =
      feedback === 'APPLIED' ? ' · you already applied' : feedback === 'SAVED' ? ' · saved' : '';

    results.push({
      opportunity,
      matchedSkillNames: matchedNames,
      skillMatchCount: matchedNames.length,
      score,
      reason: `${skillPhrase}${deadline}${feedbackPhrase}`,
      ...(feedback ? { savedStatus: feedback } : {}),
      ...(days !== undefined ? { daysUntilDeadline: days } : {}),
    });
  }

  return results.sort(
    (a, b) => b.score - a.score || (a.daysUntilDeadline ?? 9999) - (b.daysUntilDeadline ?? 9999),
  );
}
