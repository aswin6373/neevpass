'use client';

import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
} from '@neevpass/ui';
import { useActionState, useEffect, useMemo, useState, type ReactNode } from 'react';

import { removeSkillAction, saveSkillAction, setSkillsVisibilityAction } from '../actions';
import type { FormState } from '@/lib/forms';

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
 * The skills section — a taxonomy-backed picker plus the claimed skills.
 *
 * Skills are picked from the curated taxonomy rather than typed free-hand so
 * the gap engine and role matching can compare like with like. A search box
 * narrows the taxonomy select; every claimed skill can be re-levelled, hidden
 * or removed.
 */
export function SkillsSection({ revision, options, skills }: {
  readonly revision: number;
  readonly options: readonly SkillOption[];
  readonly skills: readonly ProfileSkillRow[];
}) {
  const added = useMemo(() => new Set(skills.map((skill) => skill.skillId)), [skills]);
  const available = useMemo(() => options.filter((option) => !added.has(option.id)), [options, added]);

  return (
    <div className="flex flex-col gap-6">
      <AddSkillCard revision={revision} available={available} />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Your skills ({skills.length})</CardTitle>
              <CardDescription>Level is self-assessed — documents label it “reported by you”.</CardDescription>
            </div>
            <VisibilityAllForm revision={revision} />
          </div>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <p className="py-6 text-center text-sm text-content-muted">
              No skills claimed yet — add the ones you actually use above.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {skills.map((skill) => (
                <SkillRow key={skill.skillId} revision={revision} skill={skill} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VisibilityAllForm({ revision }: { revision: number }) {
  const [state, formAction, pending] = useActionState(setSkillsVisibilityAction, EMPTY_STATE);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="revision" value={revision} />
      <div className="w-44">
        <Select name="visibility" aria-label="Set visibility for every skill" defaultValue="PRIVATE">
          {VISIBILITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.value}</option>
          ))}
        </Select>
      </div>
      <Button type="submit" variant="secondary" size="sm" isLoading={pending} loadingLabel="Applying">
        Apply to all
      </Button>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.ok && state.message ? <p className="text-sm text-success">{state.message}</p> : null}
    </form>
  );
}

function AddSkillCard({ revision, available }: { revision: number; available: readonly SkillOption[] }) {
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
    <Card>
      <CardHeader>
        <CardTitle>Add a skill</CardTitle>
        <CardDescription>
          {available.length === 0
            ? 'Every taxonomy skill is already on your profile.'
            : `${available.length} skills available to claim.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
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

          <Field label="Search" description="Filters the list below; pick one skill per save.">
            <Input
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="e.g. react, python, figma…"
              aria-label="Filter skills"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Skill" required>
              <Select name="skillId" required size={Math.min(10, Math.max(4, filtered.length))}>
                {grouped.map(([category, list]) => (
                  <optgroup key={category} label={category}>
                    {list.map((option) => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Level" required>
                <Select name="proficiency" defaultValue="3">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <option key={level} value={String(level)}>{level} — {PROFICIENCY_LABELS[level]}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Years used">
                <Input name="yearsUsed" type="number" min={0} max={30} placeholder="—" />
              </Field>

              <Field label="Visibility">
                <Select name="visibility" defaultValue="PRIVATE">
                  {VISIBILITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.value}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={pending} loadingLabel="Adding">
              Add skill
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SkillRow({ revision, skill }: { revision: number; skill: ProfileSkillRow }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-content">{skill.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-content-secondary">
            <span>Level {skill.proficiency}/5 — {PROFICIENCY_LABELS[skill.proficiency] ?? 'Self-assessed'}</span>
            {skill.yearsUsed !== undefined ? <span>· {skill.yearsUsed} yr{skill.yearsUsed === 1 ? '' : 's'}</span> : null}
            {skill.categoryName ? <span>· {skill.categoryName}</span> : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline">{skill.visibility === 'UNLISTED' ? 'Link only' : skill.visibility === 'PUBLIC' ? 'Public' : 'Private'}</Badge>
          <Button type="button" variant="secondary" size="sm" aria-expanded={open} onClick={() => setOpen((was) => !was)}>
            {open ? 'Close' : 'Edit'}
          </Button>
        </div>
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

function EditSkillForm({ revision, skill, onDone }: { revision: number; skill: ProfileSkillRow; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(saveSkillAction, EMPTY_STATE);

  // Closing happens in an effect: setState during another component's render
  // is not allowed, and a successful save re-renders with fresh server data.
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  const label: ReactNode = state.error ? (
    <Alert variant="danger" title="Could not update">
      {state.error}
    </Alert>
  ) : null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="skillId" value={skill.skillId} />
      <input type="hidden" name="revision" value={revision} />
      {label}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Level">
          <Select name="proficiency" defaultValue={String(skill.proficiency)}>
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={String(level)}>{level} — {PROFICIENCY_LABELS[level]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Years used">
          <Input name="yearsUsed" type="number" min={0} max={30} defaultValue={skill.yearsUsed ?? ''} />
        </Field>
        <Field label="Visibility">
          <Select name="visibility" defaultValue={skill.visibility}>
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.value}</option>
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
    <form action={formAction} className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-3">
      <input type="hidden" name="skillId" value={skillId} />
      <span className="text-sm text-content-muted">
        {state.error ?? `Remove ${name} from your profile?`}
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
