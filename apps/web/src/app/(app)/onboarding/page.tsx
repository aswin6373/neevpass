import { findProfileForUser } from '@neevpass/db';
import { Alert, Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader } from '@neevpass/ui';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/session';

import { OnboardingForm } from './onboarding-form';

export const metadata: Metadata = {
  title: 'Set up your profile',
  robots: { index: false, follow: false },
};

/**
 * Onboarding — the one screen between sign-up and the app.
 *
 * Deliberately tiny: full name, a headline and where you are. Everything else
 * is filled in section by section afterwards; making onboarding long is how
 * students end up with empty accounts.
 */
export default async function OnboardingPage() {
  const user = await requireUser();

  const scope = await findProfileForUser(user.id);
  if (scope) {
    redirect('/profile');
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Welcome to NeevPass"
        description="One structured profile, built once and reused for every resume, portfolio and public page."
      />

      <Alert variant="info" title="Private by default">
        Everything you add starts private. You decide later, section by section and entry by
        entry, what becomes public.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Start your profile</CardTitle>
          <CardDescription>You can change all of this at any time.</CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm defaultName={user.name ?? ''} />
        </CardContent>
      </Card>
    </div>
  );
}
