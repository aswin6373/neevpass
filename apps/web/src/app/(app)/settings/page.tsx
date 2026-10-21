import { SELF_REPORTED_NOTICE } from '@neevpass/domain';
import { Button, PageHeader } from '@neevpass/ui';
import type { Metadata } from 'next';

import { signOutAction } from '@/app/actions/auth';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
};

const PRIVACY_POINTS = [
  'Your profile is private by default and stays private until you publish a page.',
  'There is no directory of students, and recruiters cannot search for you.',
  'No achievement is labelled as verified. The work is self-reported.',
  'Your data stays scoped to your account.',
] as const;

/**
 * Account settings.
 *
 * Phase 0 scope is deliberately narrow: who is signed in, how the data is
 * treated, and the sign-out control. No future-feature cards or disabled
 * controls pretending to be a roadmap.
 */
export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-9">
      <PageHeader
        eyebrow="Settings"
        title="Account"
        description="The details you signed in with, and how NeevPass treats your information."
      />

      <section className="grid gap-6 border-b border-line pb-9 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14">
        <div>
          <h2 className="font-display text-[1.5rem] text-content">Account details</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-content-muted">
            These come from your sign-in method.
          </p>
        </div>

        <div>
          <dl className="border-t border-line">
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 border-b border-line py-3.5">
              <dt className="text-[11px] text-content-muted">Name</dt>
              <dd className="text-[13px] text-content">{user.name ?? 'Not set'}</dd>
            </div>
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 border-b border-line py-3.5">
              <dt className="text-[11px] text-content-muted">Email</dt>
              <dd className="break-all text-[13px] text-content">{user.email}</dd>
            </div>
            <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 border-b border-line py-3.5">
              <dt className="text-[11px] text-content-muted">Status</dt>
              <dd className="text-[13px] text-content">Signed in</dd>
            </div>
          </dl>

          <form
            action={signOutAction}
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-[11px] text-content-muted">
              Signing out leaves every profile entry intact.
            </p>
            <Button type="submit" variant="secondary" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14">
        <div>
          <h2 className="font-display text-[1.5rem] text-content">Privacy</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-content-muted">
            What NeevPass does and does not do with your information.
          </p>
        </div>

        <div>
          <ul className="border-t border-line">
            {PRIVACY_POINTS.map((point, index) => (
              <li
                key={point}
                className="flex items-start gap-4 border-b border-line py-3.5 text-[13px] leading-relaxed text-content-secondary"
              >
                <span className="w-4 shrink-0 pt-0.5 text-[10px] tabular-nums text-content-muted">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {point}
              </li>
            ))}
          </ul>

          <p className="mt-4 border-l-2 border-brand/50 pl-3 text-[11px] leading-relaxed text-content-muted">
            {SELF_REPORTED_NOTICE}
          </p>
        </div>
      </section>
    </div>
  );
}
