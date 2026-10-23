import { Skeleton } from '@neevpass/ui';

import {
  LoadingRegion,
  PageHeadingSkeleton,
  SectionHeadingSkeleton,
} from '@/components/loading/skeletons';

/**
 * Settings loading state: the account ledger and the privacy notes.
 */
export default function SettingsLoading() {
  return (
    <LoadingRegion label="Loading settings" className="flex max-w-3xl flex-col gap-10">
      <PageHeadingSkeleton
        titleWidth="w-32"
        descriptionWidth="w-full max-w-lg"
        action={false}
      />

      <section aria-label="Account">
        <SectionHeadingSkeleton titleWidth="w-16" meta={false} />
        <div className="mt-1">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 border-b border-line py-3"
            >
              <Skeleton className="h-2 w-12" />
              <Skeleton className="h-2.5 w-48 max-w-full" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Skeleton className="h-9 w-24" />
        </div>
      </section>

      <section aria-label="Privacy" className="border-t border-line pt-8">
        <SectionHeadingSkeleton titleWidth="w-16" meta={false} />
        <div className="mt-1">
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex items-baseline gap-4 border-b border-line py-3">
              <Skeleton className="h-2 w-4 shrink-0" />
              <Skeleton className="h-2.5 w-full max-w-xl" />
            </div>
          ))}
        </div>
      </section>
    </LoadingRegion>
  );
}
