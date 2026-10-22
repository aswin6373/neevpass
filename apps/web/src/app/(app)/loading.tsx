import { Skeleton } from '@neevpass/ui';

/**
 * Route-level skeleton for the workspace.
 *
 * The shell (sidebar, mobile header) is already on screen; this only mirrors
 * the content column. No spinner and no visible "Loading" label — the shapes
 * say it, and a screen reader gets one quiet status.
 */
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-10" role="status" aria-busy="true">
      <span className="sr-only">Loading page</span>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-2.5 w-full max-w-md" />
      </div>

      <div className="grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className={item === 0 ? 'py-5 pr-4' : 'border-l border-line py-5 pl-4 pr-4 sm:pl-6'}
          >
            <Skeleton className="h-2 w-16" />
            <Skeleton className="mt-3 h-7 w-12" />
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <Skeleton className="h-2.5 w-24" />
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-baseline gap-4 border-b border-line py-3.5">
              <Skeleton className="h-2 w-5" />
              <Skeleton className="h-2.5 w-40" />
              <Skeleton className="ml-auto h-2 w-14" />
            </div>
          ))}
        </div>
        <div>
          <Skeleton className="h-2.5 w-20" />
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-baseline justify-between gap-4 border-b border-line py-3.5">
              <Skeleton className="h-2.5 w-36" />
              <Skeleton className="h-2 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
