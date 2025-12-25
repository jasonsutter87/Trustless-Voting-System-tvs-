import { Skeleton } from "@/components/ui/skeleton"
import { ElectionCardsGridSkeleton } from "@/components/skeletons/election-card-skeleton"

/**
 * Loading state for elections list page
 * Displayed while elections data is being fetched
 */
export default function ElectionsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <div className="ml-auto">
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>

      {/* Election Cards Grid */}
      <ElectionCardsGridSkeleton count={6} />

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 pt-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  )
}
