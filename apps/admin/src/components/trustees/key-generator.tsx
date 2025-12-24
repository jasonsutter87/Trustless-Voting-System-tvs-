'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

interface KeyGeneratorProps {
  onKeyGenerated: (keyPair: KeyPair) => void;
  onError?: (error: Error) => void;
}

type GeneratorState = 'idle' | 'generating' | 'generated' | 'error';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function KeyGenerator({ onKeyGenerated, onError }: KeyGeneratorProps) {
  const [state, setState] = useState<GeneratorState>('idle');
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  const generateKeys = useCallback(async () => {
    setState('generating');
    setError(null);

    try {
      // Generate an ECDSA key pair for signing
      const cryptoKeyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        true, // extractable
        ['sign', 'verify']
      );

      // Export the keys
      const publicKeyBuffer = await crypto.subtle.exportKey(
        'spki',
        cryptoKeyPair.publicKey
      );
      const privateKeyBuffer = await crypto.subtle.exportKey(
        'pkcs8',
        cryptoKeyPair.privateKey
      );

      const newKeyPair: KeyPair = {
        publicKey: arrayBufferToBase64(publicKeyBuffer),
        privateKey: arrayBufferToBase64(privateKeyBuffer),
      };

      setKeyPair(newKeyPair);
      setState('generated');
      onKeyGenerated(newKeyPair);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to generate keys: ${errorMessage}`);
      setState('error');
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [onKeyGenerated, onError]);

  const handleRegenerate = () => {
    setShowRegenConfirm(true);
  };

  const confirmRegenerate = async () => {
    setShowRegenConfirm(false);
    await generateKeys();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const downloadPrivateKey = () => {
    if (!keyPair) return;

    const blob = new Blob([keyPair.privateKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trustee-private-key.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const obscureKey = (key: string) => {
    if (key.length <= 20) return '••••••••••••••••••••';
    return key.slice(0, 10) + '••••••••••••••••••••' + key.slice(-10);
  };

  if (state === 'idle') {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <svg
              className="h-8 w-8 text-zinc-600 dark:text-zinc-400"
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
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Generate a New Key Pair
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            As a trustee, you'll need a cryptographic key pair to participate in the
            key ceremony. Your private key must be kept secure and never shared.
          </p>
          <Button onClick={generateKeys} className="mt-4">
            Generate Key Pair
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'generating') {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-center gap-3">
          <svg
            className="h-5 w-5 animate-spin text-zinc-600 dark:text-zinc-400"
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
          <span className="text-zinc-600 dark:text-zinc-400">
            Generating secure key pair...
          </span>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Failed to Generate Keys
          </h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
          <Button onClick={generateKeys} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // state === 'generated'
  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <div className="flex gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h4 className="font-medium text-amber-800 dark:text-amber-200">
              Save Your Private Key Now
            </h4>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Keep your private key secure. You will need it to submit your
              commitment and participate in the decryption ceremony. It cannot be
              recovered if lost.
            </p>
          </div>
        </div>
      </div>

      {/* Public Key */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
            Public Key
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(keyPair?.publicKey || '')}
            aria-label="Copy public key"
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
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy Public Key
          </Button>
        </div>
        <code className="mt-2 block break-all rounded bg-zinc-100 px-3 py-2 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          {keyPair?.publicKey}
        </code>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Share this public key when registering as a trustee.
        </p>
      </div>

      {/* Private Key */}
      <div
        className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        data-testid="private-key-section"
      >
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
            Private Key
          </h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              aria-label={showPrivateKey ? 'Hide private key' : 'Show private key'}
            >
              <svg
                className="mr-1.5 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {showPrivateKey ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                )}
              </svg>
              {showPrivateKey ? 'Hide Private Key' : 'Show Private Key'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadPrivateKey}
              aria-label="Download private key"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Private Key
            </Button>
          </div>
        </div>
        <code className="mt-2 block break-all rounded bg-zinc-100 px-3 py-2 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          {showPrivateKey
            ? keyPair?.privateKey
            : obscureKey(keyPair?.privateKey || '')}
        </code>
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          Keep your private key secure and never share it with anyone.
        </p>
      </div>

      {/* Regenerate option */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleRegenerate}>
          Regenerate Keys
        </Button>
      </div>

      {/* Regeneration confirmation dialog */}
      <Dialog open={showRegenConfirm} onOpenChange={setShowRegenConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Keys?</DialogTitle>
            <DialogDescription>
              This will replace your current keys. Make sure you have not already
              submitted your public key to the ceremony.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This will replace your current keys. If you have already registered
            with your current public key, you will need to re-register.
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowRegenConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRegenerate}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
