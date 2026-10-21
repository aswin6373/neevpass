'use server';

import { AppError, type SavedStatus } from '@neevpass/domain';
import { requireProfileForUser, setOpportunityFeedback } from '@neevpass/db';
import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/session';
import { actionError, str, type FormState } from '@/lib/forms';

const STATUSES: readonly (SavedStatus | 'REMOVE')[] = ['SAVED', 'APPLIED', 'DISMISSED', 'REMOVE'];

/**
 * Opportunity feedback — one of three marks, or removing an existing one.
 * Feedback is the student's own progress record; it does not touch the profile
 * revision, which tracks content.
 */
export async function setOpportunityFeedbackAction(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Your session ended. Sign in again and retry.' };

    const scope = await requireProfileForUser(user.id);

    const opportunityId = str(form, 'opportunityId');
    const status = str(form, 'status');
    if (!opportunityId) throw AppError.validation('No opportunity was identified.');
    if (!(STATUSES as readonly string[]).includes(status)) {
      throw AppError.validation('Unknown status.');
    }

    const result = await setOpportunityFeedback(
      scope,
      opportunityId,
      { status: status as SavedStatus | 'REMOVE' },
    );

    revalidatePath('/opportunities');
    return {
      ok: true,
      message: result === undefined
        ? 'Removed from your list.'
        : result === 'APPLIED'
          ? 'Marked as applied.'
          : result === 'SAVED'
            ? 'Saved.'
            : 'Dismissed — it stays out of your recommendations.',
    };
  } catch (error) {
    return actionError(error);
  }
}
