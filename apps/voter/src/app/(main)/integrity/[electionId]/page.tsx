"use client"

/**
 * Election Integrity Dashboard
 *
 * Public dashboard showing election integrity metrics
 */

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Shield, BookOpen, BarChart3 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IntegrityCard } from "@/components/verify/integrity-card"
import { getIntegrity, type ElectionIntegrity } from "@/lib/actions/verify"
import { formatDate } from "@/lib/utils"

export default function IntegrityPage() {
  const params = useParams()
  const router = useRouter()
  const electionId = params.electionId as string

  const [data, setData] = useState<ElectionIntegrity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchIntegrity = async () => {
      try {
        const integrity = await getIntegrity(electionId)
        setData(integrity)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchIntegrity()
  }, [electionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading integrity data...</p>
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
                <CardTitle>Error Loading Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 dark:text-red-400 mb-4">
                  {error || "Failed to load integrity data"}
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "complete":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
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

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  {data.election.name}
                </h1>
                <p className="text-lg text-muted-foreground">
                  Election Integrity Dashboard
                </p>
              </div>
              <Badge className={getStatusColor(data.election.status)}>
                {data.election.status}
              </Badge>
            </div>
          </div>

          {/* Election Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Election Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Election ID
                  </div>
                  <div className="font-mono text-sm">{data.election.id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Status
                  </div>
                  <div className="capitalize">{data.election.status}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Start Time
                  </div>
                  <div>{formatDate(data.election.startTime)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    End Time
                  </div>
                  <div>{formatDate(data.election.endTime)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Candidates
                  </div>
                  <div>{data.election.candidateCount}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Total Votes
                  </div>
                  <div className="text-lg font-semibold">
                    {data.integrity.voteCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integrity Card */}
          <div className="mb-6">
            <IntegrityCard
              integrity={data.integrity}
              bitcoinAnchors={data.bitcoinAnchors}
            />
          </div>

          {/* Verification Instructions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>How to Independently Verify</CardTitle>
              <CardDescription>
                Step-by-step instructions for independent auditors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.verification.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </div>
                  <p className="text-sm pt-0.5">{instruction}</p>
                </div>
              ))}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {data.verification.message}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/verify")}
              className="w-full"
            >
              <Shield className="h-4 w-4 mr-2" />
              Verify a Vote
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/ledger/${electionId}`)}
              className="w-full"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              View Ledger
            </Button>
            {data.election.status === "complete" && (
              <Button
                variant="outline"
                onClick={() => router.push(`/results/${electionId}`)}
                className="w-full"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Results
              </Button>
            )}
          </div>

          {/* About Trustless Verification */}
          <Card className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle>Trustless Verification</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                This system is designed so you don't need to trust anyone -
                including us. Here's how:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  All votes are recorded in a public, immutable ledger using
                  Merkle trees
                </li>
                <li>
                  Every voter can verify their vote using cryptographic proofs
                </li>
                <li>
                  The Merkle root is anchored to Bitcoin, creating a permanent
                  record
                </li>
                <li>
                  Anyone can audit the election using standard cryptographic
                  tools
                </li>
                <li>
                  Votes are end-to-end encrypted - even we can't see how you
                  voted
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
