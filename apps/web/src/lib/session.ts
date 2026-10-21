import { findProfileForUser, type ProfileScope } from '@neevpass/db';
import { redirect } from 'next/navigation';

import { auth } from './auth';

/**
 * Session access helpers.
 *
 * `requireUser` is the only way application code should obtain a user id. The
 * id always comes from the verified session — never from a request body, query
 * string or header — which is the property that makes the ownership guard in
 * @neevpass/db meaningful.
 */

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  };
}

/**
 * Requires a signed-in user, redirecting to sign-in when there is none.
 *
 * Returns `never` on the redirect path so callers get a non-nullable user
 * without an assertion.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return user;
}

/**
 * Requires a signed-in user who has completed onboarding (i.e. has a profile).
 *
 * Between sign-up and onboarding there is no Profile row, so this redirects to
 * onboarding rather than treating a missing profile as an error.
 */
export async function requireProfile(): Promise<{ user: SessionUser; scope: ProfileScope }> {
  const user = await requireUser();
  const scope = await findProfileForUser(user.id);

  if (!scope) {
    redirect('/onboarding');
  }

  return { user, scope };
}
