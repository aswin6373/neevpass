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
 * is filled in section by section afterwards. A long onboarding is how
 * students end up with empty accounts.
 */
export default async function OnboardingPage() {
  const user = await requireUser();

  const scope = await findProfileForUser(user.id);
  if (scope) {
    redirect('/profile');
  }

  return (
    <div className="mx-auto w-full max-w-xl py-2 sm:py-8">
      <p className="text-[12px] text-content-muted">Profile setup</p>
      <h1 className="np-display mt-2.5 text-[2.4rem] text-content sm:text-[2.8rem]">
        Start your profile.
      </h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-content-secondary">
        Three fields now. Education, projects and the rest can wait until you have something to add.
      </p>

      <div className="mt-7 border-t border-line pt-6">
        <OnboardingForm defaultName={user.name ?? ''} />
      </div>

      <p className="mt-6 border-l-2 border-brand/50 pl-3 text-[11px] leading-relaxed text-content-muted">
        Everything you add starts private. You decide later, entry by entry, what becomes public.
      </p>

      <p className="mt-6 text-[11px] text-content-muted">
        Signed in as <span className="text-content-secondary">{user.email}</span>
      </p>
    </div>
  );
}
