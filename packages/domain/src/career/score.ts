/**
 * Career Score — a deterministic, versioned rubric over the profile.
 *
 * NOT AI. A pure function with no network, no database and no clock dependency
 * beyond the injected `now` (used only for the recency factor). The same
 * profile at the same revision always produces the same score and the same
 * explanations, which is what makes the score diffable ("+6 because you added
 * two project links") and makes a rubric change a version bump rather than a
 * silent rewrite of history.
 *
 * Every factor returns its points, its maximum and a human-readable
 * explanation. An unexplained factor is a bug: the breakdown IS the product.
 */

import { computeProfileCompleteness, mostRecentActivityDate } from '../profile/completeness';

import type { ProfileAggregate } from '../profile/aggregate';

export const CAREER_SCORE_RUBRIC_VERSION = 1;

export interface ScoreFactor {
  readonly key: string;
  readonly label: string;
  readonly points: number;
  readonly max: number;
  readonly explanation: string;
}

export interface CareerScore {
  /** 0..100. */
  readonly score: number;
  readonly rubricVersion: number;
  readonly factors: readonly ScoreFactor[];
}

/** Roughly "how full is the profile", measured across the eleven sections. */
function completenessFactor(aggregate: ProfileAggregate): ScoreFactor {
  const max = 25;
  const completeness = computeProfileCompleteness(aggregate);
  const points = Math.round((completeness.filledCount / completeness.totalCount) * max);

  const missing = completeness.sections.filter((section) => !section.filled);
  const explanation =
    missing.length === 0
      ? 'Every section has at least one entry.'
      : `You have filled ${completeness.filledCount} of ${completeness.totalCount} sections. Still empty: ${missing
          .slice(0, 4)
          .map((section) => section.label)
          .join(', ')}${missing.length > 4 ? '…' : ''}.`;

  return { key: 'completeness', label: 'Profile completeness', points, max, explanation };
}

interface EvidenceItem {
  readonly id: string;
  readonly kind: string;
  readonly hasSummary: boolean;
  readonly hasLink: boolean;
  readonly hasSkills: boolean;
}

/**
 * Does an entry read as evidence rather than a label? A project with a
 * description, a link and named skills demonstrates something; a bare title
 * demonstrates nothing.
 */
function evidenceFactor(aggregate: ProfileAggregate): ScoreFactor {
  const max = 25;

  const items: EvidenceItem[] = [
    ...aggregate.projects.map((project) => ({
      id: project.id,
      kind: 'project',
      hasSummary: Boolean(project.summary),
      hasLink: Boolean(project.repoUrl || project.liveUrl),
      hasSkills: project.skillIds.length > 0,
    })),
    ...aggregate.experience
      .filter((entry) => entry.type !== 'VOLUNTEER')
      .map((entry) => ({
        id: entry.id,
        kind: 'experience',
        hasSummary: Boolean(entry.summary) || entry.highlights.length > 0,
        hasLink: false,
        hasSkills: entry.skillIds.length > 0,
      })),
    ...aggregate.hackathons.map((hackathon) => ({
      id: hackathon.id,
      kind: 'hackathon',
      hasSummary: Boolean(hackathon.summary) || Boolean(hackathon.result),
      hasLink: Boolean(hackathon.projectUrl),
      hasSkills: hackathon.skillIds.length > 0,
    })),
  ];

  if (items.length === 0) {
    return {
      key: 'evidence',
      label: 'Evidence depth',
      points: 0,
      max,
      explanation: 'Add projects, internships or hackathons — with descriptions and links, not just titles.',
    };
  }

  const scored = items.reduce((total, item) => {
    let itemScore = 0;
    if (item.hasSummary) itemScore += 0.4;
    if (item.hasLink || item.kind === 'experience') itemScore += 0.3;
    if (item.hasSkills) itemScore += 0.3;
    return total + itemScore;
  }, 0);

  const points = Math.min(max, Math.round((scored / items.length) * max * (Math.min(items.length, 4) / 4)));

  const weak = items.filter((item) => !item.hasSummary || !item.hasSkills).length;
  const explanation =
    weak === 0
      ? `Your ${items.length} entries all carry a description and named skills — strong evidence.`
      : `${weak} of ${items.length} entries are missing a description or the skills they demonstrate. Filling those in raises this factor the most.`;

  return { key: 'evidence', label: 'Evidence depth', points, max, explanation };
}

function skillFactor(aggregate: ProfileAggregate): ScoreFactor {
  const max = 20;
  const count = aggregate.skills.length;

  if (count === 0) {
    return {
      key: 'skills',
      label: 'Skill profile',
      points: 0,
      max,
      explanation: 'No skills yet. Add the 8–12 skills you are most confident in.',
    };
  }

  // Breadth: 8+ distinct skills is the sweet spot; beyond 30 adds nothing.
  const breadth = Math.min(1, Math.min(count, 8) / 8) * 0.5;
  // Depth: mean proficiency above 3 counts; capped so one perfect skill cannot carry an empty profile.
  const meanProficiency = aggregate.skills.reduce((total, skill) => total + skill.proficiency, 0) / count;
  const depth = Math.min(1, Math.max(0, (meanProficiency - 2) / 2)) * 0.5;

  const points = Math.round((breadth + depth) * max);

  const explanation =
    count < 8
      ? `${count} skill${count === 1 ? '' : 's'} added. Breadth counts until about 8 — keep going.`
      : `Average self-assessed level ${meanProficiency.toFixed(1)}/5 across ${count} skills.`;

  return { key: 'skills', label: 'Skill profile', points, max, explanation };
}

function connectionsFactor(aggregate: ProfileAggregate): ScoreFactor {
  const max = 10;
  const linkCount = aggregate.links.length;
  const hasContact = Boolean(aggregate.location || aggregate.phone);

  const linkPoints = Math.min(6, linkCount * 3);
  const contactPoints = hasContact ? 4 : 0;
  const points = linkPoints + contactPoints;

  const missing: string[] = [];
  if (linkCount === 0) missing.push('a GitHub or portfolio link');
  if (!hasContact) missing.push('your location or phone');

  const explanation =
    missing.length === 0
      ? `${linkCount} link${linkCount === 1 ? '' : 's'} and your contact details are on the profile.`
      : `Missing: ${missing.join(' and ')}. Recruiters and readers follow links; they cannot follow a title.`;

  return { key: 'connections', label: 'Links and contact', points, max, explanation };
}

function recencyFactor(aggregate: ProfileAggregate, now: Date): ScoreFactor {
  const max = 10;
  const latest = mostRecentActivityDate(aggregate);

  if (!latest) {
    return {
      key: 'recency',
      label: 'Recent activity',
      points: 0,
      max,
      explanation: 'No dated entries yet. Recent activity signals you are still in motion.',
    };
  }

  const latestDate = new Date(`${latest}T00:00:00Z`);
  const monthsOld =
    (now.getUTCFullYear() - latestDate.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - latestDate.getUTCMonth());

  const points = monthsOld <= 6 ? max : monthsOld <= 12 ? Math.round(max / 2) : Math.round(max / 5);

  const explanation =
    monthsOld <= 6
      ? 'Something on your profile started within the last six months.'
      : `Your most recent entry is about ${monthsOld} months old. Adding a current project or role refreshes this.`;

  return { key: 'recency', label: 'Recent activity', points, max, explanation };
}

function goalsFactor(hasGoal: boolean): ScoreFactor {
  const max = 10;
  return {
    key: 'goals',
    label: 'Career direction',
    points: hasGoal ? max : 0,
    max,
    explanation: hasGoal
      ? 'You have set a target role — gap analysis and roadmaps are working from it.'
      : 'Set a target role under Career to unlock skill-gap analysis and a roadmap.',
  };
}

export interface CareerScoreInput {
  readonly aggregate: ProfileAggregate;
  readonly hasActiveGoal: boolean;
  readonly now: Date;
}

export function computeCareerScore(input: CareerScoreInput): CareerScore {
  const { aggregate, hasActiveGoal, now } = input;

  const factors: ScoreFactor[] = [
    completenessFactor(aggregate),
    evidenceFactor(aggregate),
    skillFactor(aggregate),
    connectionsFactor(aggregate),
    recencyFactor(aggregate, now),
    goalsFactor(hasActiveGoal),
  ];

  const score = factors.reduce((total, factor) => total + factor.points, 0);

  return { score, rubricVersion: CAREER_SCORE_RUBRIC_VERSION, factors };
}
