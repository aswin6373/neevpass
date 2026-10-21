import { computeProfileCompleteness, SECTION_DEFINITIONS } from '@neevpass/domain';
import { findProfileForUser, listResumes, requireProfileAggregate } from '@neevpass/db';
import { buttonVariants, cn } from '@neevpass/ui';
import { ArrowRight } from 'lucide-react';
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

function todayLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

const DESTINATIONS = [
  { href: '/resumes', label: 'Resumes', meta: 'Build and print' },
  { href: '/portfolios', label: 'Portfolio', meta: 'Publish a page' },
  { href: '/career', label: 'Career', meta: 'Score and gaps' },
  { href: '/opportunities', label: 'Opportunities', meta: 'Ranked by fit' },
] as const;

/**
 * The workspace overview.
 *
 * This is a working page, not a product tour: current numbers, the sections
 * that still need attention, and the documents that exist. The serif greeting
 * is the only decorative element.
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
  const now = new Date();

  const stats = [
    {
      value: completeness ? `${completeness.percent}%` : '—',
      label: 'Profile complete',
      detail: completeness
        ? `${completeness.filledCount} of ${completeness.totalCount} sections filled`
        : 'Profile not started',
    },
    {
      value: String(totalEntries),
      label: 'Record entries',
      detail: 'Across all profile sections',
    },
    {
      value: String(aggregate?.skills.length ?? 0),
      label: 'Skills listed',
      detail: 'Shown on resumes and portfolio',
    },
    {
      value: String(resumes.length),
      label: 'Resumes',
      detail: resumes.length === 1 ? 'One document' : 'Drafts and print-ready',
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <header>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[12px] text-content-muted">{todayLabel(now)}</p>
          {scope && (
            <p className="text-[11px] text-content-muted">Profile revision {scope.revision}</p>
          )}
        </div>

        <h1 className="np-display mt-2 text-[2.3rem] text-content sm:text-[2.9rem]">
          {greetingFor(now)}, {displayName}.
        </h1>

        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-[14px] leading-relaxed text-content-secondary">
            {scope
              ? 'Your profile is the record. Resumes and portfolio pages are generated from it, so an edit here reaches every document.'
              : 'Set up your profile first. It takes a name, a headline and one education entry to begin.'}
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link href={scope ? '/profile' : '/onboarding'} className={buttonVariants({ size: 'sm' })}>
              {scope ? 'Open profile' : 'Set up profile'}
            </Link>
            <Link
              href="/resumes"
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            >
              New resume
            </Link>
          </div>
        </div>
      </header>

      {/* Numbers --------------------------------------------------------- */}
      <section aria-label="Profile summary" className="grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              'py-5 pr-4',
              index % 2 === 1 && 'border-l border-line pl-5',
              index >= 2 && 'border-t border-line sm:border-t-0',
              index > 0 && 'sm:border-l sm:border-line sm:pl-6',
              index === 0 && 'sm:pl-0',
            )}
          >
            <p className="font-display text-[1.8rem] leading-none tracking-[-0.02em] text-content">
              {stat.value}
            </p>
            <p className="mt-2 text-[11px] font-medium text-content-secondary">{stat.label}</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-content-muted">{stat.detail}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.85fr)] lg:gap-14">
        {/* Profile sections --------------------------------------------- */}
        <section aria-labelledby="sections-heading">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5">
            <h2 id="sections-heading" className="text-[13px] font-medium text-content">
              {incomplete.length > 0 ? 'Still to fill in' : 'Profile sections'}
            </h2>
            <Link
              href="/profile"
              className="text-[11px] text-content-secondary underline decoration-line-strong underline-offset-4 hover:text-content hover:decoration-content"
            >
              All sections
            </Link>
          </div>

          {scope && completeness ? (
            <>
              {incomplete.length > 0 ? (
                <ol>
                  {incomplete.slice(0, 6).map((section) => {
                    const index = SECTION_DEFINITIONS.findIndex(
                      (definition) => definition.kind === section.kind,
                    );
                    const definition = SECTION_DEFINITIONS[index];

                    return (
                      <li key={section.kind} className="border-b border-line">
                        <Link
                          href={`/profile/${definition?.slug ?? ''}`}
                          className="group flex items-center gap-4 py-3.5"
                        >
                          <span className="w-5 shrink-0 text-[11px] tabular-nums text-content-muted">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-medium text-content group-hover:underline group-hover:underline-offset-4">
                              {section.label}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-content-muted">
                              {definition?.description ?? 'Add the first entry.'}
                            </span>
                          </span>
                          <span className="shrink-0 text-[11px] text-content-muted">Empty</span>
                          <ArrowRight
                            size={13}
                            aria-hidden="true"
                            className="shrink-0 text-content-muted transition-transform group-hover:translate-x-0.5"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="border-b border-line py-6 text-[13px] text-content-secondary">
                  Every section has at least one entry. There is nothing waiting for you here.
                </p>
              )}

              <p className="mt-4 text-[11px] leading-relaxed text-content-muted">
                Sections are independent. An empty section does not remove anything from a resume or
                portfolio that is already built.
              </p>
            </>
          ) : (
            <div className="flex flex-col items-start gap-3 py-6">
              <p className="text-[14px] text-content-secondary">
                No profile record exists for this account yet.
              </p>
              <Link href="/onboarding" className={buttonVariants({ size: 'sm' })}>
                Set up your profile
              </Link>
            </div>
          )}
        </section>

        {/* Documents and shortcuts -------------------------------------- */}
        <aside className="flex flex-col gap-8">
          <section aria-labelledby="documents-heading">
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5">
              <h2 id="documents-heading" className="text-[13px] font-medium text-content">
                Resumes
              </h2>
              <Link
                href="/resumes"
                className="text-[11px] text-content-secondary underline decoration-line-strong underline-offset-4 hover:text-content hover:decoration-content"
              >
                Manage
              </Link>
            </div>

            {resumes.length > 0 ? (
              <ul>
                {resumes.slice(0, 4).map((resume) => (
                  <li key={resume.id} className="border-b border-line">
                    <Link href={`/resumes/${resume.id}`} className="group block py-3.5">
                      <span className="block truncate text-[13px] font-medium text-content group-hover:underline group-hover:underline-offset-4">
                        {resume.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-content-muted">
                        Updated {formatDate(resume.updatedAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-b border-line py-4 text-[12px] leading-relaxed text-content-muted">
                No resumes yet. The first one takes a title and a layout.
              </p>
            )}

            <Link
              href="/resumes"
              className="mt-3 inline-block text-[12px] text-brand-text underline decoration-brand/40 underline-offset-4 hover:decoration-brand"
            >
              Create a resume
            </Link>
          </section>

          <section aria-labelledby="workspace-heading">
            <h2
              id="workspace-heading"
              className="border-b border-line pb-2.5 text-[13px] font-medium text-content"
            >
              Workspace
            </h2>
            <ul>
              {DESTINATIONS.map((destination) => (
                <li key={destination.href} className="border-b border-line">
                  <Link
                    href={destination.href}
                    className="group flex items-baseline justify-between gap-4 py-3"
                  >
                    <span className="text-[13px] text-content-secondary group-hover:text-content group-hover:underline group-hover:underline-offset-4">
                      {destination.label}
                    </span>
                    <span className="text-[10px] text-content-muted">{destination.meta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-[11px] leading-relaxed text-content-muted">
            Nothing is visible to anyone else unless you publish a portfolio or share a portfolio
            link. Resumes stay in your account.
          </p>
        </aside>
      </div>
    </div>
  );
}
