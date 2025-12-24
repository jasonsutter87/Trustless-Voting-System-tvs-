import Link from 'next/link';
import { getElection, type CeremonyStatus as CeremonyStatusType } from '@/lib/actions/elections';
import { getTrustees } from '@/lib/actions/trustees';
import { TrusteeList } from '@/components/trustees/trustee-list';
import { CeremonyStatus } from '@/components/trustees/ceremony-status';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TrusteesPage({ params }: Props) {
  const { id } = await params;

  let election;
  let publicKey: string | undefined;
  let ceremonyStatus;
  let trustees: Awaited<ReturnType<typeof getTrustees>>['trustees'] = [];
  let error: string | null = null;

  try {
    const [electionResult, trusteesResult] = await Promise.all([
      getElection(id),
      getTrustees(id),
    ]);
    election = electionResult.election;
    publicKey = electionResult.publicKey;
    ceremonyStatus = electionResult.ceremonyStatus || trusteesResult.ceremonyStatus;
    trustees = trusteesResult.trustees;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load trustees';
  }

  if (error || !election) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
          Error Loading Trustees
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

  // Can only invite trustees during setup
  const canInvite = election.status === 'setup';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Trustee Management
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage the key holders for this election's threshold encryption.
        </p>
      </div>

      {/* Ceremony status */}
      <CeremonyStatus status={ceremonyStatus} publicKey={publicKey} />

      {/* Trustee list */}
      <div>
        <h3 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Trustees
        </h3>
        <TrusteeList
          electionId={id}
          trustees={trustees}
          totalRequired={election.totalTrustees}
          canInvite={canInvite}
        />
      </div>

      {/* Instructions */}
      {canInvite && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            How the Key Ceremony Works
          </h3>
          <ol className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <span className="font-medium">1. Registration:</span> Each trustee generates
              a key pair using the ceremony client and shares their public key.
            </li>
            <li>
              <span className="font-medium">2. Commitment:</span> Trustees create and submit
              Feldman commitments to their secret shares.
            </li>
            <li>
              <span className="font-medium">3. Distribution:</span> After all commitments are
              received, shares are distributed to each trustee.
            </li>
            <li>
              <span className="font-medium">4. Finalization:</span> The election public key
              is generated. {election.threshold} of {election.totalTrustees} trustees are
              needed to decrypt results.
            </li>
          </ol>
        </div>
      )}

      {/* Ceremony complete message */}
      {ceremonyStatus?.phase === 'FINALIZED' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
            Key Ceremony Complete
          </h3>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            The election is ready for the next phase. You can now add ballot questions
            and configure the voter registry.
          </p>
          <Link
            href={`/elections/${id}/ballot`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-green-800 hover:text-green-900 dark:text-green-200 dark:hover:text-green-100"
          >
            Build Ballot →
          </Link>
        </div>
      )}
    </div>
  );
}
