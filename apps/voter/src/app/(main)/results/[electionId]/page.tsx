"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Trophy,
  Shield,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Home,
  Info,
  Search,
  Clock,
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
import { ResultsSummary } from "@/components/results/result-bar";
import { getResults, type ElectionResults } from "@/lib/actions/verify";

export default function ResultsPage() {
  const params = useParams();
  const electionId = params.electionId as string;

  const [results, setResults] = useState<ElectionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getResults(electionId);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results");
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  // Error or not available state
  if (error || !results) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Results Not Available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error || "Election results are not yet available"}
            </p>
            <p className="text-sm text-muted-foreground">
              Results are only shown after the election has been completed and
              tallied by trustees.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={fetchResults} variant="outline" className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Return Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isComplete = results.status === "complete";

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back Link */}
        <Button variant="ghost" asChild className="-ml-2">
          <Link href="/">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-4">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Election Results
          </h1>
          <p className="text-lg text-muted-foreground">{results.electionName}</p>
        </div>

        {/* Status Banner */}
        <Card
          className={
            isComplete
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
              : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {isComplete ? (
                <>
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium">Election Complete</p>
                    <p className="text-sm text-muted-foreground">
                      Results have been tallied and verified by trustees
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-medium">Tallying in Progress</p>
                    <p className="text-sm text-muted-foreground">
                      These results are preliminary and may change
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Winner Announcement */}
        {results.winner && isComplete && (
          <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 dark:border-yellow-800 dark:from-yellow-950 dark:to-orange-950">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <Trophy className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto" />
                <div>
                  <Badge className="mb-2 bg-yellow-600">Winner</Badge>
                  <h2 className="text-2xl font-bold">
                    {results.winner.candidateName}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {results.winner.votes.toLocaleString()} votes (
                    {((results.winner.votes / results.totalVotes) * 100).toFixed(1)}
                    %)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Summary */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Vote Tallies</CardTitle>
                <CardDescription>
                  Decrypted and tallied election results
                </CardDescription>
              </div>
              <div className="rounded-lg border p-3 text-center sm:text-right">
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

        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <Link href="/verify" className="block">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                  <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Verify Vote</h3>
                  <p className="text-sm text-muted-foreground">
                    Check your vote
                  </p>
                </div>
              </CardContent>
            </Link>
          </Card>
          <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <Link href={`/integrity/${electionId}`} className="block">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Integrity</h3>
                  <p className="text-sm text-muted-foreground">
                    Audit election
                  </p>
                </div>
              </CardContent>
            </Link>
          </Card>
          <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <Link href={`/ledger/${electionId}`} className="block">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                  <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">View Ledger</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse votes
                  </p>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* How Tallying Works */}
        <Card className="bg-zinc-50 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              How Vote Tallying Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              The Trustless Voting System uses end-to-end encryption and
              threshold decryption to protect voter privacy while ensuring
              accurate results:
            </p>
            <ol className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  1
                </span>
                <span>
                  <strong className="text-foreground">Votes are encrypted</strong>{" "}
                  - When you cast your vote, it's encrypted using the election's
                  public key. Nobody can see how you voted.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  2
                </span>
                <span>
                  <strong className="text-foreground">Recorded in ledger</strong>{" "}
                  - Your encrypted vote is recorded in a public, tamper-proof
                  ledger with a Merkle proof.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  3
                </span>
                <span>
                  <strong className="text-foreground">Election closes</strong> -
                  After the voting period ends, the ledger is sealed and anchored
                  to Bitcoin.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  4
                </span>
                <span>
                  <strong className="text-foreground">Trustees decrypt</strong> -
                  Multiple trustees combine their key shares to decrypt the votes
                  (threshold cryptography).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  5
                </span>
                <span>
                  <strong className="text-foreground">Results tallied</strong> -
                  Decrypted votes are counted and results are published with
                  cryptographic proofs.
                </span>
              </li>
            </ol>

            <div className="mt-6 border-t pt-4">
              <p className="font-medium text-foreground mb-3">
                Trustless Guarantees:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  Every voter can verify their vote was counted correctly
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  The ledger is public and independently auditable
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  Multiple trustees required to decrypt (no single point of trust)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  The Merkle root is anchored to Bitcoin for immutability
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
