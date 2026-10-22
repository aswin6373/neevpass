'use client';

import { Alert, Button, Field, Input, Select, cn } from '@neevpass/ui';
import { useActionState, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { FormState } from '@/lib/forms';

import { removeSkillAction, saveSkillAction, setSkillsVisibilityAction } from '../actions';

import type { SkillOption } from './section-editor';
import { VISIBILITY_OPTIONS } from './specs';

const EMPTY_STATE: FormState = {};

export interface ProfileSkillRow {
  readonly skillId: string;
  readonly name: string;
  readonly categoryName?: string;
  readonly proficiency: number;
  readonly yearsUsed?: number;
  readonly visibility: string;
}

const PROFICIENCY_LABELS: Readonly<Record<number, string>> = {
  1: 'Aware',
  2: 'Familiar',
  3: 'Working knowledge',
  4: 'Strong',
  5: 'Expert',
};

/**
 * The skills section: a taxonomy-backed picker plus the claimed skills.
 *
 * Skills come from the curated taxonomy rather than free text so the gap engine
 * and role matching compare like with like. The claimed list is a table of
 * short rows, not a gallery of badges.
 */
export function SkillsSection({ revision, options, skills }: {
  readonly revision: number;
  readonly options: readonly SkillOption[];
  readonly skills: readonly ProfileSkillRow[];
}) {
  const added = useMemo(() => new Set(skills.map((skill) => skill.skillId)), [skills]);
  const available = useMemo(
    () => options.filter((option) => !added.has(option.id)),
    [options, added],
  );

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="claimed-skills-heading">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-2">
          <div>
            <h2
              id="claimed-skills-heading"
              className="text-[12px] font-semibold text-content"
            >
              Claimed
              <span className="np-mono ml-2 text-[10px] font-normal text-content-muted">
                {skills.length}
              </span>
            </h2>
          </div>
          {skills.length > 0 ? <VisibilityAllForm revision={revision} /> : null}
        </div>

        {skills.length === 0 ? (
          <p className="border-b border-line py-4 text-[12px] text-content-secondary">
            No skills claimed yet.
          </p>
        ) : (
          <ul>
            {skills.map((skill) => (
              <SkillRow key={skill.skillId} revision={revision} skill={skill} />
            ))}
          </ul>
        )}
      </section>

      <AddSkillSection revision={revision} available={available} />
    </div>
  );
}

function VisibilityAllForm({ revision }: { revision: number }) {
  const [state, formAction, pending] = useActionState(setSkillsVisibilityAction, EMPTY_STATE);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction} className="flex items-end gap-2">
        <input type="hidden" name="revision" value={revision} />
        <Select
          name="visibility"
          aria-label="Set visibility for every skill"
          defaultValue="PRIVATE"
          className="h-8 w-36 text-[12px]"
        >
          {VISIBILITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary" size="sm" isLoading={pending} loadingLabel="Applying">
          Apply to all
        </Button>
      </form>
      {state.error ? <p className="text-[10px] text-danger">{state.error}</p> : null}
      {state.ok && state.message ? <p className="text-[10px] text-success-text">{state.message}</p> : null}
    </div>
  );
}

function AddSkillSection({ revision, available }: {
  revision: number;
  available: readonly SkillOption[];
}) {
  const [state, formAction, pending] = useActionState(saveSkillAction, EMPTY_STATE);
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (needle === '') return available;
    return available.filter((option) =>
      `${option.name} ${option.categoryName ?? ''}`.toLowerCase().includes(needle),
    );
  }, [filter, available]);

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
    <section aria-labelledby="add-skill-heading" className="border-t border-line pt-6">
      <div className="max-w-3xl">
        <h2 id="add-skill-heading" className="text-[12px] font-semibold text-content">
          Add a skill
        </h2>
        <p className="np-mono mt-1 text-[10px] text-content-muted">
          {available.length === 0
            ? 'no skills left to add'
            : `${available.length} available`}
        </p>

        {available.length > 0 ? (
          <form action={formAction} className="mt-4 flex flex-col gap-4">
            <input type="hidden" name="revision" value={revision} />

            {state.error ? (
              <Alert variant="danger" title="Could not add the skill">
                {state.error}
              </Alert>
            ) : state.ok && state.message ? (
              <Alert variant="success" title="Added">
                {state.message}
              </Alert>
            ) : null}

            <Field label="Search">
              <Input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="react, python, figma"
                aria-label="Filter skills"
              />
            </Field>

            <Field label="Skill" required>
              <Select name="skillId" required>
                {grouped.map(([category, list]) => (
                  <optgroup key={category} label={category}>
                    {list.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Level" required className="col-span-2 sm:col-span-1">
                <Select name="proficiency" defaultValue="3">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <option key={level} value={String(level)}>
                      {level} · {PROFICIENCY_LABELS[level]}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Years">
                <Input name="yearsUsed" type="number" min={0} max={30} placeholder="0" />
              </Field>

              <Field label="Visibility">
                <Select name="visibility" defaultValue="PRIVATE">
                  {VISIBILITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={pending} loadingLabel="Adding">
                Add skill
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  );
}

function SkillRow({ revision, skill }: { revision: number; skill: ProfileSkillRow }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="border-b border-line py-3.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-content">{skill.name}</p>
          <p className="mt-0.5 text-[10px] text-content-muted">
            {skill.categoryName ?? 'Other skills'}
            {skill.yearsUsed !== undefined
              ? ` · ${skill.yearsUsed} ${skill.yearsUsed === 1 ? 'year' : 'years'}`
              : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] tabular-nums text-content-muted">
            Level {skill.proficiency} of 5
          </span>
          <span className="flex gap-0.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((level) => (
              <span
                key={level}
                className={cn(
                  'h-1 w-2.5',
                  level <= skill.proficiency ? 'bg-brand' : 'bg-line-strong/50',
                )}
              />
            ))}
          </span>
        </div>

        <span className={cn('text-[10px]', visibilityTone(skill.visibility))}>
          {visibilityLabel(skill.visibility)}
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

      {open ? (
        <div className="mt-4 flex flex-col gap-4 border-t border-line pt-4">
          <EditSkillForm revision={revision} skill={skill} onDone={() => setOpen(false)} />
          <RemoveSkillForm skillId={skill.skillId} name={skill.name} />
        </div>
      ) : null}
    </li>
  );
}

function EditSkillForm({ revision, skill, onDone }: {
  revision: number;
  skill: ProfileSkillRow;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveSkillAction, EMPTY_STATE);

  // Closing happens in an effect: setState during another component's render
  // is not allowed, and a successful save re-renders with fresh server data.
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  const feedback: ReactNode = state.error ? (
    <Alert variant="danger" title="Could not update">
      {state.error}
    </Alert>
  ) : null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="skillId" value={skill.skillId} />
      <input type="hidden" name="revision" value={revision} />
      {feedback}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Level">
          <Select name="proficiency" defaultValue={String(skill.proficiency)}>
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={String(level)}>
                {level} · {PROFICIENCY_LABELS[level]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Years used">
          <Input name="yearsUsed" type="number" min={0} max={30} defaultValue={skill.yearsUsed ?? ''} />
        </Field>
        <Field label="Visibility">
          <Select name="visibility" defaultValue={skill.visibility}>
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" isLoading={pending} loadingLabel="Saving">
          Save changes
        </Button>
      </div>
    </form>
  );
}

function RemoveSkillForm({ skillId, name }: { skillId: string; name: string }) {
  const [state, formAction, pending] = useActionState(removeSkillAction, EMPTY_STATE);
  const [armed, setArmed] = useState(false);

  return (
    <form action={formAction} className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
      <input type="hidden" name="skillId" value={skillId} />
      <span className="text-[12px] text-content-muted">
        {state.error ?? `Remove ${name} from your profile?`}
      </span>
      {armed ? (
        <Button type="submit" variant="danger" size="sm" isLoading={pending} loadingLabel="Removing">
          Yes, remove it
        </Button>
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setArmed(true)}>
          Remove
        </Button>
      )}
    </form>
  );
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
