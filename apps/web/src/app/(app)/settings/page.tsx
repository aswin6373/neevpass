import { SELF_REPORTED_NOTICE } from '@neevpass/domain';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@neevpass/ui';
import type { Metadata } from 'next';

import { signOutAction } from '@/app/actions/auth';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
};

/**
 * Account settings.
 *
 * Phase 0 scope is deliberately narrow: show who is signed in, and provide the
 * sign-out control. Account deletion, data export and privacy defaults arrive
 * with the profile module, once there is data to export or delete.
 */
export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Your account and how your information is handled." />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>The details you signed in with.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-content-muted">Name</dt>
              <dd className="text-sm text-content">{user.name ?? 'Not set'}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-content-muted">Email</dt>
              <dd className="text-sm text-content">{user.email}</dd>
            </div>
          </dl>

          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>What NeevPass does and does not do with your information.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-1.5 text-sm text-content-secondary">
            <li>Your profile is private by default and stays private until you publish it.</li>
            <li>There is no directory of students, and recruiters cannot search for you.</li>
            <li>We never state that your achievements are verified.</li>
            <li>You will be able to export and delete everything you have entered.</li>
          </ul>
          <p className="text-xs text-content-muted">{SELF_REPORTED_NOTICE}</p>
        </CardContent>
      </Card>

      <Alert variant="info" title="More settings are coming">
        Changing your email, deleting your account and managing published pages arrive alongside
        the profile editor.
      </Alert>
    </div>
  );
}
