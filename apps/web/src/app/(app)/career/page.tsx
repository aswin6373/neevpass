import { listRoles } from '@neevpass/db';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@neevpass/ui';
import type { Metadata } from 'next';

import { requireProfile } from '@/lib/session';
import { computeCareerState, roadmapFor } from '@/lib/career-bridge';

import { GoalForm, RecordSnapshotButton, RoadmapStatusForm } from './career-forms';

export const metadata: Metadata = {
  title: 'Career',
  robots: { index: false, follow: false },
};

/**
 * Career screen.
 *
 * Everything here is computed, not stored: the score and gap run over the
 * current aggregate on every load; the ROADMAP is the one persisted artefact,
 * generated once per goal and then served with its progress status.
 */
export default async function CareerPage() {
  const { scope } = await requireProfile();

  const state = await computeCareerState(scope);
  const roadmap = await roadmapFor(scope, state);
  const roles = (await listRoles()).map((role) => ({
    roleId: role.roleId,
    name: role.name,
    description: role.description,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Career"
        description="A score you can act on, a gap you can see, and a roadmap you can tick off."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Career score</CardTitle>
            <CardDescription>Self-reported inputs, weighed openly.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold tracking-tight text-content">
              {state.score.score}
              <span className="text-lg text-content-muted">/100</span>
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {state.score.factors.map((factor) => (
                <li key={factor.key} className="text-sm">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-content">{factor.label}</span>
                    <span className="text-content-secondary">{factor.points}/{factor.max}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-content-muted">{factor.explanation}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <RecordSnapshotButton score={state.score.score} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Target role</CardTitle>
            <CardDescription>
              {state.goal
                ? 'Your gap analysis and roadmap are built against this role.'
                : 'Pick a role to unlock gap analysis and a roadmap.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {state.goal ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand">{state.goal.roleName}</Badge>
                {state.goal.note ? <span className="text-sm text-content-secondary">“{state.goal.note}”</span> : null}
                <span className="text-xs text-content-muted">Setting a different role keeps this one in your history.</span>
              </div>
            ) : null}
            <GoalForm roles={roles} currentRoleId={state.goal?.roleId} revision={state.revision} />
          </CardContent>
        </Card>
      </div>

      {state.gap && state.role ? (
        <Card>
          <CardHeader>
            <CardTitle>Skill gap vs “{state.role.name}”</CardTitle>
            <CardDescription>
              Coverage: {state.gap.coverage}% of requirements touched · readiness: {state.gap.readiness}% importance-weighted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <GapRow title="Matched" items={state.gap.matched} tone="success" />
              <GapRow title="Not yet at level" items={state.gap.partial} tone="warning" />
              <GapRow title="Missing" items={state.gap.missing} tone="brand" />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {roadmap ? (
        <Card>
          <CardHeader>
            <CardTitle>Roadmap</CardTitle>
            <CardDescription>Ordered by what the role actually needs, prerequisites first.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-3">
              {roadmap.items.map((item) => {
                const skillName = state.gap
                  ? [...state.gap.matched, ...state.gap.partial, ...state.gap.missing]
                      .find((entry) => entry.skillId === item.skillId)?.skillName
                  : undefined;
                return (
                  <li key={item.skillId} className="rounded-lg border border-line bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-content">
                          {item.order + 1}. {skillName ?? 'Skill'}
                        </p>
                        <p className="mt-0.5 text-sm text-content-secondary">{item.reason}</p>
                        {item.resourceUrl ? (
                          <a
                            href={item.resourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block text-sm text-brand underline-offset-2 hover:underline"
                          >
                            Resource: {item.resourceTitle ?? 'open'}
                          </a>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <RoadmapStatusForm skillId={item.skillId} status={item.status} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

interface GapItemLike {
  readonly skillId: string;
  readonly skillName: string;
  readonly minLevel: number;
  readonly level?: number;
  readonly prerequisiteSlugs?: readonly string[];
}

function GapRow({ title, items, tone }: {
  title: string;
  items: readonly GapItemLike[];
  tone: 'success' | 'warning' | 'brand';
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-content-muted">
        {title} ({items.length})
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-content-muted">Nothing here.</p>
      ) : (
        <p className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item.skillId} variant={tone}>
              {item.skillName}
              {item.level !== undefined
                ? ` · ${item.level}/${item.minLevel}`
                : ` · needs ${item.minLevel}/5`}
            </Badge>
          ))}
        </p>
      )}
    </div>
  );
}
