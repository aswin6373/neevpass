'use client';

import { Alert, Button, Field, Input, cn } from '@neevpass/ui';
import { useActionState, useState } from 'react';

import { deleteResumeAction, updateResumeConfigAction } from '../actions';
import type { FormState } from '@/lib/forms';

const EMPTY_STATE: FormState = {};

export interface ResumeConfigValues {
  readonly layout: string;
  readonly accentColor: string;
  readonly hiddenSections: readonly string[];
}

export interface TemplateChoice {
  readonly key: string;
  readonly label: string;
  readonly description: string;
}

export interface SectionChoice {
  readonly kind: string;
  readonly label: string;
}

/**
 * Per-resume template configuration.
 *
 * Templates are single-column and text-first by construction. Section visibility
 * is a checkbox list because hiding a section is a single explicit act — unlike
 * the resume body order, which follows the domain's default order. Unknown
 * values are dropped by the docgen normaliser, so this form only needs to send
 * names, not validate them.
 */
export function ResumeConfigForm({
  resumeId,
  revision,
  sections,
  templates,
  initial,
}: {
  resumeId: string;
  revision: number;
  sections: readonly SectionChoice[];
  templates: readonly TemplateChoice[];
  initial: ResumeConfigValues;
}) {
  const [state, formAction, pending] = useActionState(updateResumeConfigAction, EMPTY_STATE);
  const [layout, setLayout] = useState(initial.layout);

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

      <fieldset>
        <legend className="sr-only">Template</legend>
        <div className="flex flex-col gap-2">
          {templates.map((template) => {
            const selected = layout === template.key;
            return (
              <label
                key={template.key}
                className={cn(
                  'grid cursor-pointer grid-cols-[3rem_minmax(0,1fr)] items-start gap-3 border p-2.5 transition-colors focus-within:border-content',
                  selected
                    ? 'border-content bg-surface-hover'
                    : 'border-line hover:border-line-strong',
                )}
              >
                <input
                  type="radio"
                  name="layout"
                  value={template.key}
                  checked={selected}
                  onChange={() => setLayout(template.key)}
                  className="sr-only"
                />
                <TemplateSwatch templateKey={template.key} accent={initial.accentColor} />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-content">{template.label}</span>
                  </span>
                  <span className="mt-1 block text-[10px] leading-relaxed text-content-muted">
                    {template.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Field label="Accent colour">
        <Input
          name="accentColor"
          type="color"
          defaultValue={initial.accentColor}
          className="h-11 w-20 cursor-pointer p-1"
        />
      </Field>

      <fieldset>
        <legend className="text-[12px] font-medium text-content">Sections to hide</legend>
        <div className="mt-2 border-t border-line-subtle">
          {sections.map((section) => (
            <label
              key={section.kind}
              className="flex items-center gap-2.5 border-b border-line-subtle py-2 text-[12px] text-content-secondary transition-colors last:border-b-0 hover:text-content"
            >
              <input
                type="checkbox"
                name="hiddenSections"
                value={section.kind}
                defaultChecked={initial.hiddenSections.includes(section.kind)}
                className="h-3.5 w-3.5 accent-[var(--np-primary)]"
              />
              {section.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" isLoading={pending} loadingLabel="Saving">
          Save template
        </Button>
      </div>
    </form>
  );
}

/** A miniature of the template's typography and header treatment. */
function TemplateSwatch({ templateKey, accent }: { templateKey: string; accent: string }) {
  if (templateKey === 'MODERN') {
    return (
      <span
        aria-hidden="true"
        className="block h-10 w-12 shrink-0 border border-line p-1.5"
        style={{ background: '#fffdf8' }}
      >
        <span className="block h-2 w-7" style={{ background: '#191613' }} />
        <span className="mt-1 block h-[1px] w-full" style={{ background: accent }} />
        <span className="mt-1.5 block h-[1px] w-8" style={{ background: accent }} />
        <span className="mt-1 block h-[1px] w-full" style={{ background: '#d8d1c4' }} />
        <span className="mt-1 block h-[1px] w-6" style={{ background: '#d8d1c4' }} />
      </span>
    );
  }

  if (templateKey === 'COMPACT') {
    return (
      <span
        aria-hidden="true"
        className="block h-10 w-12 shrink-0 border border-line p-1.5"
        style={{ background: '#fffdf8' }}
      >
        <span className="flex items-baseline justify-between gap-1">
          <span className="block h-1.5 w-5" style={{ background: '#191613' }} />
          <span className="block h-[1px] w-3" style={{ background: accent }} />
        </span>
        <span className="mt-1 block h-[1px] w-full" style={{ background: '#d8d1c4' }} />
        <span className="mt-1 block h-[1px] w-9" style={{ background: '#5f584d' }} />
        <span className="mt-1 block h-[1px] w-full" style={{ background: '#d8d1c4' }} />
        <span className="mt-1 block h-[1px] w-7" style={{ background: '#5f584d' }} />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="block h-10 w-12 shrink-0 border border-line p-1.5"
      style={{ background: '#fffdf8' }}
    >
      <span className="mx-auto block h-1.5 w-7" style={{ background: '#191613' }} />
      <span className="mx-auto mt-1 block h-[1px] w-4" style={{ background: '#5f584d' }} />
      <span className="mt-1.5 block h-[2px] w-full" style={{ background: accent }} />
      <span className="mt-1 block h-[1px] w-8" style={{ background: '#d8d1c4' }} />
      <span className="mt-1 block h-[1px] w-full" style={{ background: '#d8d1c4' }} />
    </span>
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
          <span className="text-[11px] text-content-secondary">Delete “{title}”?</span>
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
