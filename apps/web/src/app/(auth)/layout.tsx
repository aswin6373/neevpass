import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { getCurrentUser } from '@/lib/session';

/**
 * Layout for the unauthenticated routes (sign in, sign up, password reset).
 *
 * It still uses the full application shell so that the header — and therefore
 * the theme toggle — is present on every page of the product. The content is
 * constrained to a narrow column because these pages are single-purpose forms.
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-8 sm:py-14">{children}</div>
    </AppShell>
  );
}
