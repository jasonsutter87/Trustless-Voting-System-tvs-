'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CredentialBatchResult, SendCredentialsResult } from '@/lib/actions/voters';

type DistributionMethod = 'email' | 'download';

interface CredentialDialogProps {
  open: boolean;
  voterIds: string[];
  voterCount: number;
  onClose: () => void;
  onGenerateCredentials: (voterIds: string[]) => Promise<CredentialBatchResult>;
  onSendCredentials: (
    voterIds: string[],
    method: DistributionMethod
  ) => Promise<SendCredentialsResult>;
}

type DialogStep = 'generate' | 'generating' | 'distribute' | 'sending' | 'complete';

export function CredentialDialog({
  open,
  voterIds,
  voterCount,
  onClose,
  onGenerateCredentials,
  onSendCredentials,
}: CredentialDialogProps) {
  const [step, setStep] = useState<DialogStep>('generate');
  const [method, setMethod] = useState<DistributionMethod>('email');
  const [generateResult, setGenerateResult] = useState<CredentialBatchResult | null>(null);
  const [sendResult, setSendResult] = useState<SendCredentialsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep('generate');
    setMethod('email');
    setGenerateResult(null);
    setSendResult(null);
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    setStep('generating');
    setError(null);

    try {
      const result = await onGenerateCredentials(voterIds);
      setGenerateResult(result);
      setStep('distribute');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate credentials');
      setStep('generate');
    }
  }, [voterIds, onGenerateCredentials]);

  const handleSend = useCallback(async () => {
    setStep('sending');
    setError(null);

    try {
      const result = await onSendCredentials(voterIds, method);
      setSendResult(result);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send credentials');
      setStep('distribute');
    }
  }, [voterIds, method, onSendCredentials]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        handleClose();
      }
    },
    [handleClose]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'generate' && 'Generate Credentials'}
            {step === 'generating' && 'Generating Credentials...'}
            {step === 'distribute' && 'Distribute Credentials'}
            {step === 'sending' && 'Sending Credentials...'}
            {step === 'complete' && 'Distribution Complete'}
          </DialogTitle>
          <DialogDescription>
            {step === 'generate' &&
              `Generate unique voting credentials for ${voterCount} selected voter${voterCount !== 1 ? 's' : ''}.`}
            {step === 'generating' && 'Please wait while credentials are being generated.'}
            {step === 'distribute' && 'Choose how to distribute the credentials to voters.'}
            {step === 'sending' && 'Sending credentials to voters...'}
            {step === 'complete' && 'Credentials have been distributed successfully.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Generate Step */}
          {step === 'generate' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
                    <svg
                      className="h-5 w-5 text-purple-600 dark:text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {voterCount} voter{voterCount !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Each voter will receive a unique credential for voting
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  What happens when you generate credentials:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>A unique voting code is created for each voter</li>
                  <li>Credentials are cryptographically secured</li>
                  <li>Voters can use these credentials to cast their vote</li>
                  <li>Each credential can only be used once</li>
                </ul>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Generating Step */}
          {step === 'generating' && (
            <div className="flex flex-col items-center py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                Generating {voterCount} credential{voterCount !== 1 ? 's' : ''}...
              </p>
            </div>
          )}

          {/* Distribute Step */}
          {step === 'distribute' && generateResult && (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                <div className="flex items-center gap-3">
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
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {generateResult.generated} credential{generateResult.generated !== 1 ? 's' : ''} generated
                    </p>
                    {generateResult.failed > 0 && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        {generateResult.failed} failed
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  How would you like to distribute credentials?
                </p>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                    method === 'email'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value="email"
                    checked={method === 'email'}
                    onChange={() => setMethod('email')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">Send via Email</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Each voter will receive their credential directly to their registered email
                    </p>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                    method === 'download'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value="download"
                    checked={method === 'download'}
                    onChange={() => setMethod('download')}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">Download CSV</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Download a CSV file with all credentials for manual distribution
                    </p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Sending Step */}
          {step === 'sending' && (
            <div className="flex flex-col items-center py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                {method === 'email' ? 'Sending emails...' : 'Preparing download...'}
              </p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && sendResult && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4">
                <div className="mb-4 rounded-full bg-green-100 p-3 dark:bg-green-900">
                  <svg
                    className="h-8 w-8 text-green-600 dark:text-green-400"
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
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  {method === 'email'
                    ? `${sendResult.sent} email${sendResult.sent !== 1 ? 's' : ''} sent`
                    : 'Download ready'}
                </p>
                {sendResult.failed > 0 && (
                  <p className="text-amber-600 dark:text-amber-400">
                    {sendResult.failed} failed
                  </p>
                )}
              </div>

              {sendResult.downloadUrl && (
                <div className="text-center">
                  <a
                    href={sendResult.downloadUrl}
                    download
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Credentials CSV
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'generate' && (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleGenerate}>
                Generate Credentials
              </Button>
            </>
          )}
          {step === 'distribute' && (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Skip Distribution
              </Button>
              <Button type="button" onClick={handleSend}>
                {method === 'email' ? 'Send Emails' : 'Download CSV'}
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button type="button" onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
