import { listRoles } from '@neevpass/db';
import { PageHeader, cn } from '@neevpass/ui';
import type { Metadata } from 'next';

import { computeCareerState, roadmapFor } from '@/lib/career-bridge';
import { requireProfile } from '@/lib/session';

import { GoalForm, RecordSnapshotButton, RoadmapStatusForm } from './career-forms';

export const metadata: Metadata = {
  title: 'Career',
  robots: { index: false, follow: false },
};

interface GapItemLike {
  readonly skillId: string;
  readonly skillName: string;
  readonly minLevel: number;
  readonly level?: number;
  readonly prerequisiteSlugs?: readonly string[];
}

/**
 * Career screen.
 *
 * The score and gap are computed on every load from the current profile. The
 * roadmap is the one persisted artefact, generated once per goal and served
 * with its progress status. Presented as a report: one figure, a factor table,
 * and a checklist.
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
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Career"
        description="A score you can inspect, a gap against a target role, and a roadmap ordered by prerequisites."
      />

      {/* Score ----------------------------------------------------------- */}
      <section className="grid gap-8 border-b border-line pb-9 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <div>
          <p className="np-mono text-[10px] text-content-muted">score</p>
          <p className="np-tabular mt-2 text-[4rem] font-medium leading-none tracking-[-0.06em] text-content">
            {state.score.score}
            <span className="ml-1 align-baseline text-[1.1rem] font-normal tracking-normal text-content-muted">
              /100
            </span>
          </p>
          <p className="mt-3 max-w-[15rem] text-[11px] leading-relaxed text-content-muted">
            Six weighted factors, calculated from the current profile.
          </p>
          <div className="mt-4">
            <RecordSnapshotButton />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
            <span className="np-mono text-[10px] text-content-muted">factor</span>
            <span className="np-mono text-[10px] text-content-muted">points</span>
          </div>
          <ul>
            {state.score.factors.map((factor) => (
              <li key={factor.key} className="border-b border-line py-3">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-[12.5px] font-medium text-content">{factor.label}</p>
                  <p className="np-mono shrink-0 text-[10px] text-content-secondary">
                    {factor.points}/{factor.max}
                  </p>
                </div>
                <div className="mt-2 h-px w-full bg-line">
                  <div
                    className="h-px bg-content"
                    style={{ width: `${Math.round((factor.points / factor.max) * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 max-w-xl text-[11px] leading-relaxed text-content-muted">
                  {factor.explanation}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Goal ------------------------------------------------------------ */}
      <section className="grid gap-8 border-b border-line pb-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <p className="np-mono text-[10px] text-content-muted">target role</p>
          <h2 className="mt-2 text-[1.5rem] font-semibold leading-tight tracking-[-0.03em] text-content">
            {state.goal?.roleName ?? 'No role selected'}
          </h2>
          <p className="mt-2 max-w-[44ch] text-[12px] leading-relaxed text-content-secondary">
            {state.goal
              ? state.goal.note
                ? `“${state.goal.note}”`
                : 'The gap analysis and roadmap are built against this role.'
              : 'Choose the role you are working toward.'}
          </p>

          {state.gap ? (
            <dl className="mt-6 grid grid-cols-3 border-y border-line">
              {[
                { label: 'coverage', value: `${state.gap.coverage}%` },
                { label: 'readiness', value: `${state.gap.readiness}%` },
                { label: 'missing', value: String(state.gap.missing.length) },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className={cn('py-3 pr-3', index > 0 && 'border-l border-line pl-4')}
                >
                  <dt className="np-mono text-[10px] text-content-muted">{stat.label}</dt>
                  <dd className="np-tabular mt-1 text-[1.25rem] leading-none tracking-[-0.03em] text-content">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        <div>
          <h3 className="text-[12px] font-semibold text-content">
            {state.goal ? 'Change the goal' : 'Set a goal'}
          </h3>
          <div className="mt-4">
            <GoalForm
              roles={roles}
              currentRoleId={state.goal?.roleId}
              revision={state.revision}
            />
          </div>
        </div>
      </section>

      {/* Gap ------------------------------------------------------------- */}
      {state.gap && state.role ? (
        <section aria-labelledby="gap-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 id="gap-heading" className="text-[12px] font-semibold text-content">
              Skill gap
            </h2>
            <p className="np-mono text-[10px] text-content-muted">
              {state.gap.matched.length} matched / {state.gap.partial.length} below /{' '}
              {state.gap.missing.length} missing
            </p>
          </div>

          <div className="grid gap-0 md:grid-cols-3">
            <GapColumn title="Matched" items={state.gap.matched} tone="success" />
            <GapColumn title="Below level" items={state.gap.partial} tone="warning" />
            <GapColumn title="Missing" items={state.gap.missing} tone="brand" />
          </div>
        </section>
      ) : null}

      {/* Roadmap --------------------------------------------------------- */}
      {roadmap ? (
        <section aria-labelledby="roadmap-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 id="roadmap-heading" className="text-[12px] font-semibold text-content">
              Roadmap
            </h2>
            <p className="np-mono text-[10px] text-content-muted">
              {roadmap.items.filter((item) => item.status === 'DONE').length}/
              {roadmap.items.length} done
            </p>
          </div>

          <ol>
            {roadmap.items.map((item) => {
              const gapItem = state.gap
                ? [...state.gap.matched, ...state.gap.partial, ...state.gap.missing].find(
                    (entry) => entry.skillId === item.skillId,
                  )
                : undefined;
              const done = item.status === 'DONE';
              const importance = gapItem?.importance ?? 0;
              const importanceLabel =
                importance >= 4 ? 'core' : importance >= 2 ? 'important' : 'bonus';

              return (
                <li
                  key={item.skillId}
                  className="grid gap-3 border-b border-line py-4 sm:grid-cols-[1.5rem_minmax(0,1fr)_auto] sm:items-start sm:gap-4"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'np-mono pt-0.5 text-[10px]',
                      done ? 'text-success' : 'text-content-muted',
                    )}
                  >
                    {done ? '✓' : String(item.order + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-content">
                      {gapItem?.skillName ?? 'Skill'}
                    </p>
                    <p className="np-mono mt-1 text-[10px] text-content-muted">
                      {gapItem?.level !== undefined
                        ? `level ${gapItem.level}/5`
                        : 'not on profile'}
                      {' / needs '}
                      {gapItem?.minLevel ?? '?'}/5{' / '}
                      {importanceLabel}
                    </p>
                    {item.resourceUrl ? (
                      <a
                        href={item.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-block text-[11px] text-content underline decoration-line-strong underline-offset-2 hover:decoration-content"
                      >
                        {item.resourceTitle ?? 'Open resource'}
                      </a>
                    ) : null}
                  </div>

                  <div className="sm:pt-0">
                    <RoadmapStatusForm
                      skillId={item.skillId}
                      skillName={gapItem?.skillName ?? 'Skill'}
                      status={item.status}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : (
        <p className="border-t border-line pt-5 text-[12px] text-content-secondary">
          A roadmap appears once a target role is set.
        </p>
      )}
    </div>
  );
}

function GapColumn({
  title,
  items,
  tone,
}: {
  title: string;
  items: readonly GapItemLike[];
  tone: 'success' | 'warning' | 'brand';
}) {
  const dot = {
    success: 'bg-success',
    warning: 'bg-warning',
    brand: 'bg-content',
  }[tone];

  return (
    <div className="border-b border-line py-4 md:border-b-0 md:border-r md:pr-5 md:last:border-r-0 md:last:pr-0 md:[&:not(:first-child)]:pl-5">
      <h3 className="flex items-center gap-2 text-[11px] font-medium text-content">
        <span aria-hidden="true" className={cn('h-1 w-1', dot)} />
        {title}
        <span className="np-mono ml-auto text-[10px] font-normal text-content-muted">
          {items.length}
        </span>
      </h3>

      {items.length === 0 ? (
        <p className="mt-3 text-[11px] text-content-muted">Nothing here.</p>
      ) : (
        <ul className="mt-1">
          {items.map((item) => (
            <li
              key={item.skillId}
              className="flex items-baseline justify-between gap-3 border-b border-line-subtle py-2 last:border-b-0"
            >
              <span className="min-w-0 truncate text-[12px] text-content-secondary">
                {item.skillName}
              </span>
              <span className="np-mono shrink-0 text-[10px] text-content-muted">
                {item.level !== undefined ? `${item.level}/${item.minLevel}` : `${item.minLevel}/5`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
