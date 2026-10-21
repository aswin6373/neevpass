'use client';

import { Alert, Badge, Button, Field, Select, Input } from '@neevpass/ui';
import { useActionState } from 'react';

import type { FormState } from '@/lib/forms';

import { recordSnapshotAction, setGoalAction, updateRoadmapItemStatusAction } from './actions';

const EMPTY_STATE: FormState = {};

export interface RoleChoice {
  readonly roleId: string;
  readonly name: string;
  readonly description?: string;
}

/**
 * Goal form — replaces the active target role.
 *
 * Carries the render-time revision so two tabs converging on the role picker
 * resolve cleanly: the older save is refused instead of overwriting.
 */
export function GoalForm({ roles, currentRoleId, revision }: {
  roles: readonly RoleChoice[];
  currentRoleId?: string;
  revision: number;
}) {
  const [state, formAction, pending] = useActionState(setGoalAction, EMPTY_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="revision" value={revision} />

      {state.error ? (
        <Alert variant="danger" title="Could not set the goal">
          {state.error}
        </Alert>
      ) : state.ok && state.message ? (
        <Alert variant="success" title="Goal set">
          {state.message}
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Field label="Target role" required>
          <Select name="roleId" defaultValue={currentRoleId ?? ''} required>
            {roles.map((role) => (
              <option key={role.roleId} value={role.roleId}>{role.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Note (optional)">
          <Input name="note" maxLength={200} placeholder="Why this role, target month…" />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant={currentRoleId ? 'secondary' : 'primary'} isLoading={pending} loadingLabel="Saving">
          {currentRoleId ? 'Switch goal' : 'Set goal'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Per-item roadmap status control.
 *
 * A select plus button, deliberately not auto-submitting on change: the status
 * change is a data write, and the button keeps it explicit.
 */
export function RoadmapStatusForm({ skillId, status }: { skillId: string; status: string }) {
  const [state, formAction, pending] = useActionState(updateRoadmapItemStatusAction, EMPTY_STATE);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="skillId" value={skillId} />
      <Select name="status" defaultValue={status} aria-label="Roadmap item status" className="h-9 w-40">
        <option value="TODO">To do</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="DONE">Done</option>
        <option value="SKIPPED">Skip</option>
      </Select>
      <Button type="submit" variant="outline" size="sm" isLoading={pending} loadingLabel="Saving">
        Update
      </Button>
      {state.error ? <Badge variant="danger">{state.error}</Badge> : null}
      {state.ok && state.message ? <Badge variant="success">{state.message}</Badge> : null}
    </form>
  );
}

/** Records a score snapshot. The chart is the history list the page renders. */
export function RecordSnapshotButton({ score }: { score: number }) {
  const [state, formAction, pending] = useActionState(recordSnapshotAction, EMPTY_STATE);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <Button type="submit" variant="secondary" size="sm" isLoading={pending} loadingLabel="Recording">
        Record score snapshot ({score}/100)
      </Button>
      {state.error ? <span className="text-sm text-danger">{state.error}</span> : null}
      {state.ok && state.message ? <span className="text-sm text-success">{state.message}</span> : null}
    </form>
  );
}
