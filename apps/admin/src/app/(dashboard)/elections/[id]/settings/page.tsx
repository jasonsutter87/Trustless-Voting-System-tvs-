import Link from 'next/link';
import { getElection } from '@/lib/actions/elections';
import { SettingsForm } from '@/components/elections/settings-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { id } = await params;

  let election;
  let error: string | null = null;

  try {
    const result = await getElection(id);
    election = result.election;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load election';
  }

  if (error || !election) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
          Error Loading Settings
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

  // Can edit based on status
  const canEditBasics = ['setup', 'draft'].includes(election.status);
  const canEditDates = ['setup', 'draft', 'registration'].includes(election.status);
  const canEditThreshold = election.status === 'setup';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Election Settings
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Configure election details and parameters.
        </p>
      </div>

      <SettingsForm
        election={election}
        canEditBasics={canEditBasics}
        canEditDates={canEditDates}
        canEditThreshold={canEditThreshold}
      />

      {/* Danger zone */}
      {(election.status === 'setup' || election.status === 'draft') && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Danger Zone
          </h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            These actions are irreversible. Proceed with caution.
          </p>
          <div className="mt-4">
            <button
              disabled
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 opacity-50 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
            >
              Delete Election (Coming Soon)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
