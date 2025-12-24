'use client';

import { UseFormReturn } from 'react-hook-form';
import type { ElectionFormData } from '../election-wizard';

interface StepReviewProps {
  form: UseFormReturn<ElectionFormData>;
}

export function StepReview({ form }: StepReviewProps) {
  const values = form.getValues();

  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return 'Not set';
    const date = new Date(dateTimeStr);
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Review & Create
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Confirm your election details before creating.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Election Name
          </h3>
          <p className="mt-1 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            {values.name || 'Untitled Election'}
          </p>
        </div>

        {values.description && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Description
            </h3>
            <p className="mt-1 text-zinc-900 dark:text-zinc-100">
              {values.description}
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Voting Opens
            </h3>
            <p className="mt-1 text-zinc-900 dark:text-zinc-100">
              {formatDateTime(values.startTime)}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Voting Closes
            </h3>
            <p className="mt-1 text-zinc-900 dark:text-zinc-100">
              {formatDateTime(values.endTime)}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Security Threshold
          </h3>
          <p className="mt-1 text-zinc-900 dark:text-zinc-100">
            <span className="text-lg font-semibold">{values.threshold}</span>
            <span className="text-zinc-500 dark:text-zinc-400"> of </span>
            <span className="text-lg font-semibold">{values.totalTrustees}</span>
            <span className="text-zinc-500 dark:text-zinc-400"> trustees required</span>
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
          What happens next?
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
          <li>1. The election will be created in <strong>setup</strong> status.</li>
          <li>2. You'll need to invite <strong>{values.totalTrustees} trustees</strong> to complete the key ceremony.</li>
          <li>3. After the ceremony, you can add ballot questions and manage voters.</li>
        </ul>
      </div>
    </div>
  );
}
