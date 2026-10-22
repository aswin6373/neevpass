import { recommendOpportunities } from '@neevpass/domain';
import {
  listActiveOpportunities,
  opportunityFeedback,
  requireProfileAggregate,
} from '@neevpass/db';
import { EmptyState, PageHeader, buttonVariants } from '@neevpass/ui';
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
  if (days === undefined) return 'rolling';
  if (days <= 0) return 'closes today';
  if (days === 1) return 'closes tomorrow';
  if (days > 60) return 'open';
  return `${days} days left`;
}

/**
 * Opportunities.
 *
 * Ranking is the domain engine's job: fit with the profile's skills first,
 * deadline proximity as a tiebreaker. Presented as a ranked list with the reason
 * visible, not as a wall of promotional cards.
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
    <div className="flex flex-col gap-9">
      <PageHeader
        title="Opportunities"
        description="Ranked by the skills on your profile, then by how soon they close."
        actions={
          <div className="flex items-center gap-4 font-mono text-[10px] text-content-muted">
            <span>
              <span className="text-content">{recommendations.length}</span> open
            </span>
            <span>
              <span className="text-content">{appliedCount}</span> applied
            </span>
            <span>
              <span className="text-content">{savedCount}</span> saved
            </span>
          </div>
        }
      />

      {recommendations.length === 0 ? (
        <EmptyState
          title="No listings match yet"
          description="A listing appears when it touches at least one skill on your profile."
          action={
            <Link
              href="/profile/skills"
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            >
              Add skills
            </Link>
          }
        />
      ) : (
        <ol>
          {recommendations.map((recommendation, index) => {
            const opportunity = recommendation.opportunity;

            return (
              <li key={opportunity.id} className="border-b border-line py-4 sm:py-5">
                <div className="grid gap-4 md:grid-cols-[1.5rem_minmax(0,1fr)_14rem] md:items-start md:gap-5">
                  <span className="np-mono hidden pt-0.5 text-[10px] text-content-muted md:block">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0">
                    <h2 className="text-[14px] font-medium leading-snug text-content">
                      {opportunity.title}
                    </h2>

                    <p className="mt-1 text-[11px] text-content-muted">
                      {opportunity.organiser}
                      {' / '}
                      {TYPE_LABELS[opportunity.type] ?? opportunity.type}
                      {opportunity.location ? ` / ${opportunity.location}` : ''}
                      {opportunity.workMode ? ` / ${opportunity.workMode.toLowerCase()}` : ''}
                      {opportunity.compensation ? ` / ${opportunity.compensation}` : ''}
                    </p>

                    {recommendation.matchedSkillNames.length > 0 ? (
                      <p className="np-mono mt-2 text-[10px] leading-relaxed text-content-muted">
                        {recommendation.matchedSkillNames.join(' / ')}
                      </p>
                    ) : (
                      <p className="mt-2 text-[11px] text-content-muted">No skill match.</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 md:flex-col md:items-end md:gap-1.5">
                    <div className="flex items-baseline gap-2">
                      <p className="np-tabular text-[1.2rem] leading-none tracking-[-0.03em] text-content">
                        {recommendation.score}
                        <span className="ml-1 font-mono text-[9px] font-normal tracking-normal text-content-muted">
                          fit
                        </span>
                      </p>
                      <span className="np-mono text-[10px] text-content-muted">
                        {closingLabel(recommendation.daysUntilDeadline)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={opportunity.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-content underline decoration-line-strong underline-offset-4 hover:decoration-content"
                      >
                        Open listing
                      </a>

                      <OpportunityFeedbackForm
                        opportunityId={opportunity.id}
                        currentStatus={recommendation.savedStatus}
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="text-[10px] text-content-muted">
        Listings are external. NeevPass does not submit applications.
      </p>
    </div>
  );
}
