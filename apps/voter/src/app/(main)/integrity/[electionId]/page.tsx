"use client";

/**
 * Election Integrity Dashboard
 *
 * Public dashboard showing election integrity metrics
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Shield,
  BookOpen,
  BarChart3,
  Search,
  AlertCircle,
  Loader2,
  RefreshCw,
  Home,
  Info,
  CheckCircle2,
  XCircle,
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
import { IntegrityCard } from "@/components/verify/integrity-card";
import { getIntegrity, type ElectionIntegrity } from "@/lib/actions/verify";
import { formatDate } from "@/lib/utils";

export default function IntegrityPage() {
  const params = useParams();
  const electionId = params.electionId as string;

  const [data, setData] = useState<ElectionIntegrity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchIntegrity = async () => {
    setLoading(true);
    setError("");
    try {
      const integrity = await getIntegrity(electionId);
      setData(integrity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId]);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-muted-foreground">Loading integrity data...</p>
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
              Error Loading Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error || "Failed to load integrity data"}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={fetchIntegrity} variant="outline" className="flex-1">
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "complete":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back Link */}
        <Button variant="ghost" asChild className="-ml-2">
          <Link href="/verify">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Verify
          </Link>
        </Button>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Election Integrity
          </h1>
          <p className="text-lg text-muted-foreground">{data.election.name}</p>
        </div>

        {/* Status Banner */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium">Election Status</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {data.election.status}
                  </p>
                </div>
              </div>
              <Badge className={getStatusBadgeVariant(data.election.status)}>
                {data.election.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Election Info */}
        <Card>
          <CardHeader>
            <CardTitle>Election Information</CardTitle>
            <CardDescription>
              Key details about this election
            </CardDescription>
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
        <IntegrityCard
          integrity={data.integrity}
          bitcoinAnchors={data.bitcoinAnchors}
        />

        {/* Verification Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Independently Verify</CardTitle>
            <CardDescription>
              Step-by-step instructions for independent auditors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.verification.instructions.map((instruction, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
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
          {data.election.status === "complete" && (
            <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <Link href={`/results/${electionId}`} className="block">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                    <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
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
          )}
        </div>

        {/* About Trustless Verification */}
        <Card className="bg-zinc-50 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Trustless Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              This system is designed so you don't need to trust anyone -
              including us. Here's how:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                All votes are recorded in a public, immutable ledger using
                Merkle trees
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                Every voter can verify their vote using cryptographic proofs
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                The Merkle root is anchored to Bitcoin, creating a permanent
                record
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                Anyone can audit the election using standard cryptographic
                tools
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                Votes are end-to-end encrypted - even we can't see how you
                voted
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
