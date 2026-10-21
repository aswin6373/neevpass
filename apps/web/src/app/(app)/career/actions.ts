'use server';

import { AppError } from '@neevpass/domain';
import {
  findActiveGoal,
  requireProfileForUser,
  setActiveGoal,
  updateRoadmapItemStatus,
  type ProfileScope,
} from '@neevpass/db';
import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/session';
import { actionError, optionalStr, str, type FormState } from '@/lib/forms';
import { computeCareerState, recordScoreSnapshot, roadmapFor } from '@/lib/career-bridge';

/**
 * Career server actions.
 *
 * The engines run in `lib/career-bridge.ts` so the page and these actions
 * compute the score, gap and roadmap the exact same way. Each action here is
 * the trust boundary: session → scope → revision-aware write.
 *
 * - Setting a goal is profile-relevant intent and carries the same
 *   optimistic-concurrency token (`revision`) as section edits.
 * - Roadmap status flips and score snapshots are additive progress records;
 *   they do not bump the profile revision.
 */

export async function setGoalAction(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const scope = await requireFreshRevisionScope(form);

    const roleId = str(form, 'roleId');
    if (!roleId) throw AppError.validation('Choose a target role.');

    await setActiveGoal(scope, { roleId, note: optionalStr(form, 'note') });

    // Fresh goal → its gap and roadmap can now be computed; generate the
    // roadmap row if this goal has none yet.
    const state = await computeCareerState(scope);
    if (state.goal && state.gap) {
      await roadmapFor(scope, state);
    }

    revalidateCareer();
    return { ok: true, message: 'Goal set — gap analysis and roadmap are ready.' };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateRoadmapItemStatusAction(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const scope = await requireScope();

    const skillId = str(form, 'skillId');
    const status = str(form, 'status');
    if (!skillId) throw AppError.validation('No roadmap item was identified.');
    if (!isRoadmapStatus(status)) throw AppError.validation('Unknown roadmap status.');

    const goal = await findActiveGoal(scope.profileId);
    if (!goal) return { error: 'Set a goal first — the roadmap belongs to it.' };

    const updated = await updateRoadmapItemStatus(scope, goal.id, skillId, status as RoadmapStatus);
    if (!updated) {
      return { error: 'That roadmap item no longer exists.' };
    }

    revalidateCareer();
    return { ok: true, message: 'Progress updated.' };
  } catch (error) {
    return actionError(error);
  }
}

export async function recordSnapshotAction(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const scope = await requireScope();
    void form;

    const score = await recordScoreSnapshot(scope);
    revalidateCareer();
    return { ok: true, message: `Snapshot recorded — ${score}/100.` };
  } catch (error) {
    return actionError(error);
  }
}

// ---------------------------------------------------------------------------

function revalidateCareer(): void {
  revalidatePath('/career');
  revalidatePath('/dashboard');
}

type RoadmapStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED';

function isRoadmapStatus(value: string): value is RoadmapStatus {
  return ['TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED'].includes(value);
}

/** Fresh scope, or with the form's render-time revision for CAS-guarded writes. */
async function requireFreshRevisionScope(form: FormData): Promise<ProfileScope> {
  const user = await getCurrentUser();
  if (!user) throw AppError.validation('Your session ended. Sign in again and retry.');
  const fresh = await requireProfileForUser(user.id);

  const revision = Number.parseInt(str(form, 'revision'), 10);
  return Number.isSafeInteger(revision) && revision > 0 ? { ...fresh, revision } : fresh;
}

async function requireScope(): Promise<ProfileScope> {
  const user = await getCurrentUser();
  if (!user) throw AppError.validation('Your session ended. Sign in again and retry.');
  return requireProfileForUser(user.id);
}
