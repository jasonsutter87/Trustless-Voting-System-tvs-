'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Key, CheckCircle, Clock, Loader2, Copy, ExternalLink } from 'lucide-react';

interface Trustee {
  id: string;
  name: string;
  status: string;
  hasDecrypted?: boolean;
}

interface DecryptionStatusProps {
  electionId: string;
  trustees: Trustee[];
  threshold: number;
  totalTrustees: number;
}

export function DecryptionStatus({
  electionId,
  trustees,
  threshold,
  totalTrustees,
}: DecryptionStatusProps) {
  const router = useRouter();
  const [selectedTrustee, setSelectedTrustee] = useState<Trustee | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const decryptedCount = trustees.filter(t => t.hasDecrypted).length;
  const progress = (decryptedCount / threshold) * 100;
  const isComplete = decryptedCount >= threshold;

  const decryptionUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/ceremony/${electionId}/decrypt`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(decryptionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReminder = async (trustee: Trustee) => {
    // TODO: Implement send reminder API
    setSelectedTrustee(trustee);
    setDialogOpen(true);
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Decryption Ceremony
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isComplete
                ? 'Threshold reached! Results can now be revealed.'
                : `${threshold - decryptedCount} more share${threshold - decryptedCount === 1 ? '' : 's'} needed`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {decryptedCount} / {threshold}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">shares collected</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <Progress value={Math.min(progress, 100)} className="h-2" />
      </div>

      {/* Decryption link */}
      <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Share this link with trustees to collect their decryption shares:
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-white px-3 py-2 text-sm dark:bg-zinc-900">
            {decryptionUrl}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={decryptionUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* Trustee list */}
      <div className="mt-6">
        <h4 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Trustee Status
        </h4>
        <div className="space-y-2">
          {trustees.map((trustee) => (
            <div
              key={trustee.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    trustee.hasDecrypted
                      ? 'bg-green-100 dark:bg-green-900'
                      : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                >
                  {trustee.hasDecrypted ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {trustee.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    {trustee.hasDecrypted ? 'Share submitted' : 'Awaiting share'}
                  </p>
                </div>
              </div>
              {!trustee.hasDecrypted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSendReminder(trustee)}
                >
                  Send Reminder
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reminder Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Reminder</DialogTitle>
            <DialogDescription>
              Send a reminder to {selectedTrustee?.name} to submit their decryption share.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              An email will be sent to the trustee with instructions on how to submit their
              decryption share for this election.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // TODO: Implement actual reminder sending
                setDialogOpen(false);
              }}
            >
              Send Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
