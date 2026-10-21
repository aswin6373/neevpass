'use client';

import { Alert, Button, Field, Input } from '@neevpass/ui';
import Link from 'next/link';
import { useActionState } from 'react';

import { signInAction, type AuthActionState } from '../actions';

const INITIAL_STATE: AuthActionState = {};

/**
 * Sign-in form.
 *
 * Native browser validation is left on for immediate feedback (required fields,
 * email shape) while the server action re-validates with the same schema. The
 * browser check is a convenience; the server check is the one that counts.
 */
export function SignInForm() {
  const [state, formAction, isPending] = useActionState(signInAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <Alert variant="danger" title="Could not sign you in">
          {state.error}
        </Alert>
      )}

      <Field label="Email" error={state.fieldErrors?.email} required>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>

      <Field label="Password" error={state.fieldErrors?.password} required>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>

      <Button type="submit" isLoading={isPending} loadingLabel="Signing in" block>
        Sign in
      </Button>

      <p className="text-center text-sm text-content-secondary">
        No account yet?{' '}
        <Link href="/sign-up" className="font-medium text-brand-text underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
