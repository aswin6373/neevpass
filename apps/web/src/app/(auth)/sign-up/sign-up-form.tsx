'use client';

import { PASSWORD_POLICY_DESCRIPTION, checkPasswordStrength } from '@neevpass/domain';
import { Alert, Button, Field, Input } from '@neevpass/ui';
import { useActionState, useState } from 'react';

import { signUpAction, type AuthActionState } from '../actions';

const INITIAL_STATE: AuthActionState = {};

/**
 * Sign-up form.
 *
 * Password requirements are shown as live guidance rather than as a list of
 * rules the user discovers by failing. The check runs client-side for instant
 * feedback and again in the server action, which is the authoritative one —
 * `checkPasswordStrength` is the same function in both places.
 */
export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, INITIAL_STATE);
  const [password, setPassword] = useState('');

  const issues = password.length > 0 ? checkPasswordStrength(password) : [];
  const passwordIsValid = password.length > 0 && issues.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <Alert variant="danger" title="Could not create your account">
          {state.error}
        </Alert>
      )}

      <Field label="Full name" error={state.fieldErrors?.name} required>
        <Input name="name" type="text" autoComplete="name" placeholder="Your full name" required />
      </Field>

      <Field label="Email" error={state.fieldErrors?.email} required>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>

      <Field
        label="Password"
        description={PASSWORD_POLICY_DESCRIPTION}
        error={state.fieldErrors?.password}
        required
      >
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </Field>

      {/* Live feedback, announced politely so it does not interrupt typing. */}
      {password.length > 0 && (
        <div role="status" aria-live="polite" className="-mt-2">
          {passwordIsValid ? (
            <p className="text-xs font-medium text-success-text">Password looks good.</p>
          ) : (
            <ul className="flex flex-col gap-0.5 text-xs text-content-secondary">
              {issues.map((issue) => (
                <li key={issue.code}>{issue.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Button type="submit" isLoading={isPending} loadingLabel="Creating account" block>
        Create account
      </Button>
    </form>
  );
}
