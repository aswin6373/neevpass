import { Alert } from '@neevpass/ui';
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
    <div className="flex flex-col">
      <p className="text-[12px] text-content-muted">NeevPass account</p>
      <h1 className="np-display mt-2.5 text-[2.25rem] text-content">Sign in</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-content-secondary">
        Your profile, resumes and career plan are where you left them.
      </p>

      <div className="mt-7 flex flex-col gap-5 border-t border-line pt-6">
        {oauthErrorMessage && (
          <Alert variant="danger" title="Sign-in problem">
            {oauthErrorMessage}
          </Alert>
        )}

        <OAuthButtons providers={providers} />

        {providers.length > 0 && <AuthDivider />}

        <SignInForm />
      </div>

      <p className="mt-6 text-[13px] text-content-secondary">
        New to NeevPass?{' '}
        <Link
          href="/sign-up"
          className="text-brand-text underline decoration-brand/40 underline-offset-4 hover:decoration-brand"
        >
          Create an account
        </Link>
      </p>

      <p className="mt-8 border-t border-line-subtle pt-4 text-[11px] leading-relaxed text-content-muted">
        By signing in you agree to the{' '}
        <Link href="/terms" className="underline underline-offset-2">
          terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
