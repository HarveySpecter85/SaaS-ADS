/**
 * Loading skeleton components for visual feedback during data fetching.
 * Uses Tailwind's animate-pulse with consistent slate palette.
 */

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton element with pulse animation.
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Card skeleton for list items (brands, products, campaigns).
 */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      {/* Image placeholder */}
      <Skeleton className="h-40 w-full rounded-md" />
      {/* Title */}
      <Skeleton className="h-5 w-3/4" />
      {/* Subtitle/metadata */}
      <Skeleton className="h-4 w-1/2" />
      {/* Additional info */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Table row skeleton for list views.
 */
export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 px-4 border-b border-slate-100">
      {/* Icon/avatar */}
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      {/* Primary text */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      {/* Secondary columns */}
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
      {/* Actions */}
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  );
}

/**
 * Page header skeleton with title and action button.
 */
export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      {/* Title */}
      <Skeleton className="h-8 w-32" />
      {/* Action button */}
      <Skeleton className="h-10 w-28 rounded-md" />
    </div>
  );
}

/**
 * Stats card skeleton for dashboard metrics.
 */
export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
      {/* Label */}
      <Skeleton className="h-4 w-24" />
      {/* Value */}
      <Skeleton className="h-8 w-16" />
      {/* Trend indicator */}
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/**
 * Filter bar skeleton for gallery and list pages.
 */
export function FilterBarSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-64 rounded-md" />
      <Skeleton className="h-10 w-32 rounded-md" />
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
  );
}

/**
 * Image grid item skeleton for gallery views.
 */
export function ImageGridSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      <Skeleton className="aspect-square w-full rounded-md" />
    </div>
  );
}
