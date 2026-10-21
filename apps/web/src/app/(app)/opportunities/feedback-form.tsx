'use client';

import { Badge, Button } from '@neevpass/ui';
import { useActionState } from 'react';

import { setOpportunityFeedbackAction } from './actions';
import type { FormState } from '@/lib/forms';

const EMPTY_STATE: FormState = {};

/**
 * One feedback control per listing: save, applied, dismiss — or undo the mark.
 * The status travels on the clicked button's `value`, so one action serves all
 * four states.
 */
export function OpportunityFeedbackForm({ opportunityId, currentStatus }: {
  opportunityId: string;
  currentStatus?: 'SAVED' | 'APPLIED' | 'DISMISSED';
}) {
  const [state, formAction, pending] = useActionState(setOpportunityFeedbackAction, EMPTY_STATE);

  return (
    <form action={formAction} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="opportunityId" value={opportunityId} />

      {state.error ? <Badge variant="danger">{state.error}</Badge> : null}
      {state.ok && state.message ? <Badge variant="success">{state.message}</Badge> : null}

      {currentStatus !== 'SAVED' ? (
        <Button type="submit" name="status" value="SAVED" variant="secondary" size="sm" disabled={pending}>
          Save
        </Button>
      ) : null}

      {currentStatus !== 'APPLIED' ? (
        <Button type="submit" name="status" value="APPLIED" variant="primary" size="sm" disabled={pending}>
          I applied
        </Button>
      ) : null}

      {currentStatus ? (
        <Button type="submit" name="status" value="REMOVE" variant="ghost" size="sm" disabled={pending}>
          Undo
        </Button>
      ) : (
        <Button type="submit" name="status" value="DISMISSED" variant="ghost" size="sm" disabled={pending}>
          Not for me
        </Button>
      )}
    </form>
  );
}
