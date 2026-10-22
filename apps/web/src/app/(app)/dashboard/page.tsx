import { computeProfileCompleteness } from '@neevpass/domain';
import { findProfileForUser, listResumes, requireProfileAggregate } from '@neevpass/db';
import { buttonVariants } from '@neevpass/ui';
import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { requireUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Overview',
  robots: { index: false, follow: false },
};

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

/**
 * The workspace overview.
 *
 * A ledger, not a dashboard: one row of figures, then the sections that are
 * still empty and the documents that exist. No stat cards, no product tour.
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const scope = await findProfileForUser(user.id);

  const aggregate = scope ? await requireProfileAggregate(scope.profileId) : null;
  const resumes = scope ? await listResumes(scope.profileId) : [];

  const completeness = aggregate ? computeProfileCompleteness(aggregate) : null;
  const totalEntries =
    completeness?.sections.reduce((sum, section) => sum + section.items, 0) ?? 0;
  const incomplete = completeness?.sections.filter((section) => !section.filled) ?? [];
  const displayName = user.name?.split(' ')[0] ?? 'there';

  const figures = [
    {
      label: 'complete',
      value: completeness ? `${completeness.percent}%` : '—',
    },
    { label: 'entries', value: String(totalEntries) },
    { label: 'skills', value: String(aggregate?.skills.length ?? 0) },
    { label: 'resumes', value: String(resumes.length) },
  ];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <h1 className="text-[1.5rem] font-semibold leading-tight tracking-[-0.03em] text-content sm:text-[1.8rem]">
            {greetingFor(new Date())}, {displayName}.
          </h1>
          <p className="mt-1 text-[12.5px] text-content-secondary">
            {scope
              ? 'Your record, documents and the sections still waiting for a first entry.'
              : 'Create a profile to start using the workspace.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">
          <Link
            href={scope ? '/profile' : '/onboarding'}
            className={buttonVariants({ size: 'sm' })}
          >
            {scope ? 'Open profile' : 'Create profile'}
          </Link>
          {scope ? (
            <Link
              href="/resumes"
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            >
              New resume
            </Link>
          ) : null}
        </div>
      </header>

      {/* Figures --------------------------------------------------------- */}
      <section aria-label="Profile summary" className="border-y border-line">
        <dl className="grid grid-cols-2 sm:grid-cols-4">
          {figures.map((figure, index) => (
            <div
              key={figure.label}
              className={
                index === 0
                  ? 'py-5 pr-4'
                  : 'border-l border-line py-5 pl-4 pr-4 sm:pl-6'
              }
            >
              <dt className="np-mono text-[10px] lowercase tracking-[0.02em] text-content-muted">
                {figure.label}
              </dt>
              <dd className="np-tabular mt-2 text-[1.7rem] font-medium leading-none tracking-[-0.04em] text-content">
                {figure.value}
              </dd>
              {index === 0 && completeness ? (
                <div
                  role="progressbar"
                  aria-valuenow={completeness.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Profile completeness"
                  className="mt-3 h-px w-full max-w-[8rem] bg-line"
                >
                  <div
                    className="h-px bg-content"
                    style={{ width: `${completeness.percent}%` }}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </dl>
      </section>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-16">
        {/* Sections ------------------------------------------------------ */}
        <section aria-labelledby="sections-heading">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
            <h2 id="sections-heading" className="text-[12px] font-semibold text-content">
              {incomplete.length > 0 ? 'Still to add' : 'Profile sections'}
            </h2>
            <Link
              href="/profile"
              className="text-[11px] text-content-muted underline decoration-line-strong underline-offset-4 hover:text-content hover:decoration-content"
            >
              All sections
            </Link>
          </div>

          {scope && completeness ? (
            <ol>
              {(incomplete.length > 0 ? incomplete.slice(0, 8) : completeness.sections).map(
                (section, index) => (
                  <li key={section.kind}>
                    <Link
                      href={`/profile/${sectionKindToSlug(section.kind)}`}
                      className="group flex items-baseline gap-4 border-b border-line py-3 transition-colors hover:bg-surface-hover"
                    >
                      <span className="np-mono w-5 shrink-0 text-[10px] text-content-muted">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1 text-[13px] text-content">
                        {section.label}
                      </span>
                      <span className="np-mono shrink-0 text-[10px] text-content-muted">
                        {section.filled
                          ? `${section.items} ${section.items === 1 ? 'entry' : 'entries'}`
                          : 'empty'}
                      </span>
                      <ArrowUpRight
                        size={13}
                        aria-hidden="true"
                        className="shrink-0 self-center text-content-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-content"
                      />
                    </Link>
                  </li>
                ))}
            </ol>
          ) : (
            <div className="border-b border-line py-5">
              <p className="text-[12px] text-content-secondary">
                No profile record exists for this account yet.
              </p>
              <Link
                href="/onboarding"
                className="mt-3 inline-flex text-[12px] text-content underline decoration-line-strong underline-offset-4 hover:decoration-content"
              >
                Create your profile
              </Link>
            </div>
          )}
        </section>

        {/* Documents ----------------------------------------------------- */}
        <section aria-labelledby="documents-heading">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
            <h2 id="documents-heading" className="text-[12px] font-semibold text-content">
              Documents
            </h2>
            <Link
              href="/resumes"
              className="text-[11px] text-content-muted underline decoration-line-strong underline-offset-4 hover:text-content hover:decoration-content"
            >
              Manage
            </Link>
          </div>

          {resumes.length > 0 ? (
            <ul>
              {resumes.slice(0, 5).map((resume) => (
                <li key={resume.id}>
                  <Link
                    href={`/resumes/${resume.id}`}
                    className="group flex items-baseline justify-between gap-4 border-b border-line py-3 transition-colors hover:bg-surface-hover"
                  >
                    <span className="min-w-0 truncate text-[13px] text-content">
                      {resume.title}
                    </span>
                    <span className="np-mono shrink-0 text-[10px] text-content-muted">
                      {formatDate(resume.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border-b border-line py-5">
              <p className="text-[12px] text-content-secondary">No resumes yet.</p>
              <Link
                href="/resumes"
                className="mt-3 inline-flex text-[12px] text-content underline decoration-line-strong underline-offset-4 hover:decoration-content"
              >
                Create the first one
              </Link>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}

/** Dashboard rows link back to the section editor that owns the kind. */
function sectionKindToSlug(kind: string): string {
  const map: Record<string, string> = {
    SUMMARY: 'summary',
    EDUCATION: 'education',
    EXPERIENCE: 'experience',
    INTERNSHIPS: 'internships',
    PROJECTS: 'projects',
    SKILLS: 'skills',
    CERTIFICATES: 'certificates',
    ACHIEVEMENTS: 'achievements',
    HACKATHONS: 'hackathons',
    WORKSHOPS: 'workshops',
    LINKS: 'links',
  };
  return map[kind] ?? 'summary';
}
