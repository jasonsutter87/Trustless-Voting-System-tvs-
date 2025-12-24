import Link from 'next/link';
import { getElection } from '@/lib/actions/elections';
import { getQuestions } from '@/lib/actions/ballot';
import { BallotPreview } from '@/components/preview/ballot-preview';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: Props) {
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
    error = err instanceof Error ? err.message : 'Failed to load preview';
  }

  if (error || !election) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
          Error Loading Preview
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Ballot Preview
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          See how voters will experience the ballot.
        </p>
      </div>

      {/* Preview notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Preview Mode:</strong> This is a read-only preview. Voters will see
          a similar interface when they access their ballot during the voting period.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Total Questions
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {questions.length}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Total Options
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {questions.reduce((sum, q) => sum + q.candidates.length, 0)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Election Status
          </p>
          <p className="mt-1 text-2xl font-semibold capitalize text-zinc-900 dark:text-zinc-100">
            {election.status}
          </p>
        </div>
      </div>

      {/* Ballot preview */}
      <BallotPreview electionName={election.name} questions={questions} />
    </div>
  );
}
