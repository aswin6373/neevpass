import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { requireUser } from '@/lib/session';

/**
 * Layout for the authenticated application.
 *
 * `requireUser()` redirects to sign-in when there is no session, which is the
 * authorisation gate for everything inside this route group. Doing it here
 * rather than in middleware has two advantages: the check runs in the Node
 * runtime with full access to the database, and a new route under `(app)` is
 * protected by default rather than by remembering to add a matcher.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return <AppShell user={{ name: user.name, email: user.email }}>{children}</AppShell>;
}
