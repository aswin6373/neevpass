'use client';

import { Alert, Button, Field, Input, Textarea } from '@neevpass/ui';
import { useActionState } from 'react';

import type { FormState } from '@/lib/forms';

import { saveBasicsAction } from '../actions';

const EMPTY_STATE: FormState = {};

export interface BasicsInitial {
  readonly fullName: string;
  readonly headline?: string;
  readonly phone?: string;
  readonly location?: string;
  readonly summary?: string;
  readonly email: string;
}

/**
 * The summary section: profile basics plus the professional summary.
 *
 * This is the only section backed by profile columns rather than entry tables,
 * so it does not go through the entry editor: one form, one save. The email is
 * read-only because it belongs to the account, not the profile.
 */
export function SummarySection({ revision, initial }: { revision: number; initial: BasicsInitial }) {
  const [state, formAction, pending] = useActionState(saveBasicsAction, EMPTY_STATE);

  return (
    <div className="max-w-3xl">
      <div className="border-b border-line pb-2.5">
        <h2 className="text-[13px] font-medium text-content">Basics and summary</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-content-muted">
          The name and summary here open every resume and portfolio you generate.
        </p>
      </div>

      <form action={formAction} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="revision" value={revision} />

        {state.error ? (
          <Alert variant="danger" title="Could not save">
            {state.error}
          </Alert>
        ) : state.ok && state.message ? (
          <Alert variant="success" title="Saved">
            {state.message}
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={state.fieldErrors?.fullName} required>
            <Input name="fullName" defaultValue={initial.fullName} required maxLength={120} />
          </Field>

          <Field label="Email" description="Set on your account. Shown only if you publish it.">
            <Input value={initial.email} readOnly disabled />
          </Field>

          <Field
            label="Headline"
            error={state.fieldErrors?.headline}
            description="One line. For example: Final-year CS student, Bengaluru."
          >
            <Input name="headline" defaultValue={initial.headline ?? ''} maxLength={120} />
          </Field>

          <Field label="Location" error={state.fieldErrors?.location}>
            <Input
              name="location"
              defaultValue={initial.location ?? ''}
              maxLength={120}
              placeholder="Bengaluru, India"
            />
          </Field>

          <Field
            label="Phone"
            error={state.fieldErrors?.phone}
            description="Empty by default. Add it only when it should appear on resumes."
          >
            <Input name="phone" type="tel" defaultValue={initial.phone ?? ''} maxLength={40} />
          </Field>
        </div>

        <Field
          label="Professional summary"
          error={state.fieldErrors?.summary}
          description="Three or four lines: who you are, what you are strong at, and what you are looking for."
        >
          <Textarea name="summary" defaultValue={initial.summary ?? ''} rows={5} maxLength={1200} />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" isLoading={pending} loadingLabel="Saving">
            Save basics
          </Button>
        </div>
      </form>
    </div>
  );
}
