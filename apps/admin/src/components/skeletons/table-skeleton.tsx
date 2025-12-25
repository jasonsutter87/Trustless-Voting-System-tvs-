import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Props for TableSkeleton component
 */
interface TableSkeletonProps {
  /** Number of rows to display */
  rows?: number
  /** Number of columns to display */
  columns?: number
  /** Show table header with skeleton column names */
  showHeader?: boolean
  /** Show actions column (checkbox/buttons) */
  showActions?: boolean
}

/**
 * Loading skeleton for data tables
 * Used for voter lists, trustee lists, and other tabular data
 *
 * @example
 * ```tsx
 * <TableSkeleton rows={5} columns={4} showHeader showActions />
 * ```
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  showActions = false,
}: TableSkeletonProps) {
  const totalColumns = showActions ? columns + 1 : columns

  return (
    <div className="rounded-md border">
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {showActions && (
                <TableHead className="w-12">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
              )}
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {showActions && (
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
              )}
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * Loading skeleton for a table with search and filters
 * Includes toolbar area above the table
 */
export function TableWithToolbarSkeleton({
  rows = 5,
  columns = 4,
  showActions = true,
}: Omit<TableSkeletonProps, "showHeader">) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Search input */}
          <Skeleton className="h-10 w-64" />
          {/* Filter button */}
          <Skeleton className="h-10 w-24" />
        </div>
        {/* Action button */}
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table */}
      <TableSkeleton
        rows={rows}
        columns={columns}
        showHeader
        showActions={showActions}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  )
}

/**
 * Loading skeleton for voter table specifically
 * Includes voter-specific column widths and layout
 */
export function VoterTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead><Skeleton className="h-4 w-32" /></TableHead>
              <TableHead><Skeleton className="h-4 w-48" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-32" /></TableHead>
              <TableHead className="w-12"><Skeleton className="h-4 w-4" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  )
}

/**
 * Loading skeleton for trustee table specifically
 * Includes trustee-specific column widths and layout
 */
export function TrusteeTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Skeleton className="h-4 w-32" /></TableHead>
            <TableHead><Skeleton className="h-4 w-48" /></TableHead>
            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead><Skeleton className="h-4 w-32" /></TableHead>
            <TableHead className="w-12"><Skeleton className="h-4 w-4" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
              <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
