'use client';

import type { VoterStats } from '@/lib/actions/voters';

interface VoterStatsCardProps {
  stats: VoterStats | null;
  isLoading?: boolean;
}

interface StatItemProps {
  label: string;
  value: number;
  total?: number;
  color: string;
}

function StatItem({ label, value, total, color }: StatItemProps) {
  const percentage = total && total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {value.toLocaleString()}
          {total !== undefined && (
            <span className="ml-1 text-zinc-500">({percentage}%)</span>
          )}
        </span>
      </div>
      {total !== undefined && (
        <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function VoterStatsCard({ stats, isLoading = false }: VoterStatsCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-8 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    {
      label: 'Total Voters',
      value: stats.total,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'Credentials Generated',
      value: stats.credentialsGenerated,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      ),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      label: 'Credentials Sent',
      value: stats.credentialsSent,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
    },
    {
      label: 'Voted',
      value: stats.voted,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
  ];

  const jurisdictionEntries = Object.entries(stats.byJurisdiction);

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <span className={card.color}>{card.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Section */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Voter Progress
        </h3>
        <div className="space-y-4">
          <StatItem
            label="Credentials Generated"
            value={stats.credentialsGenerated}
            total={stats.total}
            color="bg-purple-500"
          />
          <StatItem
            label="Credentials Sent"
            value={stats.credentialsSent}
            total={stats.total}
            color="bg-amber-500"
          />
          <StatItem
            label="Voted"
            value={stats.voted}
            total={stats.total}
            color="bg-green-500"
          />
        </div>
      </div>

      {/* Jurisdiction Breakdown */}
      {jurisdictionEntries.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            By Jurisdiction
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="pb-2 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Jurisdiction
                  </th>
                  <th className="pb-2 text-right text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Total
                  </th>
                  <th className="pb-2 text-right text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Voted
                  </th>
                  <th className="pb-2 text-right text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Turnout
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {jurisdictionEntries.map(([name, data]) => {
                  const turnout = data.total > 0 ? Math.round((data.voted / data.total) * 100) : 0;
                  return (
                    <tr key={name}>
                      <td className="py-2 text-zinc-900 dark:text-zinc-100">{name}</td>
                      <td className="py-2 text-right text-zinc-600 dark:text-zinc-400">
                        {data.total.toLocaleString()}
                      </td>
                      <td className="py-2 text-right text-zinc-600 dark:text-zinc-400">
                        {data.voted.toLocaleString()}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            turnout >= 50
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : turnout >= 25
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {turnout}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
