import { Skeleton, Spinner, VisuallyHidden } from '@neevpass/ui';

/**
 * Default loading state for a route segment.
 *
 * Next renders this instantly while the segment's server component streams in,
 * which is what makes navigation feel immediate rather than stalled.
 *
 * The announcement matters: a sighted user sees the skeleton and understands
 * something is loading, but a screen reader user gets nothing unless we say so.
 * The `role="status"` region says it exactly once.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div role="status" className="flex items-center gap-2 text-sm text-content-secondary">
        <Spinner size="sm" label={null} />
        <span>Loading…</span>
        <VisuallyHidden>Please wait while this page loads.</VisuallyHidden>
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton shape="block" className="h-36" />
        <Skeleton shape="block" className="h-36" />
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}
