'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Play,
  Square,
  Calculator,
  Archive,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Bitcoin,
} from 'lucide-react';
import { updateElectionStatus, type Election } from '@/lib/actions/elections';

interface LifecycleControlsProps {
  election: Election;
  hasPublicKey: boolean;
  hasVoters: boolean;
  hasQuestions: boolean;
}

type StatusTransition = {
  from: Election['status'][];
  to: Election['status'];
  label: string;
  description: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  requiresConfirmation: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  showBitcoinAnchor?: boolean;
};

const transitions: StatusTransition[] = [
  {
    from: ['draft'],
    to: 'registration',
    label: 'Open Registration',
    description: 'Allow voters to register and receive credentials',
    icon: <Play className="h-4 w-4" />,
    variant: 'default',
    requiresConfirmation: true,
    confirmationTitle: 'Open Voter Registration?',
    confirmationMessage:
      'This will allow voters to register and receive their voting credentials. Make sure you have configured the voter registry.',
  },
  {
    from: ['registration'],
    to: 'voting',
    label: 'Start Voting',
    description: 'Open the election for voting',
    icon: <Play className="h-4 w-4" />,
    variant: 'default',
    requiresConfirmation: true,
    confirmationTitle: 'Start Voting?',
    confirmationMessage:
      'This will open the election for voting. The Merkle root will be anchored to Bitcoin for immutability. This action cannot be undone.',
    showBitcoinAnchor: true,
  },
  {
    from: ['voting'],
    to: 'tallying',
    label: 'Close Voting',
    description: 'Close the election and begin tallying',
    icon: <Square className="h-4 w-4" />,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmationTitle: 'Close Voting?',
    confirmationMessage:
      'This will close the election. No more votes will be accepted. The final Merkle root will be anchored to Bitcoin.',
    showBitcoinAnchor: true,
  },
  {
    from: ['tallying'],
    to: 'complete',
    label: 'Certify Results',
    description: 'Finalize and publish election results',
    icon: <CheckCircle className="h-4 w-4" />,
    variant: 'default',
    requiresConfirmation: true,
    confirmationTitle: 'Certify Results?',
    confirmationMessage:
      'This will certify and publish the final election results. Ensure all trustees have provided their decryption shares.',
  },
];

export function LifecycleControls({
  election,
  hasPublicKey,
  hasVoters,
  hasQuestions,
}: LifecycleControlsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<StatusTransition | null>(null);
  const [bitcoinAnchorStatus, setBitcoinAnchorStatus] = useState<{
    submitted?: boolean;
    pending?: string;
    error?: string;
  } | null>(null);

  const availableTransitions = transitions.filter((t) =>
    t.from.includes(election.status)
  );

  const canTransition = (transition: StatusTransition): { allowed: boolean; reason?: string } => {
    if (transition.to === 'registration') {
      if (!hasPublicKey) {
        return { allowed: false, reason: 'Complete the key ceremony first' };
      }
      if (!hasQuestions) {
        return { allowed: false, reason: 'Add at least one ballot question' };
      }
    }
    if (transition.to === 'voting') {
      if (!hasVoters) {
        return { allowed: false, reason: 'Add voters to the registry first' };
      }
    }
    return { allowed: true };
  };

  const handleTransitionClick = (transition: StatusTransition) => {
    setError(null);
    setBitcoinAnchorStatus(null);

    if (transition.requiresConfirmation) {
      setPendingTransition(transition);
      setDialogOpen(true);
    } else {
      executeTransition(transition);
    }
  };

  const executeTransition = async (transition: StatusTransition) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateElectionStatus(election.id, transition.to);

      if (result.bitcoinAnchor) {
        setBitcoinAnchorStatus(result.bitcoinAnchor);
      }

      setDialogOpen(false);
      setPendingTransition(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update election status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    // Archive is a special action, not a status transition
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement archive API
      alert('Archive functionality coming soon');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive election');
    } finally {
      setIsLoading(false);
    }
  };

  if (election.status === 'setup') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950" role="status" aria-live="polite">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-200">
              Key Ceremony Required
            </h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Complete the trustee key ceremony before you can advance the election.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {bitcoinAnchorStatus && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950" role="status" aria-live="polite">
          <Bitcoin className="h-4 w-4 text-orange-600" aria-hidden="true" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">
            Bitcoin Anchor Status
          </AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            {bitcoinAnchorStatus.submitted && 'Merkle root submitted to Bitcoin network.'}
            {bitcoinAnchorStatus.pending && `Pending: ${bitcoinAnchorStatus.pending}`}
            {bitcoinAnchorStatus.error && `Error: ${bitcoinAnchorStatus.error}`}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Election Controls
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage the election lifecycle. Current status:{' '}
          <span className="font-medium capitalize">{election.status}</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {availableTransitions.map((transition) => {
            const check = canTransition(transition);
            return (
              <div key={transition.to} className="flex flex-col">
                <Button
                  variant={transition.variant}
                  onClick={() => handleTransitionClick(transition)}
                  disabled={!check.allowed || isLoading}
                  aria-label={`${transition.label} - ${transition.description}`}
                  aria-disabled={!check.allowed || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="mr-2" aria-hidden="true">{transition.icon}</span>
                  )}
                  {transition.label}
                </Button>
                {!check.allowed && (
                  <span className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                    {check.reason}
                  </span>
                )}
              </div>
            );
          })}

          {election.status === 'complete' && (
            <Button variant="outline" onClick={handleArchive} disabled={isLoading}>
              <Archive className="mr-2 h-4 w-4" />
              Archive Election
            </Button>
          )}
        </div>

        {election.status === 'tallying' && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950" role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden="true" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">
                  Tallying in Progress
                </h4>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  Trustees need to provide their decryption shares to complete the tally.
                  Once all required shares are collected, you can certify the results.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingTransition?.confirmationTitle}</DialogTitle>
            <DialogDescription>
              {pendingTransition?.confirmationMessage}
            </DialogDescription>
          </DialogHeader>

          {pendingTransition?.showBitcoinAnchor && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
              <div className="flex items-start gap-3">
                <Bitcoin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Bitcoin Anchoring
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    The election Merkle root will be anchored to the Bitcoin blockchain
                    using OpenTimestamps for immutable proof of integrity.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant={pendingTransition?.variant}
              onClick={() => pendingTransition && executeTransition(pendingTransition)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {pendingTransition?.icon}
                  <span className="ml-2">Confirm</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
