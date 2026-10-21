import { SECTION_DEFINITIONS } from '@neevpass/domain';
import { ensurePortfolio, requireProfileAggregate } from '@neevpass/db';
import { normaliseResumeConfig } from '@neevpass/docgen';
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@neevpass/ui';
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
 * One published portfolio per profile, lazily created. The public page at
 * /p/[slug] is rendered from a publicOnly snapshot: only entries the student
 * marked PUBLIC (or UNLISTED) appear, and private entries never leave the
 * owner's view.
 */
export default async function PortfoliosPage() {
  const { scope } = await requireProfile();
  const aggregate = await requireProfileAggregate(scope.profileId);
  const portfolio = await ensurePortfolio(scope, `${aggregate.fullName} — portfolio`);
  const config = normaliseResumeConfig(portfolio.config);

  // A published portfolio whose entries are all private still renders — just
  // with nothing but the header and summary. Warn before that surprises anyone.
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Portfolio"
        description="One page you can share. Everything private stays private — the public render only sees what you publish."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{portfolio.title}</CardTitle>
              <CardDescription>
                {portfolio.published && portfolio.publicSlug
                  ? 'Your portfolio is live at the address below.'
                  : 'Not published yet — save an address and tick “Published” to go live.'}
              </CardDescription>
            </div>
            <Badge variant={portfolio.published ? 'success' : 'outline'}>
              {portfolio.published ? 'Published' : 'Draft'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {portfolio.published && portfolio.publicSlug ? (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-content-secondary">Public address:</span>
              <Link
                href={`/p/${portfolio.publicSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                /p/{portfolio.publicSlug} ↗
              </Link>
            </p>
          ) : null}

          <Alert variant="info" title="What the public page shows">
            Only entries whose visibility is Public or Unlisted, and only sections you leave
            unticked below. Your email appears only if you add it as a link.
          </Alert>

          {portfolio.published && visibleEntryCount === 0 ? (
            <Alert variant="warning" title="Your published page is nearly empty">
              Every entry on your profile is still Private, so visitors only see your name,
              headline and summary. Open a profile section and set a few entries to Public or
              Unlisted before sharing the link.
            </Alert>
          ) : null}

          <PortfolioForm
            revision={aggregate.revision}
            sections={SECTION_DEFINITIONS.map((section) => ({ kind: section.kind, label: section.label }))}
            initial={{
              title: portfolio.title,
              publicSlug: portfolio.publicSlug ?? '',
              published: portfolio.published,
              hiddenSections: config.hiddenSections,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
