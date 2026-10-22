'use client';

import { Select } from '@neevpass/ui';
import { useActionState, useState } from 'react';

import type { FormState } from '@/lib/forms';

import { setOpportunityFeedbackAction } from './actions';

const EMPTY_STATE: FormState = {};

/**
 * Tracking control for one listing.
 *
 * A single select rather than four buttons: the list can be long, and a row of
 * Save / Applied / Not for me buttons repeated sixteen times is noise. Choosing
 * an option submits immediately.
 */
export function OpportunityFeedbackForm({
  opportunityId,
  currentStatus,
}: {
  opportunityId: string;
  currentStatus?: 'SAVED' | 'APPLIED' | 'DISMISSED';
}) {
  const [state, formAction, pending] = useActionState(setOpportunityFeedbackAction, EMPTY_STATE);
  // Controlled so React's post-action form reset cannot snap the select back to
  // its previous value while the server tree revalidates.
  const [status, setStatus] = useState(currentStatus ?? 'REMOVE');

  return (
    <form
      action={formAction}
      onReset={(event) => event.preventDefault()}
      className="flex flex-col items-stretch gap-1"
    >
      <input type="hidden" name="opportunityId" value={opportunityId} />

      <Select
        name="status"
        value={status}
        onChange={(event) => {
          setStatus(event.target.value);
          event.currentTarget.form?.requestSubmit();
        }}
        aria-label="Tracking status"
        disabled={pending}
        className="h-7 w-32 text-[11px]"
      >
        <option value="REMOVE">Not tracked</option>
        <option value="SAVED">Saved</option>
        <option value="APPLIED">Applied</option>
        <option value="DISMISSED">Not for me</option>
      </Select>

      <span role="status" className="sr-only">
        {pending ? 'Saving' : (state.message ?? '')}
      </span>

      {state.error ? <span className="text-[10px] text-danger-text">{state.error}</span> : null}
    </form>
  );
}
