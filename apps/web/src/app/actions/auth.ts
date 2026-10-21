'use server';

import { signOut } from '@/lib/auth';

/**
 * Server actions for authentication.
 *
 * Sign-out is a server action rather than a client `fetch` so that it works
 * without JavaScript and cannot be triggered by a cross-site GET. Server
 * actions are POST-only and carry an origin check, which is what makes a form
 * submission safe here.
 */

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}
