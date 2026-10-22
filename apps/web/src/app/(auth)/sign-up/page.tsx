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
    <div>
      <h1 className="np-display text-[1.9rem] text-content sm:text-[2.1rem]">
        Create your account
      </h1>
      <p className="mt-1 text-[12px] text-content-secondary">
        One profile, used for every document you make.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        <OAuthButtons providers={providers} />

        {providers.length > 0 && <AuthDivider />}

        <SignUpForm />
      </div>

      <p className="mt-6 border-t border-line pt-4 text-[12px] text-content-secondary">
        Already have an account?{' '}
        <Link
          href="/sign-in"
          className="text-content underline decoration-line-strong underline-offset-4 hover:decoration-content"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
