'use client';

import type { BallotQuestion } from '@/lib/actions/ballot';

interface QuestionCardProps {
  question: BallotQuestion;
  onEdit: () => void;
  onDelete: () => void;
}

const questionTypeLabels = {
  single_choice: 'Single Choice',
  multi_choice: 'Multiple Choice',
  ranked_choice: 'Ranked Choice',
  yes_no: 'Yes/No',
  write_in: 'Write-In',
};

export function QuestionCard({ question, onEdit, onDelete }: QuestionCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {question.displayOrder + 1}
            </span>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
              {question.title}
            </h3>
          </div>
          {question.description && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {question.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {questionTypeLabels[question.questionType]}
            </span>
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {question.candidates.length} options
            </span>
            {question.maxSelections > 1 && (
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                Select up to {question.maxSelections}
              </span>
            )}
            {question.allowWriteIn && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                Write-in allowed
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1.5 text-zinc-600 hover:bg-red-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Candidates preview */}
      <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Options:</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {question.candidates.map((candidate) => (
            <span
              key={candidate.id}
              className="inline-flex items-center rounded bg-zinc-50 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {candidate.name}
              {candidate.party && (
                <span className="ml-1 text-zinc-400">({candidate.party})</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
