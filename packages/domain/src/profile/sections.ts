/**
 * The canonical list of profile sections.
 *
 * This is the single source of truth for section identity. It drives the
 * profile navigation, the resume section ordering, and the `SectionKind` union
 * used by the document model in Phase 2.
 *
 * Adding a section means adding it here and nowhere else — the navigation, the
 * default resume order and the portfolio renderer all read from this list.
 *
 * `icon` is an icon *name*, not a component. The domain layer must not depend
 * on React, so the UI resolves the name to a real icon.
 */

export const SECTION_KINDS = [
  'SUMMARY',
  'EDUCATION',
  'EXPERIENCE',
  'INTERNSHIPS',
  'PROJECTS',
  'SKILLS',
  'CERTIFICATES',
  'ACHIEVEMENTS',
  'HACKATHONS',
  'WORKSHOPS',
  'LINKS',
] as const;

export type SectionKind = (typeof SECTION_KINDS)[number];

export interface SectionDefinition {
  readonly kind: SectionKind;
  /** Display name used in navigation and on generated documents. */
  readonly label: string;
  /** Short helper text shown under the section heading in the editor. */
  readonly description: string;
  /** lucide-react icon name, resolved by the UI layer. */
  readonly icon: string;
  /** Route segment under `/profile`. */
  readonly slug: string;
  /** Whether a student can add more than one entry. */
  readonly cardinality: 'SINGLE' | 'MULTIPLE';
}

export const SECTION_DEFINITIONS: readonly SectionDefinition[] = [
  {
    kind: 'SUMMARY',
    label: 'Summary',
    description: 'A short professional summary that appears at the top of your resume.',
    icon: 'AlignLeft',
    slug: 'summary',
    cardinality: 'SINGLE',
  },
  {
    kind: 'EDUCATION',
    label: 'Education',
    description: 'Degrees, institutions and academic results.',
    icon: 'GraduationCap',
    slug: 'education',
    cardinality: 'MULTIPLE',
  },
  {
    kind: 'EXPERIENCE',
    label: 'Experience',
    description: 'Full-time roles, part-time work, freelance and volunteering.',
    icon: 'Briefcase',
    slug: 'experience',
    cardinality: 'MULTIPLE',
  },
  {
    kind: 'INTERNSHIPS',
    label: 'Internships',
    description: 'Internships and apprenticeships. Stored alongside experience.',
    icon: 'Building2',
    slug: 'internships',
    cardinality: 'MULTIPLE',
  },
  {
    kind: 'PROJECTS',
    label: 'Projects',
    description: 'Things you have built, with links to code and live demos.',
    icon: 'FolderGit2',
    slug: 'projects',
    cardinality: 'MULTIPLE',
  },
  {
    kind: 'SKILLS',
    label: 'Skills',
    description: 'Your skills with a self-assessed level. Used by career analysis.',
    icon: 'Sparkles',
    slug: 'skills',
    cardinality: 'MULTIPLE',
  },
  {
    kind: 'CERTIFICATES',
    label: 'Certificates',
    description: 'Certifications you have earned, with the issuing body.',
    icon: 'BadgeCheck',
    slug: 'certificates',
    cardinality: 'MULTIPLE',
  },
  {
    kind: 'ACHIEVEMENTS',
    label: 'Achievements',
    description: 'Awards, recognitions, ranks and publications.',
    icon: 'Trophy',
    slug: 'achievements',
    cardinality: 'MULTIPLE',
  },
  {
    kind: 'HACKATHONS',
    label: 'Hackathons',
    description: 'Hackathons you took part in, the team and the result.',
    icon: 'Zap',
    slug: 'hackathons',
    cardinality: 'MULTIPLE',
  },
  {
    kind: 'WORKSHOPS',
    label: 'Workshops',
    description: 'Workshops and short programmes you attended.',
    icon: 'Presentation',
    slug: 'workshops',
    cardinality: 'MULTIPLE',
  },
  {
    kind: 'LINKS',
    label: 'Links',
    description: 'GitHub, LinkedIn, portfolio and anywhere else you can be found.',
    icon: 'Link2',
    slug: 'links',
    cardinality: 'MULTIPLE',
  },
] as const;

/**
 * Default order of sections on a generated resume.
 * A student can reorder these per resume without touching their profile.
 */
export const DEFAULT_RESUME_SECTION_ORDER: readonly SectionKind[] = [
  'SUMMARY',
  'EDUCATION',
  'EXPERIENCE',
  'INTERNSHIPS',
  'PROJECTS',
  'SKILLS',
  'CERTIFICATES',
  'ACHIEVEMENTS',
  'HACKATHONS',
  'WORKSHOPS',
  'LINKS',
];

const SECTION_BY_KIND: ReadonlyMap<SectionKind, SectionDefinition> = new Map(
  SECTION_DEFINITIONS.map((definition) => [definition.kind, definition]),
);

export function getSectionDefinition(kind: SectionKind): SectionDefinition {
  const definition = SECTION_BY_KIND.get(kind);
  if (!definition) {
    // Unreachable while SECTION_DEFINITIONS covers SECTION_KINDS, but the map
    // lookup is typed as possibly-undefined so we make the invariant explicit.
    throw new Error(`No section definition registered for kind "${kind}"`);
  }
  return definition;
}

export function isSectionKind(value: unknown): value is SectionKind {
  return typeof value === 'string' && SECTION_KINDS.includes(value as SectionKind);
}
