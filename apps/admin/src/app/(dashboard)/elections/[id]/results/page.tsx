import Link from 'next/link';
import { getElection, getElectionResults } from '@/lib/actions/elections';
import { getTrustees } from '@/lib/actions/trustees';
import { ResultsDisplay } from '@/components/results/results-display';
import { DecryptionStatus } from '@/components/results/decryption-status';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ResultsPage({ params }: Props) {
  const { id } = await params;

  let election;
  let results: { candidate: { id: string; name: string; position: number }; votes: number }[] = [];
  let trustees: { trustees: Array<{ id: string; name: string; status: string; hasDecrypted?: boolean }> } = { trustees: [] };
  let error: string | null = null;

  try {
    const [electionResult, trusteesResult] = await Promise.all([
      getElection(id),
      getTrustees(id),
    ]);
    election = electionResult.election;
    trustees = trusteesResult;

    // Only fetch results if election is in tallying or complete status
    if (election.status === 'tallying' || election.status === 'complete') {
      try {
        const resultsData = await getElectionResults(id);
        results = resultsData.results;
      } catch {
        // Results may not be available yet during tallying
      }
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load election';
  }

  if (error || !election) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
          Error Loading Results
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

  // Show message for elections not yet ready for results
  if (!['tallying', 'complete'].includes(election.status)) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Election Results
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            View and manage election results.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
            <svg
              className="h-6 w-6 text-zinc-500 dark:text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Results Not Available Yet
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Results will be available after voting closes and tallying begins.
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
            Current status:{' '}
            <span className="font-medium capitalize">{election.status}</span>
          </p>
        </div>
      </div>
    );
  }

  // Calculate decryption progress
  const trusteesWithDecryption = trustees.trustees.filter(t => t.hasDecrypted);
  const decryptionProgress = {
    completed: trusteesWithDecryption.length,
    required: election.threshold,
    total: election.totalTrustees,
  };

  const hasEnoughDecryptions = decryptionProgress.completed >= decryptionProgress.required;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Election Results
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {election.status === 'tallying'
            ? 'Collect trustee decryption shares to reveal results.'
            : 'Final certified results for this election.'}
        </p>
      </div>

      {/* Decryption Status (only show during tallying) */}
      {election.status === 'tallying' && (
        <DecryptionStatus
          electionId={id}
          trustees={trustees.trustees}
          threshold={election.threshold}
          totalTrustees={election.totalTrustees}
        />
      )}

      {/* Results Display */}
      {(hasEnoughDecryptions || election.status === 'complete') && results.length > 0 ? (
        <ResultsDisplay
          election={election}
          results={results}
          isCertified={election.status === 'complete'}
        />
      ) : election.status === 'tallying' ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950">
          <h3 className="text-lg font-medium text-amber-800 dark:text-amber-200">
            Awaiting Decryption Shares
          </h3>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            Need {decryptionProgress.required - decryptionProgress.completed} more trustee
            {decryptionProgress.required - decryptionProgress.completed === 1 ? '' : 's'} to
            provide decryption shares before results can be revealed.
          </p>
        </div>
      ) : null}

      {/* Election metadata */}
      {election.status === 'complete' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-medium text-green-800 dark:text-green-200">
                Results Certified
              </h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                These results have been certified and are final. The election data has been
                anchored to Bitcoin for permanent, tamper-proof verification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
