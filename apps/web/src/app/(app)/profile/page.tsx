import { computeProfileCompleteness, SECTION_DEFINITIONS } from '@neevpass/domain';
import { requireProfileAggregate } from '@neevpass/db';
import { buttonVariants, cn } from '@neevpass/ui';
import { ArrowUpRight } from 'lucide-react';
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
 * The index of the record: every section in one ruled list, with the
 * completeness figure in a narrow margin. Deliberately not a gallery of cards.
 */
export default async function ProfilePage() {
  const { user, scope } = await requireProfile();
  const aggregate = await requireProfileAggregate(scope.profileId);
  const completeness = computeProfileCompleteness(aggregate);

  const nextSection = completeness.sections.find((section) => !section.filled);

  return (
    <div className="flex flex-col gap-9">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <h1 className="text-[1.5rem] font-semibold leading-tight tracking-[-0.03em] text-content sm:text-[1.8rem]">
            {aggregate.fullName}
          </h1>
          <p className="mt-1 max-w-[55ch] text-[12.5px] leading-relaxed text-content-secondary">
            {aggregate.headline ??
              'Add a headline so every resume and portfolio opens with the same line.'}
          </p>
          <p className="np-mono mt-3 text-[10px] text-content-muted">
            {[aggregate.location, user.email].filter(Boolean).join('  /  ')}
          </p>
        </div>
        <Link
          href="/profile/summary"
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'self-start')}
        >
          Edit basics
        </Link>
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
        {/* Section index -------------------------------------------------- */}
        <section aria-labelledby="sections-heading">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
            <h2 id="sections-heading" className="text-[12px] font-semibold text-content">
              Sections
            </h2>
            <span className="np-mono text-[10px] text-content-muted">
              {completeness.filledCount}/{completeness.totalCount} filled
            </span>
          </div>

          <ol>
            {completeness.sections.map((section, index) => {
              const definition = sectionDefinition(section.kind);
              return (
                <li key={section.kind}>
                  <Link
                    href={`/profile/${definition?.slug ?? ''}`}
                    className="group grid grid-cols-[1.5rem_minmax(0,1fr)_auto_1rem] items-baseline gap-3 border-b border-line py-3.5 transition-colors hover:bg-surface-hover"
                  >
                    <span className="np-mono text-[10px] text-content-muted">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={
                        section.filled
                          ? 'text-[13px] font-medium text-content'
                          : 'text-[13px] text-content-secondary'
                      }
                    >
                      {section.label}
                    </span>
                    <span className="np-mono text-[10px] text-content-muted">
                      {section.filled ? `${section.items} entr${section.items === 1 ? 'y' : 'ies'}` : 'empty'}
                    </span>
                    <ArrowUpRight
                      size={13}
                      aria-hidden="true"
                      className="text-content-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-content"
                    />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Margin --------------------------------------------------------- */}
        <aside className="flex flex-col gap-8">
          <section aria-labelledby="completeness-heading">
            <h2
              id="completeness-heading"
              className="border-b border-line pb-2 text-[12px] font-semibold text-content"
            >
              Completeness
            </h2>
            <p className="np-tabular mt-4 text-[2.6rem] font-medium leading-none tracking-[-0.05em] text-content">
              {completeness.percent}
              <span className="ml-0.5 align-baseline text-[0.95rem] font-normal text-content-muted">
                %
              </span>
            </p>
            <div
              role="progressbar"
              aria-valuenow={completeness.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completeness"
              className="mt-4 h-px w-full bg-line"
            >
              <div
                className="h-px bg-content"
                style={{ width: `${completeness.percent}%` }}
              />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-content-muted">
              {nextSection ? (
                <>
                  Next:{' '}
                  <Link
                    href={`/profile/${sectionDefinition(nextSection.kind)?.slug ?? ''}`}
                    className="text-content underline decoration-line-strong underline-offset-2 hover:decoration-content"
                  >
                    {nextSection.label}
                  </Link>
                </>
              ) : (
                'Every section has at least one entry.'
              )}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function sectionDefinition(kind: string) {
  return SECTION_DEFINITIONS.find((definition) => definition.kind === kind);
}
