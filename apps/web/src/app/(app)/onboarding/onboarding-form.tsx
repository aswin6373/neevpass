'use client';

import { Alert, Button, Field, Input } from '@neevpass/ui';
import { useActionState } from 'react';

import type { FormState } from '@/lib/forms';

import { createProfileAction } from './actions';

const INITIAL: FormState = {};

/**
 * Onboarding form. On success the server action redirects to the profile
 * overview, so there is no client navigation here — a fallback success message
 * renders when the redirect has not happened (or a redirect is impossible).
 */
export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, isPending] = useActionState(createProfileAction, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <Alert variant="danger" title="Could not create your profile">
          {state.error}
        </Alert>
      )}
      {state.ok && state.message && (
        <Alert variant="success" title="Done">
          {state.message}
        </Alert>
      )}

      <Field label="Full name" error={state.fieldErrors?.fullName} required>
        <Input name="fullName" defaultValue={defaultName} autoComplete="name" placeholder="Asha Verma" required />
      </Field>

      <Field label="Headline" error={state.fieldErrors?.headline}>
        <Input
          name="headline"
          placeholder="Final-year CS student, Bengaluru"
          maxLength={120}
          autoComplete="organization-title"
        />
      </Field>

      <Field label="Location">
        <Input name="location" placeholder="Bengaluru, India" maxLength={120} />
      </Field>

      <Button type="submit" isLoading={isPending} loadingLabel="Creating" block>
        Create profile
      </Button>
    </form>
  );
}
