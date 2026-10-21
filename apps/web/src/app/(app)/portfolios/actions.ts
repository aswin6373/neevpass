'use server';

import { publicSlugSchemaInput } from '@neevpass/domain';
import {
  ensurePortfolio,
  requireProfileForUser,
  updatePortfolio,
} from '@neevpass/db';
import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/session';
import { actionError, parseForm, str, type FormState } from '@/lib/forms';

/**
 * Portfolio server actions.
 *
 * One save covers title, public address, publish state and hidden sections:
 * splitting them into four buttons would let a student publish a portfolio
 * whose address was never validated. The address uses the domain's public-slug
 * schema, and publishing without an address is refused here — the database
 * would otherwise hold a published row nothing can reach.
 */
export async function savePortfolioAction(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: 'Your session ended. Sign in again and retry.' };
    const scope = await requireProfileForUser(user.id);

    const parsedSlug = parseForm(publicSlugSchemaInput, { publicSlug: str(form, 'publicSlug') });
    if (!parsedSlug.ok) return parsedSlug.state;

    const published = str(form, 'published') === 'on';
    if (published && !parsedSlug.data.publicSlug) {
      return {
        error: 'Add a public address before publishing — it is where the portfolio lives.',
        fieldErrors: { publicSlug: 'Required when published.' },
      };
    }

    const title = str(form, 'title').trim() || 'My portfolio';
    if (title.length > 120) {
      return { error: 'Portfolio titles are limited to 120 characters.' };
    }

    const revision = Number.parseInt(str(form, 'revision'), 10);
    const writeScope = Number.isSafeInteger(revision) && revision > 0 ? { ...scope, revision } : scope;

    // Find-or-create; a portfolio row exists lazily after the first save.
    const portfolio = await ensurePortfolio(writeScope, title);

    const updated = await updatePortfolio(writeScope, portfolio.id, {
      title,
      publicSlug: parsedSlug.data.publicSlug,
      published,
      config: { hiddenSections: form.getAll('hiddenSections') },
    });

    revalidatePath('/portfolios');
    revalidatePath('/profile');
    revalidatePath('/dashboard');
    if (updated.publicSlug) revalidatePath(`/p/${updated.publicSlug}`);
    if (portfolio.publicSlug) revalidatePath(`/p/${portfolio.publicSlug}`);

    return {
      ok: true,
      message: published
        ? `Published at /p/${updated.publicSlug}.`
        : 'Portfolio saved — it is not visible to anyone yet.',
    };
  } catch (error) {
    return actionError(error);
  }
}
