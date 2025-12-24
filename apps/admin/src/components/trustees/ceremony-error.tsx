'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export type ErrorType =
  | 'timeout'
  | 'network'
  | 'validation'
  | 'trustee_offline'
  | 'commitment_mismatch'
  | 'unknown';

export type ErrorSeverity = 'warning' | 'error' | 'critical';

export interface CeremonyErrorData {
  type: ErrorType;
  message: string;
  severity?: ErrorSeverity;
  trusteeId?: string;
  trusteeName?: string;
  field?: string;
  technicalDetails?: string;
  timestamp?: string;
}

interface CeremonyErrorProps {
  error: CeremonyErrorData;
  onRetry: () => void;
  onCancel: () => void;
  onContactSupport?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

const errorTypeLabels: Record<ErrorType, string> = {
  timeout: 'Timeout Error',
  network: 'Network Error',
  validation: 'Validation Error',
  trustee_offline: 'Trustee Offline',
  commitment_mismatch: 'Commitment Mismatch',
  unknown: 'Unknown Error',
};

const recoverySuggestions: Record<ErrorType, string[]> = {
  timeout: [
    'Wait a few moments and try again',
    'Check if other trustees are experiencing similar issues',
    'Ensure stable network connectivity',
  ],
  network: [
    'Check your internet connection',
    'Verify the API server is accessible',
    'Try refreshing the page',
  ],
  validation: [
    'Verify the input format matches the required specification',
    'Regenerate your commitment and try again',
    'Check for any typos in the entered values',
  ],
  trustee_offline: [
    'Contact the trustee directly to confirm their availability',
    'Ask the trustee to refresh their browser and rejoin',
    'Wait for the trustee to come back online',
  ],
  commitment_mismatch: [
    'This is a critical error that may indicate tampering',
    'Do not proceed with the ceremony',
    'Contact support immediately for investigation',
  ],
  unknown: [
    'Try refreshing the page',
    'Contact support if the issue persists',
  ],
};

const isCriticalError = (type: ErrorType): boolean => {
  return type === 'commitment_mismatch';
};

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timestamp;
  }
}

export function CeremonyError({
  error,
  onRetry,
  onCancel,
  onContactSupport,
  retryCount = 0,
  maxRetries = 3,
}: CeremonyErrorProps) {
  const [showDetails, setShowDetails] = useState(false);

  const severity = error.severity || (isCriticalError(error.type) ? 'critical' : 'warning');
  const isMaxRetriesReached = retryCount >= maxRetries;
  const showContactSupport = isCriticalError(error.type) || isMaxRetriesReached;
  const suggestions = recoverySuggestions[error.type] || recoverySuggestions.unknown;

  const severityStyles = {
    warning: {
      container: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950',
      icon: 'text-amber-600 dark:text-amber-400',
      title: 'text-amber-800 dark:text-amber-200',
      text: 'text-amber-700 dark:text-amber-300',
    },
    error: {
      container: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950',
      icon: 'text-orange-600 dark:text-orange-400',
      title: 'text-orange-800 dark:text-orange-200',
      text: 'text-orange-700 dark:text-orange-300',
    },
    critical: {
      container: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-800 dark:text-red-200',
      text: 'text-red-700 dark:text-red-300',
    },
  };

  const styles = severityStyles[severity];

  return (
    <div
      className={`rounded-lg border p-6 ${styles.container}`}
      data-testid="ceremony-error"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${styles.icon}`}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${styles.title}`}>
              Ceremony Error
            </h3>
            <p className={`mt-1 text-sm ${styles.text}`}>
              {errorTypeLabels[error.type] || 'Error'}
              {error.timestamp && (
                <span className="ml-2 text-xs opacity-75">
                  at {formatTimestamp(error.timestamp)}
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className={`rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/5 ${styles.icon}`}
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Error message */}
      <div className={`mt-4 ${styles.text}`}>
        <p className="text-sm font-medium">{error.message}</p>
        {error.trusteeName && (
          <p className="mt-1 text-sm">
            Affected trustee: <span className="font-medium">{error.trusteeName}</span>
          </p>
        )}
      </div>

      {/* Retry count */}
      {retryCount > 0 && (
        <div className={`mt-3 text-sm ${styles.text}`}>
          <span className="font-medium">Attempt {retryCount} of {maxRetries}</span>
          {isMaxRetriesReached && (
            <span className="ml-2 font-semibold">- Max retries reached</span>
          )}
        </div>
      )}

      {/* Recovery suggestions */}
      <div className="mt-4">
        <p className={`text-sm font-medium ${styles.title}`}>Recovery Steps:</p>
        <ul className={`mt-2 space-y-1 text-sm ${styles.text}`}>
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-current" />
              {suggestion}
            </li>
          ))}
        </ul>
      </div>

      {/* Technical details */}
      {error.technicalDetails && (
        <div className="mt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`flex items-center gap-1 text-sm font-medium ${styles.title}`}
            aria-label={showDetails ? 'Hide details' : 'Show details'}
          >
            {showDetails ? 'Hide' : 'Show'} Details
            <svg
              className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
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
          {showDetails && (
            <pre className={`mt-2 overflow-auto rounded-lg bg-black/5 p-3 text-xs dark:bg-white/5 ${styles.text}`}>
              {error.technicalDetails}
            </pre>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          onClick={onRetry}
          disabled={isMaxRetriesReached}
          variant={severity === 'critical' ? 'outline' : 'default'}
        >
          Retry
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel Ceremony
        </Button>
        {showContactSupport && onContactSupport && (
          <Button variant="outline" onClick={onContactSupport}>
            Contact Support
          </Button>
        )}
      </div>
    </div>
  );
}
