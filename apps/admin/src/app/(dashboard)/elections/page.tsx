import Link from "next/link";

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

// Mock elections data
const elections = [
  {
    id: "1",
    title: "Board of Directors Election 2025",
    status: "active",
    voters: 1247,
    totalVotes: 892,
    startDate: "2025-01-01",
    endDate: "2025-01-15",
    createdAt: "2024-12-15",
  },
  {
    id: "2",
    title: "Annual Budget Approval",
    status: "draft",
    voters: 3500,
    totalVotes: 0,
    startDate: "2025-01-20",
    endDate: "2025-02-01",
    createdAt: "2024-12-20",
  },
  {
    id: "3",
    title: "Policy Amendment Vote",
    status: "completed",
    voters: 2100,
    totalVotes: 1987,
    startDate: "2024-12-10",
    endDate: "2024-12-20",
    createdAt: "2024-12-01",
  },
  {
    id: "4",
    title: "Committee Member Selection",
    status: "scheduled",
    voters: 850,
    totalVotes: 0,
    startDate: "2025-02-15",
    endDate: "2025-02-28",
    createdAt: "2024-12-22",
  },
];

const statusStyles = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function ElectionsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Elections
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage all your organization's elections
          </p>
        </div>
        <Link
          href="/elections/new"
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          aria-label="Create new election"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          New Election
        </Link>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4" role="search">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          <label htmlFor="search-elections" className="sr-only">
            Search elections
          </label>
          <input
            id="search-elections"
            type="search"
            placeholder="Search elections..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label="Open filter options"
        >
          <FilterIcon className="h-4 w-4" aria-hidden="true" />
          Filter
        </button>
      </div>

      {/* Elections table */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">List of all elections</caption>
            <thead className="border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Election
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Voters
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Votes Cast
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Period
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {elections.map((election) => {
                const participationRate = election.voters > 0
                  ? ((election.totalVotes / election.voters) * 100).toFixed(1)
                  : "0.0";

                return (
                  <tr
                    key={election.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {election.title}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        Created {new Date(election.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          statusStyles[election.status as keyof typeof statusStyles]
                        }`}
                      >
                        <span className="sr-only">Status: </span>
                        {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                      {election.voters.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-900 dark:text-zinc-100">
                        {election.totalVotes.toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {participationRate}% turnout
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-900 dark:text-zinc-100">
                        {new Date(election.startDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        to {new Date(election.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/elections/${election.id}`}
                        className="text-sm font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                        aria-label={`View ${election.title} details`}
                      >
                        View <span aria-hidden="true">→</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
