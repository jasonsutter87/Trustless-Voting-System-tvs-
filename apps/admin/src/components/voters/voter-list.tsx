'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { Voter } from '@/lib/actions/voters';

interface VoterListProps {
  voters: Voter[];
  totalVoters: number;
  currentPage: number;
  pageSize: number;
  isLoading?: boolean;
  selectable?: boolean;
  selectedVoterIds?: string[];
  jurisdictions?: string[];
  sortable?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onPageChange: (page: number) => void;
  onVoterSelect?: (voterIds: string[]) => void;
  onVoterEdit: (voter: Voter) => void;
  onVoterDelete: (voter: Voter) => void;
  onGenerateCredential: (voter: Voter) => void;
  onSearch: (query: string) => void;
  onFilterChange: (filters: { status?: string; jurisdiction?: string }) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onBulkGenerateCredentials?: (voterIds: string[]) => void;
  onBulkDelete?: (voterIds: string[]) => void;
}

const statusLabels: Record<string, string> = {
  registered: 'Registered',
  credential_generated: 'Credential Generated',
  credential_sent: 'Credential Sent',
  voted: 'Voted',
};

const statusStyles: Record<string, string> = {
  registered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  credential_generated: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  credential_sent: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  voted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export function VoterList({
  voters,
  totalVoters,
  currentPage,
  pageSize,
  isLoading = false,
  selectable = false,
  selectedVoterIds = [],
  jurisdictions = [],
  sortable = false,
  sortBy,
  sortDirection = 'asc',
  onPageChange,
  onVoterSelect,
  onVoterEdit,
  onVoterDelete,
  onGenerateCredential,
  onSearch,
  onFilterChange,
  onSort,
  onBulkGenerateCredentials,
  onBulkDelete,
}: VoterListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalSelected, setInternalSelected] = useState<string[]>(selectedVoterIds);

  const totalPages = Math.ceil(totalVoters / pageSize);
  const showPagination = totalVoters > pageSize;

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        onSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  // Sync external selection - compare arrays by value to avoid infinite loops
  useEffect(() => {
    const isDifferent =
      internalSelected.length !== selectedVoterIds.length ||
      selectedVoterIds.some((id, i) => internalSelected[i] !== id);
    if (isDifferent) {
      setInternalSelected(selectedVoterIds);
    }
  }, [selectedVoterIds, internalSelected]);

  const handleSelectAll = useCallback(() => {
    if (internalSelected.length === voters.length) {
      setInternalSelected([]);
      onVoterSelect?.([]);
    } else {
      const allIds = voters.map((v) => v.id);
      setInternalSelected(allIds);
      onVoterSelect?.(allIds);
    }
  }, [voters, internalSelected.length, onVoterSelect]);

  const handleSelectVoter = useCallback(
    (voterId: string) => {
      const newSelected = internalSelected.includes(voterId)
        ? internalSelected.filter((id) => id !== voterId)
        : [...internalSelected, voterId];

      setInternalSelected(newSelected);
      onVoterSelect?.(newSelected);
    },
    [internalSelected, onVoterSelect]
  );

  const handleSort = useCallback(
    (column: string) => {
      if (!onSort) return;

      const newDirection =
        sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(column, newDirection);
    },
    [sortBy, sortDirection, onSort]
  );

  if (isLoading) {
    return (
      <div
        className="flex h-64 items-center justify-center"
        data-testid="voter-list-loading"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (voters.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <svg
          className="mb-4 h-12 w-12 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          No voters found
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Add voters to get started with your election
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search voters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <select
          aria-label="Filter by status"
          onChange={(e) => onFilterChange({ status: e.target.value || undefined })}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">All Statuses</option>
          <option value="registered">Registered</option>
          <option value="credential_generated">Credential Generated</option>
          <option value="credential_sent">Credential Sent</option>
          <option value="voted">Voted</option>
        </select>

        {jurisdictions.length > 0 && (
          <select
            aria-label="Filter by jurisdiction"
            onChange={(e) => onFilterChange({ jurisdiction: e.target.value || undefined })}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">All Jurisdictions</option>
            {jurisdictions.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Bulk Actions */}
      {selectable && internalSelected.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {internalSelected.length} selected
          </span>
          <span className="text-blue-300 dark:text-blue-700">|</span>
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Bulk Actions
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkGenerateCredentials?.(internalSelected)}
          >
            Generate Credentials
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkDelete?.(internalSelected)}
          >
            Delete Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full" role="table">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={internalSelected.length === voters.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              <th
                className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300"
                role="columnheader"
              >
                {sortable ? (
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                    aria-label="Sort by name"
                  >
                    Name
                    {sortBy === 'name' && (
                      <svg
                        className={`h-4 w-4 transition-transform ${
                          sortDirection === 'desc' ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </button>
                ) : (
                  'Name'
                )}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300"
                role="columnheader"
              >
                {sortable ? (
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                    aria-label="Sort by email"
                  >
                    Email
                    {sortBy === 'email' && (
                      <svg
                        className={`h-4 w-4 transition-transform ${
                          sortDirection === 'desc' ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </button>
                ) : (
                  'Email'
                )}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300"
                role="columnheader"
              >
                Jurisdiction
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300"
                role="columnheader"
              >
                Status
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {voters.map((voter) => (
              <tr
                key={voter.id}
                className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={internalSelected.includes(voter.id)}
                      onChange={() => handleSelectVoter(voter.id)}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {voter.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {voter.email}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {voter.jurisdiction || '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusStyles[voter.status]
                    }`}
                  >
                    {statusLabels[voter.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!voter.credentialGenerated && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onGenerateCredential(voter)}
                        aria-label="Generate credential"
                      >
                        Generate Credential
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onVoterEdit(voter)}
                      aria-label="Edit"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onVoterDelete(voter)}
                      disabled={voter.hasVoted}
                      aria-label="Delete"
                    >
                      <svg
                        className="h-4 w-4 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Page {currentPage} of {totalPages} ({totalVoters} total voters)
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Next"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
