'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Trophy, BarChart3, Printer } from 'lucide-react';
import type { Election, Candidate } from '@/lib/actions/elections';

interface ResultsDisplayProps {
  election: Election;
  results: { candidate: Candidate; votes: number }[];
  isCertified: boolean;
}

export function ResultsDisplay({
  election,
  results,
  isCertified,
}: ResultsDisplayProps) {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // Sort results by votes descending
  const sortedResults = [...results].sort((a, b) => b.votes - a.votes);
  const totalVotes = sortedResults.reduce((sum, r) => sum + r.votes, 0);
  const winner = sortedResults[0];

  const handleExportCSV = () => {
    const headers = ['Position', 'Candidate', 'Votes', 'Percentage'];
    const rows = sortedResults.map((r, index) => [
      index + 1,
      r.candidate.name,
      r.votes,
      totalVotes > 0 ? ((r.votes / totalVotes) * 100).toFixed(2) + '%' : '0%',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${election.name.replace(/\s+/g, '_')}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Winner banner */}
      {isCertified && winner && (
        <div className="rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 p-6 dark:border-yellow-800 dark:from-yellow-950 dark:to-amber-950" role="status" aria-live="polite" aria-label="Election winner announcement">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 dark:bg-yellow-600" aria-hidden="true">
              <Trophy className="h-8 w-8 text-yellow-900" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                Winner
              </p>
              <h3 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {winner.candidate.name}
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                {winner.votes.toLocaleString()} votes (<span className="sr-only">Percentage: </span>
                {totalVotes > 0 ? ((winner.votes / totalVotes) * 100).toFixed(1) : 0}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results card */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Vote Tallies
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {totalVotes.toLocaleString()} total votes cast
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700" role="group" aria-label="View mode toggle">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode('table')}
                aria-label="Show results as table"
                aria-pressed={viewMode === 'table'}
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'chart' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('chart')}
                aria-label="Show results as chart"
                aria-pressed={viewMode === 'chart'}
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Chart view</span>
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV} aria-label="Export results as CSV file">
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} aria-label="Print results">
              <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
              Print
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {viewMode === 'table' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead className="text-right">Votes</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedResults.map((result, index) => (
                  <TableRow key={result.candidate.id}>
                    <TableCell>
                      {index === 0 && isCertified ? (
                        <Badge className="bg-yellow-500 text-yellow-900">1st</Badge>
                      ) : (
                        <span className="font-medium">{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {result.candidate.name}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {result.votes.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {totalVotes > 0
                        ? ((result.votes / totalVotes) * 100).toFixed(1)
                        : 0}
                      %
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="space-y-3">
              {sortedResults.map((result, index) => {
                const percentage =
                  totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0;
                return (
                  <div key={result.candidate.id}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {result.candidate.name}
                        </span>
                        {index === 0 && isCertified && (
                          <Trophy className="h-4 w-4 text-yellow-500" aria-label="Winner" />
                        )}
                      </div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {result.votes.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-8 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          index === 0 && isCertified
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Total Votes Cast
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {totalVotes.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Number of Candidates
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {sortedResults.length}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Winning Margin
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {sortedResults.length > 1
              ? (sortedResults[0].votes - sortedResults[1].votes).toLocaleString()
              : '-'}
          </p>
        </div>
      </div>
    </div>
  );
}
