'use client';

import { useState } from 'react';
import type { BallotQuestion } from '@/lib/actions/ballot';

interface BallotPreviewProps {
  electionName: string;
  questions: BallotQuestion[];
}

const questionTypeLabels = {
  single_choice: 'Select one',
  multi_choice: 'Select up to',
  ranked_choice: 'Rank your choices',
  yes_no: 'Yes or No',
  write_in: 'Write-in response',
};

export function BallotPreview({ electionName, questions }: BallotPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="space-y-4">
      {/* View mode toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Preview how voters will see the ballot
        </p>
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setViewMode('desktop')}
            className={`px-3 py-1.5 text-sm font-medium ${
              viewMode === 'desktop'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`px-3 py-1.5 text-sm font-medium ${
              viewMode === 'mobile'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            Mobile
          </button>
        </div>
      </div>

      {/* Preview container */}
      <div
        className={`mx-auto rounded-lg border border-zinc-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950 ${
          viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
        }`}
      >
        {/* Header */}
        <div className="border-b border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {electionName}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Please review all questions before submitting your ballot.
          </p>
        </div>

        {/* Questions */}
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {questions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-zinc-500 dark:text-zinc-400">
                No questions added yet.
              </p>
            </div>
          ) : (
            questions.map((question, index) => (
              <div key={question.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {question.title}
                    </h3>
                    {question.description && (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {question.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                      {questionTypeLabels[question.questionType]}
                      {question.questionType === 'multi_choice' && ` ${question.maxSelections}`}
                    </p>

                    {/* Options */}
                    <div className="mt-3 space-y-2">
                      {question.candidates.map((candidate) => (
                        <label
                          key={candidate.id}
                          className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                        >
                          {question.questionType === 'multi_choice' ? (
                            <input
                              type="checkbox"
                              disabled
                              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
                            />
                          ) : (
                            <input
                              type="radio"
                              name={`preview-${question.id}`}
                              disabled
                              className="h-4 w-4 border-zinc-300 dark:border-zinc-700"
                            />
                          )}
                          <div className="flex-1">
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {candidate.name}
                            </span>
                            {candidate.party && (
                              <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-500">
                                ({candidate.party})
                              </span>
                            )}
                            {candidate.description && (
                              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                                {candidate.description}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                      {question.allowWriteIn && (
                        <div className="rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
                          <p className="text-sm text-zinc-500 dark:text-zinc-500">
                            Write-in option available
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            disabled
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Submit Ballot (Preview Only)
          </button>
          <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-500">
            Your vote will be encrypted before submission
          </p>
        </div>
      </div>
    </div>
  );
}
