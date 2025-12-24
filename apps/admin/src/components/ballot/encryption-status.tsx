'use client';

interface EncryptionStatusProps {
  status: 'pending' | 'ready' | 'active';
  publicKey?: string;
}

export function EncryptionStatus({ status, publicKey }: EncryptionStatusProps) {
  const statusConfig = {
    pending: {
      bg: 'bg-amber-50 dark:bg-amber-950',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-600 dark:text-amber-400',
      title: 'Encryption Pending',
      description: 'Complete the key ceremony to enable vote encryption.',
    },
    ready: {
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      title: 'Encryption Ready',
      description: 'Threshold key ceremony complete. Votes will be encrypted.',
    },
    active: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'Encryption Active',
      description: 'Voters are submitting encrypted ballots.',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.icon}`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {config.title}
          </h4>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {config.description}
          </p>
          {publicKey && (
            <div className="mt-3">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                Public Key (truncated):
              </p>
              <code className="mt-1 block break-all rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {publicKey.slice(0, 64)}...
              </code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
