import { Button, PageHeader } from '@neevpass/ui';
import type { Metadata } from 'next';

import { signOutAction } from '@/app/actions/auth';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
};

const PRIVACY_POINTS = [
  'Your profile is private until you publish a portfolio page.',
  'There is no directory of students, and recruiters cannot search for you.',
  'Entries are self-reported. NeevPass does not verify or endorse them.',
] as const;

/**
 * Account settings.
 *
 * Phase 0 scope is deliberately narrow: who is signed in, how the data is
 * treated, and the sign-out control.
 */
export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <PageHeader title="Settings" description="Account details and how NeevPass treats your data." />

      <section aria-labelledby="account-heading">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
          <h2 id="account-heading" className="np-section-label">
            Account
          </h2>
        </div>

        <dl>
          <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 border-b border-line py-3">
            <dt className="np-mono text-[10px] text-content-muted">name</dt>
            <dd className="text-[12.5px] text-content">{user.name ?? 'Not set'}</dd>
          </div>
          <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 border-b border-line py-3">
            <dt className="np-mono text-[10px] text-content-muted">email</dt>
            <dd className="break-all text-[12.5px] text-content">{user.email}</dd>
          </div>
        </dl>

        <form action={signOutAction} className="mt-4 flex justify-end">
          <Button type="submit" variant="secondary" size="sm">
            Sign out
          </Button>
        </form>
      </section>

      <section aria-labelledby="privacy-heading" className="border-t border-line pt-8">
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
          <h2 id="privacy-heading" className="np-section-label">
            Privacy
          </h2>
        </div>

        <ol>
          {PRIVACY_POINTS.map((point, index) => (
            <li
              key={point}
              className="flex items-baseline gap-4 border-b border-line py-3 text-[12.5px] leading-relaxed text-content-secondary"
            >
              <span className="np-mono w-4 shrink-0 text-[10px] text-content-muted">
                {String(index + 1).padStart(2, '0')}
              </span>
              {point}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
