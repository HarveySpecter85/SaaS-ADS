import { PageHeaderSkeleton, FilterBarSkeleton, ImageGridSkeleton } from "@/components/loading";

/**
 * Loading state for the Gallery page.
 * Displays skeleton UI during data fetching.
 */
export default function GalleryLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      <FilterBarSkeleton />

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <ImageGridSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
