"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: "Server configuration error",
      description: "There is a problem with the server configuration.",
    },
    AccessDenied: {
      title: "Access denied",
      description: "You do not have permission to sign in.",
    },
    Verification: {
      title: "Unable to verify",
      description: "The sign-in link is invalid or has expired.",
    },
    Default: {
      title: "Authentication error",
      description: "An error occurred during authentication.",
    },
  };

  const errorInfo = errorMessages[error || "Default"] || errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Error Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
              <svg
                className="h-8 w-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {errorInfo.title}
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {errorInfo.description}
            </p>
          </div>

          {/* Error Details */}
          {error && (
            <div className="mb-6 rounded-md bg-zinc-50 p-4 dark:bg-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Error code: <span className="font-mono">{error}</span>
              </p>
            </div>
          )}

          {/* Suggestions */}
          <div className="mb-6 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="font-medium">What can you do?</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Try signing in again</li>
              <li>Request a new magic link</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full rounded-md bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Auth error page
 * Displays error messages when authentication fails
 */
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
