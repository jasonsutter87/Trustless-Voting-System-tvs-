"use client"

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronRightIcon, AlertCircleIcon, CheckCircleIcon, LoaderIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fetchBallot, fetchElection, type BallotResponse, type Election } from "@/lib/actions/voting";

interface Selection {
  questionId: string;
  selection: string | string[];
}

export default function BallotPage() {
  const router = useRouter();
  const params = useParams();
  const electionId = params.electionId as string;

  const [election, setElection] = useState<Election | null>(null);
  const [ballot, setBallot] = useState<BallotResponse | null>(null);
  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBallot();
  }, [electionId]);

  const loadBallot = async () => {
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
      if (electionResult.election.status !== 'voting') {
        setError(`Voting is not currently open. Election status: ${electionResult.election.status}`);
        setIsLoading(false);
        return;
      }

      setElection(electionResult.election);

      // For MVP, use a default jurisdiction ID
      // In production, this would come from the credential
      const jurisdictionId = "US"; // Default to US federal

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
  };

  const handleSingleChoice = (questionId: string, candidateId: string) => {
    setSelections(prev => ({
      ...prev,
      [questionId]: candidateId,
    }));
  };

  const handleMultiChoice = (questionId: string, candidateId: string, maxSelections: number) => {
    setSelections(prev => {
      const current = (prev[questionId] as string[]) || [];
      const isSelected = current.includes(candidateId);

      let newSelection: string[];
      if (isSelected) {
        newSelection = current.filter(id => id !== candidateId);
      } else {
        if (current.length >= maxSelections) {
          return prev; // Don't allow more than max
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
    // Validate all questions are answered
    if (!ballot) return;

    const allQuestions = ballot.sections.flatMap(s => s.questions);
    const unanswered = allQuestions.filter(q => !selections[q.id] ||
      (Array.isArray(selections[q.id]) && selections[q.id].length === 0)
    );

    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }

    // Store selections and navigate to review
    sessionStorage.setItem("ballotSelections", JSON.stringify(selections));
    router.push(`/vote/${electionId}/review`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <LoaderIcon className="size-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your ballot...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

  const allQuestions = ballot.sections.flatMap(s => s.questions);
  const answeredCount = Object.keys(selections).filter(qId => {
    const sel = selections[qId];
    return sel && (Array.isArray(sel) ? sel.length > 0 : true);
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{election.name}</h1>
          <p className="text-muted-foreground">{election.description}</p>
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="secondary">
              {answeredCount} of {allQuestions.length} answered
            </Badge>
            {ballot.voter && (
              <span className="text-muted-foreground">
                Jurisdiction: {ballot.voter.jurisdictionName}
              </span>
            )}
          </div>
        </div>

        {/* Ballot Sections */}
        {ballot.sections.map((section, sectionIdx) => (
          <Card key={section.jurisdiction.id}>
            <CardHeader>
              <CardTitle>{section.jurisdiction.name}</CardTitle>
              <CardDescription>
                {section.jurisdiction.type} - {section.questions.length} question(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.questions.map((question, questionIdx) => {
                const isAnswered = selections[question.id] &&
                  (Array.isArray(selections[question.id])
                    ? (selections[question.id] as string[]).length > 0
                    : true);

                return (
                  <div key={question.id} className="space-y-4 pb-6 border-b last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{question.title}</h3>
                          {isAnswered && (
                            <CheckCircleIcon className="size-4 text-green-600" />
                          )}
                        </div>
                        {question.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {question.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {question.questionType === 'single_choice' && 'Choose One'}
                            {question.questionType === 'multi_choice' && `Choose up to ${question.maxSelections}`}
                            {question.questionType === 'yes_no' && 'Yes or No'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Single Choice */}
                    {question.questionType === 'single_choice' && (
                      <RadioGroup
                        value={selections[question.id] as string}
                        onValueChange={(value) => handleSingleChoice(question.id, value)}
                      >
                        {question.candidates.map((candidate) => (
                          <div key={candidate.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value={candidate.id} id={candidate.id} />
                            <Label htmlFor={candidate.id} className="flex-1 cursor-pointer">
                              <div className="font-medium">{candidate.name}</div>
                              {candidate.party && (
                                <div className="text-xs text-muted-foreground">{candidate.party}</div>
                              )}
                              {candidate.description && (
                                <div className="text-xs text-muted-foreground mt-1">{candidate.description}</div>
                              )}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {/* Multi Choice */}
                    {question.questionType === 'multi_choice' && (
                      <div className="space-y-2">
                        {question.candidates.map((candidate) => {
                          const isChecked = (selections[question.id] as string[] || []).includes(candidate.id);
                          const currentCount = (selections[question.id] as string[] || []).length;
                          const isDisabled = !isChecked && currentCount >= question.maxSelections;

                          return (
                            <div
                              key={candidate.id}
                              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                                isDisabled ? 'opacity-50' : 'hover:bg-muted/50'
                              }`}
                            >
                              <Checkbox
                                id={candidate.id}
                                checked={isChecked}
                                disabled={isDisabled}
                                onCheckedChange={() => handleMultiChoice(question.id, candidate.id, question.maxSelections)}
                              />
                              <Label htmlFor={candidate.id} className="flex-1 cursor-pointer">
                                <div className="font-medium">{candidate.name}</div>
                                {candidate.party && (
                                  <div className="text-xs text-muted-foreground">{candidate.party}</div>
                                )}
                                {candidate.description && (
                                  <div className="text-xs text-muted-foreground mt-1">{candidate.description}</div>
                                )}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {/* Review Button */}
        <Card className="sticky bottom-4 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold">
                  {answeredCount === allQuestions.length ? (
                    <span className="text-green-600 flex items-center gap-2">
                      <CheckCircleIcon className="size-5" />
                      All questions answered
                    </span>
                  ) : (
                    <span>Progress: {answeredCount} of {allQuestions.length}</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {allQuestions.length - answeredCount > 0 && (
                    `${allQuestions.length - answeredCount} question(s) remaining`
                  )}
                </div>
              </div>
              <Button
                size="lg"
                onClick={handleReviewBallot}
                disabled={answeredCount !== allQuestions.length}
              >
                Review Ballot
                <ChevronRightIcon className="size-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
