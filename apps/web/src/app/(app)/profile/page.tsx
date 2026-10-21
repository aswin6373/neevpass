import { computeProfileCompleteness, SECTION_DEFINITIONS } from '@neevpass/domain';
import { requireProfileAggregate } from '@neevpass/db';
import { PageHeader, buttonVariants, cn } from '@neevpass/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { requireProfile } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false, follow: false },
};

/**
 * Profile overview.
 *
 * A table of contents for the record rather than a gallery of cards. The eleven
 * sections and the completeness figures both come from the domain, so this page
 * cannot drift from the data model.
 */
export default async function ProfilePage() {
  const { user, scope } = await requireProfile();
  const aggregate = await requireProfileAggregate(scope.profileId);
  const completeness = computeProfileCompleteness(aggregate);

  const nextSection = SECTION_DEFINITIONS.find(
    (definition) =>
      !completeness.sections.some(
        (section) => section.kind === definition.kind && section.filled,
      ),
  );

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Profile record"
        title={aggregate.fullName}
        description={
          aggregate.headline ??
          'Add a one-line headline so the profile and every resume open with the same summary.'
        }
        actions={
          <Link
            href="/profile/summary"
            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
          >
            Edit basics
          </Link>
        }
      />

      <section className="grid gap-6 border-b border-line pb-6 sm:grid-cols-[minmax(0,1fr)_17rem] sm:items-end sm:gap-10">
        <div className="flex flex-col gap-1.5">
          <p className="text-[12px] text-content-secondary">
            {aggregate.location ? `${aggregate.location} · ` : ''}
            {user.email}
          </p>
          <p className="text-[11px] text-content-muted">
            Revision {aggregate.revision} · Private unless an entry is marked public
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[11px] text-content-secondary">Profile completeness</p>
            <p className="text-[11px] tabular-nums text-content">
              {completeness.percent}%
            </p>
          </div>
          <div
            role="progressbar"
            aria-valuenow={completeness.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completeness"
            className="mt-2 h-1.5 w-full overflow-hidden bg-surface-sunken"
          >
            <div
              className="h-full bg-brand transition-[width] duration-300"
              style={{ width: `${completeness.percent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-content-muted">
            {nextSection ? (
              <>
                Next up:{' '}
                <Link
                  href={`/profile/${nextSection.slug}`}
                  className="text-content-secondary underline decoration-line-strong underline-offset-2 hover:text-content hover:decoration-content"
                >
                  {nextSection.label}
                </Link>
              </>
            ) : (
              'Every section has at least one entry.'
            )}
          </p>
        </div>
      </section>

      <section aria-labelledby="sections-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2.5">
          <h2 id="sections-heading" className="font-display text-[1.6rem] text-content">
            Sections
          </h2>
          <p className="text-[11px] text-content-muted">
            {completeness.filledCount} of {completeness.totalCount} filled
          </p>
        </div>

        <ol>
          {SECTION_DEFINITIONS.map((definition, index) => {
            const section = completeness.sections.find(
              (entry) => entry.kind === definition.kind,
            );
            const filled = section?.filled ?? false;
            const items = section?.items ?? 0;

            return (
              <li key={definition.kind} className="border-b border-line">
                <Link
                  href={`/profile/${definition.slug}`}
                  className="group grid grid-cols-[0.5rem_1.25rem_minmax(0,1fr)_auto] items-center gap-3 py-3.5 sm:grid-cols-[0.5rem_2rem_minmax(0,12rem)_minmax(0,1fr)_auto] sm:gap-4"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'h-1.5 w-1.5',
                      filled ? 'bg-brand' : 'border border-line-strong bg-transparent',
                    )}
                  />
                  <span className="text-[11px] tabular-nums text-content-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'text-[14px] group-hover:underline group-hover:underline-offset-4',
                      filled ? 'font-medium text-content' : 'text-content-secondary',
                    )}
                  >
                    {definition.label}
                  </span>
                  <span className="hidden truncate text-[11px] text-content-muted sm:block">
                    {definition.description}
                  </span>
                  <span
                    className={cn(
                      'text-right text-[11px] tabular-nums',
                      filled ? 'text-content-secondary' : 'text-content-muted',
                    )}
                  >
                    {filled
                      ? `${items} ${items === 1 ? 'entry' : 'entries'}`
                      : 'Add'}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <p className="max-w-2xl text-[11px] leading-relaxed text-content-muted">
        Every entry starts private. Visibility is set per entry, and a resume never publishes
        anything on its own. Only a portfolio page can be seen by someone else, and only when you
        publish it.
      </p>
    </div>
  );
}
