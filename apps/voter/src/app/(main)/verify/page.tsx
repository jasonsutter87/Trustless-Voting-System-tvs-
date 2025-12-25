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
import { VisuallyHidden } from "@/components/ui/visually-hidden";
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
          <div className="inline-flex items-center justify-center rounded-full bg-blue-100 p-4 dark:bg-blue-900" aria-hidden="true">
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
            <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} aria-label="Vote verification form">
              {/* Election Selector */}
              <div className="space-y-2 mb-6">
                <Label htmlFor="election">Select Election</Label>
                <Select
                  value={electionId}
                  onValueChange={setElectionId}
                  disabled={loadingElections}
                >
                  <SelectTrigger id="election" aria-label="Select election to verify">
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
              <div className="space-y-2 mb-6">
                <Label htmlFor="nullifier">Confirmation Code</Label>
                <Input
                  id="nullifier"
                  type="text"
                  placeholder="Enter your confirmation code..."
                  value={nullifier}
                  onChange={(e) => setNullifier(e.target.value)}
                  className="font-mono"
                  aria-describedby="nullifier-help"
                  aria-invalid={!!error}
                />
                <p id="nullifier-help" className="text-sm text-muted-foreground">
                  This code was provided when you submitted your vote
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400 mb-6"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>{error}</p>
                </div>
              )}

              {/* Verify Button */}
              <Button
                type="submit"
                disabled={verifying || !electionId || !nullifier.trim()}
                className="w-full"
                size="lg"
                aria-label={verifying ? "Verifying vote" : "Verify my vote"}
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" aria-hidden="true" />
                    Verify My Vote
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-zinc-50 dark:bg-zinc-900">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <div className="space-y-3 text-sm">
                <h2 className="font-medium">How Verification Works:</h2>
                <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
                  <li>Enter your confirmation code from when you voted</li>
                  <li>We look up your vote commitment in the public ledger</li>
                  <li>You receive a cryptographic proof (Merkle proof)</li>
                  <li>Anyone can independently verify this proof</li>
                </ol>
                <h3 className="mt-4 font-medium">Trustless Verification:</h3>
                <p className="text-muted-foreground">
                  You don't need to trust this website. The Merkle proofs can be
                  verified using any SHA-256 implementation.
                </p>
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
              <Link href="/ledger" className="block" aria-label="Public ledger - Browse all recorded votes">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900" aria-hidden="true">
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
              <Link href="/results" className="block" aria-label="View results - See election outcomes">
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
      </div>
    </div>
  );
}
