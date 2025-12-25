"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ShieldCheck,
  Info,
  Loader2,
  AlertCircle,
  BookOpen,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getElections } from "@/lib/actions/verify";

interface Election {
  id: string;
  name: string;
  status: string;
}

export default function VerifyPage() {
  const router = useRouter();
  const [electionId, setElectionId] = useState("");
  const [nullifier, setNullifier] = useState("");
  const [elections, setElections] = useState<Election[]>([]);
  const [loadingElections, setLoadingElections] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoadingElections(true);
    getElections()
      .then((data) => {
        setElections(data || []);
        setLoadingElections(false);
      })
      .catch((err) => {
        console.error("Failed to load elections:", err);
        setLoadingElections(false);
      });
  }, []);

  const handleVerify = () => {
    setError("");

    if (!electionId) {
      setError("Please select an election");
      return;
    }

    if (!nullifier.trim()) {
      setError("Please enter your confirmation code");
      return;
    }

    setVerifying(true);
    router.push(`/verify/${electionId}/${encodeURIComponent(nullifier.trim())}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center rounded-full bg-blue-100 p-4 dark:bg-blue-900">
            <ShieldCheck className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Verify Your Vote
          </h1>
          <p className="text-lg text-muted-foreground">
            Check that your vote was recorded correctly in the ledger
          </p>
        </div>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Vote Verification</CardTitle>
            <CardDescription>
              Enter your confirmation code to verify your vote was counted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Election Selector */}
            <div className="space-y-2">
              <Label htmlFor="election">Select Election</Label>
              <Select
                value={electionId}
                onValueChange={setElectionId}
                disabled={loadingElections}
              >
                <SelectTrigger id="election">
                  <SelectValue
                    placeholder={
                      loadingElections ? "Loading elections..." : "Choose an election..."
                    }
                  />
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

            {/* Confirmation Code Input */}
            <div className="space-y-2">
              <Label htmlFor="nullifier">Confirmation Code</Label>
              <Input
                id="nullifier"
                type="text"
                placeholder="Enter your confirmation code..."
                value={nullifier}
                onChange={(e) => setNullifier(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && electionId && nullifier.trim()) {
                    handleVerify();
                  }
                }}
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                This code was provided when you submitted your vote
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={verifying || !electionId || !nullifier.trim()}
              className="w-full"
              size="lg"
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Verify My Vote
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-zinc-50 dark:bg-zinc-900">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="space-y-3 text-sm">
                <p className="font-medium">How Verification Works:</p>
                <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
                  <li>Enter your confirmation code from when you voted</li>
                  <li>We look up your vote commitment in the public ledger</li>
                  <li>You receive a cryptographic proof (Merkle proof)</li>
                  <li>Anyone can independently verify this proof</li>
                </ol>
                <p className="mt-4 font-medium">Trustless Verification:</p>
                <p className="text-muted-foreground">
                  You don't need to trust this website. The Merkle proofs can be
                  verified using any SHA-256 implementation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <Link href="/ledger" className="block">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                  <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Public Ledger</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse all recorded votes
                  </p>
                </div>
              </CardContent>
            </Link>
          </Card>
          <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <Link href="/results" className="block">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
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
      </div>
    </div>
  );
}
