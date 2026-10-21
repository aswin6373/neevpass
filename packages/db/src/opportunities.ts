/**
 * Opportunities repository — the catalog read and the student's feedback.
 *
 * Lists link OUT. NeevPass never hosts an application; the student's own
 * feedback (SAVED / APPLIED / DISMISSED) is theirs to change at any time.
 */

import { AppError, type OpportunityInput, type SavedStatus } from '@neevpass/domain';

import type { ProfileScope } from './access';
import { prisma } from './index';

export async function listActiveOpportunities(): Promise<readonly OpportunityInput[]> {
  const rows = await prisma.opportunity.findMany({
    where: { isActive: true },
    orderBy: [{ deadline: 'asc' }, { title: 'asc' }],
    include: { skills: { include: { skill: { select: { id: true } } } } },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    organiser: row.organiser,
    type: row.type,
    ...(row.workMode ? { workMode: row.workMode } : {}),
    ...(row.location ? { location: row.location } : {}),
    ...(row.deadline ? { deadline: row.deadline.toISOString() } : {}),
    url: row.url,
    ...(row.compensation ? { compensation: row.compensation } : {}),
    skillIds: row.skills.map((skill) => skill.skill.id),
  }));
}

/** All of the profile's opportunity feedback, keyed by opportunity id. */
export async function opportunityFeedback(profileId: string): Promise<ReadonlyMap<string, SavedStatus>> {
  const rows = await prisma.savedOpportunity.findMany({
    where: { profileId },
    select: { opportunityId: true, status: true },
  });
  return new Map(rows.map((row) => [row.opportunityId, row.status]));
}

/** Upserts or removes the student's feedback on one opportunity. */
export async function setOpportunityFeedback(
  scope: ProfileScope,
  opportunityId: string,
  action: { readonly status: SavedStatus | 'REMOVE' },
): Promise<SavedStatus | undefined> {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { id: true } });
  if (!opportunity) throw AppError.validation('That opportunity does not exist.', { opportunityId });

  if (action.status === 'REMOVE') {
    await prisma.savedOpportunity.deleteMany({
      where: { profileId: scope.profileId, opportunityId },
    });
    return undefined;
  }

  const row = await prisma.savedOpportunity.upsert({
    where: { profileId_opportunityId: { profileId: scope.profileId, opportunityId } },
    create: { profileId: scope.profileId, opportunityId, status: action.status },
    update: { status: action.status },
    select: { status: true },
  });
  return row.status;
}
