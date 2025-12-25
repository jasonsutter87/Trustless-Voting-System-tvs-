import Link from 'next/link';
import { getElection } from '@/lib/actions/elections';
import { getTrustees } from '@/lib/actions/trustees';
import { getQuestions } from '@/lib/actions/ballot';
import { getVoterStats } from '@/lib/actions/voters';
import { LifecycleControls } from '@/components/elections/lifecycle-controls';

interface Props {
  params: Promise<{ id: string }>;
}

const statusStyles = {
  setup: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  draft: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  registration: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  voting: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  tallying: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  complete: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400',
};

const statusDescriptions = {
  setup: 'Waiting for trustees to complete the key ceremony',
  draft: 'Key ceremony complete. Add ballot questions and voters.',
  registration: 'Voters can register and receive credentials',
  voting: 'Election is live. Voters are casting ballots.',
  tallying: 'Voting closed. Trustees are decrypting results.',
  complete: 'Election complete. Results are finalized.',
};

export default async function ElectionDetailPage({ params }: Props) {
  const { id } = await params;

  let election;
  let ceremonyStatus;
  let publicKey;
  let trustees: { trustees: Array<{ id: string; name: string; status: string }> } = { trustees: [] };
  let questions: { questions: Array<{ id: string }> } = { questions: [] };
  let voterStats: { stats: { total: number; voted: number } | null } = { stats: null };
  let error: string | null = null;

  try {
    const result = await getElection(id);
    election = result.election;
    ceremonyStatus = result.ceremonyStatus;
    publicKey = result.publicKey;

    // Fetch related data
    const [trusteesResult, questionsResult, voterStatsResult] = await Promise.all([
      getTrustees(id).catch(() => ({ trustees: [] })),
      getQuestions({ electionId: id }).catch(() => ({ questions: [] })),
      getVoterStats(id).catch(() => ({ stats: null })),
    ]);
    trustees = trusteesResult;
    questions = questionsResult;
    voterStats = voterStatsResult;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load election';
  }

  if (error || !election) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
          Election Not Found
        </h2>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
          {error || 'Unable to load election details'}
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {election.name}
            </h1>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                statusStyles[election.status]
              }`}
            >
              {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {statusDescriptions[election.status]}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Ballot Questions
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {questions.questions.length}
          </p>
          <Link
            href={`/elections/${id}/ballot`}
            className="mt-2 inline-block text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Manage →
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Voters
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {voterStats.stats?.total || 0}
          </p>
          <Link
            href={`/elections/${id}/voters`}
            className="mt-2 inline-block text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Manage →
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Trustees
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {trustees.trustees.length} / {election.totalTrustees}
          </p>
          <Link
            href={`/elections/${id}/trustees`}
            className="mt-2 inline-block text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Manage →
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Security Threshold
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {election.threshold} of {election.totalTrustees}
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Required to decrypt
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Key Ceremony
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {ceremonyStatus?.phase || 'Unknown'}
          </p>
          {publicKey && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              Public key ready
            </p>
          )}
        </div>
      </div>

      {/* Election Lifecycle Controls */}
      <LifecycleControls
        election={election}
        hasPublicKey={!!publicKey}
        hasVoters={(voterStats.stats?.total || 0) > 0}
        hasQuestions={questions.questions.length > 0}
      />

      {/* Timeline */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Election Timeline
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Voting Opens
            </p>
            <p className="mt-1 text-zinc-900 dark:text-zinc-100">
              {formatDate(election.startTime)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Voting Closes
            </p>
            <p className="mt-1 text-zinc-900 dark:text-zinc-100">
              {formatDate(election.endTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      {election.description && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Description
          </h3>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {election.description}
          </p>
        </div>
      )}

      {/* Next steps based on status */}
      {election.status === 'setup' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950">
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
            Next Step: Complete Key Ceremony
          </h3>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            Invite {election.totalTrustees} trustees to participate in the key ceremony.
            The ceremony requires all trustees to register and submit their commitments.
          </p>
          <Link
            href={`/elections/${id}/trustees`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
          >
            Manage Trustees →
          </Link>
        </div>
      )}

      {election.status === 'draft' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
            Next Step: Configure Ballot
          </h3>
          <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            The key ceremony is complete. Now add ballot questions and configure
            the voter registry before opening registration.
          </p>
          <Link
            href={`/elections/${id}/ballot`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Build Ballot →
          </Link>
        </div>
      )}
    </div>
  );
}
