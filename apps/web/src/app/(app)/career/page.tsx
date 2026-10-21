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
 * with its progress status. Presented as a report: one large figure, a factor
 * table, and a checklist.
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
        eyebrow="Career"
        title="Career plan"
        description="A score you can inspect, a gap against a target role, and a roadmap ordered by prerequisites. The inputs are self-reported; the weighting is open."
      />

      {/* Score ----------------------------------------------------------- */}
      <section className="grid gap-8 border-b border-line pb-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <div>
          <p className="text-[11px] text-content-muted">Career score</p>
          <p className="np-display mt-2 text-[4.5rem] leading-none text-content">
            {state.score.score}
            <span className="ml-1 align-baseline text-[1.4rem] text-content-muted">/ 100</span>
          </p>
          <p className="mt-4 max-w-[16rem] text-[12px] leading-relaxed text-content-secondary">
            Six weighted factors, calculated from the current profile. No hidden adjustments.
          </p>
          <div className="mt-5">
            <RecordSnapshotButton score={state.score.score} />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2 text-[11px] text-content-muted">
            <span>Factor</span>
            <span>Points</span>
          </div>
          <ul>
            {state.score.factors.map((factor) => (
              <li key={factor.key} className="border-b border-line py-3.5">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-[13px] font-medium text-content">{factor.label}</p>
                  <p className="shrink-0 text-[11px] tabular-nums text-content-secondary">
                    {factor.points} / {factor.max}
                  </p>
                </div>
                <div className="mt-2 h-1 w-full bg-surface-sunken">
                  <div
                    className="h-full bg-brand"
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
      <section className="grid gap-8 border-b border-line pb-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <div>
          <p className="text-[11px] text-content-muted">Target role</p>
          <h2 className="np-display mt-2 text-[1.8rem] text-content">
            {state.goal?.roleName ?? 'No role selected'}
          </h2>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-content-secondary">
            {state.goal
              ? state.goal.note
                ? `“${state.goal.note}”`
                : 'The gap analysis and roadmap are built against this role.'
              : 'Choose the role you are working toward. The gap analysis and roadmap will appear below.'}
          </p>
          {state.goal ? (
            <p className="mt-2 text-[11px] text-content-muted">
              Setting a different role keeps this one in your history.
            </p>
          ) : null}

          {state.gap ? (
            <dl className="mt-6 grid grid-cols-3 border-y border-line">
              {[
                { label: 'Coverage', value: `${state.gap.coverage}%`, hint: 'Breadth' },
                { label: 'Readiness', value: `${state.gap.readiness}%`, hint: 'Weighted' },
                { label: 'Missing', value: `${state.gap.missing.length}`, hint: 'Skills' },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className={cn('py-3.5 pr-3', index > 0 && 'border-l border-line pl-4')}
                >
                  <dt className="text-[10px] text-content-muted">{stat.label}</dt>
                  <dd className="mt-1 font-display text-[1.35rem] leading-none text-content">
                    {stat.value}
                  </dd>
                  <dd className="mt-1 text-[10px] text-content-muted">{stat.hint}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        <div>
          <h3 className="text-[13px] font-medium text-content">
            {state.goal ? 'Change the goal' : 'Set a goal'}
          </h3>
          <p className="mt-1 text-[11px] text-content-muted">
            One active role at a time. You can change it as often as you need.
          </p>
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
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-2.5">
            <h2 id="gap-heading" className="font-display text-[1.6rem] text-content">
              Skill gap
            </h2>
            <p className="text-[11px] text-content-muted">
              {state.gap.matched.length} matched · {state.gap.partial.length} partial ·{' '}
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
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-2.5">
            <h2 id="roadmap-heading" className="font-display text-[1.6rem] text-content">
              Roadmap
            </h2>
            <p className="text-[11px] text-content-muted">
              {roadmap.items.filter((item) => item.status === 'DONE').length} of{' '}
              {roadmap.items.length} done
            </p>
          </div>

          <ol>
            {roadmap.items.map((item) => {
              const skillName = state.gap
                ? [...state.gap.matched, ...state.gap.partial, ...state.gap.missing].find(
                    (entry) => entry.skillId === item.skillId,
                  )?.skillName
                : undefined;
              const done = item.status === 'DONE';

              return (
                <li
                  key={item.skillId}
                  className="grid gap-3 border-b border-line py-4 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-start sm:gap-5"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'pt-0.5 text-[11px] tabular-nums',
                      done ? 'text-success' : 'text-content-muted',
                    )}
                  >
                    {done ? '✓' : String(item.order + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-content">{skillName ?? 'Skill'}</p>
                    <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-content-secondary">
                      {item.reason}
                    </p>
                    {item.resourceUrl ? (
                      <a
                        href={item.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-block text-[11px] text-brand-text underline decoration-brand/40 underline-offset-2 hover:decoration-brand"
                      >
                        {item.resourceTitle ?? 'Open resource'}
                      </a>
                    ) : null}
                  </div>

                  <div className="sm:pt-0">
                    <RoadmapStatusForm skillId={item.skillId} status={item.status} />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : (
        <p className="border-t border-line pt-6 text-[13px] text-content-secondary">
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
    brand: 'bg-brand',
  }[tone];

  return (
    <div className="border-b border-line py-5 md:border-b-0 md:border-r md:pr-6 md:last:border-r-0 md:last:pr-0 md:[&:not(:first-child)]:pl-6">
      <h3 className="flex items-center gap-2 text-[12px] font-medium text-content">
        <span aria-hidden="true" className={cn('h-1.5 w-1.5', dot)} />
        {title}
        <span className="ml-auto text-[10px] font-normal tabular-nums text-content-muted">
          {items.length}
        </span>
      </h3>

      {items.length === 0 ? (
        <p className="mt-3 text-[12px] text-content-muted">Nothing here.</p>
      ) : (
        <ul className="mt-2">
          {items.map((item) => (
            <li
              key={item.skillId}
              className="flex items-baseline justify-between gap-3 border-b border-line-subtle py-2 last:border-b-0"
            >
              <span className="min-w-0 truncate text-[12px] text-content-secondary">
                {item.skillName}
              </span>
              <span className="shrink-0 text-[10px] tabular-nums text-content-muted">
                {item.level !== undefined ? `${item.level}/${item.minLevel}` : `${item.minLevel}/5`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
