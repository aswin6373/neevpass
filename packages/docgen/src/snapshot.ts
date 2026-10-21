/**
 * Snapshot building — `ProfileAggregate` to `ProfileSnapshot`.
 *
 * The snapshot is the immutable, self-contained view that every renderer
 * consumes. It carries RESOLVED VALUES (not foreign keys) so a resume rendered
 * today renders identically in a year.
 *
 * `buildSnapshot` never mutates the aggregate and never reads anything outside
 * its argument — the same property that makes the whole docgen package
 * testable with plain objects.
 */

import { SECTION_DEFINITIONS, type SectionKind, type Visibility } from '@neevpass/domain';

import type {
  AggregateAchievement,
  AggregateCertificate,
  AggregateEducation,
  AggregateExperience,
  AggregateHackathon,
  AggregateProject,
  AggregateWorkshop,
  ProfileAggregate,
} from '@neevpass/domain';

import type {
  ProfileSnapshot,
  SnapshotEntry,
  SnapshotIdentity,
  SnapshotLink,
  SnapshotSection,
} from './document';

export interface SnapshotIdentityInput {
  readonly email?: string;
}

export interface BuildSnapshotInput {
  readonly aggregate: ProfileAggregate;
  readonly revision: number;
  readonly now: Date;
  /**
   * Which entries the snapshot includes.
   *   - a resume or profile page for the owner includes everything;
   *   - a published public page includes only PUBLIC and UNLISTED entries.
   *
   * `defaultVisibility` is how a Private-default profile is walked: an entry
   * keeps its own visibility; the default only governs NEW entries, which are
   * resolved at write time in the database.
   */
  readonly publicOnly?: boolean;
  readonly email?: string;
}

type EntryFilter = (visibility: Visibility) => boolean;

export function createEntryFilter(publicOnly: boolean, defaultVisibility: Visibility): EntryFilter {
  if (!publicOnly) return () => true;
  // Private-default profiles publish nothing implicitly: UNLISTED and PUBLIC
  // entries are explicit choices by the student.
  if (defaultVisibility === 'PRIVATE') return (visibility) => visibility !== 'PRIVATE';
  // A public-default profile publishes everything except explicitly private
  // entries — "start public, hide what you choose to hide".
  return (visibility) => visibility !== 'PRIVATE';
}


/** Profile dates are month precision; the snapshot keeps `YYYY-MM`. */
function toIsoMonth(date: string | undefined): string | undefined {
  return date ? date.slice(0, 7) : undefined;
}

function linksOf(label: string, url: string): SnapshotLink {
  // The link `kind` is a free-form classifier for renderers; derive it once
  // from the URL so renderers do not each re-implement the heuristic.
  const kind = url.includes('github.com')
    ? 'github'
    : url.includes('linkedin.com')
      ? 'linkedin'
      : url.includes('mailto:')
        ? 'email'
        : 'external';
  return { id: label, label, url, kind };
}

type PartialEntry = Omit<SnapshotEntry, 'id'>;
const withId = (id: string, entry: PartialEntry): SnapshotEntry => ({ id, ...entry });

function educationEntry(entry: AggregateEducation): SnapshotEntry {
  return withId(entry.id, {
    title: entry.degree,
    subtitle: entry.field,
    organisation: entry.institution,
    location: entry.location,
    fromDate: toIsoMonth(entry.fromDate),
    toDate: entry.isCurrent ? undefined : toIsoMonth(entry.toDate),
    isCurrent: entry.isCurrent,
    summary: entry.notes ?? undefined,
    highlights: [],
    skillLabels: [],
    links: [],
    tags: entry.gradeType && entry.gradeValue ? [`${entry.gradeValue}`] : [],
  });
}

function experienceEntry(entry: AggregateExperience, skillNameById: ReadonlyMap<string, string>): SnapshotEntry {
  return withId(entry.id, {
    title: entry.title,
    organisation: entry.organisation,
    location: entry.location,
    fromDate: toIsoMonth(entry.fromDate),
    toDate: entry.isCurrent ? undefined : toIsoMonth(entry.toDate),
    isCurrent: entry.isCurrent,
    summary: entry.summary ?? undefined,
    highlights: [...entry.highlights],
    skillLabels: entry.skillIds.map((skillId) => skillNameById.get(skillId)).filter((name): name is string => Boolean(name)),
    links: [],
    tags: [],
  });
}

function projectEntry(entry: AggregateProject, skillNameById: ReadonlyMap<string, string>): SnapshotEntry {
  const links: SnapshotLink[] = [];
  if (entry.repoUrl) links.push(linksOf('Repository', entry.repoUrl));
  if (entry.liveUrl) links.push(linksOf('Live demo', entry.liveUrl));
  return withId(entry.id, {
    title: entry.title,
    subtitle: entry.role,
    fromDate: toIsoMonth(entry.fromDate),
    toDate: entry.isCurrent ? undefined : toIsoMonth(entry.toDate),
    isCurrent: entry.isCurrent,
    summary: entry.summary ?? undefined,
    highlights: [],
    skillLabels: entry.skillIds.map((skillId) => skillNameById.get(skillId)).filter((name): name is string => Boolean(name)),
    links,
    tags: [],
  });
}

function certificateEntry(
  entry: AggregateCertificate,
  skillNameById: ReadonlyMap<string, string>,
): SnapshotEntry {
  const links = entry.credentialUrl ? [linksOf('Credential', entry.credentialUrl)] : [];
  return withId(entry.id, {
    title: entry.title,
    organisation: entry.issuer,
    fromDate: toIsoMonth(entry.issuedAt),
    toDate: entry.expiresAt ? toIsoMonth(entry.expiresAt) : undefined,
    summary: entry.summary ?? undefined,
    highlights: [],
    skillLabels: entry.skillIds.map((skillId) => skillNameById.get(skillId)).filter((name): name is string => Boolean(name)),
    links,
    tags: entry.credentialId ? [`ID: ${entry.credentialId}`] : [],
  });
}

function achievementEntry(entry: AggregateAchievement): SnapshotEntry {
  const links = entry.url ? [linksOf('Link', entry.url)] : [];
  return withId(entry.id, {
    title: entry.title,
    subtitle: entry.category,
    organisation: entry.issuer ?? undefined,
    fromDate: toIsoMonth(entry.issuedAt),
    summary: entry.description ?? undefined,
    highlights: [],
    skillLabels: [],
    links,
    tags: [],
  });
}

function hackathonEntry(
  entry: AggregateHackathon,
  skillNameById: ReadonlyMap<string, string>,
): SnapshotEntry {
  const links = entry.projectUrl ? [linksOf('Project', entry.projectUrl)] : [];
  return withId(entry.id, {
    title: entry.projectName && entry.name !== entry.projectName ? `${entry.name} — ${entry.projectName}` : entry.name,
    subtitle: entry.role,
    organisation: entry.organiser ?? undefined,
    fromDate: toIsoMonth(entry.heldOn),
    summary: entry.summary ?? undefined,
    highlights: entry.result ? [entry.result] : [],
    skillLabels: entry.skillIds.map((skillId) => skillNameById.get(skillId)).filter((name): name is string => Boolean(name)),
    links,
    tags: entry.teamSize !== undefined && entry.teamSize !== null ? [`Team of ${entry.teamSize}`] : [],
  });
}

function workshopEntry(
  entry: AggregateWorkshop,
  skillNameById: ReadonlyMap<string, string>,
): SnapshotEntry {
  const links = entry.credentialUrl ? [linksOf('Credential', entry.credentialUrl)] : [];
  const duration = entry.durationHours !== undefined && entry.durationHours !== null ? `${entry.durationHours} h` : undefined;
  return withId(entry.id, {
    title: entry.title,
    subtitle: entry.mode === undefined ? undefined : (entry.mode.charAt(0) + entry.mode.slice(1).toLowerCase()),
    organisation: entry.organiser ?? undefined,
    fromDate: toIsoMonth(entry.heldOn),
    summary: entry.summary ?? undefined,
    highlights: [],
    skillLabels: entry.skillIds.map((skillId) => skillNameById.get(skillId)).filter((name): name is string => Boolean(name)),
    links,
    tags: duration ? [`Duration: ${duration}`] : [],
  });
}

/**
 * Builds the snapshot. Entries are emitted in the stored `order` (ascending),
 * which is the order the application maintains on every write.
 */
export function buildSnapshot(input: BuildSnapshotInput): ProfileSnapshot {
  const { aggregate, revision, now, publicOnly = false, email } = input;
  const include = createEntryFilter(publicOnly, aggregate.defaultVisibility);

  const skillNameById = new Map(
    aggregate.skills.map((skill) => [skill.skillId, skill.name]),
  );

  const internships = aggregate.experience.filter((entry) => entry.type === 'INTERNSHIP');
  const otherExperience = aggregate.experience.filter((entry) => entry.type !== 'INTERNSHIP');

  const sourceSections: Readonly<Record<SectionKind, { include: boolean; entries: readonly SnapshotEntry[] }>> = {
    SUMMARY: { include: Boolean(aggregate.summary), entries: [] },
    EDUCATION: {
      include: true,
      entries: aggregate.education.filter((e) => include(e.visibility)).map(educationEntry),
    },
    EXPERIENCE: {
      include: true,
      entries: otherExperience.filter((e) => include(e.visibility)).map((e) => experienceEntry(e, skillNameById)),
    },
    INTERNSHIPS: {
      include: true,
      entries: internships.filter((e) => include(e.visibility)).map((e) => experienceEntry(e, skillNameById)),
    },
    PROJECTS: {
      include: true,
      entries: aggregate.projects.filter((e) => include(e.visibility)).map((e) => projectEntry(e, skillNameById)),
    },
    SKILLS: {
      include: true,
      entries: [],
    },
    CERTIFICATES: {
      include: true,
      entries: aggregate.certificates.filter((e) => include(e.visibility)).map((e) => certificateEntry(e, skillNameById)),
    },
    ACHIEVEMENTS: {
      include: true,
      entries: aggregate.achievements.filter((e) => include(e.visibility)).map(achievementEntry),
    },
    HACKATHONS: {
      include: true,
      entries: aggregate.hackathons.filter((e) => include(e.visibility)).map((e) => hackathonEntry(e, skillNameById)),
    },
    WORKSHOPS: {
      include: true,
      entries: aggregate.workshops.filter((e) => include(e.visibility)).map((e) => workshopEntry(e, skillNameById)),
    },
    LINKS: {
      include: true,
      entries: aggregate.links
        .filter((e) => include(e.visibility))
        .map((e) =>
          withId(e.id, {
            title: e.label,
            subtitle: e.url,
            highlights: [],
            skillLabels: [],
            links: [linksOf(e.label, e.url)],
            tags: [],
          }),
        ),
    },
  };

  const sectionTitles = new Map(SECTION_DEFINITIONS.map((definition) => [definition.kind, definition.label]));

  const sections: SnapshotSection[] = SECTION_DEFINITIONS.filter(
    (definition) => definition.kind !== 'SUMMARY',
  ).map((definition) => {
    const source = sourceSections[definition.kind];
    return {
      kind: definition.kind,
      title: sectionTitles.get(definition.kind) ?? definition.label,
      entries: source.entries,
      ...(definition.kind === 'SKILLS'
        ? {
            chipLabels: aggregate.skills
              .filter((skill) => include(skill.visibility))
              .map((skill) => `${skill.name}${skill.proficiency ? ` (${skill.proficiency})` : ''}`),
          }
        : {}),
    };
  });

  const identity: SnapshotIdentity = {
    fullName: aggregate.fullName,
    ...(aggregate.headline ? { headline: aggregate.headline } : {}),
    ...(email ? { email } : {}),
    ...(aggregate.phone ? { phone: aggregate.phone } : {}),
    ...(aggregate.location ? { location: aggregate.location } : {}),
    ...(aggregate.photoUrl ? { photoUrl: aggregate.photoUrl } : {}),
    links: aggregate.links
      .filter((link) => include(link.visibility))
      .map((link) => linksOf(link.label, link.url)),
  };

  const maxVisibility: Visibility = publicOnly
    ? 'PUBLIC'
    : aggregate.defaultVisibility;

  return {
    profileId: aggregate.profileId,
    revision,
    takenAt: now.toISOString(),
    locale: 'en-IN',
    identity,
    ...(aggregate.summary ? { summary: aggregate.summary } : {}),
    sections,
    visibility: maxVisibility,
  };
}
