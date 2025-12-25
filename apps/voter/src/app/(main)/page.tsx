"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Search,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { validateCredential } from "@/lib/actions/voting";

export default function HomePage() {
  const router = useRouter();
  const [credential, setCredential] = useState("");
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsValidating(true);

    try {
      const trimmedCredential = credential.trim();

      if (!trimmedCredential) {
        setError("Please enter your voting credential");
        setIsValidating(false);
        return;
      }

      const result = await validateCredential(trimmedCredential);

      if (!result.valid || !result.credential) {
        setError(result.error || "Invalid credential format. Please check and try again.");
        setIsValidating(false);
        return;
      }

      // Store credential in sessionStorage
      sessionStorage.setItem("votingCredential", trimmedCredential);

      // Navigate to ballot
      router.push(`/vote/${result.credential.electionId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to validate credential"
      );
      setIsValidating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center rounded-full bg-blue-100 p-4 dark:bg-blue-900" aria-hidden="true">
            <ShieldCheck className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Cast Your Vote
          </h1>
          <p className="text-lg text-muted-foreground">
            Secure, private, and verifiable voting
          </p>
        </div>

        {/* Credential Entry Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
              Enter Your Voting Credential
            </CardTitle>
            <CardDescription>
              Paste the credential you received via email or downloaded during
              registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" aria-label="Voting credential form">
              <div className="space-y-2">
                <Label htmlFor="credential">Voting Credential</Label>
                <textarea
                  id="credential"
                  placeholder='{"electionId": "...", "nullifier": "...", "message": "...", "signature": "..."}'
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  aria-describedby="credential-help"
                  aria-invalid={!!error}
                />
                <p id="credential-help" className="text-xs text-muted-foreground">
                  Your credential is a JSON string containing your encrypted
                  voting token. It looks like the placeholder above.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!credential.trim() || isValidating}
                aria-label={isValidating ? "Validating credential" : "Continue to ballot"}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Validating...
                  </>
                ) : (
                  "Continue to Ballot"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Features */}
        <Card className="bg-zinc-50 dark:bg-zinc-900">
          <CardContent className="pt-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-5 w-5 text-green-600" aria-hidden="true" />
              Security & Privacy Guarantees
            </h2>
            <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2" role="list">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                <span>Vote encrypted in your browser</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                <span>One vote per credential</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                <span>Vote cannot be linked to you</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                <span>Tamper-proof vote ledger</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                <span>Verify your vote anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
                <span>Bitcoin-anchored proofs</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <nav aria-label="Quick navigation">
          <h2 className="sr-only">Additional features</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <Link href="/verify" className="block" aria-label="Verify your vote - Check that your vote was recorded">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900" aria-hidden="true">
                    <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Verify Your Vote</h3>
                    <p className="text-sm text-muted-foreground">
                      Check that your vote was recorded
                    </p>
                  </div>
                </CardContent>
              </Link>
            </Card>
            <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <Link href="/results" className="block" aria-label="View results - See election results when available">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-full bg-green-100 p-3 dark:bg-green-900" aria-hidden="true">
                    <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">View Results</h3>
                    <p className="text-sm text-muted-foreground">
                      See election results when available
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
