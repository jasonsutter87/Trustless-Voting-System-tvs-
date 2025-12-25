"use client"

/**
 * Vote Verification Result Page
 *
 * Displays the verification result and Merkle proof
 */

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { CheckCircle, XCircle, ArrowLeft, Shield, Download } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProofTree } from "@/components/verify/proof-tree"
import { verifyVote, type VoteVerificationResult } from "@/lib/actions/verify"
import {
  verifyMerkleProof,
  type VerificationResult,
} from "@/lib/merkle-verify"
import { formatTimestamp, truncateHash } from "@/lib/utils"

export default function VerificationResultPage() {
  const params = useParams()
  const router = useRouter()
  const electionId = params.electionId as string
  const nullifier = decodeURIComponent(params.nullifier as string)

  const [result, setResult] = useState<VoteVerificationResult | null>(null)
  const [verification, setVerification] = useState<VerificationResult | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const data = await verifyVote(electionId, nullifier)
        setResult(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify vote")
      } finally {
        setLoading(false)
      }
    }

    fetchVerification()
  }, [electionId, nullifier])

  const handleVerifyProof = async () => {
    if (!result?.merkleProof) return

    setVerifying(true)
    try {
      const verificationResult = await verifyMerkleProof(result.merkleProof)
      setVerification(verificationResult)
    } catch (err) {
      setError("Failed to verify proof locally")
    } finally {
      setVerifying(false)
    }
  }

  const handleDownloadProof = () => {
    if (!result?.merkleProof) return

    const data = {
      electionId,
      nullifier,
      verification: result,
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vote-verification-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your vote...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <XCircle className="h-6 w-6 text-red-600" />
                  <CardTitle>Verification Failed</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button onClick={() => router.push("/verify")} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Try Again
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
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push("/verify")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Verification
          </Button>

          {/* Result Header */}
          <div className="text-center mb-8">
            {result?.exists ? (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-4xl font-bold mb-2 text-green-800 dark:text-green-400">
                  Vote Found!
                </h1>
                <p className="text-lg text-muted-foreground">
                  Your vote is recorded in the ledger
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-4xl font-bold mb-2 text-red-800 dark:text-red-400">
                  Vote Not Found
                </h1>
                <p className="text-lg text-muted-foreground">
                  No vote found with this confirmation code
                </p>
              </>
            )}
          </div>

          {!result?.exists && (
            <Card className="mb-6 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
              <CardContent className="pt-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  If you believe you voted, please check:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-800 dark:text-yellow-200 mt-2 space-y-1">
                  <li>You selected the correct election</li>
                  <li>You entered the confirmation code exactly as shown</li>
                  <li>Your vote was successfully submitted</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {result?.exists && (
            <div className="space-y-6">
              {/* Vote Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Vote Details</CardTitle>
                  <CardDescription>
                    Cryptographic verification of your vote
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Position in Ledger
                      </div>
                      <div className="font-mono text-lg font-semibold">
                        #{result.position}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Timestamp
                      </div>
                      <div className="text-lg">
                        {formatTimestamp(result.timestamp)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Commitment Hash
                    </div>
                    <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 font-mono text-sm break-all">
                      {result.commitment}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This cryptographic commitment proves your vote is in the
                      ledger without revealing how you voted
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleVerifyProof}
                      disabled={verifying}
                      className="flex-1"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {verifying ? "Verifying..." : "Verify Proof Locally"}
                    </Button>
                    <Button
                      onClick={handleDownloadProof}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Merkle Proof */}
              {result.merkleProof && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cryptographic Proof</CardTitle>
                    <CardDescription>
                      Merkle proof showing your vote is included in the tree
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProofTree
                      proof={result.merkleProof}
                      steps={verification?.steps}
                      valid={verification?.valid}
                    />

                    {verification && (
                      <div className="mt-6">
                        <div
                          className={`rounded-lg p-4 ${
                            verification.valid
                              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400"
                          }`}
                        >
                          <p className="font-medium mb-2">Verification Result:</p>
                          <p className="text-sm">{verification.explanation}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Info */}
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <p className="font-medium mb-2">What This Means:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>
                      Your vote is cryptographically proven to be in the ledger
                    </li>
                    <li>
                      The Merkle proof can be independently verified by anyone
                    </li>
                    <li>
                      No one can see how you voted (end-to-end encryption)
                    </li>
                    <li>The ledger is tamper-proof and publicly auditable</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/integrity/${electionId}`)}
                  className="w-full"
                >
                  View Election Integrity
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/ledger/${electionId}`)}
                  className="w-full"
                >
                  Browse Full Ledger
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
