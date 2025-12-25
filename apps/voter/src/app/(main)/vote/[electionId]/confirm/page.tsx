"use client"

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  CheckCircleIcon,
  CopyIcon,
  CheckIcon,
  PrinterIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  LoaderIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    const firstSuccess = confirmation.results.find(r => r.success);
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
    // Clear all session data
    sessionStorage.removeItem("votingCredential");
    sessionStorage.removeItem("ballotSelections");
    sessionStorage.removeItem("voteConfirmation");
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <LoaderIcon className="size-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !confirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="size-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error || "No confirmation data found"}</p>
            <Button onClick={() => router.push("/")} variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const successfulResults = confirmation.results.filter(r => r.success);
  const failedResults = confirmation.results.filter(r => !r.success);
  const firstMerkleRoot = successfulResults.length > 0 ? successfulResults[0].merkleRoot : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 print:bg-white">
      <div className="container max-w-3xl mx-auto px-4 space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircleIcon className="size-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Vote Submitted Successfully!</h1>
          <p className="text-muted-foreground text-lg">
            Your ballot has been encrypted and recorded in the secure voting ledger.
          </p>
        </div>

        {/* Confirmation Code */}
        <Card className="border-primary print:border-black">
          <CardHeader className="bg-primary/5 print:bg-white">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheckIcon className="size-5" />
              Your Confirmation Code
            </CardTitle>
            <CardDescription>
              Save this code to verify your vote was counted
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="p-6 rounded-lg bg-muted/50 border-2 border-dashed border-primary print:border-black">
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold tracking-wider text-primary print:text-black">
                    {confirmation.confirmationCode}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 print:hidden">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyConfirmation}
                >
                  {copiedConfirmation ? (
                    <>
                      <CheckIcon className="size-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="size-4 mr-2" />
                      Copy Code
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <PrinterIcon className="size-4 mr-2" />
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
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Election ID:</span>
                <span className="font-mono text-sm">{confirmation.electionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Questions Answered:</span>
                <span className="font-semibold">
                  {confirmation.answersSubmitted} of {confirmation.answersTotal}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={confirmation.success ? "default" : "destructive"}>
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
              <CardTitle>Cryptographic Verification</CardTitle>
              <CardDescription>
                Your vote is secured in a tamper-proof Merkle tree
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Merkle Root Hash</div>
                <div className="p-3 rounded-md bg-muted font-mono text-xs break-all">
                  {firstMerkleRoot}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full print:hidden"
                  onClick={handleCopyMerkleRoot}
                >
                  {copiedRoot ? (
                    <>
                      <CheckIcon className="size-3 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="size-3 mr-2" />
                      Copy Merkle Root
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This cryptographic hash proves your vote was included in the election ledger.
                You can use it to independently verify your vote was counted.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Failed Questions (if any) */}
        {failedResults.length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                Some Questions Failed to Submit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {failedResults.map((result) => (
                  <li key={result.questionId} className="text-sm">
                    <span className="font-medium">Question {result.questionId}:</span>{" "}
                    <span className="text-destructive">{result.error}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="font-bold text-primary">1.</span>
                <span>
                  <strong>Save your confirmation code</strong> - You'll need it to verify
                  your vote was counted in the final tally.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">2.</span>
                <span>
                  <strong>Voting closes</strong> - Once the election period ends, the votes
                  will be tallied using threshold decryption.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">3.</span>
                <span>
                  <strong>Results published</strong> - You can verify your vote was included
                  using your confirmation code and the public ledger.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">4.</span>
                <span>
                  <strong>Blockchain anchoring</strong> - The final Merkle root will be
                  anchored to Bitcoin for permanent, tamper-proof verification.
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="border-orange-500 bg-orange-50 print:bg-white print:border-black">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircleIcon className="size-5 text-orange-600 mt-0.5 print:text-black" />
              <div className="text-sm space-y-2">
                <p className="font-semibold text-foreground">Important:</p>
                <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Keep your confirmation code in a safe place</li>
                  <li>You cannot vote again or change your vote</li>
                  <li>Do not share your confirmation code with anyone</li>
                  <li>Print or save this page for your records</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 print:hidden">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <PrinterIcon className="size-4 mr-2" />
            Print Receipt
          </Button>
          <Button onClick={handleFinish} className="flex-1" size="lg">
            Finish
          </Button>
        </div>

        {/* Footer Message */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>Thank you for participating in this election.</p>
          <p>Your vote has been securely recorded and will remain private.</p>
        </div>
      </div>
    </div>
  );
}
