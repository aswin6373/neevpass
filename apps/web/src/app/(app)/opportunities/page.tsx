import { recommendOpportunities } from '@neevpass/domain';
import {
  listActiveOpportunities,
  opportunityFeedback,
  requireProfileAggregate,
} from '@neevpass/db';
import { EmptyState, PageHeader, buttonVariants, cn } from '@neevpass/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { requireProfile } from '@/lib/session';

import { OpportunityFeedbackForm } from './feedback-form';

export const metadata: Metadata = {
  title: 'Opportunities',
  robots: { index: false, follow: false },
};

const TYPE_LABELS: Readonly<Record<string, string>> = {
  INTERNSHIP: 'Internship',
  JOB: 'Job',
  HACKATHON: 'Hackathon',
  COMPETITION: 'Competition',
  SCHOLARSHIP: 'Scholarship',
  WORKSHOP: 'Workshop',
};

function closingLabel(days: number | undefined): string {
  if (days === undefined) return 'Rolling deadline';
  if (days <= 0) return 'Closes today';
  if (days === 1) return 'Closes tomorrow';
  if (days > 60) return 'Open for a while';
  return `Closes in ${days} days`;
}

/**
 * Opportunities.
 *
 * Ranking is the domain engine's job: fit with the profile's skills first,
 * deadline proximity as a tiebreaker. This page presents the result as a
 * ranked list with the reason visible, not as a wall of promotional cards.
 * Links point out; NeevPass never hosts an application.
 */
export default async function OpportunitiesPage() {
  const { scope } = await requireProfile();
  const aggregate = await requireProfileAggregate(scope.profileId);

  const [catalog, feedback] = await Promise.all([
    listActiveOpportunities(),
    opportunityFeedback(scope.profileId),
  ]);

  const recommendations = recommendOpportunities({
    opportunities: catalog,
    profileSkills: aggregate.skills.map((skill) => ({
      skillId: skill.skillId,
      skillName: skill.name,
    })),
    feedbackByOpportunityId: feedback,
    now: new Date(),
  });

  const appliedCount = recommendations.filter(
    (recommendation) => recommendation.savedStatus === 'APPLIED',
  ).length;
  const savedCount = recommendations.filter(
    (recommendation) => recommendation.savedStatus === 'SAVED',
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Opportunities"
        title="Open listings"
        description="Ranked by the skills already on your profile, then by how soon they close. Each row says why it appears."
        actions={
          <div className="flex items-center gap-4 text-[11px] text-content-muted">
            <span>
              <strong className="font-medium text-content">{recommendations.length}</strong> open
            </span>
            <span>
              <strong className="font-medium text-content">{appliedCount}</strong> applied
            </span>
            <span>
              <strong className="font-medium text-content">{savedCount}</strong> saved
            </span>
          </div>
        }
      />

      {recommendations.length === 0 ? (
        <EmptyState
          title="No listings match yet"
          description="A listing appears here when it touches at least one skill on your profile. Add a few skills, or check back when new listings are published."
          action={
            <Link href="/profile/skills" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
              Add skills
            </Link>
          }
        />
      ) : (
        <ol>
          {recommendations.map((recommendation, index) => {
            const opportunity = recommendation.opportunity;
            const applied = recommendation.savedStatus === 'APPLIED';

            return (
              <li key={opportunity.id} className="border-b border-line py-5 sm:py-6">
                <div className="grid gap-4 md:grid-cols-[2rem_minmax(0,1fr)_15rem] md:items-start md:gap-6">
                  <span className="pt-0.5 text-[11px] tabular-nums text-content-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                      <h2 className="text-[16px] font-medium leading-snug text-content">
                        {opportunity.title}
                      </h2>
                      {recommendation.savedStatus ? (
                        <span
                          className={cn(
                            'border px-1.5 py-0.5 text-[10px] leading-4',
                            applied
                              ? 'border-success/40 bg-success-subtle text-success-text'
                              : 'border-line bg-surface-sunken/60 text-content-secondary',
                          )}
                        >
                          {applied ? 'Applied' : 'Saved'}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-[12px] text-content-secondary">
                      {opportunity.organiser}
                      <span className="text-content-muted">
                        {' · '}
                        {TYPE_LABELS[opportunity.type] ?? opportunity.type}
                        {opportunity.location ? ` · ${opportunity.location}` : ''}
                        {opportunity.workMode ? ` · ${opportunity.workMode.toLowerCase()}` : ''}
                        {opportunity.compensation ? ` · ${opportunity.compensation}` : ''}
                      </span>
                    </p>

                    <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-content-muted">
                      {recommendation.reason}
                    </p>

                    {recommendation.matchedSkillNames.length > 0 ? (
                      <p className="mt-2 text-[11px] leading-relaxed text-content-secondary">
                        <span className="text-content-muted">Matched: </span>
                        {recommendation.matchedSkillNames.join(', ')}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 md:flex-col md:items-end md:justify-start">
                    <div className="text-right">
                      <p className="font-display text-[1.35rem] leading-none text-content">
                        {recommendation.score}
                        <span className="ml-1 font-sans text-[10px] font-normal text-content-muted">
                          fit
                        </span>
                      </p>
                      <p className="mt-1 text-[10px] text-content-muted">
                        {closingLabel(recommendation.daysUntilDeadline)}
                      </p>
                    </div>

                    <a
                      href={opportunity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-brand-text underline decoration-brand/40 underline-offset-4 hover:decoration-brand"
                    >
                      Open listing
                    </a>

                    <OpportunityFeedbackForm
                      opportunityId={opportunity.id}
                      currentStatus={recommendation.savedStatus}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="text-[11px] leading-relaxed text-content-muted">
        Listings are external. NeevPass does not submit applications and does not track whether an
        employer receives one. The saved and applied marks are only for you.
      </p>
    </div>
  );
}
