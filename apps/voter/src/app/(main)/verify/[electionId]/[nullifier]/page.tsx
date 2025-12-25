"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Shield,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  Home,
  Copy,
  Check,
  BookOpen,
  BarChart3,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { ProofTree } from "@/components/verify/proof-tree";
import { verifyVote, type VoteVerificationResult } from "@/lib/actions/verify";
import {
  verifyMerkleProof,
  type VerificationResult,
} from "@/lib/merkle-verify";
import { formatTimestamp, copyToClipboard } from "@/lib/utils";

export default function VerificationResultPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.electionId as string;
  const nullifier = decodeURIComponent(params.nullifier as string);

  const [result, setResult] = useState<VoteVerificationResult | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [copiedCommitment, setCopiedCommitment] = useState(false);

  const fetchVerification = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await verifyVote(electionId, nullifier);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify vote");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerification();
  }, [electionId, nullifier]);

  const handleVerifyProof = async () => {
    if (!result?.merkleProof) return;

    setVerifying(true);
    try {
      const verificationResult = await verifyMerkleProof(result.merkleProof);
      setVerification(verificationResult);
    } catch (err) {
      setError("Failed to verify proof locally");
    } finally {
      setVerifying(false);
    }
  };

  const handleDownloadProof = () => {
    if (!result?.merkleProof) return;

    const data = {
      electionId,
      nullifier,
      verification: result,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vote-verification-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCommitment = async () => {
    if (!result?.commitment) return;
    const success = await copyToClipboard(result.commitment);
    if (success) {
      setCopiedCommitment(true);
      setTimeout(() => setCopiedCommitment(false), 2000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center space-y-4" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" aria-hidden="true" />
          <p className="text-muted-foreground">Verifying your vote...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
              Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground" role="alert">{error}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={fetchVerification} variant="outline" className="flex-1" aria-label="Try verification again">
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Try Again
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/verify" aria-label="Go back to verification form">
                  <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  Back to Verify
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back Link */}
        <Button variant="ghost" asChild className="-ml-2">
          <Link href="/verify" aria-label="Go back to verification form">
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Back to Verification
          </Link>
        </Button>

        {/* Result Header */}
        <div className="text-center space-y-4" role="status" aria-live="polite">
          {result?.exists ? (
            <>
              <div className="inline-flex items-center justify-center rounded-full bg-green-100 p-4 dark:bg-green-900" aria-hidden="true">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Vote Found!
              </h1>
              <p className="text-lg text-muted-foreground">
                Your vote is recorded in the ledger
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center rounded-full bg-red-100 p-4 dark:bg-red-900" aria-hidden="true">
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Vote Not Found
              </h1>
              <p className="text-lg text-muted-foreground">
                No vote found with this confirmation code
              </p>
            </>
          )}
        </div>

        {/* Not Found Help */}
        {!result?.exists && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <div className="text-sm">
                  <h2 className="mb-2 font-medium">If you believe you voted, please check:</h2>
                  <ul className="space-y-1 text-muted-foreground" role="list">
                    <li>You selected the correct election</li>
                    <li>You entered the confirmation code exactly as shown</li>
                    <li>Your vote was successfully submitted</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vote Found Content */}
        {result?.exists && (
          <>
            {/* Vote Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" aria-hidden="true" />
                  Vote Details
                </CardTitle>
                <CardDescription>
                  Cryptographic verification of your vote
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      Position in Ledger
                    </div>
                    <div className="font-mono text-2xl font-bold" aria-label={`Position number ${result.position}`}>
                      #{result.position}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      Timestamp
                    </div>
                    <div className="text-lg font-medium">
                      {formatTimestamp(result.timestamp)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" id="commitment-label">Commitment Hash</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyCommitment}
                      className="h-8"
                      aria-label={copiedCommitment ? "Copied to clipboard" : "Copy commitment hash to clipboard"}
                    >
                      {copiedCommitment ? (
                        <>
                          <Check className="mr-1 h-3 w-3" aria-hidden="true" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3 w-3" aria-hidden="true" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="rounded-md bg-zinc-100 p-3 font-mono text-xs break-all dark:bg-zinc-800" aria-labelledby="commitment-label">
                    {result.commitment}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This cryptographic commitment proves your vote is in the
                    ledger without revealing how you voted
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={handleVerifyProof}
                    disabled={verifying}
                    className="flex-1"
                    aria-label={verifying ? "Verifying proof locally" : "Verify proof locally"}
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
                        Verify Proof Locally
                      </>
                    )}
                  </Button>
                  <Button onClick={handleDownloadProof} variant="outline" aria-label="Download verification proof">
                    <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                    Download Proof
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
                    <div
                      role="status"
                      aria-live="polite"
                      className={`mt-6 rounded-lg p-4 ${
                        verification.valid
                          ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {verification.valid ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
                        ) : (
                          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                        )}
                        <div>
                          <p className="font-medium mb-1">
                            {verification.valid ? "Proof Valid" : "Proof Invalid"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {verification.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* What This Means */}
            <Card className="bg-zinc-50 dark:bg-zinc-900">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <div className="space-y-3 text-sm">
                    <h2 className="font-medium">What This Means:</h2>
                    <ul className="space-y-2 text-muted-foreground" role="list">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                        Your vote is cryptographically proven to be in the ledger
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                        The Merkle proof can be independently verified by anyone
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                        No one can see how you voted (end-to-end encryption)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                        The ledger is tamper-proof and publicly auditable
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <nav aria-label="Quick navigation">
              <VisuallyHidden>
                <h2>Additional features</h2>
              </VisuallyHidden>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <Link href={`/ledger/${electionId}`} className="block" aria-label="Browse ledger - View all recorded votes">
                    <CardContent className="flex items-center gap-4 pt-6">
                      <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900" aria-hidden="true">
                        <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Browse Ledger</h3>
                        <p className="text-sm text-muted-foreground">
                          View all recorded votes
                        </p>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
                <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <Link href={`/results/${electionId}`} className="block" aria-label="View results - See election outcomes">
                    <CardContent className="flex items-center gap-4 pt-6">
                      <div className="rounded-full bg-green-100 p-3 dark:bg-green-900" aria-hidden="true">
                        <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">View Results</h3>
                        <p className="text-sm text-muted-foreground">
                          See election outcomes
                        </p>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </div>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
