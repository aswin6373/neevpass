import { Skeleton } from '@neevpass/ui';

import {
  ButtonSkeleton,
  ListRowsSkeleton,
  LoadingRegion,
  SectionHeadingSkeleton,
} from '@/components/loading/skeletons';

/**
 * Overview loading state: the greeting, one row of figures, then the two
 * content columns. It matches the dashboard's ledger layout so the page does
 * not jump when the data arrives.
 */
export default function DashboardLoading() {
  return (
    <LoadingRegion label="Loading overview" className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="mt-2 h-2.5 w-full max-w-md" />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">
          <ButtonSkeleton className="w-24" />
          <ButtonSkeleton className="w-24" />
        </div>
      </header>

      <section aria-label="Profile summary" className="border-y border-line">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className={
                item === 0
                  ? 'py-5 pr-4'
                  : 'border-l border-line py-5 pl-4 pr-4 sm:pl-6'
              }
            >
              <Skeleton className="h-2 w-16" />
              <Skeleton className="mt-3 h-7 w-12" />
              {item === 0 ? <Skeleton className="mt-3 h-px w-full max-w-[8rem]" /> : null}
            </div>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-16">
        <section>
          <SectionHeadingSkeleton titleWidth="w-24" />
          <ListRowsSkeleton rows={5} />
        </section>

        <section>
          <SectionHeadingSkeleton titleWidth="w-20" />
          <ListRowsSkeleton rows={3} numbered={false} />
        </section>
      </div>
    </LoadingRegion>
  );
}
