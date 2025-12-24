import Link from "next/link";

// Skip static generation - auth needs runtime
export const dynamic = 'force-dynamic';

/**
 * Home/Landing page
 * Simple landing - auth check happens via middleware
 */
export default function Home() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-2xl text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            VeilSuite Admin
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Secure Election Administration Portal
          </p>
        </div>

        {/* Features */}
        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex justify-center">
              <svg
                className="h-8 w-8 text-zinc-900 dark:text-zinc-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Secure
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              End-to-end encrypted voting system
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex justify-center">
              <svg
                className="h-8 w-8 text-zinc-900 dark:text-zinc-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Transparent
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Verifiable and auditable results
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex justify-center">
              <svg
                className="h-8 w-8 text-zinc-900 dark:text-zinc-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Fast
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Real-time election management
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign in to Admin Portal
          </Link>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Secure authentication with magic links
          </p>
        </div>
      </div>
    </div>
  );
}
