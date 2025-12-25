"use client"

/**
 * Election Results Page
 *
 * Shows tallied results after election is complete
 */

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Trophy,
  Shield,
  BookOpen,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ResultsSummary } from "@/components/results/result-bar"
import { getResults, type ElectionResults } from "@/lib/actions/verify"

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const electionId = params.electionId as string

  const [results, setResults] = useState<ElectionResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await getResults(electionId)
        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load results")
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [electionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                  <CardTitle>Results Not Available</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-800 dark:text-yellow-200 mb-4">
                  {error || "Election results are not yet available"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Results are only shown after the election has been completed
                  and tallied.
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

  const isComplete = results.status === "complete"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
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

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-2">Election Results</h1>
              <p className="text-lg text-muted-foreground">
                {results.electionName}
              </p>
            </div>

            {/* Status Banner */}
            <Card
              className={
                isComplete
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
              }
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {isComplete ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-semibold text-green-800 dark:text-green-400">
                          Election Complete
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Results have been tallied and verified
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <p className="font-semibold text-yellow-800 dark:text-yellow-400">
                          Tallying in Progress
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          These results are preliminary and may change
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Summary */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vote Tallies</CardTitle>
                  <CardDescription>
                    Decrypted and tallied election results
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Votes</div>
                  <div className="text-2xl font-bold">
                    {results.totalVotes.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResultsSummary
                results={results.results}
                totalVotes={results.totalVotes}
                winner={results.winner}
              />
            </CardContent>
          </Card>

          {/* Verification Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
              onClick={() => router.push(`/ledger/${electionId}`)}
              className="w-full"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              View Vote Ledger
            </Button>
          </div>

          {/* How Tallying Works */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle>How Vote Tallying Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                The Trustless Voting System uses end-to-end encryption and
                threshold decryption to protect voter privacy while ensuring
                accurate results:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">
                    Votes are encrypted:
                  </strong>{" "}
                  When you cast your vote, it's encrypted using the election's
                  public key. Nobody can see how you voted.
                </li>
                <li>
                  <strong className="text-foreground">
                    Recorded in ledger:
                  </strong>{" "}
                  Your encrypted vote is recorded in a public, tamper-proof
                  ledger with a Merkle proof.
                </li>
                <li>
                  <strong className="text-foreground">
                    Election closes:
                  </strong>{" "}
                  After the voting period ends, the ledger is sealed and
                  anchored to Bitcoin.
                </li>
                <li>
                  <strong className="text-foreground">
                    Trustees decrypt:
                  </strong>{" "}
                  Multiple trustees combine their key shares to decrypt the
                  votes (threshold cryptography).
                </li>
                <li>
                  <strong className="text-foreground">Results tallied:</strong>{" "}
                  Decrypted votes are counted and results are published with
                  cryptographic proofs.
                </li>
              </ol>

              <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
                <p className="font-medium mb-2">Trustless Guarantees:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>
                    Every voter can verify their vote was counted correctly
                  </li>
                  <li>
                    The ledger is public and independently auditable
                  </li>
                  <li>
                    Multiple trustees are required to decrypt (no single point
                    of trust)
                  </li>
                  <li>
                    The Merkle root is anchored to Bitcoin for immutability
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Winner Announcement */}
          {results.winner && isComplete && (
            <Card className="mt-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Trophy className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">
                    Congratulations to {results.winner.candidateName}!
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Winner with {results.winner.votes.toLocaleString()} votes (
                    {((results.winner.votes / results.totalVotes) * 100).toFixed(1)}
                    %)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
