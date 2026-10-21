import { SECTION_DEFINITIONS } from '@neevpass/domain';
import { ensurePortfolio, requireProfileAggregate } from '@neevpass/db';
import { PORTFOLIO_TEMPLATES, normalisePortfolioConfig } from '@neevpass/docgen';
import { Alert, PageHeader, buttonVariants } from '@neevpass/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { requireProfile } from '@/lib/session';

import { PortfolioStudio } from './portfolio-studio';

export const metadata: Metadata = {
  title: 'Portfolio',
  robots: { index: false, follow: false },
};

/**
 * Portfolio studio.
 *
 * One published portfolio per profile, lazily created. The public page renders
 * from a publicOnly snapshot: only entries marked PUBLIC or UNLISTED appear,
 * and private entries never leave the owner's view.
 *
 * The live iframe is the main workspace: template, accent, title and hidden
 * sections are previewed against the real renderer before saving, so the
 * published page has no visual surprises.
 */
export default async function PortfoliosPage() {
  const { scope } = await requireProfile();
  const aggregate = await requireProfileAggregate(scope.profileId);
  const portfolio = await ensurePortfolio(scope, `${aggregate.fullName} — portfolio`);
  const config = normalisePortfolioConfig(portfolio.config, portfolio.templateKey);
  const sections = SECTION_DEFINITIONS.filter((section) => section.kind !== 'SUMMARY');

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
  const hiddenSectionCount = config.hiddenSections.filter((kind) =>
    sections.some((section) => section.kind === kind),
  ).length;
  const visibleSectionCount = sections.length - hiddenSectionCount;
  const live = portfolio.published && Boolean(portfolio.publicSlug);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Portfolio"
        title="Portfolio"
        description="A personal site built only from entries you have marked public or unlisted. Pick a template, make it yours, and publish when it feels right."
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
                value: `${visibleSectionCount}/${sections.length}`,
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

      {/* Studio ---------------------------------------------------------- */}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="font-display text-[1.6rem] text-content">Design &amp; publish</h2>
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-content-secondary">
              Choose a template, tune the accent and hide anything you would rather not show.
              The preview on the left is the real page, not a mock-up.
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.14em] text-content-muted">
            {live ? 'Live' : 'Draft'}
          </span>
        </div>

        <PortfolioStudio
          revision={aggregate.revision}
          sections={sections.map((section) => ({
            kind: section.kind,
            label: section.label,
          }))}
          templates={PORTFOLIO_TEMPLATES.map((template) => ({
            key: template.key,
            label: template.label,
            description: template.description,
            defaultAccent: template.defaultAccent,
          }))}
          initial={{
            title: portfolio.title,
            publicSlug: portfolio.publicSlug ?? '',
            published: portfolio.published,
            templateKey: config.templateKey,
            accentColor: config.accentColor,
            hiddenSections: config.hiddenSections,
          }}
        />

        <dl className="mt-8 grid gap-x-10 gap-y-4 border-t border-line pt-5 sm:grid-cols-3">
          <div>
            <dt className="text-[10px] text-content-muted">Visibility rule</dt>
            <dd className="mt-1 text-[11px] leading-relaxed text-content-secondary">
              Only entries marked Public or Unlisted are rendered. Private entries are never
              included.
            </dd>
          </div>
          <div>
            <dt className="text-[10px] text-content-muted">Links &amp; email</dt>
            <dd className="mt-1 text-[11px] leading-relaxed text-content-secondary">
              Your account email is never shown. Add an email link if you want visitors to have
              it.
            </dd>
          </div>
          <div>
            <dt className="text-[10px] text-content-muted">Search engines</dt>
            <dd className="mt-1 text-[11px] leading-relaxed text-content-secondary">
              The page is not listed in a directory and is sent with a noindex header.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
