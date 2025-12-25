"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Search,
  Home,
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
import { copyToClipboard } from "@/lib/utils";
import type { VoteSubmissionResult } from "@/lib/actions/voting";

export default function ConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const electionId = params.electionId as string;

  const [confirmation, setConfirmation] = useState<VoteSubmissionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedConfirmation, setCopiedConfirmation] = useState(false);
  const [copiedRoot, setCopiedRoot] = useState(false);

  useEffect(() => {
    loadConfirmation();
  }, []);

  const loadConfirmation = () => {
    try {
      const confirmationString = sessionStorage.getItem("voteConfirmation");
      if (!confirmationString) {
        setError("No confirmation found. Your vote may not have been submitted.");
        setIsLoading(false);
        return;
      }

      const parsed = JSON.parse(confirmationString) as VoteSubmissionResult;
      setConfirmation(parsed);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load confirmation");
      setIsLoading(false);
    }
  };

  const handleCopyConfirmation = async () => {
    if (!confirmation) return;
    const success = await copyToClipboard(confirmation.confirmationCode);
    if (success) {
      setCopiedConfirmation(true);
      setTimeout(() => setCopiedConfirmation(false), 2000);
    }
  };

  const handleCopyMerkleRoot = async () => {
    if (!confirmation) return;
    const firstSuccess = confirmation.results.find((r) => r.success);
    if (firstSuccess?.merkleRoot) {
      const success = await copyToClipboard(firstSuccess.merkleRoot);
      if (success) {
        setCopiedRoot(true);
        setTimeout(() => setCopiedRoot(false), 2000);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFinish = () => {
    sessionStorage.removeItem("votingCredential");
    sessionStorage.removeItem("ballotSelections");
    sessionStorage.removeItem("voteConfirmation");
    router.push("/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-muted-foreground">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !confirmation) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              No Confirmation Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error || "No confirmation data found. Your vote may not have been submitted."}
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const successfulResults = confirmation.results.filter((r) => r.success);
  const failedResults = confirmation.results.filter((r) => !r.success);
  const firstMerkleRoot =
    successfulResults.length > 0 ? successfulResults[0].merkleRoot : null;

  return (
    <div className="container mx-auto px-4 py-6 print:bg-white">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center rounded-full bg-green-100 p-4 dark:bg-green-900">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Vote Submitted Successfully!
          </h1>
          <p className="text-muted-foreground">
            Your ballot has been encrypted and recorded securely.
          </p>
        </div>

        {/* Confirmation Code */}
        <Card className="border-2 border-green-200 dark:border-green-800 print:border-black">
          <CardHeader className="bg-green-50 dark:bg-green-950 print:bg-white">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Your Confirmation Code
            </CardTitle>
            <CardDescription>
              Save this code to verify your vote later
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-green-300 bg-green-50 p-6 dark:border-green-700 dark:bg-green-950 print:border-black print:bg-white">
                <div className="text-center">
                  <div className="font-mono text-2xl font-bold tracking-widest text-green-700 dark:text-green-300 sm:text-3xl print:text-black">
                    {confirmation.confirmationCode}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row print:hidden">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyConfirmation}
                >
                  {copiedConfirmation ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Code
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handlePrint} className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submission Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Election:</span>
                <span className="font-mono">{electionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Questions Answered:</span>
                <span className="font-medium">
                  {confirmation.answersSubmitted} of {confirmation.answersTotal}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={confirmation.success ? "default" : "destructive"}
                  className="bg-green-600"
                >
                  {confirmation.success ? "Submitted" : "Partial"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Merkle Proof Info */}
        {firstMerkleRoot && (
          <Card>
            <CardHeader>
              <CardTitle>Cryptographic Proof</CardTitle>
              <CardDescription>
                Your vote is secured in a tamper-proof ledger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="mb-2 text-sm font-medium">Merkle Root Hash</p>
                <div className="rounded-md bg-zinc-100 p-3 font-mono text-xs break-all dark:bg-zinc-800">
                  {firstMerkleRoot}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full print:hidden"
                onClick={handleCopyMerkleRoot}
              >
                {copiedRoot ? (
                  <>
                    <Check className="mr-2 h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-3 w-3" />
                    Copy Merkle Root
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Failed Questions */}
        {failedResults.length > 0 && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardHeader>
              <CardTitle className="text-red-600">
                Some Questions Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {failedResults.map((result) => (
                  <li key={result.questionId}>
                    <span className="font-medium">Question {result.questionId}:</span>{" "}
                    <span className="text-red-600">{result.error}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* What's Next */}
        <Card className="bg-zinc-50 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  1
                </span>
                <span>
                  <strong>Save your code</strong> - You'll need it to verify your
                  vote was counted.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  2
                </span>
                <span>
                  <strong>Election closes</strong> - Votes are tallied using
                  threshold decryption by trustees.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                  3
                </span>
                <span>
                  <strong>Verify your vote</strong> - Use your confirmation code
                  to check it was included.
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 print:bg-white print:border-black">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400 print:text-black" />
              <div className="text-sm">
                <p className="mb-2 font-medium">Important:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Keep your confirmation code safe</li>
                  <li>• You cannot vote again or change your vote</li>
                  <li>• Do not share your confirmation code</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row print:hidden">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/verify">
              <Search className="mr-2 h-4 w-4" />
              Verify Vote
            </Link>
          </Button>
          <Button onClick={handleFinish} className="flex-1" size="lg">
            <Home className="mr-2 h-4 w-4" />
            Finish & Return Home
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>Thank you for participating in this election.</p>
          <p>Your vote is encrypted and anonymous.</p>
        </div>
      </div>
    </div>
  );
}
