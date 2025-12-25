"use client"

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeftIcon, SendIcon, LoaderIcon, AlertCircleIcon, LockIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const electionId = params.electionId as string;

  const [election, setElection] = useState<Election | null>(null);
  const [ballot, setBallot] = useState<BallotResponse | null>(null);
  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const [credential, setCredential] = useState<Credential | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [encryptionStatus, setEncryptionStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadReviewData();
  }, [electionId]);

  const loadReviewData = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Get credential and selections from sessionStorage
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

      // Fetch election and ballot for display
      const [electionResult, ballotResult] = await Promise.all([
        fetchElection(electionId),
        fetchBallot(electionId, "US"), // Default jurisdiction
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
  };

  const handleSubmitVote = async () => {
    if (!credential || !ballot || !election) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Prepare answers array
      const answers = Object.entries(selections).map(([questionId, selection]) => ({
        questionId,
        selection,
      }));

      // Encrypt ballot
      setEncryptionStatus("Encrypting your votes...");
      const publicKey = election.publicKey || "default-public-key";
      const encryptedAnswers = await encryptBallot(answers, publicKey);

      // Submit vote
      setEncryptionStatus("Submitting your ballot...");
      const result = await submitVote({
        electionId,
        credential,
        answers: encryptedAnswers,
      });

      if (!result.success || !result.result) {
        setError(result.error || "Failed to submit vote");
        setIsSubmitting(false);
        setEncryptionStatus("");
        return;
      }

      // Store confirmation data and navigate to confirmation page
      sessionStorage.setItem("voteConfirmation", JSON.stringify(result.result));
      sessionStorage.removeItem("ballotSelections"); // Clear selections
      router.push(`/vote/${electionId}/confirm`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit vote");
      setIsSubmitting(false);
      setEncryptionStatus("");
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const getCandidateName = (questionId: string, candidateId: string): string => {
    if (!ballot) return candidateId;

    for (const section of ballot.sections) {
      const question = section.questions.find(q => q.id === questionId);
      if (question) {
        const candidate = question.candidates.find(c => c.id === candidateId);
        if (candidate) {
          return candidate.name + (candidate.party ? ` (${candidate.party})` : '');
        }
      }
    }
    return candidateId;
  };

  const getQuestionTitle = (questionId: string): string => {
    if (!ballot) return questionId;

    for (const section of ballot.sections) {
      const question = section.questions.find(q => q.id === questionId);
      if (question) return question.title;
    }
    return questionId;
  };

  const getJurisdictionName = (questionId: string): string => {
    if (!ballot) return "";

    for (const section of ballot.sections) {
      const question = section.questions.find(q => q.id === questionId);
      if (question) return section.jurisdiction.name;
    }
    return "";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <LoaderIcon className="size-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading review...</p>
        </div>
      </div>
    );
  }

  if (error && !isSubmitting) {
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
            <p className="mb-4">{error}</p>
            <Button onClick={() => router.push("/")} variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ballot || !election) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Review Your Ballot</h1>
          <p className="text-muted-foreground">
            Please review your selections carefully before submitting.
          </p>
        </div>

        {/* Selections Review */}
        <Card>
          <CardHeader>
            <CardTitle>Your Selections</CardTitle>
            <CardDescription>
              {Object.keys(selections).length} question(s) answered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(selections).map(([questionId, selection]) => (
              <div key={questionId} className="pb-4 border-b last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="font-semibold">{getQuestionTitle(questionId)}</div>
                    <div className="text-sm text-muted-foreground">
                      {getJurisdictionName(questionId)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {Array.isArray(selection) ? (
                    selection.map(candidateId => (
                      <div key={candidateId} className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {getCandidateName(questionId, candidateId)}
                        </Badge>
                      </div>
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

        {/* Encryption Status */}
        {isSubmitting && (
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <LoaderIcon className="size-5 animate-spin text-primary" />
                <div className="flex-1">
                  <div className="font-semibold">{encryptionStatus}</div>
                  <div className="text-sm text-muted-foreground">
                    Please wait while we securely process your ballot...
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && isSubmitting && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircleIcon className="size-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-destructive">Submission Failed</div>
                  <div className="text-sm mt-1">{error}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <LockIcon className="size-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">Before you submit:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Your votes will be encrypted before submission</li>
                  <li>Once submitted, you cannot change your vote</li>
                  <li>You will receive a confirmation code to verify your vote later</li>
                  <li>Your vote is anonymous and cannot be traced back to you</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="sticky bottom-4 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handleGoBack}
                disabled={isSubmitting}
              >
                <ChevronLeftIcon className="size-4 mr-2" />
                Go Back to Edit
              </Button>
              <Button
                size="lg"
                onClick={handleSubmitVote}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <SendIcon className="size-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit My Ballot"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
