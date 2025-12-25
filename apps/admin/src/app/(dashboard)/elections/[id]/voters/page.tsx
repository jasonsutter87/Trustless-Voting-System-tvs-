'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { VoterList } from '@/components/voters/voter-list';
import { VoterForm } from '@/components/voters/voter-form';
import { VoterImport } from '@/components/voters/voter-import';
import { VoterStatsCard } from '@/components/voters/voter-stats';
import { CredentialDialog } from '@/components/voters/credential-dialog';
import {
  getVoters,
  getVoterStats,
  addVoter,
  updateVoter,
  deleteVoter,
  importVotersFromCSV,
  generateCredentialsBatch,
  sendCredentials,
  type Voter,
  type VoterInput,
  type VoterStats,
} from '@/lib/actions/voters';

export default function VotersPage() {
  const params = useParams();
  const electionId = params.id as string;

  // State
  const [voters, setVoters] = useState<Voter[]>([]);
  const [stats, setStats] = useState<VoterStats | null>(null);
  const [totalVoters, setTotalVoters] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [selectedVoterIds, setSelectedVoterIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string | undefined>();
  const [jurisdictions, setJurisdictions] = useState<string[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Dialog states
  const [voterFormOpen, setVoterFormOpen] = useState(false);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false);

  // Load voters
  const loadVoters = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getVoters(electionId, {
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        status: statusFilter,
        jurisdiction: jurisdictionFilter,
      });
      setVoters(result.voters);
      setTotalVoters(result.total);

      // Extract unique jurisdictions
      const uniqueJurisdictions = [
        ...new Set(result.voters.map((v) => v.jurisdiction).filter(Boolean)),
      ] as string[];
      if (uniqueJurisdictions.length > jurisdictions.length) {
        setJurisdictions(uniqueJurisdictions);
      }
    } catch (error) {
      console.error('Failed to load voters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [electionId, currentPage, pageSize, searchQuery, statusFilter, jurisdictionFilter, jurisdictions.length]);

  // Load stats
  const loadStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const result = await getVoterStats(electionId);
      setStats(result.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  }, [electionId]);

  // Initial load
  useEffect(() => {
    loadVoters();
    loadStats();
  }, [loadVoters, loadStats]);

  // Handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback(
    (filters: { status?: string; jurisdiction?: string }) => {
      if (filters.status !== undefined) setStatusFilter(filters.status || undefined);
      if (filters.jurisdiction !== undefined) setJurisdictionFilter(filters.jurisdiction || undefined);
      setCurrentPage(1);
    },
    []
  );

  const handleSort = useCallback((column: string, direction: 'asc' | 'desc') => {
    setSortBy(column);
    setSortDirection(direction);
  }, []);

  const handleVoterSelect = useCallback((voterIds: string[]) => {
    setSelectedVoterIds(voterIds);
  }, []);

  const handleAddVoter = useCallback(() => {
    setEditingVoter(null);
    setVoterFormOpen(true);
  }, []);

  const handleEditVoter = useCallback((voter: Voter) => {
    setEditingVoter(voter);
    setVoterFormOpen(true);
  }, []);

  const handleVoterFormSubmit = useCallback(
    async (data: VoterInput) => {
      if (editingVoter) {
        await updateVoter(electionId, editingVoter.id, data);
      } else {
        await addVoter(electionId, data);
      }
      await loadVoters();
      await loadStats();
    },
    [electionId, editingVoter, loadVoters, loadStats]
  );

  const handleDeleteVoter = useCallback(
    async (voter: Voter) => {
      if (!confirm(`Are you sure you want to delete ${voter.name}?`)) return;
      await deleteVoter(electionId, voter.id);
      await loadVoters();
      await loadStats();
    },
    [electionId, loadVoters, loadStats]
  );

  const handleBulkDelete = useCallback(
    async (voterIds: string[]) => {
      if (!confirm(`Are you sure you want to delete ${voterIds.length} voters?`)) return;
      for (const id of voterIds) {
        await deleteVoter(electionId, id);
      }
      setSelectedVoterIds([]);
      await loadVoters();
      await loadStats();
    },
    [electionId, loadVoters, loadStats]
  );

  const handleImport = useCallback(
    async (file: File) => {
      const result = await importVotersFromCSV(electionId, file);
      await loadVoters();
      await loadStats();
      return result;
    },
    [electionId, loadVoters, loadStats]
  );

  const handleGenerateCredential = useCallback((voter: Voter) => {
    setSelectedVoterIds([voter.id]);
    setCredentialDialogOpen(true);
  }, []);

  const handleBulkGenerateCredentials = useCallback((voterIds: string[]) => {
    setSelectedVoterIds(voterIds);
    setCredentialDialogOpen(true);
  }, []);

  const handleGenerateCredentials = useCallback(
    async (voterIds: string[]) => {
      const result = await generateCredentialsBatch(electionId, voterIds);
      await loadVoters();
      await loadStats();
      return result;
    },
    [electionId, loadVoters, loadStats]
  );

  const handleSendCredentials = useCallback(
    async (voterIds: string[], method: 'email' | 'download') => {
      const result = await sendCredentials(electionId, voterIds, method);
      await loadVoters();
      await loadStats();
      return result;
    },
    [electionId, loadVoters, loadStats]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Voter Registry</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage voters and distribute voting credentials
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import CSV
          </Button>
          <Button onClick={handleAddVoter}>
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Voter
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <VoterStatsCard stats={stats} isLoading={isStatsLoading} />

      {/* Voter List */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <VoterList
          voters={voters}
          totalVoters={totalVoters}
          currentPage={currentPage}
          pageSize={pageSize}
          isLoading={isLoading}
          selectable
          selectedVoterIds={selectedVoterIds}
          jurisdictions={jurisdictions}
          sortable
          sortBy={sortBy}
          sortDirection={sortDirection}
          onPageChange={handlePageChange}
          onVoterSelect={handleVoterSelect}
          onVoterEdit={handleEditVoter}
          onVoterDelete={handleDeleteVoter}
          onGenerateCredential={handleGenerateCredential}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onSort={handleSort}
          onBulkGenerateCredentials={handleBulkGenerateCredentials}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      {/* Dialogs */}
      <VoterForm
        open={voterFormOpen}
        voter={editingVoter}
        jurisdictions={jurisdictions}
        onClose={() => {
          setVoterFormOpen(false);
          setEditingVoter(null);
        }}
        onSubmit={handleVoterFormSubmit}
      />

      <VoterImport
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImport}
      />

      <CredentialDialog
        open={credentialDialogOpen}
        voterIds={selectedVoterIds}
        voterCount={selectedVoterIds.length}
        onClose={() => {
          setCredentialDialogOpen(false);
          setSelectedVoterIds([]);
        }}
        onGenerateCredentials={handleGenerateCredentials}
        onSendCredentials={handleSendCredentials}
      />
    </div>
  );
}
