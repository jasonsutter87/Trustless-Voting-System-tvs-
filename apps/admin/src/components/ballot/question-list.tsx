'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { QuestionCard } from './question-card';
import { QuestionForm } from './question-form';
import type { BallotQuestion } from '@/lib/actions/ballot';

interface QuestionListProps {
  electionId: string;
  questions: BallotQuestion[];
  canEdit: boolean;
}

export function QuestionList({ electionId, questions, canEdit }: QuestionListProps) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BallotQuestion | undefined>();

  const handleSuccess = () => {
    router.refresh();
  };

  const handleEdit = (question: BallotQuestion) => {
    setEditingQuestion(question);
    setIsFormOpen(true);
  };

  const handleDelete = async (question: BallotQuestion) => {
    // TODO: Implement delete API
    if (confirm(`Delete "${question.title}"?`)) {
      console.log('Delete question:', question.id);
      router.refresh();
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingQuestion(undefined);
  };

  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <svg
            className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          No Ballot Questions
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Add questions that voters will answer on their ballot.
        </p>
        {canEdit && (
          <Button onClick={() => setIsFormOpen(true)} className="mt-4">
            Add First Question
          </Button>
        )}

        <QuestionForm
          open={isFormOpen}
          onClose={handleCloseForm}
          electionId={electionId}
          displayOrder={0}
          onSuccess={handleSuccess}
          existingQuestion={editingQuestion}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {questions.length} question{questions.length !== 1 ? 's' : ''} on ballot
        </p>
        {canEdit && (
          <Button onClick={() => setIsFormOpen(true)}>
            Add Question
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            onEdit={() => handleEdit(question)}
            onDelete={() => handleDelete(question)}
          />
        ))}
      </div>

      <QuestionForm
        open={isFormOpen}
        onClose={handleCloseForm}
        electionId={electionId}
        displayOrder={questions.length}
        onSuccess={handleSuccess}
        existingQuestion={editingQuestion}
      />
    </div>
  );
}
