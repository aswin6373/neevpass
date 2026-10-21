/**
 * Ownership guard.
 *
 * This is the ONLY place in the codebase where "does this user own this data?"
 * is answered. Every query that touches student-authored data must first obtain
 * a `ProfileScope` from here and scope its `where` clause with the `profileId`
 * it returns.
 *
 * Two rules make this hold:
 *
 *   1. `userId` always comes from the server-side session. It is never read
 *      from a request body, query string or header.
 *   2. A scoped repository function takes a `ProfileScope`, not a bare id, so
 *      an unscoped query is not expressible without deliberately bypassing the
 *      type.
 */

import { AppError } from '@neevpass/domain';

import { prisma } from './index';

export interface ProfileScope {
  readonly profileId: string;
  readonly userId: string;
  /** Optimistic concurrency token — pass this back on write. */
  readonly revision: number;
}

/**
 * Resolves the profile belonging to `userId`.
 *
 * Throws `UNAUTHENTICATED` when there is no session user, and `NOT_FOUND` when
 * the account exists but has no profile yet — which is the normal state between
 * sign-up and onboarding, so callers should handle it by redirecting to
 * onboarding rather than treating it as an error.
 */
export async function requireProfileForUser(userId: string): Promise<ProfileScope> {
  if (!userId) {
    throw AppError.unauthenticated('requireProfileForUser called without a user id');
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, userId: true, revision: true },
  });

  if (!profile) {
    throw AppError.notFound('No profile exists for this account yet', { userId });
  }

  return { profileId: profile.id, userId: profile.userId, revision: profile.revision };
}

/** Non-throwing variant, for pages that branch on onboarding state. */
export async function findProfileForUser(userId: string): Promise<ProfileScope | null> {
  if (!userId) return null;

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, userId: true, revision: true },
  });

  if (!profile) return null;

  return { profileId: profile.id, userId: profile.userId, revision: profile.revision };
}
