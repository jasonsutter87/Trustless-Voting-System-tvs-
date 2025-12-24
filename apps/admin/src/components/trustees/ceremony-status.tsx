'use client';

import type { CeremonyStatus as CeremonyStatusType } from '@/lib/actions/elections';

interface CeremonyStatusProps {
  status: CeremonyStatusType | undefined;
  publicKey?: string;
}

const phaseConfig = {
  CREATED: {
    label: 'Not Started',
    description: 'Waiting for trustees to be invited',
    color: 'zinc',
    step: 0,
  },
  REGISTRATION: {
    label: 'Registration',
    description: 'Trustees are joining the ceremony',
    color: 'blue',
    step: 1,
  },
  COMMITMENT: {
    label: 'Commitment',
    description: 'Trustees are submitting their key shares',
    color: 'purple',
    step: 2,
  },
  SHARE_DISTRIBUTION: {
    label: 'Distribution',
    description: 'Key shares are being distributed',
    color: 'orange',
    step: 3,
  },
  FINALIZED: {
    label: 'Complete',
    description: 'Key ceremony successfully completed',
    color: 'green',
    step: 4,
  },
};

const steps = ['Registration', 'Commitment', 'Distribution', 'Complete'];

export function CeremonyStatus({ status, publicKey }: CeremonyStatusProps) {
  const phase = status?.phase || 'CREATED';
  const config = phaseConfig[phase];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Key Ceremony Status
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {config.description}
          </p>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            config.color === 'green'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : config.color === 'blue'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              : config.color === 'purple'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
              : config.color === 'orange'
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
              : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          {config.label}
        </div>
      </div>

      {/* Progress steps */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    index < config.step
                      ? 'bg-green-600 text-white'
                      : index === config.step
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {index < config.step ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-8 sm:w-16 ${
                    index < config.step ? 'bg-green-600' : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {status && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Registered
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {status.registeredCount} / {status.requiredCount}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Committed
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {status.committedCount} / {status.requiredCount}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Phase
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {config.label}
            </p>
          </div>
        </div>
      )}

      {/* Public key display */}
      {publicKey && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
            Election Public Key Generated
          </h4>
          <code className="mt-2 block break-all rounded bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
            {publicKey.slice(0, 100)}...
          </code>
        </div>
      )}
    </div>
  );
}
