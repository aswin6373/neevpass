'use client';

import { Alert, Button, Field, Input } from '@neevpass/ui';
import { useActionState } from 'react';

import { savePortfolioAction } from './actions';
import type { FormState } from '@/lib/forms';

const EMPTY_STATE: FormState = {};

export interface PortfolioSectionChoice {
  readonly kind: string;
  readonly label: string;
}

export interface PortfolioInitial {
  readonly title: string;
  readonly publicSlug: string;
  readonly published: boolean;
  readonly hiddenSections: readonly string[];
}

/**
 * Portfolio form — title, address, publish state, hidden sections.
 *
 * The address is not auto-suggested: a student should choose the name they
 * want on their shared link. The server validates it with the domain slug
 * schema; the input below only mirrors the shape for fast feedback.
 */
export function PortfolioForm({ revision, sections, initial }: {
  revision: number;
  sections: readonly PortfolioSectionChoice[];
  initial: PortfolioInitial;
}) {
  const [state, formAction, pending] = useActionState(savePortfolioAction, EMPTY_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="revision" value={revision} />

      {state.error ? (
        <Alert variant="danger" title="Could not save">
          {state.error}
        </Alert>
      ) : state.ok && state.message ? (
        <Alert variant="success" title="Saved">
          {state.message}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" description="Shown as the page title and browser tab.">
          <Input name="title" defaultValue={initial.title} maxLength={120} />
        </Field>

        <Field
          label="Public address"
          error={state.fieldErrors?.publicSlug}
          description="Lowercase letters, numbers and hyphens, e.g. asha-verma."
        >
          <Input
            name="publicSlug"
            defaultValue={initial.publicSlug}
            placeholder="your-name"
            maxLength={40}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            autoCapitalize="none"
            spellCheck={false}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 rounded-md border border-line bg-surface-sunken px-3 py-2.5 text-sm text-content">
        <input type="checkbox" name="published" defaultChecked={initial.published} className="h-4 w-4" />
        <span>
          Published
          <span className="block text-xs text-content-muted">
            Unticking takes the page offline immediately; the address is kept for later.
          </span>
        </span>
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-sm font-medium text-content">Sections to hide</legend>
        {sections.map((section) => (
          <label key={section.kind} className="flex items-center gap-2 text-sm text-content-secondary">
            <input
              type="checkbox"
              name="hiddenSections"
              value={section.kind}
              defaultChecked={initial.hiddenSections.includes(section.kind)}
              className="h-4 w-4"
            />
            {section.label}
          </label>
        ))}
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" isLoading={pending} loadingLabel="Saving">
          Save portfolio
        </Button>
      </div>
    </form>
  );
}
