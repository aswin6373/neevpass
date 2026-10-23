import { Skeleton } from '@neevpass/ui';

import { LoadingRegion } from '@/components/loading/skeletons';

/**
 * Profile index loading state: identity block, the section index and the
 * completeness margin.
 */
export default function ProfileLoading() {
  return (
    <LoadingRegion label="Loading profile" className="flex flex-col gap-9">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="h-2.5 w-full max-w-lg" />
          <Skeleton className="mt-1 h-2 w-56 max-w-full" />
        </div>
        <Skeleton className="h-9 w-24 shrink-0" />
      </header>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_15rem] xl:gap-14">
        <section aria-label="Profile sections">
          <div className="flex items-baseline justify-between gap-4">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-2 w-16" />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Array.from({ length: 11 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 bg-surface px-3.5 py-3">
                <Skeleton className="h-2 w-5 shrink-0" />
                <Skeleton className="h-2.5 flex-1" />
                <Skeleton className="h-2 w-10 shrink-0" />
                <Skeleton className="h-3 w-3 shrink-0" />
              </div>
            ))}
          </div>
        </section>

        <aside aria-label="Profile completeness">
          <div className="bg-surface p-4">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="mt-5 h-10 w-20" />
            <Skeleton className="mt-4 h-1 w-full" />
            <Skeleton className="mt-4 h-2.5 w-full" />
            <Skeleton className="mt-2 h-2.5 w-3/4" />
          </div>
        </aside>
      </div>
    </LoadingRegion>
  );
}
