import { recommendOpportunities } from '@neevpass/domain';
import {
  listActiveOpportunities,
  opportunityFeedback,
  requireProfileAggregate,
} from '@neevpass/db';
import { Badge, Card, PageHeader } from '@neevpass/ui';
import type { Metadata } from 'next';

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

const FEEDBACK_LABELS: Readonly<Record<string, string>> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
};

/**
 * Opportunities.
 *
 * Ranking is the domain engine's job (`recommendOpportunities`): fit with your
 * skills first, deadline proximity as a tiebreaker. Links point OUT — NeevPass
 * never hosts an application; it keeps the student's own progress marks here.
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Opportunities"
        description="Ranked by fit with your skills and how soon they close. Dismissed listings stay out of your way."
      />

      {recommendations.length === 0 ? (
        <Card>
          <p className="p-6 text-center text-sm text-content-muted">
            Nothing ranks in yet — each listing needs to touch at least one skill on your profile.
            As your skills grow, more will appear here.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {recommendations.map((recommendation) => {
            const opportunity = recommendation.opportunity;
            return (
              <li key={opportunity.id} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-content">
                      {opportunity.title}
                      <Badge variant="neutral">{TYPE_LABELS[opportunity.type] ?? opportunity.type}</Badge>
                      {recommendation.savedStatus ? (
                        <Badge variant="success">{FEEDBACK_LABELS[recommendation.savedStatus] ?? recommendation.savedStatus}</Badge>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-sm text-content-secondary">
                      {opportunity.organiser}
                      {opportunity.location ? ` · ${opportunity.location}` : ''}
                      {opportunity.workMode ? ` · ${opportunity.workMode.toLowerCase()}` : ''}
                      {opportunity.compensation ? ` · ${opportunity.compensation}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-content-muted">{recommendation.reason}</p>
                    {recommendation.matchedSkillNames.length > 0 ? (
                      <p className="mt-2 flex flex-wrap gap-1.5">
                        {recommendation.matchedSkillNames.map((name) => (
                          <Badge key={name} variant="outline">{name}</Badge>
                        ))}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <a
                      href={opportunity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-brand underline-offset-2 hover:underline"
                    >
                      Open listing ↗
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
        </ul>
      )}
    </div>
  );
}
