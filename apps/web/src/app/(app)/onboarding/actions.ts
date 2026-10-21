'use server';

import { AppError } from '@neevpass/domain';
import { createProfileForUser, requireProfileForUser } from '@neevpass/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/session';
import { optionalStr, str, type FormState } from '@/lib/forms';

/**
 * Onboarding actions — distinct from the profile section actions because this
 * one guards the ABSENCE of a profile: it is the write that CREATES the scope
 * every following action leans on.
 *
 * The action finishes with `redirect('/profile')`. `redirect` leaves a server
 * action by erroring with a control-flow signal, so it is deliberately called
 * OUTSIDE the try/catch below — a redirect that had to be re-caught would be a
 * bug factory.
 */
export async function createProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  let completed = false;

  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Your session ended. Sign in again and retry.' };

    let scope: Awaited<ReturnType<typeof requireProfileForUser>> | undefined;
    try {
      scope = await requireProfileForUser(user.id);
    } catch {
      scope = undefined;
    }

    if (!scope) {
      await createProfile(user.id, form);
    }
    // Either way onboarding is now complete.
    completed = true;
  } catch (error) {
    // Two tabs finishing onboarding at once: the second one finds an existing
    // profile, which is success.
    if (error instanceof AppError && error.code === 'CONFLICT') {
      completed = true;
    } else {
      const userError = errorToFormState(error);
      if (userError) return userError;
      return { error: 'Something went wrong creating your profile. Try again.' };
    }
  }

  if (completed) {
    revalidateAll();
    redirect('/profile');
  }

  return { error: 'Something went wrong creating your profile. Try again.' };
}

function errorToFormState(error: unknown): FormState | undefined {
  if (error instanceof AppError && error.code === 'VALIDATION_FAILED') {
    const fieldErrors = (error.details as { fieldErrors?: Record<string, string> } | undefined)?.fieldErrors;
    return fieldErrors
      ? { error: error.userMessage, fieldErrors }
      : { error: error.userMessage };
  }
  return undefined;
}

async function createProfile(userId: string, form: FormData): Promise<void> {
  const fullName = str(form, 'fullName').trim();
  const headline = optionalStr(form, 'headline');
  const location = optionalStr(form, 'location');

  if (fullName.length < 2) {
    throw AppError.validation('Enter your full name to continue.', {
      fieldErrors: { fullName: 'Full name must be at least 2 characters.' },
    });
  }

  await createProfileForUser(userId, {
    fullName,
    ...(headline ? { headline } : {}),
    ...(location ? { location } : {}),
  });
}

function revalidateAll(): void {
  revalidatePath('/onboarding');
  revalidatePath('/dashboard');
  revalidatePath('/profile');
  revalidatePath('/profile/[slug]', 'page');
  revalidatePath('/career');
}
