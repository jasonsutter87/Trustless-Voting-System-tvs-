import Link from "next/link";

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const recentElections = [
  {
    id: "1",
    title: "Board of Directors Election 2025",
    status: "active",
    voters: 1247,
    totalVotes: 892,
    endDate: "2025-01-15",
  },
  {
    id: "2",
    title: "Annual Budget Approval",
    status: "draft",
    voters: 3500,
    totalVotes: 0,
    endDate: "2025-02-01",
  },
  {
    id: "3",
    title: "Policy Amendment Vote",
    status: "completed",
    voters: 2100,
    totalVotes: 1987,
    endDate: "2024-12-20",
  },
];

export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Elections Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage and monitor your organization's elections
          </p>
        </div>
        <Link
          href="/elections/new"
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          New Election
        </Link>
      </div>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Election statistics
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Active Elections
            </p>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              1
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              Currently running
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Total Voters
            </p>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              6,847
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Across all elections
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Participation Rate
            </p>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              71.5%
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Average across active
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="recent-elections-heading">
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 id="recent-elections-heading" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Recent Elections
            </h2>
          </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {recentElections.map((election) => {
            const getStatusClass = (status: string) => {
              if (status === "active") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
              if (status === "draft") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
              return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400";
            };

            return (
              <Link
                key={election.id}
                href={`/elections/${election.id}`}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {election.title}
                    </h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(election.status)}`}>
                      <span className="sr-only">Status: </span>
                      {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                    <span>{election.voters.toLocaleString()} voters</span>
                    <span>
                      {election.totalVotes.toLocaleString()} votes cast
                    </span>
                    <span>Ends {new Date(election.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-zinc-400" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
          <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <Link
              href="/elections"
              className="text-sm font-medium text-zinc-900 hover:text-zinc-700 focus:outline-none focus:underline dark:text-zinc-100 dark:hover:text-zinc-300"
            >
              View all elections →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
