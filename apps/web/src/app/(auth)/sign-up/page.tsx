import { SELF_REPORTED_NOTICE } from '@neevpass/domain';
import type { Metadata } from 'next';
import Link from 'next/link';

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
    <div className="flex flex-col">
      <p className="text-[12px] text-content-muted">New account</p>
      <h1 className="np-display mt-2.5 text-[2.25rem] text-content">Create your account</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-content-secondary">
        One profile, used for every resume, portfolio and career page you make.
      </p>

      <div className="mt-7 flex flex-col gap-5 border-t border-line pt-6">
        <OAuthButtons providers={providers} />

        {providers.length > 0 && <AuthDivider />}

        <SignUpForm />
      </div>

      <p className="mt-6 text-[13px] text-content-secondary">
        Already have an account?{' '}
        <Link
          href="/sign-in"
          className="text-brand-text underline decoration-brand/40 underline-offset-4 hover:decoration-brand"
        >
          Sign in
        </Link>
      </p>

      <p className="mt-8 border-t border-line-subtle pt-4 text-[11px] leading-relaxed text-content-muted">
        Your profile is private by default. You choose what, if anything, to publish.{' '}
        {SELF_REPORTED_NOTICE}
      </p>
    </div>
  );
}
