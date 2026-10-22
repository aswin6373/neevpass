import { Skeleton } from '@neevpass/ui';

/**
 * Default loading state for routes outside the workspace, such as the landing
 * page and the auth screens. It is deliberately blank: a page that has not
 * arrived yet should not draw attention to itself.
 */
export default function Loading() {
  return (
    <div className="min-h-dvh bg-background px-5 py-12 sm:px-8" role="status" aria-busy="true">
      <span className="sr-only">Loading page</span>
      <div className="mx-auto w-full max-w-[72rem]">
        <Skeleton className="h-2.5 w-20" />
        <div className="mt-8 flex flex-col gap-3">
          <Skeleton className="h-10 w-full max-w-lg" />
          <Skeleton className="h-10 w-3/4 max-w-md" />
        </div>
        <Skeleton className="mt-6 h-2.5 w-full max-w-sm" />
        <Skeleton className="mt-2 h-2.5 w-2/3 max-w-xs" />
      </div>
    </div>
  );
}
