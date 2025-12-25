"use client"

/**
 * Public Ledger Explorer
 *
 * Browse all votes in the election ledger
 */

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Download, Shield, Info } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VoteTable } from "@/components/ledger/vote-table"
import { getLedgerExport, type LedgerExport } from "@/lib/actions/verify"

export default function LedgerPage() {
  const params = useParams()
  const router = useRouter()
  const electionId = params.electionId as string

  const [data, setData] = useState<LedgerExport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const ledger = await getLedgerExport(electionId)
        setData(ledger)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ledger")
      } finally {
        setLoading(false)
      }
    }

    fetchLedger()
  }, [electionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading ledger...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle>Error Loading Ledger</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 dark:text-red-400 mb-4">
                  {error || "Failed to load ledger"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  The ledger export is only available after voting has ended.
                </p>
                <Button onClick={() => router.push("/verify")} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Verification
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/verify")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <h1 className="text-4xl font-bold">Public Ledger</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  {data.electionName}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Votes</div>
                <div className="text-3xl font-bold">{data.voteCount.toLocaleString()}</div>
              </div>
            </div>

            {/* Info Banner */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">About This Ledger:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>
                        This is the complete public record of all votes cast in
                        this election
                      </li>
                      <li>
                        Each entry shows the position, cryptographic commitment,
                        nullifier, and timestamp
                      </li>
                      <li>
                        Votes are encrypted - this ledger doesn't reveal how
                        anyone voted
                      </li>
                      <li>
                        Anyone can verify vote inclusion using Merkle proofs
                      </li>
                      <li>
                        The Merkle root cryptographically commits to all entries
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ledger Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vote Entries</CardTitle>
                  <CardDescription>
                    Searchable, exportable record of all votes
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {data.voteCount} {data.voteCount === 1 ? "vote" : "votes"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <VoteTable
                votes={data.votes}
                electionName={data.electionName}
                merkleRoot={data.merkleRoot}
              />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/integrity/${electionId}`)}
              className="w-full"
            >
              <Shield className="h-4 w-4 mr-2" />
              View Election Integrity
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/verify")}
              className="w-full"
            >
              Verify a Vote
            </Button>
          </div>

          {/* Auditing Info */}
          <Card className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <CardTitle>For Auditors</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                This ledger is designed for independent auditing and
                verification:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  Export the full ledger as CSV using the "Export CSV" button
                  above
                </li>
                <li>
                  Verify the Merkle root matches published anchors (Bitcoin,
                  etc.)
                </li>
                <li>
                  Reconstruct the Merkle tree from the vote commitments
                </li>
                <li>
                  Validate individual vote proofs using standard SHA-256 tools
                </li>
                <li>
                  Cross-reference vote counts with published election results
                </li>
              </ul>
              <div className="pt-3 border-t border-purple-200 dark:border-purple-800">
                <p className="font-medium">Merkle Root:</p>
                <code className="block mt-1 p-2 bg-white dark:bg-gray-800 rounded text-xs break-all">
                  {data.merkleRoot}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
