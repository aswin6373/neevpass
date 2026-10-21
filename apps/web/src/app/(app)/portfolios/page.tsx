import { SECTION_DEFINITIONS } from '@neevpass/domain';
import { ensurePortfolio, requireProfileAggregate } from '@neevpass/db';
import { normaliseResumeConfig } from '@neevpass/docgen';
import { Alert, PageHeader, buttonVariants } from '@neevpass/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { requireProfile } from '@/lib/session';

import { PortfolioForm } from './portfolio-form';

export const metadata: Metadata = {
  title: 'Portfolio',
  robots: { index: false, follow: false },
};

/**
 * Portfolio publishing.
 *
 * One published portfolio per profile, lazily created. The public page renders
 * from a publicOnly snapshot: only entries marked PUBLIC or UNLISTED appear,
 * and private entries never leave the owner's view.
 *
 * The page is arranged as a configuration sheet: current address, what the
 * public sees, then the settings. It is not a promotional landing page for the
 * student's own portfolio.
 */
export default async function PortfoliosPage() {
  const { scope } = await requireProfile();
  const aggregate = await requireProfileAggregate(scope.profileId);
  const portfolio = await ensurePortfolio(scope, `${aggregate.fullName} — portfolio`);
  const config = normaliseResumeConfig(portfolio.config);

  const contentSections = [
    aggregate.education,
    aggregate.experience,
    aggregate.projects,
    aggregate.certificates,
    aggregate.achievements,
    aggregate.hackathons,
    aggregate.workshops,
    aggregate.skills,
    aggregate.links,
  ];
  const visibleEntryCount = contentSections.reduce(
    (total, section) => total + section.filter((row) => row.visibility !== 'PRIVATE').length,
    0,
  );
  const hiddenSectionCount = config.hiddenSections.length;
  const visibleSectionCount = SECTION_DEFINITIONS.length - hiddenSectionCount;
  const live = portfolio.published && Boolean(portfolio.publicSlug);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Portfolio"
        title="Portfolio"
        description="A public page built only from entries you have marked public or unlisted. Everything else stays in your account."
        actions={
          live && portfolio.publicSlug ? (
            <Link
              href={`/p/${portfolio.publicSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: 'sm' })}
            >
              View public page
            </Link>
          ) : (
            <p className="text-[11px] text-content-muted">Not published</p>
          )
        }
      />

      {/* Status ----------------------------------------------------------- */}
      <section className="border-y border-line py-6">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div className="min-w-0">
            <p className="text-[11px] text-content-muted">Public address</p>
            {live && portfolio.publicSlug ? (
              <Link
                href={`/p/${portfolio.publicSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="np-display mt-1 inline-block break-all text-[1.75rem] text-content underline decoration-line-strong decoration-1 underline-offset-4 hover:decoration-content"
              >
                /p/{portfolio.publicSlug}
              </Link>
            ) : (
              <p className="np-display mt-1 text-[1.75rem] text-content-muted">
                No address yet
              </p>
            )}
            <p className="mt-2 max-w-md text-[11px] leading-relaxed text-content-muted">
              {live
                ? 'The page is live and reachable by this link. It is not listed in a directory and search engines are asked not to index it.'
                : 'Save an address below and tick Published to make the page reachable.'}
            </p>
          </div>

          <dl className="grid shrink-0 grid-cols-3 gap-6 sm:gap-10">
            {[
              { label: 'Visible entries', value: String(visibleEntryCount) },
              {
                label: 'Sections shown',
                value: `${visibleSectionCount}/${SECTION_DEFINITIONS.length}`,
              },
              { label: 'Hidden', value: String(hiddenSectionCount) },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="mt-1.5 text-[10px] leading-tight text-content-muted">{stat.label}</dt>
                <dd className="font-display text-[1.5rem] leading-none text-content">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {portfolio.published && visibleEntryCount === 0 ? (
        <Alert variant="warning" title="The published page is nearly empty">
          Every entry on your profile is still private, so visitors only see your name, headline and
          summary. Open a profile section and set a few entries to Public or Unlisted before sharing
          the link.
        </Alert>
      ) : null}

      {/* Settings --------------------------------------------------------- */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-14">
        <div>
          <h2 className="font-display text-[1.6rem] text-content">Publishing settings</h2>
          <p className="mt-2 text-[12px] leading-relaxed text-content-secondary">
            The title, address and sections shown on the public page. Changes take effect on the
            next request.
          </p>

          <dl className="mt-5 border-t border-line">
            <div className="border-b border-line py-3">
              <dt className="text-[10px] text-content-muted">Visibility rule</dt>
              <dd className="mt-1 text-[11px] leading-relaxed text-content-secondary">
                Only entries marked Public or Unlisted are rendered. Private entries are never
                included.
              </dd>
            </div>
            <div className="border-b border-line py-3">
              <dt className="text-[10px] text-content-muted">Hidden sections</dt>
              <dd className="mt-1 text-[11px] leading-relaxed text-content-secondary">
                A ticked section is left out of the public page even when it contains public
                entries.
              </dd>
            </div>
            <div className="border-b border-line py-3">
              <dt className="text-[10px] text-content-muted">Email</dt>
              <dd className="mt-1 text-[11px] leading-relaxed text-content-secondary">
                Your account email is not shown. It appears only if you add it as a public link.
              </dd>
            </div>
          </dl>
        </div>

        <PortfolioForm
          revision={aggregate.revision}
          sections={SECTION_DEFINITIONS.map((section) => ({
            kind: section.kind,
            label: section.label,
          }))}
          initial={{
            title: portfolio.title,
            publicSlug: portfolio.publicSlug ?? '',
            published: portfolio.published,
            hiddenSections: config.hiddenSections,
          }}
        />
      </section>
    </div>
  );
}
