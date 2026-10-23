import { Skeleton } from '@neevpass/ui';

import {
  ButtonSkeleton,
  LoadingRegion,
} from '@/components/loading/skeletons';

/**
 * Resume preview loading state: the document paper on the left and the
 * template controls on the right.
 */
export default function ResumeLoading() {
  return (
    <LoadingRegion label="Loading resume" className="flex flex-col gap-6">
      <Skeleton className="h-2.5 w-16" />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="mt-2 h-2 w-32" />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ButtonSkeleton className="w-24" />
          <ButtonSkeleton className="w-20" />
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-8">
        <div className="order-1 min-w-0">
          <div className="overflow-hidden border border-line bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-2 w-20" />
            </div>

            <div className="bg-surface-sunken p-2 sm:p-4">
              <div className="mx-auto min-h-[480px] max-w-[52rem] border border-line bg-white p-6 sm:min-h-[600px] sm:p-10">
                <Skeleton className="h-6 w-48 max-w-full" />
                <Skeleton className="mt-2 h-2 w-64 max-w-full" />
                <Skeleton className="mt-6 h-px w-full" />

                <div className="mt-8 flex flex-col gap-2.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((line) => (
                    <Skeleton key={line} className="h-2 w-full" />
                  ))}
                  <Skeleton className="h-2 w-4/5" />
                </div>

                <Skeleton className="mt-8 h-2.5 w-24" />
                <div className="mt-3 flex flex-col gap-2">
                  {[0, 1, 2, 3].map((line) => (
                    <Skeleton key={line} className="h-2 w-full" />
                  ))}
                </div>

                <Skeleton className="mt-8 h-2.5 w-28" />
                <div className="mt-3 flex flex-col gap-2">
                  {[0, 1, 2].map((line) => (
                    <Skeleton key={line} className="h-2 w-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="order-2">
          <div className="border border-line bg-surface p-4">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="mt-2 h-2 w-full" />
            <Skeleton className="mt-1.5 h-2 w-3/4" />

            <div className="mt-4 flex flex-col gap-2">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-3 border border-line p-2.5"
                >
                  <Skeleton className="h-10 w-12" />
                  <div>
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="mt-2 h-2 w-full" />
                  </div>
                </div>
              ))}
            </div>

            <Skeleton className="mt-4 h-2 w-20" />
            <Skeleton className="mt-2 h-11 w-20" />

            <Skeleton className="mt-5 h-2.5 w-24" />
            <div className="mt-2">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2.5 border-b border-line-subtle py-2 last:border-b-0"
                >
                  <Skeleton className="h-3.5 w-3.5 shrink-0" />
                  <Skeleton className="h-2 w-32 max-w-full" />
                </div>
              ))}
            </div>

            <Skeleton className="mt-4 ml-auto h-9 w-28" />
          </div>
        </aside>
      </div>
    </LoadingRegion>
  );
}
