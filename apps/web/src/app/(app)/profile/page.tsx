import {
  computeProfileCompleteness,
  SECTION_DEFINITIONS,
} from '@neevpass/domain';
import { requireProfileAggregate } from '@neevpass/db';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  buttonVariants,
  cn,
} from '@neevpass/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { requireProfile } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false, follow: false },
};

/**
 * Profile overview.
 *
 * The eleven sections come from the domain's single source of truth, and the
 * completeness figures come from the domain engine — never a hard-coded list
 * here, so this screen cannot fall out of sync with the data model.
 */
export default async function ProfilePage() {
  const { user, scope } = await requireProfile();
  const aggregate = await requireProfileAggregate(scope.profileId);
  const completeness = computeProfileCompleteness(aggregate);

  const nextSection = SECTION_DEFINITIONS.find(
    (definition) => !completeness.sections.some(
      (section) => section.kind === definition.kind && section.filled,
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Your profile"
        description="Build it once, then let resumes, portfolios and public pages reuse it."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{aggregate.fullName}</CardTitle>
              <CardDescription>
                {aggregate.headline ?? user.email}
              </CardDescription>
            </div>
            <Badge variant={completeness.percent === 100 ? 'success' : 'brand'}>
              {completeness.percent}% complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div
            role="progressbar"
            aria-valuenow={completeness.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completeness"
            className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
          >
            <div
              className="h-full rounded-full bg-brand transition-[width]"
              style={{ width: `${completeness.percent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-content-secondary">
            {completeness.filledCount} of {completeness.totalCount} sections filled
            {nextSection ? <> — next up: <strong className="font-medium text-content">{nextSection.label}</strong>.</> : '.'}
          </p>
        </CardContent>
      </Card>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTION_DEFINITIONS.map((definition) => {
          const section = completeness.sections.find((entry) => entry.kind === definition.kind);
          const filled = section?.filled ?? false;
          const items = section?.items ?? 0;

          return (
            <li key={definition.kind}>
              <Link
                href={`/profile/${definition.slug}`}
                className={cn(
                  'flex h-full flex-col gap-2 rounded-lg border bg-surface p-4 transition-colors hover:bg-surface-hover',
                  filled ? 'border-line' : 'border-dashed border-line',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-content">{definition.label}</span>
                  <Badge variant={filled ? 'success' : 'outline'}>
                    {filled ? (items === 1 ? '1 entry' : `${items} entries`) : 'Empty'}
                  </Badge>
                </div>
                <span className="text-sm text-content-secondary">{definition.description}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-sunken p-4">
        <div>
          <p className="text-sm font-medium text-content">Sections reset nothing — you can edit any entry later.</p>
          <p className="text-sm text-content-secondary">
            Visibility is set per entry, and self-reported facts are always labelled as self-reported.
          </p>
        </div>
        <Link href="/profile/summary" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
          Edit basics &amp; summary
        </Link>
      </div>
    </div>
  );
}
