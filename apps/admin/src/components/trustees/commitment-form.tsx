'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { submitCommitment, type CeremonyStatus } from '@/lib/actions/trustees';

const hexRegex = /^[a-fA-F0-9]{64}$/;

const commitmentSchema = z.object({
  commitmentHash: z
    .string()
    .min(1, 'Commitment hash is required')
    .regex(hexRegex, 'Invalid hash format. Must be 64 hex characters'),
  feldmanCommitments: z
    .array(
      z.object({
        x: z.string().min(1, 'X coordinate is required').regex(/^\d+$/, 'Invalid coordinate'),
        y: z.string().min(1, 'Y coordinate is required').regex(/^\d+$/, 'Invalid coordinate'),
      })
    )
    .min(1, 'At least one Feldman commitment is required'),
});

type CommitmentFormData = z.infer<typeof commitmentSchema>;

interface CommitmentFormProps {
  electionId: string;
  trusteeId: string;
  trusteeName: string;
  onSuccess: (result: {
    status: 'awaiting_commitments' | 'finalized';
    ceremonyStatus?: CeremonyStatus;
    publicKey?: string;
  }) => void;
  onError?: (error: Error) => void;
}

type FormState = 'idle' | 'submitting' | 'success' | 'finalized' | 'error';

interface FinalizedResult {
  publicKey: string;
  threshold: number;
  totalParticipants: number;
}

export function CommitmentForm({
  electionId,
  trusteeId,
  trusteeName,
  onSuccess,
  onError,
}: CommitmentFormProps) {
  const [formState, setFormState] = useState<FormState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [finalizedResult, setFinalizedResult] = useState<FinalizedResult | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const form = useForm<CommitmentFormData>({
    resolver: zodResolver(commitmentSchema),
    defaultValues: {
      commitmentHash: '',
      feldmanCommitments: [],
    },
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'feldmanCommitments',
  });

  const isValid = form.formState.isValid && fields.length > 0;

  const handleSubmit = useCallback(
    async (data: CommitmentFormData) => {
      setFormState('submitting');
      setError(null);

      try {
        const result = await submitCommitment(electionId, trusteeId, {
          commitmentHash: data.commitmentHash,
          feldmanCommitments: data.feldmanCommitments,
        });

        if (result.status === 'finalized') {
          setFormState('finalized');
          setFinalizedResult({
            publicKey: result.publicKey,
            threshold: result.threshold,
            totalParticipants: result.totalParticipants,
          });
        } else {
          setFormState('success');
        }

        onSuccess(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Submission failed';
        setError(errorMessage);
        setFormState('error');
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    },
    [electionId, trusteeId, onSuccess, onError]
  );

  // Enable submit button based on validity
  useEffect(() => {
    form.trigger();
  }, [fields.length, form]);

  if (formState === 'finalized' && finalizedResult) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
            Ceremony Complete!
          </h3>
          <p className="mt-2 text-sm text-green-700 dark:text-green-300">
            All commitments have been received. The election public key has been generated.
          </p>
          <div className="mt-4 rounded-lg bg-green-100 p-4 dark:bg-green-900">
            <p className="text-xs font-medium text-green-800 dark:text-green-200">
              Election Public Key
            </p>
            <code className="mt-1 block break-all text-xs text-green-700 dark:text-green-300">
              {finalizedResult.publicKey}
            </code>
            <p className="mt-2 text-xs text-green-600 dark:text-green-400">
              Threshold: {finalizedResult.threshold} of {finalizedResult.totalParticipants}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Submit Commitment
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Trustee: <span className="font-medium">{trusteeName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex w-full items-center justify-between p-4"
          aria-label="How to generate your commitment"
        >
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            How to Generate Your Commitment
          </span>
          <svg
            className={`h-5 w-5 text-zinc-500 transition-transform ${
              showInstructions ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {showInstructions && (
          <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
            <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <span className="font-medium">1.</span> Use your private key to generate a
                random polynomial of degree (threshold - 1)
              </li>
              <li>
                <span className="font-medium">2.</span> Compute the commitment hash by
                hashing your polynomial coefficients
              </li>
              <li>
                <span className="font-medium">3.</span> Generate Feldman commitments by
                computing G^coefficient for each coefficient
              </li>
              <li>
                <span className="font-medium">4.</span> Enter the commitment hash and
                Feldman commitment points below
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Commitment Hash */}
          <FormField
            control={form.control}
            name="commitmentHash"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commitment Hash</FormLabel>
                <FormControl>
                  <Input
                    placeholder="64-character hex string (e.g., a1b2c3d4...)"
                    className="font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  The SHA-256 hash of your polynomial coefficients
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Feldman Commitments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                  Feldman Commitments
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Add the commitment points for each coefficient
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ x: '', y: '' })}
                aria-label="Add commitment point"
              >
                <svg
                  className="mr-1.5 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Commitment Point
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No commitment points added yet. Add at least one.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Commitment Point {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                        aria-label="Remove"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`feldmanCommitments.${index}.x`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>X Coordinate</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 12345678901234567890"
                                className="font-mono text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`feldmanCommitments.${index}.y`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Y Coordinate</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 98765432109876543210"
                                className="font-mono text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!isValid || formState === 'submitting'}
            >
              {formState === 'submitting' ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Commitment'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
