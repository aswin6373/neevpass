import { Alert, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@neevpass/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { getConfiguredOAuthProviders } from '@/lib/env';

import { AuthDivider, OAuthButtons } from '../oauth-buttons';
import { SignInForm } from './sign-in-form';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

/**
 * Maps Auth.js error codes to something a person can understand.
 * Auth.js redirects back here with `?error=<code>` on a failed OAuth exchange.
 */
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    'That email is already registered with a different sign-in method. Sign in the way you originally did.',
  OAuthSignin: 'We could not start the sign-in with that provider. Please try again.',
  OAuthCallback: 'That provider rejected the sign-in. Please try again.',
  AccessDenied: 'Access was denied. If you used a school or work account, it may be restricted.',
  Configuration: 'Sign-in is not configured correctly. Please contact support.',
  Verification: 'That sign-in link has expired. Please try again.',
};

export default async function SignInPage({
  searchParams,
}: {
  // Next.js 15+ passes searchParams as a promise.
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, providers] = await Promise.all([
    searchParams,
    Promise.resolve(getConfiguredOAuthProviders()),
  ]);

  const oauthErrorMessage = error
    ? (OAUTH_ERROR_MESSAGES[error] ?? 'Sign-in failed. Please try again.')
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1" className="text-xl">
          Welcome back
        </CardTitle>
        <CardDescription>Sign in to continue building your profile.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {oauthErrorMessage && (
          <Alert variant="danger" title="Sign-in problem">
            {oauthErrorMessage}
          </Alert>
        )}

        <OAuthButtons providers={providers} />

        {providers.length > 0 && <AuthDivider />}

        <SignInForm />

        <p className="text-center text-xs text-content-muted">
          By signing in you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-4">
            terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-4">
            privacy policy
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
