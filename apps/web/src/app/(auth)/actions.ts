'use server';

import { displayNameSchema, emailSchema, passwordSchema } from '@neevpass/domain';
import { prisma } from '@neevpass/db';
import { AuthError } from 'next-auth';
import { z } from 'zod';

import { signIn } from '@/lib/auth';
import { getConfiguredOAuthProviders } from '@/lib/env';
import { logger } from '@/lib/logger';
import { passwordHasher } from '@/lib/password';

/**
 * Authentication server actions.
 *
 * Server actions are POST-only and origin-checked by Next.js, so a credentials
 * form does not need a hand-rolled CSRF token.
 *
 * These actions authenticate only. They never create or touch profile content —
 * that is Phase 1 and belongs to the profile module.
 */

export interface AuthActionState {
  /** Form-level error, safe to show the user. */
  error?: string;
  /** Per-field errors, keyed by field name. */
  fieldErrors?: Record<string, string>;
}

const signUpSchema = z.object({
  name: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const signInSchema = z.object({
  email: emailSchema,
  // Only presence is checked on sign-in. Applying the full policy here would
  // reject a password that was valid when it was set.
  password: z.string().min(1, 'Enter your password.'),
});

/** Flattens a Zod error into `{ field: message }` for inline display. */
function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      // Sign-up is the one place we confirm an account exists, because the
      // alternative — silently doing nothing — leaves the user stuck with no
      // way to understand why. Sign-in deliberately does not do this.
      return { fieldErrors: { email: 'An account with this email already exists. Try signing in.' } };
    }

    const passwordHash = await passwordHasher.hash(password);

    await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true },
    });

    logger.info('Account created');
  } catch (error) {
    logger.error('Sign-up failed', { error });
    return { error: 'We could not create your account. Please try again.' };
  }

  // Sign the new user in. This throws a redirect, which must propagate — hence
  // it sits outside the try block above.
  return signInWithCredentials(email, password);
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  return signInWithCredentials(parsed.data.email, parsed.data.password);
}

/**
 * Starts an OAuth sign-in.
 *
 * The provider id comes from a hidden form field, so it is validated against
 * the providers we actually configured rather than passed through. An arbitrary
 * string here would otherwise let a caller probe Auth.js internals.
 */
export async function oauthSignInAction(formData: FormData): Promise<void> {
  const provider = formData.get('provider');
  const allowed = getConfiguredOAuthProviders();

  if (typeof provider !== 'string' || !allowed.includes(provider)) {
    logger.warn('Rejected an OAuth sign-in for an unconfigured provider', { provider });
    return;
  }

  await signIn(provider, { redirectTo: '/dashboard' });
}

/**
 * Shared sign-in helper.
 *
 * `signIn` signals success by throwing a redirect. That is control flow, not an
 * error, so only a genuine `AuthError` is caught here — catching everything
 * would swallow the redirect and leave the form hanging.
 */
async function signInWithCredentials(email: string, password: string): Promise<AuthActionState> {
  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard' });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'That email and password combination did not match an account.' };
    }
    throw error;
  }
}
