import { Skeleton } from '@neevpass/ui';

import {
  ButtonSkeleton,
  FieldSkeleton,
  ListRowsSkeleton,
  LoadingRegion,
  PageHeadingSkeleton,
  SectionHeadingSkeleton,
} from '@/components/loading/skeletons';

/**
 * Resume list loading state: the create form strip, then the ledger of
 * documents.
 */
export default function ResumesLoading() {
  return (
    <LoadingRegion label="Loading resumes" className="flex flex-col gap-9">
      <PageHeadingSkeleton
        titleWidth="w-36"
        descriptionWidth="w-full max-w-lg"
        action={false}
      />

      <section aria-label="New resume" className="border-y border-line py-5">
        <Skeleton className="mb-3 h-2.5 w-20" />
        <div className="flex flex-wrap items-end gap-3">
          <FieldSkeleton className="min-w-64 flex-1 sm:max-w-sm" />
          <ButtonSkeleton />
        </div>
      </section>

      <section aria-label="Documents">
        <SectionHeadingSkeleton titleWidth="w-24" />
        <ListRowsSkeleton rows={4} />
      </section>
    </LoadingRegion>
  );
}
