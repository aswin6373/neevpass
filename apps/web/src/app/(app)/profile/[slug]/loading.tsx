import { Skeleton } from '@neevpass/ui';

import {
  LoadingRegion,
  PageHeadingSkeleton,
} from '@/components/loading/skeletons';

/**
 * Section editor loading state.
 *
 * The editor is a stack of quiet entry cards over a single "add" panel, with
 * the previous/next section controls below.
 */
export default function ProfileSectionLoading() {
  return (
    <LoadingRegion label="Loading profile section" className="flex flex-col gap-7">
      <Skeleton className="h-2.5 w-16" />

      <PageHeadingSkeleton
        titleWidth="w-40"
        descriptionWidth="w-full max-w-lg"
        actionClassName="h-2 w-14"
      />

      <div className="flex flex-col gap-2">
        {[0, 1].map((item) => (
          <div key={item} className="bg-surface px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-48 max-w-full" />
                <Skeleton className="mt-2 h-2 w-32 max-w-full" />
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Skeleton className="h-2 w-12" />
                <Skeleton className="h-8 w-14" />
              </div>
            </div>
          </div>
        ))}

        <div className="mt-5 bg-surface px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </LoadingRegion>
  );
}
