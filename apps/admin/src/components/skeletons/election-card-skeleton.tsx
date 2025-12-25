import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Loading skeleton for election cards
 * Used in the elections list view while data is being fetched
 */
export function ElectionCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        {/* Election title */}
        <Skeleton className="h-6 w-3/4" />
        {/* Election description */}
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-2/3 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status badge and dates */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {/* Action buttons */}
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
      </CardFooter>
    </Card>
  )
}

/**
 * Loading skeleton for a grid of election cards
 * @param count - Number of skeleton cards to display (default: 6)
 */
export function ElectionCardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ElectionCardSkeleton key={i} />
      ))}
    </div>
  )
}
