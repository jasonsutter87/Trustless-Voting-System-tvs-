import Link from "next/link";

/**
 * Verify Request page
 * Shown after user submits their email for magic link authentication
 */
export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Check your email
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              A sign-in link has been sent to your email address
            </p>
          </div>

          {/* Instructions */}
          <div className="mb-6 space-y-3 rounded-md bg-zinc-50 p-4 dark:bg-zinc-800">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                  1
                </span>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                Check your inbox for an email from VeilSuite Admin
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                  2
                </span>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                Click the magic link in the email to sign in
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                  3
                </span>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                You'll be automatically signed in to your admin account
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="mb-6 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="font-medium">Can't find the email?</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>The link will expire in 24 hours</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              Back to login
            </Link>
          </div>

          {/* Development Notice */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Development Mode:</strong> Check your terminal console
                for the magic link URL.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
