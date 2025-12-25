import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Loading skeleton for a single stats card
 * Used in the dashboard to show loading state for metrics
 */
export function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {/* Card title */}
        <Skeleton className="h-4 w-24" />
        {/* Icon */}
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        {/* Main stat value */}
        <Skeleton className="h-8 w-16 mb-2" />
        {/* Description/change text */}
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

/**
 * Loading skeleton for a row of stats cards
 * @param count - Number of stats cards to display (default: 4)
 */
export function StatsRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Loading skeleton for dashboard overview with multiple stats sections
 */
export function DashboardStatsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Primary stats row */}
      <StatsRowSkeleton count={4} />

      {/* Secondary stats or charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
