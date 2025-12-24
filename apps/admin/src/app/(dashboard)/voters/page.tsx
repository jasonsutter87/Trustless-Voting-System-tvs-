export default function VotersPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Voters
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage voter registration and eligibility
        </p>
      </div>

      {/* Placeholder */}
      <div className="rounded-lg border border-zinc-200 bg-white p-12 dark:border-zinc-800 dark:bg-zinc-900">
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Voter Management
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            This page will provide tools to:
          </p>
          <ul className="mt-4 space-y-2 text-left text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
              View and search registered voters
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
              Import voter lists from CSV or other sources
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
              Manage voter groups and segments
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
              Track voter eligibility and participation
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
              Export voter data and reports
            </li>
          </ul>
          <div className="mt-8">
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Voter management features coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
