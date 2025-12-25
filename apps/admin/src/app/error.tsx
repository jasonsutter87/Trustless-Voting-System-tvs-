"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * Next.js Error Page
 *
 * This component handles errors that occur during rendering, in Server Components,
 * and in Data Fetching. It automatically wraps route segments in a React Error Boundary.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (placeholder for future error reporting)
    console.error("Route error:", error);

    // TODO: Send error to monitoring service
    // errorReportingService.logError(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          {/* Error Icon */}
          <div className="mb-4 flex justify-center">
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

          <CardTitle className="text-center text-2xl">Something went wrong</CardTitle>
          <CardDescription className="text-center">
            An unexpected error occurred while loading this page.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Details - Only show in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="rounded-md bg-zinc-50 p-4 dark:bg-zinc-800">
              <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Error details:
              </p>
              <pre className="overflow-x-auto text-xs text-zinc-600 dark:text-zinc-400">
                {error.message}
              </pre>
              {error.digest && (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Digest: <span className="font-mono">{error.digest}</span>
                </p>
              )}
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300">
                    Stack trace
                  </summary>
                  <pre className="mt-2 overflow-x-auto text-xs text-zinc-500 dark:text-zinc-400">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Suggestions */}
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="font-medium">What can you try?</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Click the button below to try again</li>
              <li>Go back to the previous page</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button onClick={reset} className="w-full">
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full"
            >
              Go back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
