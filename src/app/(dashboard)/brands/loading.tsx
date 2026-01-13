import { PageHeaderSkeleton, CardSkeleton } from "@/components/loading";

/**
 * Loading state for the Brands page.
 * Displays skeleton UI during data fetching.
 */
export default function BrandsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
