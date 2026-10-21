import { SELF_REPORTED_NOTICE } from '@neevpass/domain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neevpass/ui';
import type { Metadata } from 'next';

import { getConfiguredOAuthProviders } from '@/lib/env';

import { AuthDivider, OAuthButtons } from '../oauth-buttons';
import { SignUpForm } from './sign-up-form';

export const metadata: Metadata = {
  title: 'Create your account',
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  const providers = getConfiguredOAuthProviders();

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1" className="text-xl">
          Create your account
        </CardTitle>
        <CardDescription>
          One profile, reused for every resume, portfolio and career page.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <OAuthButtons providers={providers} />

        {providers.length > 0 && <AuthDivider />}

        <SignUpForm />

        <p className="text-xs text-content-muted">
          Your profile is private by default. You choose what, if anything, to publish.{' '}
          {SELF_REPORTED_NOTICE}
        </p>
      </CardContent>
    </Card>
  );
}
