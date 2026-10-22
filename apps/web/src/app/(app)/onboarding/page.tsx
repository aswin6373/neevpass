import { findProfileForUser } from '@neevpass/db';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/session';

import { OnboardingForm } from './onboarding-form';

export const metadata: Metadata = {
  title: 'Set up your profile',
  robots: { index: false, follow: false },
};

/**
 * Onboarding: the one screen between sign-up and the app.
 *
 * Deliberately tiny. Full name, a headline and where you are; everything else
 * is filled in section by section afterwards.
 */
export default async function OnboardingPage() {
  const user = await requireUser();

  const scope = await findProfileForUser(user.id);
  if (scope) {
    redirect('/profile');
  }

  return (
    <div className="mx-auto w-full max-w-lg py-2 sm:py-8">
      <h1 className="np-display text-[2rem] text-content sm:text-[2.35rem]">
        Set up your profile.
      </h1>
      <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-content-secondary">
        Three fields now. Everything else can wait.
      </p>

      <div className="mt-7 border-t border-line pt-6">
        <OnboardingForm defaultName={user.name ?? ''} />
      </div>

      <p className="np-mono mt-6 text-[10px] text-content-muted">{user.email}</p>
    </div>
  );
}
