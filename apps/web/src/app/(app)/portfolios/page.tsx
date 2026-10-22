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
    <div className="flex flex-col gap-9">
      <PageHeader
        title="Portfolio"
        description="A single page built only from entries you marked public or unlisted."
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
            <span className="np-mono text-[10px] text-content-muted">draft</span>
          )
        }
      />

      {/* Address and figures --------------------------------------------- */}
      <section className="border-y border-line">
        <div className="flex flex-col gap-6 py-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div className="min-w-0">
            <p className="np-mono text-[10px] text-content-muted">public address</p>
            {live && portfolio.publicSlug ? (
              <Link
                href={`/p/${portfolio.publicSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block break-all font-mono text-[1.35rem] leading-tight tracking-[-0.03em] text-content underline decoration-line-strong underline-offset-4 hover:decoration-content"
              >
                /p/{portfolio.publicSlug}
              </Link>
            ) : (
              <p className="mt-2 font-mono text-[1.35rem] leading-tight tracking-[-0.03em] text-content-muted">
                not published
              </p>
            )}
          </div>

          <dl className="grid shrink-0 grid-cols-3 gap-6 sm:gap-10">
            {[
              { label: 'entries', value: String(visibleEntryCount) },
              { label: 'sections', value: `${visibleSectionCount}/${sections.length}` },
              { label: 'hidden', value: String(hiddenSectionCount) },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="np-mono text-[10px] text-content-muted">{stat.label}</dt>
                <dd className="np-tabular mt-1.5 text-[1.35rem] leading-none tracking-[-0.03em] text-content">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {portfolio.published && visibleEntryCount === 0 ? (
        <Alert variant="warning" title="The published page is nearly empty">
          Every entry is still private, so visitors only see your name, headline and summary.
        </Alert>
      ) : null}

      {/* Studio ---------------------------------------------------------- */}
      <section aria-labelledby="studio-heading">
        <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-line pb-2">
          <h2 id="studio-heading" className="np-section-label">
            Design &amp; publish
          </h2>
          <span className="np-mono text-[10px] text-content-muted">
            {live ? 'live' : 'draft'}
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
      </section>
    </div>
  );
}
