import { Skeleton } from '@neevpass/ui';

import {
  ButtonSkeleton,
  FieldSkeleton,
  LoadingRegion,
} from '@/components/loading/skeletons';

/**
 * Onboarding loading state: the same narrow form column that follows sign-up.
 */
export default function OnboardingLoading() {
  return (
    <LoadingRegion
      label="Loading profile setup"
      className="mx-auto w-full max-w-lg py-2 sm:py-8"
    >
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="mt-2 h-2.5 w-full max-w-sm" />

      <div className="mt-7 border-t border-line pt-6">
        <div className="flex flex-col gap-4">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <div className="flex justify-end">
            <ButtonSkeleton />
          </div>
        </div>
      </div>

      <Skeleton className="mt-6 h-2 w-48 max-w-full" />
    </LoadingRegion>
  );
}
