import {
  ListRowsSkeleton,
  LoadingRegion,
  PageHeadingSkeleton,
  SectionHeadingSkeleton,
} from '@/components/loading/skeletons';

/**
 * Route-level skeleton for the workspace.
 *
 * The shell (sidebar, mobile header) is already on screen; this only mirrors
 * the content column. Individual routes provide a closer match where their
 * layout differs, and this acts as the quiet fallback for anything new.
 */
export default function AppLoading() {
  return (
    <LoadingRegion label="Loading page" className="flex flex-col gap-9">
      <PageHeadingSkeleton />

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-16">
        <section>
          <SectionHeadingSkeleton />
          <ListRowsSkeleton rows={4} />
        </section>
        <section>
          <SectionHeadingSkeleton titleWidth="w-20" />
          <ListRowsSkeleton rows={3} numbered={false} />
        </section>
      </div>
    </LoadingRegion>
  );
}
