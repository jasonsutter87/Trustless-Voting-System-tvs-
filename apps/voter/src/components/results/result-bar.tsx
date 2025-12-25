"use client"

/**
 * Result Bar Chart
 *
 * Displays election results as horizontal bars
 */

import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface ResultBarProps {
  candidateName: string
  votes: number
  percentage: number
  totalVotes: number
  isWinner?: boolean
}

export function ResultBar({
  candidateName,
  votes,
  percentage,
  totalVotes,
  isWinner = false,
}: ResultBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
          <span className="font-medium">{candidateName}</span>
          {isWinner && (
            <Badge variant="default" className="bg-yellow-500">
              Winner
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {votes.toLocaleString()} votes
          </span>
          <span className="font-semibold text-lg min-w-[60px] text-right">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Bar */}
      <div className="relative h-8 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            isWinner
              ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
              : "bg-gradient-to-r from-blue-400 to-blue-500"
          )}
          style={{ width: `${percentage}%` }}
        >
          <div className="h-full w-full bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        {/* Percentage label inside bar if wide enough */}
        {percentage > 15 && (
          <div className="absolute inset-0 flex items-center px-3">
            <span className="text-sm font-medium text-white drop-shadow">
              {percentage.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

interface ResultsSummaryProps {
  results: Array<{
    candidateId: string
    candidateName: string
    votes: number
    percentage: number
  }>
  totalVotes: number
  winner?: {
    candidateId: string
    candidateName: string
    votes: number
  }
}

export function ResultsSummary({
  results,
  totalVotes,
  winner,
}: ResultsSummaryProps) {
  // Sort by votes descending
  const sortedResults = [...results].sort((a, b) => b.votes - a.votes)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Results</h3>
        <div className="text-sm text-muted-foreground">
          Total: {totalVotes.toLocaleString()} votes
        </div>
      </div>

      <div className="space-y-4">
        {sortedResults.map((result) => (
          <ResultBar
            key={result.candidateId}
            candidateName={result.candidateName}
            votes={result.votes}
            percentage={result.percentage}
            totalVotes={totalVotes}
            isWinner={winner?.candidateId === result.candidateId}
          />
        ))}
      </div>

      {winner && (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            <p className="font-semibold text-yellow-900 dark:text-yellow-100">
              Winner: {winner.candidateName}
            </p>
          </div>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {winner.votes.toLocaleString()} votes (
            {((winner.votes / totalVotes) * 100).toFixed(1)}%)
          </p>
        </div>
      )}
    </div>
  )
}
