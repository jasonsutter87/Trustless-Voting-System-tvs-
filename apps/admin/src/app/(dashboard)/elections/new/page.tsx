import Link from "next/link";

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export default function NewElectionPage() {
  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div>
        <Link
          href="/elections"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Elections
        </Link>
      </div>

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Create New Election
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Set up a new election for your organization
        </p>
      </div>

      {/* Form placeholder */}
      <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Election Creation Form
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            This form will allow you to configure:
          </p>
          <ul className="mt-4 space-y-2 text-left text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
              Election title and description
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
              Voting period (start and end dates)
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
              Eligible voters and voter groups
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
              Ballot questions and options
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
              Advanced settings and permissions
            </li>
          </ul>
          <div className="mt-8">
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Full election creation form coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
