'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { InviteTrustee } from './invite-trustee';
import type { Trustee } from '@/lib/actions/trustees';

interface TrusteeListProps {
  electionId: string;
  trustees: Trustee[];
  totalRequired: number;
  canInvite: boolean;
}

const statusStyles = {
  registered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  committed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  share_received: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const statusLabels = {
  registered: 'Registered',
  committed: 'Committed',
  share_received: 'Complete',
};

export function TrusteeList({ electionId, trustees, totalRequired, canInvite }: TrusteeListProps) {
  const router = useRouter();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
  };

  const spotsRemaining = totalRequired - trustees.length;

  if (trustees.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <svg
            className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          No Trustees Yet
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Add {totalRequired} trustees to complete the key ceremony.
        </p>
        {canInvite && (
          <Button onClick={() => setIsInviteOpen(true)} className="mt-4">
            Add First Trustee
          </Button>
        )}

        <InviteTrustee
          open={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          electionId={electionId}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {trustees.length} of {totalRequired} trustees registered
          </p>
          {spotsRemaining > 0 && canInvite && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {spotsRemaining} more needed to complete ceremony
            </p>
          )}
        </div>
        {canInvite && spotsRemaining > 0 && (
          <Button onClick={() => setIsInviteOpen(true)}>
            Add Trustee
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {trustees.map((trustee, index) => (
          <div
            key={trustee.id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {trustee.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  Share index: {trustee.shareIndex ?? 'Pending'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusStyles[trustee.status]
                }`}
              >
                {statusLabels[trustee.status]}
              </span>
            </div>
          </div>
        ))}
      </div>

      <InviteTrustee
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        electionId={electionId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
