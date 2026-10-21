/**
 * Profile completeness.
 *
 * A deterministic measure of how much of the profile exists, used by the
 * dashboard, the profile overview and the career score's completeness factor.
 *
 * It answers "how much is filled in", never "how good is it" — quality is the
 * career score's job. The two are kept separate so a student can see both
 * "you have not added anything yet" and "what you added is strong" at the
 * same time.
 */

import { SECTION_DEFINITIONS, type SectionKind } from './sections';

import type { ProfileAggregate } from './aggregate';

export interface SectionCompleteness {
  readonly kind: SectionKind;
  readonly label: string;
  /** How many entries the section holds (summary counts as 0 or 1). */
  readonly items: number;
  readonly filled: boolean;
}

export interface ProfileCompleteness {
  /** 0..100, rounded. */
  readonly percent: number;
  readonly filledCount: number;
  readonly totalCount: number;
  readonly sections: readonly SectionCompleteness[];
}

/**
 * Counts the entries behind each section. Internships and Experience share one
 * table, so the same rows feed both sections depending on their `type`.
 */
function countSection(aggregate: ProfileAggregate, kind: SectionKind): number {
  switch (kind) {
    case 'SUMMARY':
      return aggregate.summary ? 1 : 0;
    case 'EDUCATION':
      return aggregate.education.length;
    case 'EXPERIENCE':
      return aggregate.experience.filter((entry) => entry.type !== 'INTERNSHIP').length;
    case 'INTERNSHIPS':
      return aggregate.experience.filter((entry) => entry.type === 'INTERNSHIP').length;
    case 'PROJECTS':
      return aggregate.projects.length;
    case 'SKILLS':
      return aggregate.skills.length;
    case 'CERTIFICATES':
      return aggregate.certificates.length;
    case 'ACHIEVEMENTS':
      return aggregate.achievements.length;
    case 'HACKATHONS':
      return aggregate.hackathons.length;
    case 'WORKSHOPS':
      return aggregate.workshops.length;
    case 'LINKS':
      return aggregate.links.length;
  }
}

export function computeProfileCompleteness(aggregate: ProfileAggregate): ProfileCompleteness {
  const sections: SectionCompleteness[] = SECTION_DEFINITIONS.map((definition) => {
    const items = countSection(aggregate, definition.kind);
    return { kind: definition.kind, label: definition.label, items, filled: items > 0 };
  });

  const filledCount = sections.filter((section) => section.filled).length;

  return {
    percent: Math.round((filledCount / sections.length) * 100),
    filledCount,
    totalCount: sections.length,
    sections,
  };
}

/**
 * The most recent activity date on the profile: the latest `from`/`held on`/
 * `issued at` date across dated sections. Used by the score's recency factor.
 */
export function mostRecentActivityDate(aggregate: ProfileAggregate): string | undefined {
  const dates: string[] = [
    ...aggregate.education.map((entry) => entry.fromDate),
    ...aggregate.experience.map((entry) => entry.fromDate),
    ...aggregate.projects.map((entry) => entry.fromDate ?? undefined),
    ...aggregate.certificates.map((entry) => entry.issuedAt),
    ...aggregate.achievements.map((entry) => entry.issuedAt),
    ...aggregate.hackathons.map((entry) => entry.heldOn),
    ...aggregate.workshops.map((entry) => entry.heldOn),
  ].filter((date): date is string => typeof date === 'string');

  if (dates.length === 0) return undefined;

  return dates.reduce((latest, date) => (date > latest ? date : latest));
}
