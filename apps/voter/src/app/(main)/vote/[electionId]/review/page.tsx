"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Send,
  Loader2,
  AlertCircle,
  Lock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
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
import {
  fetchBallot,
  fetchElection,
  submitVote,
  type BallotResponse,
  type Election,
  type Credential,
} from "@/lib/actions/voting";
import { encryptBallot } from "@/lib/encryption";

type SubmitStep = "idle" | "encrypting" | "submitting" | "success" | "error";

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const electionId = params.electionId as string;

  const [election, setElection] = useState<Election | null>(null);
  const [ballot, setBallot] = useState<BallotResponse | null>(null);
  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const [credential, setCredential] = useState<Credential | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitStep, setSubmitStep] = useState<SubmitStep>("idle");
  const [error, setError] = useState("");

  const loadReviewData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const credentialString = sessionStorage.getItem("votingCredential");
      const selectionsString = sessionStorage.getItem("ballotSelections");

      if (!credentialString || !selectionsString) {
        setError("Missing voting data. Please start from the beginning.");
        setIsLoading(false);
        return;
      }

      const parsedCredential = JSON.parse(credentialString);
      const parsedSelections = JSON.parse(selectionsString);

      setCredential(parsedCredential);
      setSelections(parsedSelections);

      const jurisdictionId = parsedCredential.jurisdictionId || "US";

      const [electionResult, ballotResult] = await Promise.all([
        fetchElection(electionId),
        fetchBallot(electionId, jurisdictionId),
      ]);

      if (!electionResult.success || !electionResult.election) {
        setError(electionResult.error || "Failed to load election");
        setIsLoading(false);
        return;
      }

      if (!ballotResult.success || !ballotResult.ballot) {
        setError(ballotResult.error || "Failed to load ballot");
        setIsLoading(false);
        return;
      }

      setElection(electionResult.election);
      setBallot(ballotResult.ballot);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review data");
      setIsLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    loadReviewData();
  }, [loadReviewData]);

  const handleSubmitVote = async () => {
    if (!credential || !ballot || !election) return;

    setSubmitStep("encrypting");
    setError("");

    try {
      const answers = Object.entries(selections).map(([questionId, selection]) => ({
        questionId,
        selection,
      }));

      const publicKey = election.publicKey || "default-public-key";
      const encryptedAnswers = await encryptBallot(answers, publicKey);

      setSubmitStep("submitting");
      const result = await submitVote({
        electionId,
        credential,
        answers: encryptedAnswers,
      });

      if (!result.success || !result.result) {
        setError(result.error || "Failed to submit vote");
        setSubmitStep("error");
        return;
      }

      setSubmitStep("success");
      sessionStorage.setItem("voteConfirmation", JSON.stringify(result.result));
      sessionStorage.removeItem("ballotSelections");

      // Brief delay to show success before navigating
      setTimeout(() => {
        router.push(`/vote/${electionId}/confirm`);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit vote");
      setSubmitStep("error");
    }
  };

  const getCandidateName = (questionId: string, candidateId: string): string => {
    if (!ballot) return candidateId;

    for (const section of ballot.sections) {
      const question = section.questions.find((q) => q.id === questionId);
      if (question) {
        const candidate = question.candidates.find((c) => c.id === candidateId);
        if (candidate) {
          return candidate.name + (candidate.party ? ` (${candidate.party})` : "");
        }
      }
    }
    return candidateId;
  };

  const getQuestionTitle = (questionId: string): string => {
    if (!ballot) return questionId;

    for (const section of ballot.sections) {
      const question = section.questions.find((q) => q.id === questionId);
      if (question) return question.title;
    }
    return questionId;
  };

  const getJurisdictionName = (questionId: string): string => {
    if (!ballot) return "";

    for (const section of ballot.sections) {
      const question = section.questions.find((q) => q.id === questionId);
      if (question) return section.jurisdiction.name;
    }
    return "";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-muted-foreground">Loading your selections...</p>
        </div>
      </div>
    );
  }

  // Error state (not during submission)
  if (error && submitStep === "idle") {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Unable to Load Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={loadReviewData} variant="outline" className="flex-1">
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

  if (!ballot || !election) {
    return null;
  }

  const isSubmitting = submitStep !== "idle" && submitStep !== "error";

  return (
    <div className="container mx-auto px-4 py-6 pb-32">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold sm:text-3xl">Review Your Ballot</h1>
          <p className="text-muted-foreground">
            Please review your selections carefully before submitting.
          </p>
        </div>

        {/* Selections Review */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Your Selections
            </CardTitle>
            <CardDescription>
              {Object.keys(selections).length} question
              {Object.keys(selections).length !== 1 ? "s" : ""} answered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(selections).map(([questionId, selection]) => (
              <div
                key={questionId}
                className="border-b pb-4 last:border-b-0 last:pb-0"
              >
                <div className="mb-2">
                  <div className="font-medium">{getQuestionTitle(questionId)}</div>
                  <div className="text-sm text-muted-foreground">
                    {getJurisdictionName(questionId)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(selection) ? (
                    selection.map((candidateId) => (
                      <Badge key={candidateId} variant="secondary">
                        {getCandidateName(questionId, candidateId)}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary">
                      {getCandidateName(questionId, selection)}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submission Progress */}
        {(submitStep === "encrypting" || submitStep === "submitting" || submitStep === "success") && (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {submitStep === "success" ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {submitStep === "encrypting" && "Encrypting your ballot..."}
                      {submitStep === "submitting" && "Submitting your vote..."}
                      {submitStep === "success" && "Vote submitted successfully!"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {submitStep === "encrypting" &&
                        "Your votes are being encrypted in your browser"}
                      {submitStep === "submitting" &&
                        "Securely transmitting your encrypted ballot"}
                      {submitStep === "success" && "Redirecting to confirmation..."}
                    </p>
                  </div>
                </div>
                {/* Progress steps */}
                <div className="flex gap-2">
                  <div
                    className={`h-1 flex-1 rounded-full ${
                      submitStep === "encrypting" ||
                      submitStep === "submitting" ||
                      submitStep === "success"
                        ? "bg-blue-600"
                        : "bg-zinc-200"
                    }`}
                  />
                  <div
                    className={`h-1 flex-1 rounded-full ${
                      submitStep === "submitting" || submitStep === "success"
                        ? "bg-blue-600"
                        : "bg-zinc-200"
                    }`}
                  />
                  <div
                    className={`h-1 flex-1 rounded-full ${
                      submitStep === "success" ? "bg-green-600" : "bg-zinc-200"
                    }`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error during submission */}
        {submitStep === "error" && error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    Submission Failed
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  <Button
                    onClick={handleSubmitVote}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="bg-zinc-50 dark:bg-zinc-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-green-600" />
              <div className="text-sm">
                <p className="mb-2 font-medium">Before you submit:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                    Your votes are encrypted before leaving your device
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                    Once submitted, you cannot change your vote
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                    You will receive a confirmation code to verify later
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Footer */}
      <div className="fixed inset-x-0 bottom-0 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/80">
        <div className="container mx-auto px-4 py-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="order-2 sm:order-1"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Go Back to Edit
            </Button>
            <Button
              size="lg"
              onClick={handleSubmitVote}
              disabled={isSubmitting}
              className="order-1 bg-green-600 hover:bg-green-700 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit My Ballot
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
