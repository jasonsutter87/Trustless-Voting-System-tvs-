import Link from 'next/link';
import { getElection } from '@/lib/actions/elections';
import { getQuestions } from '@/lib/actions/ballot';
import { QuestionList } from '@/components/ballot/question-list';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BallotBuilderPage({ params }: Props) {
  const { id } = await params;

  let election;
  let questions: Awaited<ReturnType<typeof getQuestions>>['questions'] = [];
  let error: string | null = null;

  try {
    const [electionResult, questionsResult] = await Promise.all([
      getElection(id),
      getQuestions({ electionId: id }),
    ]);
    election = electionResult.election;
    questions = questionsResult.questions;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load ballot';
  }

  if (error || !election) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
          Error Loading Ballot
        </h2>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
        <Link
          href="/elections"
          className="mt-4 inline-block text-sm font-medium text-red-800 hover:text-red-900 dark:text-red-200 dark:hover:text-red-100"
        >
          ← Back to Elections
        </Link>
      </div>
    );
  }

  // Can only edit ballot in draft status
  const canEdit = election.status === 'draft' || election.status === 'setup';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Ballot Builder
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Configure the questions that appear on voter ballots.
        </p>
      </div>

      {/* Status warning */}
      {!canEdit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Read-only:</strong> The ballot cannot be modified after the election
            has moved past the draft phase.
          </p>
        </div>
      )}

      {/* Question list */}
      <QuestionList
        electionId={id}
        questions={questions}
        canEdit={canEdit}
      />

      {/* Tips */}
      {canEdit && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Ballot Tips
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <li>• Each question needs at least 2 options</li>
            <li>• Use "Single Choice" for elections with one winner</li>
            <li>• Use "Multiple Choice" when voters can select several options</li>
            <li>• "Ranked Choice" lets voters order their preferences</li>
            <li>• Enable "Write-in" to allow custom responses</li>
          </ul>
        </div>
      )}
    </div>
  );
}
