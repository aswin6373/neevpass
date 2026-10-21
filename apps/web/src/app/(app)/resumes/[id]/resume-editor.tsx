'use client';

import { Alert, Button, Field, Input, Select } from '@neevpass/ui';
import { useActionState, useState } from 'react';

import { deleteResumeAction, updateResumeConfigAction } from '../actions';
import type { FormState } from '@/lib/forms';

const EMPTY_STATE: FormState = {};

export interface ResumeConfigValues {
  readonly layout: string;
  readonly headerStyle: string;
  readonly density: string;
  readonly accentColor: string;
  readonly hiddenSections: readonly string[];
}

export interface SectionChoice {
  readonly kind: string;
  readonly label: string;
}

/**
 * Per-resume layout configuration.
 *
 * Section visibility is a checkbox list because hiding a section is a single
 * explicit act — unlike the resume body order, which follows the domain's
 * default order. Unknown values are dropped by the docgen normaliser, so this
 * form only needs to send names, not validate them.
 */
export function ResumeConfigForm({ resumeId, revision, sections, initial }: {
  resumeId: string;
  revision: number;
  sections: readonly SectionChoice[];
  initial: ResumeConfigValues;
}) {
  const [state, formAction, pending] = useActionState(updateResumeConfigAction, EMPTY_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="resumeId" value={resumeId} />
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

      <Field label="Layout">
        <Select name="layout" defaultValue={initial.layout}>
          <option value="CLASSIC">Classic — single column</option>
          <option value="MODERN">Modern — airy single column</option>
          <option value="COMPACT">Compact — fit more on a page</option>
          <option value="SIDEBAR_LEFT">Sidebar left</option>
          <option value="SIDEBAR_RIGHT">Sidebar right</option>
        </Select>
      </Field>

      <Field label="Header style">
        <Select name="headerStyle" defaultValue={initial.headerStyle}>
          <option value="BANNER">Banner</option>
          <option value="STACKED">Stacked</option>
          <option value="INLINE">Inline</option>
          <option value="NONE">No header</option>
        </Select>
      </Field>

      <Field label="Spacing">
        <Select name="density" defaultValue={initial.density}>
          <option value="COMFORTABLE">Comfortable</option>
          <option value="NORMAL">Normal</option>
          <option value="COMPACT">Compact</option>
        </Select>
      </Field>

      <Field label="Accent colour">
        <Input
          name="accentColor"
          type="color"
          defaultValue={initial.accentColor}
          className="h-10 w-20 cursor-pointer p-1"
        />
      </Field>

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
          Save layout
        </Button>
      </div>
    </form>
  );
}

/**
 * Delete with a two-step confirm. The action redirects to the resume list on
 * success, so the button unmounts with the page.
 */
export function DeleteResumeButton({ resumeId, revision, title }: {
  resumeId: string;
  revision: number;
  title: string;
}) {
  const [state, formAction, pending] = useActionState(deleteResumeAction, EMPTY_STATE);
  const [armed, setArmed] = useState(false);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="resumeId" value={resumeId} />
      <input type="hidden" name="revision" value={revision} />

      {state.error ? <span className="text-sm text-danger">{state.error}</span> : null}

      {armed ? (
        <>
          <span className="text-sm text-content-secondary">Delete “{title}”?</span>
          <Button type="submit" variant="danger" size="sm" isLoading={pending} loadingLabel="Deleting">
            Yes, delete
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setArmed(false)}>
            Cancel
          </Button>
        </>
      ) : (
        <Button type="button" variant="secondary" size="sm" onClick={() => setArmed(true)}>
          Delete resume
        </Button>
      )}
    </form>
  );
}
