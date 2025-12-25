"use client";

/**
 * Public Ledger Explorer
 *
 * Browse all votes in the election ledger
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  BookOpen,
  Shield,
  Info,
  AlertCircle,
  Loader2,
  RefreshCw,
  Home,
  BarChart3,
  Search,
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
import { VoteTable } from "@/components/ledger/vote-table";
import { getLedgerExport, type LedgerExport } from "@/lib/actions/verify";

export default function LedgerPage() {
  const params = useParams();
  const electionId = params.electionId as string;

  const [data, setData] = useState<LedgerExport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLedger = async () => {
    setLoading(true);
    setError("");
    try {
      const ledger = await getLedgerExport(electionId);
      setData(ledger);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId]);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-muted-foreground">Loading ledger...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Ledger Not Available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error || "Failed to load ledger"}
            </p>
            <p className="text-sm text-muted-foreground">
              The ledger export is only available after voting has ended.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={fetchLedger} variant="outline" className="flex-1">
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
          <div className="inline-flex items-center justify-center rounded-full bg-purple-100 p-4 dark:bg-purple-900">
            <BookOpen className="h-10 w-10 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Public Ledger
          </h1>
          <p className="text-lg text-muted-foreground">{data.electionName}</p>
        </div>

        {/* Vote Count Banner */}
        <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">
                Total Votes Recorded
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {data.voteCount.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Banner */}
        <Card className="bg-zinc-50 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              About This Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              This is the complete public record of all votes cast in this
              election. The ledger provides transparency while maintaining voter
              privacy through cryptography.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>
                  Each entry shows the position, cryptographic commitment,
                  nullifier, and timestamp
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>
                  Votes are encrypted - this ledger doesn't reveal how anyone voted
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>
                  Anyone can verify vote inclusion using Merkle proofs
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>
                  The Merkle root cryptographically commits to all entries
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Ledger Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Vote Entries</CardTitle>
                <CardDescription>
                  Searchable, exportable record of all votes
                </CardDescription>
              </div>
              <Badge variant="secondary" className="self-start sm:self-center">
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
            <Link href={`/results/${electionId}`} className="block">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                  <BarChart3 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold">View Results</h3>
                  <p className="text-sm text-muted-foreground">
                    See outcomes
                  </p>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Auditing Info */}
        <Card className="bg-zinc-50 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              For Independent Auditors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              This ledger is designed for independent auditing and verification
              by anyone who wants to verify the election's integrity.
            </p>
            <div className="space-y-3">
              <p className="font-medium text-foreground">Auditing Steps:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">1.</span>
                  <span>
                    Export the full ledger as CSV using the "Export CSV" button
                    above
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">2.</span>
                  <span>
                    Verify the Merkle root matches published anchors (Bitcoin, etc.)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">3.</span>
                  <span>
                    Reconstruct the Merkle tree from the vote commitments
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">4.</span>
                  <span>
                    Validate individual vote proofs using standard SHA-256 tools
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">5.</span>
                  <span>
                    Cross-reference vote counts with published election results
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
