"use client"

/**
 * Vote Verification Entry Page
 *
 * Allows voters to verify their vote was recorded correctly
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Shield, Info } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getElections } from "@/lib/actions/verify"

export default function VerifyPage() {
  const router = useRouter()
  const [electionId, setElectionId] = useState("")
  const [nullifier, setNullifier] = useState("")
  const [elections, setElections] = useState<
    Array<{ id: string; name: string; status: string }>
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Load elections on mount
  useEffect(() => {
    getElections().then(setElections).catch(console.error)
  }, [])

  const handleVerify = async () => {
    setError("")

    if (!electionId) {
      setError("Please select an election")
      return
    }

    if (!nullifier.trim()) {
      setError("Please enter your confirmation code or nullifier")
      return
    }

    setLoading(true)

    try {
      // Navigate to verification result page
      router.push(`/verify/${electionId}/${encodeURIComponent(nullifier.trim())}`)
    } catch (err) {
      setError("Failed to verify vote. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Verify Your Vote</h1>
            <p className="text-lg text-muted-foreground">
              Check that your vote was recorded correctly in the ledger
            </p>
          </div>

          {/* Main Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Vote Verification</CardTitle>
              <CardDescription>
                Enter your confirmation code or nullifier to verify your vote
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Election Selector */}
              <div className="space-y-2">
                <Label htmlFor="election">Select Election</Label>
                <Select value={electionId} onValueChange={setElectionId}>
                  <SelectTrigger id="election">
                    <SelectValue placeholder="Choose an election..." />
                  </SelectTrigger>
                  <SelectContent>
                    {elections.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No elections available
                      </SelectItem>
                    ) : (
                      elections.map((election) => (
                        <SelectItem key={election.id} value={election.id}>
                          {election.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Nullifier Input */}
              <div className="space-y-2">
                <Label htmlFor="nullifier">Confirmation Code / Nullifier</Label>
                <Input
                  id="nullifier"
                  type="text"
                  placeholder="Enter your confirmation code..."
                  value={nullifier}
                  onChange={(e) => setNullifier(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleVerify()
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  This was provided to you after casting your vote
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                disabled={loading || !electionId || !nullifier.trim()}
                className="w-full"
                size="lg"
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Verifying..." : "Verify My Vote"}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium">How Verification Works:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Enter your confirmation code from when you voted</li>
                    <li>We'll look up your vote in the public ledger</li>
                    <li>You'll see a cryptographic proof (Merkle proof)</li>
                    <li>
                      Anyone can independently verify this proof without trusting
                      us
                    </li>
                  </ol>
                  <p className="font-medium mt-4">Trustless Verification:</p>
                  <p className="text-muted-foreground">
                    The system uses Merkle trees and cryptographic hashing. You
                    don't need to trust this website - you can verify the proofs
                    yourself using any SHA-256 implementation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/integrity")}
              className="w-full"
            >
              View Election Integrity
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/ledger")}
              className="w-full"
            >
              Browse Public Ledger
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
