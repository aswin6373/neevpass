import { Skeleton } from '@neevpass/ui';

import { LoadingRegion } from '@/components/loading/skeletons';

/**
 * Opportunities loading state: the ranked ledger, with the title and fit
 * columns already in their final positions.
 */
export default function OpportunitiesLoading() {
  return (
    <LoadingRegion label="Loading opportunities" className="flex flex-col gap-9">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-8 w-44 max-w-full" />
          <Skeleton className="h-2.5 w-full max-w-xl" />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-4 sm:pt-1">
          <Skeleton className="h-2 w-12" />
          <Skeleton className="h-2 w-12" />
          <Skeleton className="h-2 w-10" />
        </div>
      </header>

      <ol>
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <li key={item} className="border-b border-line py-4 sm:py-5">
            <div className="grid gap-4 md:grid-cols-[1.5rem_minmax(0,1fr)_14rem] md:items-start md:gap-5">
              <Skeleton className="hidden h-2 w-5 md:block" />

              <div className="min-w-0">
                <Skeleton className="h-3.5 w-64 max-w-full" />
                <Skeleton className="mt-2 h-2 w-full max-w-sm" />
                <Skeleton className="mt-2 h-2 w-40 max-w-full" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 md:flex-col md:items-end md:gap-1.5">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-6 w-10" />
                  <Skeleton className="h-2 w-16" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-2 w-20" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </LoadingRegion>
  );
}
