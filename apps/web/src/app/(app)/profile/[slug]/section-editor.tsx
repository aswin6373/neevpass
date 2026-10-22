'use client';

import { Alert, Button, Field, Input, Select, Textarea, cn } from '@neevpass/ui';
import { useActionState, useCallback, useEffect, useMemo, useState } from 'react';

import { removeEntryAction, saveEntryAction } from '../actions';
import type { FormState } from '@/lib/forms';

import { fieldsForSection, VISIBILITY_OPTIONS, type FieldSpec } from './specs';

const EMPTY_STATE: FormState = {};

export interface SkillOption {
  readonly id: string;
  readonly name: string;
  readonly categoryName?: string;
}

export interface EntryLike {
  readonly id: string;
  readonly [key: string]: unknown;
}

export interface SectionEditorProps {
  readonly kind: string;
  readonly slug: string;
  /** The profile revision at render time — the optimistic-concurrency token. */
  readonly revision: number;
  readonly skillOptions: readonly SkillOption[];
  /** Section entries already mapped to form-friendly values by the page. */
  readonly entries: readonly EntryLike[];
  /** Taxonomy skill names per entry id, for display. */
  readonly skillNamesByEntryId: Readonly<Record<string, readonly string[]>>;
}

/**
 * The shared editor for the ten MULTI-entry sections.
 *
 * One declarative field table (`specs.ts`) drives both what is shown and — via
 * the server action — what is validated, so the editor cannot drift out of
 * sync with the domain schema. SUMMARY and SKILLS have bespoke components
 * because their shapes differ (single object; taxonomy picker).
 */
export function SectionEditor({ kind, slug, revision, skillOptions, entries, skillNamesByEntryId }: SectionEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      {entries.length === 0 ? (
        <p className="rounded-none bg-surface px-4 py-4 text-[12px] text-content-secondary">
          No entries yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              kind={kind}
              slug={slug}
              revision={revision}
              entry={entry}
              skillOptions={skillOptions}
              skillNames={skillNamesByEntryId[entry.id] ?? []}
            />
          ))}
        </div>
      )}

      <AddEntry kind={kind} slug={slug} revision={revision} skillOptions={skillOptions} />
    </div>
  );
}

function AddEntry({ kind, slug, revision, skillOptions }: {
  kind: string;
  slug: string;
  revision: number;
  skillOptions: readonly SkillOption[];
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const start = useCallback(() => setOpen(true), []);

  return (
    <div className="mt-5 rounded-none bg-surface px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="np-section-label">Add an entry</p>
        {open ? (
          <Button type="button" variant="ghost" size="sm" onClick={close}>
            Hide form
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="sm" onClick={start}>
            Add entry
          </Button>
        )}
      </div>

      {open ? (
        <div className="mt-5">
          <EntryForm
            kind={kind}
            slug={slug}
            revision={revision}
            skillOptions={skillOptions}
            onSuccess={close}
          />
        </div>
      ) : null}
    </div>
  );
}

function EntryCard({ kind, slug, revision, entry, skillOptions, skillNames }: {
  kind: string;
  slug: string;
  revision: number;
  entry: EntryLike;
  skillOptions: readonly SkillOption[];
  skillNames: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="rounded-none bg-surface px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-content">{entryTitle(entry)}</p>
          {entryMeta(entry) && (
            <p className="mt-0.5 text-[11px] text-content-muted">{entryMeta(entry)}</p>
          )}
          {skillNames.length > 0 && (
            <p className="mt-1 text-[11px] leading-relaxed text-content-secondary">
              <span className="text-content-muted">Skills: </span>
              {skillNames.join(', ')}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className={cn(
              'text-[10px]',
              visibilityTone(String(entry.visibility ?? 'PRIVATE')),
            )}
          >
            {visibilityLabel(String(entry.visibility ?? 'PRIVATE'))}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={open}
            onClick={() => setOpen((was) => !was)}
          >
            {open ? 'Close' : 'Edit'}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="mt-4 rounded-none bg-surface-sunken p-4">
          <div className="flex flex-col gap-4">
            <EntryForm
              kind={kind}
              slug={slug}
              revision={revision}
              skillOptions={skillOptions}
              initial={entry}
              onSuccess={close}
            />
            <RemoveEntry slug={slug} entryId={entry.id} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RemoveEntry({ slug, entryId }: { slug: string; entryId: string }) {
  const [state, formAction, pending] = useActionState(removeEntryAction, EMPTY_STATE);
  const [armed, setArmed] = useState(false);

  if (state.ok) return null; // removed: the card unmounts with the first render

  return (
    <form action={formAction} className="flex flex-wrap items-center justify-between gap-3">
      <input type="hidden" name="section" value={slug} />
      <input type="hidden" name="entryId" value={entryId} />
      <span className="text-[11px] text-content-muted">
        {state.error ?? 'Remove this entry?'}
      </span>
      {armed ? (
        <Button type="submit" variant="danger" size="sm" isLoading={pending} loadingLabel="Removing">
          Yes, remove it
        </Button>
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setArmed(true)}>
          Remove…
        </Button>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
// The form
// ---------------------------------------------------------------------------

function EntryForm({ kind, slug, revision, skillOptions, initial, onSuccess }: {
  kind: string;
  slug: string;
  revision: number;
  skillOptions: readonly SkillOption[];
  initial?: EntryLike;
  /** Called once per successful submission — the panel closes. */
  onSuccess?: () => void;
}) {
  const fields = useMemo(() => fieldsForSection(kind as never), [kind]);
  const [state, formAction, pending] = useActionState(saveEntryAction, EMPTY_STATE);
  const handledOk = useCallback(() => {
    if (state.ok) onSuccess?.();
    // state.ok resets when the form is re-opened (fresh instance), so this
    // reacting to a persisting ok is safe.
  }, [state.ok, onSuccess]);

  useEffect(() => {
    handledOk();
  }, [handledOk]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="section" value={slug} />
      <input type="hidden" name="entryId" value={initial?.id ?? ''} />
      <input type="hidden" name="revision" value={revision} />

      {state.error ? (
        <Alert variant="danger" title="Cannot save yet">
          {state.error}
        </Alert>
      ) : state.ok && state.message ? (
        <Alert variant="success" title="Saved">
          {state.message}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {(fields as readonly FieldSpec[]).map((spec) => (
          <FieldRow
            key={spec.name}
            spec={spec}
            state={state}
            initial={initial}
            skillOptions={skillOptions}
          />
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="submit" isLoading={pending} loadingLabel="Saving">
          {initial ? 'Save changes' : 'Add entry'}
        </Button>
      </div>
    </form>
  );
}

function entryErrorFor(state: FormState, name: string): string | undefined {
  return state.fieldErrors?.[name];
}

function FieldRow({ spec, state, initial, skillOptions }: {
  spec: FieldSpec;
  state: FormState;
  initial?: EntryLike;
  skillOptions: readonly SkillOption[];
}) {
  const error = entryErrorFor(state, spec.name);

  switch (spec.kind) {
    case 'text':
      return (
        <Field label={spec.label} error={error} required={spec.required}>
          <Input
            name={spec.name}
            type={spec.type ?? 'text'}
            required={spec.required}
            placeholder={spec.placeholder}
            maxLength={spec.maxLength}
            defaultValue={scalar(initial, spec.name) ?? ''}
            hasError={Boolean(error)}
          />
        </Field>
      );
    case 'textarea':
      return (
        <Field
          label={spec.label}
          error={error}
          required={spec.required}
          description={spec.hint}
          className="sm:col-span-2"
        >
          <Textarea
            name={spec.name}
            required={spec.required}
            placeholder={spec.placeholder}
            rows={spec.rows ?? 3}
            maxLength={spec.maxLength}
            defaultValue={scalar(initial, spec.name) ?? ''}
            hasError={Boolean(error)}
          />
        </Field>
      );
    case 'select':
      return (
        <Field label={spec.label} error={error} required={spec.required} description={spec.hint}>
          <Select name={spec.name} defaultValue={scalar(initial, spec.name) ?? ''} hasError={Boolean(error)}>
            {spec.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </Field>
      );
    case 'date':
      return (
        <Field label={spec.label} error={error} required={spec.required}>
          <Input
            name={spec.name}
            type="month"
            required={spec.required}
            defaultValue={scalar(initial, spec.name) ?? ''}
            hasError={Boolean(error)}
          />
        </Field>
      );
    case 'checkbox':
      return (
        <label className="flex items-start gap-2.5 py-1 text-[13px] text-content sm:col-span-2">
          <input
            type="checkbox"
            name={spec.name}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--np-primary)]"
            defaultChecked={Boolean(scalar(initial, spec.name))}
          />
          <span>
            {spec.label}
            {spec.hint ? (
              <span className="mt-0.5 block text-[11px] leading-relaxed text-content-muted">
                {spec.hint}
              </span>
            ) : null}
          </span>
        </label>
      );
    case 'number':
      return (
        <Field label={spec.label} error={error} description={spec.hint}>
          <Input
            name={spec.name}
            type="number"
            min={spec.min}
            max={spec.max}
            step={spec.step}
            defaultValue={scalar(initial, spec.name) ?? ''}
            hasError={Boolean(error)}
          />
        </Field>
      );
    case 'skills':
      return (
        <div className="sm:col-span-2">
          <SkillPicker error={error} initial={initial} options={skillOptions} />
        </div>
      );
    case 'visibility':
      return (
        <Field label={spec.label}>
          <Select name={spec.name} defaultValue={scalar(initial, spec.name) ?? 'PRIVATE'}>
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </Field>
      );
    default: {
      const exhaustive: never = spec;
      void exhaustive;
      return null;
    }
  }
}

/** A scalar form default from an entry; arrays are never scalars here. */
function scalar(entry: EntryLike | undefined, name: string): string | number | undefined {
  const value = entry?.[name];
  if (typeof value === 'string' || typeof value === 'number') return value;
  return undefined;
}

// ---------------------------------------------------------------------------
// Skills picker — checkboxes with a text filter
// ---------------------------------------------------------------------------

function SkillPicker({ error, initial, options }: {
  error?: string;
  initial?: EntryLike;
  options: readonly SkillOption[];
}) {
  const [filter, setFilter] = useState('');
  const selectedIds = useMemo(() => {
    const value = initial?.skillIds;
    return Array.isArray(value) ? new Set(value.filter((id): id is string => typeof id === 'string')) : new Set<string>();
  }, [initial]);

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (needle === '') return options;
    return options.filter((option) => {
      const haystack = `${option.name} ${option.categoryName ?? ''}`.toLowerCase();
      return haystack.includes(needle) || selectedIds.has(option.id);
    });
  }, [filter, options, selectedIds]);

  const grouped = useMemo(() => {
    const groups = new Map<string, SkillOption[]>();
    for (const option of filtered) {
      const key = option.categoryName ?? 'Other skills';
      const list = groups.get(key) ?? [];
      list.push(option);
      groups.set(key, list);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <Field
      label="Skills shown in this entry"
      error={error}
    >
      <div className="rounded-none bg-background p-3">
        {options.length === 0 ? (
          <p className="py-2 text-[12px] text-content-muted">Loading skills…</p>
        ) : (
          <>
            <Input
              type="search"
              placeholder="Filter skills, e.g. react, python…"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter skills"
              className="mb-2 h-9"
            />
            <div className="max-h-56 overflow-y-auto pr-1">
              {grouped.map(([category, list]) => (
                <fieldset key={category} className="mb-2 last:mb-0">
                  <legend className="mb-1 text-[10px] font-medium text-content-muted">
                    {category}
                  </legend>
                  <div className="flex flex-col">
                    {list.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-2 py-1 text-[12px] text-content-secondary hover:text-content"
                      >
                        <input
                          type="checkbox"
                          name="skillIds"
                          value={option.id}
                          defaultChecked={selectedIds.has(option.id)}
                          className="h-3.5 w-3.5 accent-[var(--np-primary)]"
                        />
                        {option.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-content-muted">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected. Scroll or filter to change.`
                : 'Unticked adds no skills.'}
            </p>
          </>
        )}
      </div>
    </Field>
  );
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const TITLE_KEYS: readonly string[] = ['title', 'name', 'label', 'degree'];
const META_KEYS: readonly string[] = ['organisation', 'issuer', 'institution', 'projectName', 'role', 'category'];

function entryTitle(entry: EntryLike): string {
  for (const key of TITLE_KEYS) {
    const value = entry[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return 'Untitled entry';
}

function entryMeta(entry: EntryLike): string {
  const parts: string[] = [];
  for (const key of META_KEYS) {
    const value = entry[key];
    if (typeof value === 'string' && value.trim() !== '') parts.push(value);
  }

  const fromDate = typeof entry.fromDate === 'string'
    ? entry.fromDate
    : typeof entry.issuedAt === 'string'
      ? entry.issuedAt
      : typeof entry.heldOn === 'string'
        ? entry.heldOn
        : undefined;
  const toDate = typeof entry.toDate === 'string' ? entry.toDate : undefined;

  if (fromDate && entry.isCurrent === true) parts.push(`${monthLabel(fromDate)} — Present`);
  else if (fromDate && toDate) parts.push(`${monthLabel(fromDate)} — ${monthLabel(toDate)}`);
  else if (fromDate) parts.push(monthLabel(fromDate));
  else if (toDate) parts.push(monthLabel(toDate));

  return parts.join(' · ');
}

function monthLabel(iso: string): string {
  const [year, month] = iso.split('-');
  if (!year || !month) return iso;
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleString('en', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function visibilityLabel(value: string): string {
  if (value === 'UNLISTED') return 'Link only';
  if (value === 'PUBLIC') return 'Public';
  return 'Private';
}

function visibilityTone(value: string): string {
  if (value === 'PUBLIC') return 'text-success-text';
  if (value === 'UNLISTED') return 'text-warning-text';
  return 'text-content-muted';
}
