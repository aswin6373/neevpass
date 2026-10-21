'use client';

import { Alert, Button, Field, Input } from '@neevpass/ui';
import { useActionState } from 'react';

import { createResumeAction } from './actions';
import type { FormState } from '@/lib/forms';

const EMPTY_STATE: FormState = {};

/**
 * Create-resume form. On success the server action redirects straight to the
 * new resume's preview, so there is nothing to navigate here.
 */
export function CreateResumeForm({ defaultTitle }: { defaultTitle: string }) {
  const [state, formAction, pending] = useActionState(createResumeAction, EMPTY_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error ? (
        <Alert variant="danger" title="Could not create the resume">
          {state.error}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <Field label="Resume name" error={state.fieldErrors?.title} required>
            <Input name="title" defaultValue={defaultTitle} maxLength={120} required />
          </Field>
        </div>
        <Button type="submit" isLoading={pending} loadingLabel="Creating">
          Create resume
        </Button>
      </div>
    </form>
  );
}
