"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  fetchBallot,
  fetchElection,
  type BallotResponse,
  type Election,
} from "@/lib/actions/voting";
import { BallotSkeleton } from "@/components/skeletons";

export default function BallotPage() {
  const router = useRouter();
  const params = useParams();
  const electionId = params.electionId as string;

  const [election, setElection] = useState<Election | null>(null);
  const [ballot, setBallot] = useState<BallotResponse | null>(null);
  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBallot = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      // Get credential from sessionStorage
      const credentialString = sessionStorage.getItem("votingCredential");
      if (!credentialString) {
        setError("No voting credential found. Please start from the beginning.");
        setIsLoading(false);
        return;
      }

      const credential = JSON.parse(credentialString);

      // Verify credential belongs to this election
      if (credential.electionId !== electionId) {
        setError("Your credential is not valid for this election.");
        setIsLoading(false);
        return;
      }

      // Fetch election details
      const electionResult = await fetchElection(electionId);
      if (!electionResult.success || !electionResult.election) {
        setError(electionResult.error || "Failed to load election");
        setIsLoading(false);
        return;
      }

      // Check if voting is open
      if (electionResult.election.status !== "voting") {
        setError(
          `Voting is not currently open. Election status: ${electionResult.election.status}`
        );
        setIsLoading(false);
        return;
      }

      setElection(electionResult.election);

      // Get jurisdiction from credential or default
      const jurisdictionId = credential.jurisdictionId || "US";

      // Fetch ballot
      const ballotResult = await fetchBallot(electionId, jurisdictionId);
      if (!ballotResult.success || !ballotResult.ballot) {
        setError(ballotResult.error || "Failed to load ballot");
        setIsLoading(false);
        return;
      }

      setBallot(ballotResult.ballot);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ballot");
      setIsLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    loadBallot();
  }, [loadBallot]);

  const handleSingleChoice = (questionId: string, candidateId: string) => {
    setSelections((prev) => ({
      ...prev,
      [questionId]: candidateId,
    }));
  };

  const handleMultiChoice = (
    questionId: string,
    candidateId: string,
    maxSelections: number
  ) => {
    setSelections((prev) => {
      const current = (prev[questionId] as string[]) || [];
      const isSelected = current.includes(candidateId);

      let newSelection: string[];
      if (isSelected) {
        newSelection = current.filter((id) => id !== candidateId);
      } else {
        if (current.length >= maxSelections) {
          return prev;
        }
        newSelection = [...current, candidateId];
      }

      return {
        ...prev,
        [questionId]: newSelection,
      };
    });
  };

  const handleReviewBallot = () => {
    if (!ballot) return;

    const allQuestions = ballot.sections.flatMap((s) => s.questions);
    const unanswered = allQuestions.filter(
      (q) =>
        !selections[q.id] ||
        (Array.isArray(selections[q.id]) && selections[q.id].length === 0)
    );

    if (unanswered.length > 0) {
      setError(
        `Please answer all questions. ${unanswered.length} question(s) remaining.`
      );
      return;
    }

    sessionStorage.setItem("ballotSelections", JSON.stringify(selections));
    router.push(`/vote/${electionId}/review`);
  };

  // Loading state
  if (isLoading) {
    return <BallotSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Unable to Load Ballot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={loadBallot} variant="outline" className="flex-1">
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

  const allQuestions = ballot.sections.flatMap((s) => s.questions);
  const answeredCount = Object.keys(selections).filter((qId) => {
    const sel = selections[qId];
    return sel && (Array.isArray(sel) ? sel.length > 0 : true);
  }).length;
  const progressPercent = Math.round((answeredCount / allQuestions.length) * 100);

  return (
    <div className="container mx-auto px-4 py-6 pb-32">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold sm:text-3xl">{election.name}</h1>
          {election.description && (
            <p className="text-muted-foreground">{election.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="secondary">
              {answeredCount} of {allQuestions.length} answered
            </Badge>
            {ballot.voter && (
              <span className="text-muted-foreground">
                {ballot.voter.jurisdictionName}
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Ballot Sections */}
        {ballot.sections.map((section) => (
          <Card key={section.jurisdiction.id}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{section.jurisdiction.name}</CardTitle>
              <CardDescription>
                {section.jurisdiction.type} - {section.questions.length} question
                {section.questions.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.questions.map((question) => {
                const isAnswered =
                  selections[question.id] &&
                  (Array.isArray(selections[question.id])
                    ? (selections[question.id] as string[]).length > 0
                    : true);

                return (
                  <div
                    key={question.id}
                    className="space-y-4 border-b pb-6 last:border-b-0 last:pb-0"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <h3 className="flex-1 font-semibold">{question.title}</h3>
                        {isAnswered && (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                        )}
                      </div>
                      {question.description && (
                        <p className="text-sm text-muted-foreground">
                          {question.description}
                        </p>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {question.questionType === "single_choice" && "Choose one"}
                        {question.questionType === "multi_choice" &&
                          `Choose up to ${question.maxSelections}`}
                        {question.questionType === "yes_no" && "Yes or No"}
                      </Badge>
                    </div>

                    {/* Single Choice */}
                    {(question.questionType === "single_choice" ||
                      question.questionType === "yes_no") && (
                      <RadioGroup
                        value={selections[question.id] as string}
                        onValueChange={(value) =>
                          handleSingleChoice(question.id, value)
                        }
                        className="space-y-2"
                      >
                        {question.candidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                          >
                            <RadioGroupItem
                              value={candidate.id}
                              id={candidate.id}
                              className="mt-0.5"
                            />
                            <Label
                              htmlFor={candidate.id}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="font-medium">{candidate.name}</div>
                              {candidate.party && (
                                <div className="text-sm text-muted-foreground">
                                  {candidate.party}
                                </div>
                              )}
                              {candidate.description && (
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {candidate.description}
                                </div>
                              )}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {/* Multi Choice */}
                    {question.questionType === "multi_choice" && (
                      <div className="space-y-2">
                        {question.candidates.map((candidate) => {
                          const isChecked = (
                            (selections[question.id] as string[]) || []
                          ).includes(candidate.id);
                          const currentCount = (
                            (selections[question.id] as string[]) || []
                          ).length;
                          const isDisabled =
                            !isChecked && currentCount >= question.maxSelections;

                          return (
                            <div
                              key={candidate.id}
                              className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                                isDisabled
                                  ? "opacity-50"
                                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                              }`}
                            >
                              <Checkbox
                                id={candidate.id}
                                checked={isChecked}
                                disabled={isDisabled}
                                onCheckedChange={() =>
                                  handleMultiChoice(
                                    question.id,
                                    candidate.id,
                                    question.maxSelections
                                  )
                                }
                                className="mt-0.5"
                              />
                              <Label
                                htmlFor={candidate.id}
                                className={`flex-1 ${isDisabled ? "" : "cursor-pointer"}`}
                              >
                                <div className="font-medium">{candidate.name}</div>
                                {candidate.party && (
                                  <div className="text-sm text-muted-foreground">
                                    {candidate.party}
                                  </div>
                                )}
                                {candidate.description && (
                                  <div className="mt-1 text-sm text-muted-foreground">
                                    {candidate.description}
                                  </div>
                                )}
                              </Label>
                            </div>
                          );
                        })}
                        <p className="text-xs text-muted-foreground">
                          {currentCount(question.id, selections)} of{" "}
                          {question.maxSelections} selected
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sticky Footer */}
      <div className="fixed inset-x-0 bottom-0 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/80">
        <div className="container mx-auto px-4 py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {answeredCount === allQuestions.length ? (
                <p className="flex items-center gap-2 font-medium text-green-600">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span className="truncate">All questions answered</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {allQuestions.length - answeredCount} question
                  {allQuestions.length - answeredCount !== 1 ? "s" : ""} remaining
                </p>
              )}
            </div>
            <Button
              size="lg"
              onClick={handleReviewBallot}
              disabled={answeredCount !== allQuestions.length}
            >
              Review Ballot
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function
function currentCount(
  questionId: string,
  selections: Record<string, string | string[]>
): number {
  const sel = selections[questionId];
  if (!sel) return 0;
  return Array.isArray(sel) ? sel.length : 0;
}
