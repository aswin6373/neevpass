import { Skeleton, Spinner, VisuallyHidden } from '@neevpass/ui';

/**
 * Default loading state for a route segment.
 *
 * The skeleton mirrors the new page structure: a heading block, a ruled summary
 * band and a list. It is intentionally quiet; a loading screen should not be
 * more decorative than the page it becomes.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-9">
      <div role="status" className="flex items-center gap-2 text-[12px] text-content-muted">
        <Spinner size="sm" label={null} />
        <span>Loading</span>
        <VisuallyHidden>Please wait while this page loads.</VisuallyHidden>
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <Skeleton className="h-3 w-full max-w-xl" />
      </div>

      <div className="grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="border-line py-5 pr-4 not-first:border-l not-first:pl-5">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="mt-2 h-2.5 w-24" />
            <Skeleton className="mt-1.5 h-2 w-32" />
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.85fr)] lg:gap-14">
        <div>
          <Skeleton className="h-3 w-32" />
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center gap-4 border-b border-line py-4">
              <Skeleton className="h-2.5 w-6" />
              <div className="flex-1">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="mt-1.5 h-2 w-56" />
              </div>
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))}
        </div>
        <div>
          <Skeleton className="h-3 w-24" />
          {[0, 1, 2].map((row) => (
            <div key={row} className="border-b border-line py-3.5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="mt-1.5 h-2 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
