import type { ProfileAggregate, SectionKind } from '@neevpass/domain';
import { SECTION_DEFINITIONS } from '@neevpass/domain';
import { listTaxonomySkills, requireProfileAggregate } from '@neevpass/db';
import { PageHeader } from '@neevpass/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireProfile } from '@/lib/session';

import {
  SectionEditor,
  type EntryLike,
  type SkillOption,
} from './section-editor';
import { SkillsSection } from './skills-section';
import { SummarySection } from './summary-section';

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const definition = SECTION_DEFINITIONS.find((candidate) => candidate.slug === slug);

  return {
    title: definition ? `${definition.label} — Profile` : 'Profile',
    robots: { index: false, follow: false },
  };
}

/**
 * One section editor page: `/profile/[slug]`.
 *
 * The section is resolved from the domain's SECTION_DEFINITIONS — an unknown
 * slug is a 404, not a blank editor. The page loads the aggregate and taxonomy,
 * reshapes rows into the one shape the client editor submits (`EntryLike`),
 * and dispatches to the bespoke editors for SUMMARY and SKILLS or the shared
 * editor for the rest. Everything handed to the client is plain serialisable
 * data.
 */
export default async function SectionPage({ params }: PageProps) {
  const { slug } = await params;

  const definition = SECTION_DEFINITIONS.find((candidate) => candidate.slug === slug);
  if (!definition) notFound();

  const { user, scope } = await requireProfile();
  const aggregate = await requireProfileAggregate(scope.profileId);

  const body: React.ReactNode = definition.kind === 'SUMMARY'
    ? (
      <SummarySection
        revision={aggregate.revision}
        initial={{
          fullName: aggregate.fullName,
          headline: aggregate.headline,
          phone: aggregate.phone,
          location: aggregate.location,
          summary: aggregate.summary,
          email: user.email,
        }}
      />
    )
    : definition.kind === 'SKILLS'
      ? (
        <SkillsSection
          revision={aggregate.revision}
          options={await skillOptions()}
          skills={skillRows(aggregate)}
        />
      )
      : (
        <SectionEditor
          kind={definition.kind}
          slug={definition.slug}
          revision={aggregate.revision}
          skillOptions={await skillOptions()}
          // Rows are plain aggregate objects, read by field name through the
          // declarative spec table; the cast marks that intentional looseness
          // at the server→client boundary.
          entries={entriesFor(definition.kind, aggregate) as readonly EntryLike[]}
          skillNamesByEntryId={skillNamesByEntry(definition.kind, aggregate)}
        />
      );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-content-secondary hover:text-content">
          ← All sections
        </Link>
      </div>

      <PageHeader title={definition.label} description={definition.description} />

      {body}

      <p className="text-xs text-content-muted">
        Every entry starts private. Visibility per entry: Private stays yours; Unlisted shares only
        through a link; Public appears on pages you publish.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aggregate → form-friendly rows
// ---------------------------------------------------------------------------

/** Taxonomy skills for the pickers, mapped to the editor's option shape. */
async function skillOptions(): Promise<readonly SkillOption[]> {
  const taxonomy = await listTaxonomySkills();
  return taxonomy.map((skill) => ({
    id: skill.id,
    name: skill.name,
    categoryName: skill.categoryName,
  }));
}

/** Claimed skills for the SkillsSection editor. */
function skillRows(aggregate: ProfileAggregate) {
  return aggregate.skills.map((skill) => ({
    skillId: skill.skillId,
    name: skill.name,
    categoryName: skill.categoryName,
    proficiency: skill.proficiency,
    yearsUsed: skill.yearsUsed,
    visibility: skill.visibility,
  }));
}

/**
 * Aggregate rows for one section, in display order.
 *
 * Experience and Internships share one table and differ only by `type`, so the
 * section page filters instead of splitting storage. Highlights become one
 * string (one bullet per line) because that is how the textarea submits them.
 */
function entriesFor(kind: SectionKind, aggregate: ProfileAggregate): readonly object[] {
  switch (kind) {
    case 'EDUCATION':
      return aggregate.education;
    case 'EXPERIENCE':
      return aggregate.experience
        .filter((entry) => entry.type !== 'INTERNSHIP')
        .map((entry) => ({ ...entry, highlights: entry.highlights.join('\n') }));
    case 'INTERNSHIPS':
      return aggregate.experience
        .filter((entry) => entry.type === 'INTERNSHIP')
        .map((entry) => ({ ...entry, highlights: entry.highlights.join('\n') }));
    case 'PROJECTS':
      return aggregate.projects;
    case 'CERTIFICATES':
      return aggregate.certificates;
    case 'ACHIEVEMENTS':
      return aggregate.achievements;
    case 'HACKATHONS':
      return aggregate.hackathons;
    case 'WORKSHOPS':
      return aggregate.workshops;
    case 'LINKS':
      return aggregate.links;
    case 'SUMMARY':
    case 'SKILLS':
      // Never dispatched to the section editor.
      return [];
  }
}

/** Taxonomy skill names per entry id, for the editor's chips. */
function skillNamesByEntry(
  kind: SectionKind,
  aggregate: ProfileAggregate,
): Readonly<Record<string, readonly string[]>> {
  const nameById = new Map(aggregate.skills.map((skill) => [skill.skillId, skill.name]));
  const rows: readonly object[] = (() => {
    switch (kind) {
      case 'EXPERIENCE':
        return aggregate.experience.filter((entry) => entry.type !== 'INTERNSHIP');
      case 'INTERNSHIPS':
        return aggregate.experience.filter((entry) => entry.type === 'INTERNSHIP');
      case 'PROJECTS':
        return aggregate.projects;
      case 'CERTIFICATES':
        return aggregate.certificates;
      case 'HACKATHONS':
        return aggregate.hackathons;
      case 'WORKSHOPS':
        return aggregate.workshops;
      default:
        return [];
    }
  })();

  const result: Record<string, readonly string[]> = {};
  for (const row of rows) {
    const id = (row as { id: string }).id;
    const ids = (row as { skillIds?: unknown }).skillIds;
    if (!Array.isArray(ids) || ids.length === 0) continue;

    const names = ids
      .map((skillId) => nameById.get(String(skillId)))
      .filter((name): name is string => typeof name === 'string');
    if (names.length > 0) result[id] = names;
  }
  return result;
}
