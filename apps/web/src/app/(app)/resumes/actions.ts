'use server';

import { AppError } from '@neevpass/domain';
import {
  createResume,
  deleteResume,
  findResume,
  requireProfileForUser,
  updateResumeConfig,
} from '@neevpass/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/session';
import { actionError, str, type FormState } from '@/lib/forms';

/**
 * Resume server actions.
 *
 * Creating and deleting a resume change what the account owns, so both carry
 * the optimistic-concurrency token like every profile write. Deleting ends
 * with a redirect to the list — `redirect` is deliberately called OUTSIDE the
 * try/catch because it leaves the action through error control-flow.
 */
export async function createResumeAction(_prev: FormState, form: FormData): Promise<FormState> {
  let createdId: string | undefined;

  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Your session ended. Sign in again and retry.' };
    const scope = await requireProfileForUser(user.id);

    const title = str(form, 'title').trim();
    if (title.length < 2 || title.length > 120) {
      throw AppError.validation('Give the resume a name (2–120 characters).', {
        fieldErrors: { title: 'Use 2–120 characters.' },
      });
    }

    let targetRoleId: string | undefined;
    const roleId = str(form, 'targetRoleId');
    if (roleId) targetRoleId = roleId;

    const resume = await createResume(scopeWithRevision(scope, form), {
      title,
      ...(targetRoleId ? { targetRoleId } : {}),
    });
    createdId = resume.id;

    revalidatePath('/resumes');
    revalidatePath('/dashboard');
  } catch (error) {
    return actionError(error);
  }

  if (createdId) {
    redirect(`/resumes/${createdId}`);
  }
  return { error: 'The resume could not be created. Try again.' };
}

export async function deleteResumeAction(_prev: FormState, form: FormData): Promise<FormState> {
  let deleted = false;

  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Your session ended. Sign in again and retry.' };
    const scope = await requireProfileForUser(user.id);

    const resumeId = str(form, 'resumeId');
    if (!resumeId) throw AppError.validation('No resume was identified.');

    deleted = await deleteResume(scopeWithRevision(scope, form), resumeId);
    if (!deleted) return { error: 'That resume was already deleted.' };

    revalidatePath('/resumes');
    revalidatePath('/dashboard');
  } catch (error) {
    return actionError(error);
  }

  if (deleted) {
    redirect('/resumes');
  }
  return { error: 'The resume could not be deleted. Try again.' };
}

export async function updateResumeConfigAction(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Your session ended. Sign in again and retry.' };
    const scope = await requireProfileForUser(user.id);

    const resumeId = str(form, 'resumeId');
    if (!resumeId) throw AppError.validation('No resume was identified.');

    const existing = await findResume(scope.profileId, resumeId);
    if (!existing) return { error: 'That resume no longer exists.' };

    // Field names are the config keys; anything unknown is dropped by the
    // normaliser at render time.
    const config: Record<string, unknown> = {
      layout: str(form, 'layout'),
      headerStyle: str(form, 'headerStyle'),
      density: str(form, 'density'),
      accentColor: str(form, 'accentColor'),
      hiddenSections: form.getAll('hiddenSections'),
    };

    const updated = await updateResumeConfig(scopeWithRevision(scope, form), resumeId, config);
    if (!updated) return { error: 'That resume no longer exists.' };

    revalidatePath(`/resumes/${resumeId}`);
    revalidatePath('/resumes');
    return { ok: true, message: 'Resume updated.' };
  } catch (error) {
    return actionError(error);
  }
}

/** Overrides the fresh scope's revision with the form's, for real conflicts. */
function scopeWithRevision<T extends { revision: number }>(scope: T, form: FormData): T {
  const revision = Number.parseInt(str(form, 'revision'), 10);
  return Number.isSafeInteger(revision) && revision > 0 ? { ...scope, revision } : scope;
}
