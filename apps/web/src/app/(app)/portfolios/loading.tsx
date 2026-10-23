import { Skeleton } from '@neevpass/ui';

import {
  LoadingRegion,
  PageHeadingSkeleton,
  SectionHeadingSkeleton,
} from '@/components/loading/skeletons';

/**
 * Portfolio studio loading state: address and figures, then the live preview
 * and its controls.
 */
export default function PortfoliosLoading() {
  return (
    <LoadingRegion label="Loading portfolio studio" className="flex flex-col gap-9">
      <PageHeadingSkeleton
        titleWidth="w-36"
        descriptionWidth="w-full max-w-lg"
        action
      />

      <section aria-label="Portfolio address and figures" className="border-y border-line">
        <div className="flex flex-col gap-6 py-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-2 w-20" />
            <Skeleton className="mt-2 h-7 w-56 max-w-full" />
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-6 sm:gap-10">
            {[0, 1, 2].map((item) => (
              <div key={item}>
                <Skeleton className="h-2 w-12" />
                <Skeleton className="mt-2 h-5 w-10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Design and publish">
        <SectionHeadingSkeleton titleWidth="w-28" meta />

        <div className="mt-4 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-8">
          <div className="order-1 min-w-0">
            <div className="overflow-hidden border border-line bg-surface">
              <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-2 w-20" />
              </div>

              <div className="bg-surface-sunken p-2 sm:p-4">
                <div className="mx-auto min-h-[520px] border border-line bg-white p-6 sm:min-h-[620px] sm:p-10">
                  <Skeleton className="h-7 w-48 max-w-full" />
                  <Skeleton className="mt-2 h-2 w-64 max-w-full" />
                  <Skeleton className="mt-6 h-px w-full" />
                  <div className="mt-8 flex flex-col gap-2.5">
                    {[0, 1, 2, 3, 4, 5].map((line) => (
                      <Skeleton key={line} className="h-2 w-full" />
                    ))}
                  </div>
                  <Skeleton className="mt-8 h-2.5 w-24" />
                  <div className="mt-3 flex flex-col gap-2">
                    {[0, 1, 2, 3].map((line) => (
                      <Skeleton key={line} className="h-2 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="order-2 min-w-0">
            <div className="flex flex-col gap-6">
              <div>
                <Skeleton className="h-2.5 w-20" />
                <div className="mt-2 border-t border-line">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="flex items-start gap-3 border-b border-line px-1 py-3">
                      <Skeleton className="h-10 w-12 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-2.5 w-24" />
                        <Skeleton className="mt-2 h-2 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="flex flex-col gap-1.5">
                    <Skeleton className="h-2 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>

              <div className="border-y border-line py-3">
                <Skeleton className="h-4 w-4" />
              </div>

              <div>
                <Skeleton className="h-2.5 w-24" />
                <div className="mt-2 border-t border-line-subtle">
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
              </div>

              <Skeleton className="ml-auto h-9 w-28" />
            </div>
          </aside>
        </div>
      </section>
    </LoadingRegion>
  );
}
