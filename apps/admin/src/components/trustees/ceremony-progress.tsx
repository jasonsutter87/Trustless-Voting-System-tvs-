'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { CeremonyStatus, Trustee } from '@/lib/actions/trustees';

interface CeremonyProgressProps {
  status: CeremonyStatus;
  trustees: Array<{
    id: string;
    name: string;
    status: Trustee['status'];
  }>;
  threshold: number;
  totalTrustees: number;
  publicKey?: string;
  onRefresh: () => void | Promise<void>;
  autoRefresh?: boolean;
  autoRefreshInterval?: number;
  showTimeEstimate?: boolean;
  compact?: boolean;
}

const phaseConfig = {
  CREATED: {
    label: 'Not Started',
    step: 0,
    color: 'zinc',
  },
  REGISTRATION: {
    label: 'Registration',
    step: 1,
    color: 'blue',
  },
  COMMITMENT: {
    label: 'Commitment',
    step: 2,
    color: 'purple',
  },
  SHARE_DISTRIBUTION: {
    label: 'Distribution',
    step: 3,
    color: 'orange',
  },
  FINALIZED: {
    label: 'Complete',
    step: 4,
    color: 'green',
  },
};

const steps = [
  { id: 1, name: 'Registration', description: 'Trustees join the ceremony' },
  { id: 2, name: 'Commitment', description: 'Submit Feldman commitments' },
  { id: 3, name: 'Distribution', description: 'Distribute key shares' },
  { id: 4, name: 'Complete', description: 'Ceremony finalized' },
];

const trusteeStatusLabels = {
  registered: 'Registered',
  committed: 'Committed',
  share_received: 'Complete',
};

function calculateProgress(status: CeremonyStatus): number {
  const config = phaseConfig[status.phase];
  const stepWeight = 25; // Each step is 25%
  const baseProgress = (config.step - 1) * stepWeight;

  if (status.phase === 'CREATED') return 0;
  if (status.phase === 'FINALIZED') return 100;

  // Calculate within-step progress
  let withinStepProgress = 0;
  if (status.phase === 'REGISTRATION') {
    withinStepProgress = (status.registeredCount / status.requiredCount) * stepWeight;
  } else if (status.phase === 'COMMITMENT') {
    withinStepProgress = (status.committedCount / status.requiredCount) * stepWeight;
  } else if (status.phase === 'SHARE_DISTRIBUTION') {
    withinStepProgress = stepWeight * 0.5; // Halfway through this step
  }

  return Math.min(baseProgress + withinStepProgress, 100);
}

export function CeremonyProgress({
  status,
  trustees,
  threshold,
  totalTrustees,
  publicKey,
  onRefresh,
  autoRefresh = false,
  autoRefreshInterval = 10000,
  showTimeEstimate = false,
  compact = false,
}: CeremonyProgressProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const config = phaseConfig[status.phase];
  const progress = calculateProgress(status);
  const pendingTrustees = totalTrustees - trustees.length;
  const isFinalized = status.phase === 'FINALIZED';

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || isFinalized) return;

    const interval = setInterval(() => {
      onRefresh();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, autoRefreshInterval, isFinalized, onRefresh]);

  if (compact) {
    return (
      <div
        className="compact rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        data-testid="ceremony-progress"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                config.color === 'green'
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                  : config.color === 'blue'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              <span className="text-sm font-medium">{config.step}</span>
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{config.label}</p>
              <p className="text-xs text-zinc-500">
                {status.registeredCount} / {status.requiredCount} registered
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      data-testid="ceremony-progress"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Key Ceremony Progress
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Threshold: {threshold} of {totalTrustees} trustees required
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Refresh"
        >
          <svg
            className={`mr-1.5 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{config.label}</span>
          <span className="text-zinc-500">{Math.round(progress)}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
        >
          <div
            className={`h-full transition-all duration-500 ${
              isFinalized
                ? 'bg-green-500'
                : status.phase === 'COMMITMENT'
                ? 'bg-purple-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = config.step > step.id;
            const isCurrent = config.step === step.id;
            const isPending = config.step < step.id;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    data-testid={`step-${step.id}`}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {step.name}
                  </span>
                  {isCurrent && !isFinalized && (
                    <div
                      data-testid="pulse-indicator"
                      className="mt-1 h-1 w-1 animate-pulse rounded-full bg-blue-500"
                    />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-8 sm:w-16 ${
                      isCompleted ? 'bg-green-600' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Registered</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {status.registeredCount} / {status.requiredCount}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Committed</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {status.committedCount} / {status.requiredCount}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Threshold</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {threshold} of {totalTrustees}
          </p>
        </div>
      </div>

      {/* Time estimate */}
      {showTimeEstimate && !isFinalized && (
        <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Estimated time remaining: depends on trustee availability
        </div>
      )}

      {/* Trustee list */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Trustees</h4>
          {pendingTrustees > 0 && (
            <span className="text-sm text-amber-600 dark:text-amber-400">
              {pendingTrustees} more needed
            </span>
          )}
        </div>
        <div className="mt-3 space-y-2">
          {trustees.map((trustee) => (
            <div
              key={trustee.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {trustee.name}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  trustee.status === 'share_received'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : trustee.status === 'committed'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {trusteeStatusLabels[trustee.status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Public key display */}
      {isFinalized && publicKey && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <h4 className="font-medium text-green-800 dark:text-green-200">
            Election Public Key Generated
          </h4>
          <code className="mt-2 block break-all rounded bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
            {publicKey}
          </code>
        </div>
      )}
    </div>
  );
}
