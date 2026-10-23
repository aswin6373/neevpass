import { Skeleton } from '@neevpass/ui';

import {
  ButtonSkeleton,
  FieldSkeleton,
  LoadingRegion,
} from '@/components/loading/skeletons';

/**
 * Loading state for the sign-in and sign-up cards.
 *
 * The auth layout already supplies the masthead, the centred column and the
 * footer; this only outlines the form that is being fetched.
 */
export default function AuthLoading() {
  return (
    <LoadingRegion label="Loading account form" className="flex flex-col">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 h-2.5 w-full max-w-[19rem]" />

      <div className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="flex items-center gap-3">
          <Skeleton className="h-px flex-1" />
          <Skeleton className="h-2 w-4" />
          <Skeleton className="h-px flex-1" />
        </div>

        <div className="flex flex-col gap-4">
          <FieldSkeleton />
          <FieldSkeleton />
          <ButtonSkeleton className="w-full" />
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-4">
        <Skeleton className="h-2.5 w-56 max-w-full" />
      </div>
    </LoadingRegion>
  );
}
