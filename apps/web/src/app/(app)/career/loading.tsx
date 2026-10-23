import { Skeleton } from '@neevpass/ui';

import {
  ButtonSkeleton,
  FieldSkeleton,
  LoadingRegion,
  PageHeadingSkeleton,
  SectionHeadingSkeleton,
} from '@/components/loading/skeletons';

/**
 * Career loading state: the score report, the goal form and the opening skill
 * gap columns.
 */
export default function CareerLoading() {
  return (
    <LoadingRegion label="Loading career report" className="flex flex-col gap-10">
      <PageHeadingSkeleton
        titleWidth="w-32"
        descriptionWidth="w-full max-w-xl"
        action={false}
      />

      <section className="grid gap-8 border-b border-line pb-9 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <div>
          <Skeleton className="h-2 w-12" />
          <Skeleton className="mt-2 h-16 w-36" />
          <Skeleton className="mt-3 h-2.5 w-full max-w-[15rem]" />
          <Skeleton className="mt-2 h-2.5 w-4/5 max-w-[12rem]" />
          <ButtonSkeleton className="mt-4" />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
            <Skeleton className="h-2 w-12" />
            <Skeleton className="h-2 w-10" />
          </div>

          <div>
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="border-b border-line py-3">
                <div className="flex items-baseline justify-between gap-4">
                  <Skeleton className="h-2.5 w-40 max-w-full" />
                  <Skeleton className="h-2 w-12 shrink-0" />
                </div>
                <Skeleton className="mt-2 h-px w-full" />
                <Skeleton className="mt-2 h-2 w-full max-w-xl" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-b border-line pb-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <Skeleton className="h-2 w-16" />
          <Skeleton className="mt-3 h-8 w-52 max-w-full" />
          <Skeleton className="mt-2 h-2.5 w-full max-w-md" />
          <Skeleton className="mt-2 h-2.5 w-4/5 max-w-sm" />

          <div className="mt-6 grid grid-cols-3 border-y border-line">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className={item === 0 ? 'py-3 pr-3' : 'border-l border-line py-3 pl-4'}
              >
                <Skeleton className="h-2 w-12" />
                <Skeleton className="mt-2 h-5 w-10" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <Skeleton className="h-2.5 w-20" />
          <div className="mt-4 flex flex-col gap-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <div className="flex justify-end">
              <ButtonSkeleton />
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeadingSkeleton titleWidth="w-20" />
        <div className="grid gap-0 md:grid-cols-3">
          {[0, 1, 2].map((column) => (
            <div
              key={column}
              className="border-b border-line py-4 md:border-b-0 md:border-r md:pr-5 md:last:border-r-0 md:last:pr-0 md:[&:not(:first-child)]:pl-5"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-1 w-1" />
                <Skeleton className="h-2 w-16" />
                <Skeleton className="ml-auto h-2 w-4" />
              </div>
              {[0, 1, 2].map((row) => (
                <div key={row} className="mt-2 flex items-center justify-between gap-3">
                  <Skeleton className="h-2 w-28 max-w-full" />
                  <Skeleton className="h-2 w-8 shrink-0" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </LoadingRegion>
  );
}
