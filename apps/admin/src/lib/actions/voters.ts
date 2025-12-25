'use server';

import { apiFetch } from './api';

// Types
export interface Voter {
  id: string;
  electionId: string;
  email: string;
  name: string;
  jurisdiction?: string;
  status: 'registered' | 'credential_generated' | 'credential_sent' | 'voted';
  credentialGenerated: boolean;
  hasVoted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface VoterInput {
  email: string;
  name: string;
  jurisdiction?: string;
}

export interface VoterCredential {
  voterId: string;
  code: string;
  nullifier: string;
  expiresAt: string;
}

export interface VoterStats {
  total: number;
  registered: number;
  credentialsGenerated: number;
  credentialsSent: number;
  voted: number;
  byJurisdiction: Record<string, { total: number; voted: number }>;
}

export interface GetVotersOptions {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  jurisdiction?: string;
}

export interface BatchResult {
  added: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

export interface ImportResult {
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export interface CredentialBatchResult {
  generated: number;
  failed: number;
  errors?: Array<{ voterId: string; error: string }>;
}

export interface SendCredentialsResult {
  sent: number;
  failed: number;
  errors?: Array<{ voterId: string; error: string }>;
  downloadUrl?: string;
}

export interface ExportResult {
  downloadUrl: string;
  expiresAt: string;
}

// API Functions

export async function getVoters(
  electionId: string,
  options: GetVotersOptions = {}
): Promise<{ voters: Voter[]; total: number }> {
  const params = new URLSearchParams();

  if (options.page) params.set('page', options.page.toString());
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.status) params.set('status', options.status);
  if (options.search) params.set('search', options.search);
  if (options.jurisdiction) params.set('jurisdiction', options.jurisdiction);

  const queryString = params.toString();
  const url = `/api/elections/${electionId}/voters${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch voters');
  }

  return response.json();
}

export async function getVoter(
  electionId: string,
  voterId: string
): Promise<{ voter: Voter }> {
  const response = await fetch(`/api/elections/${electionId}/voters/${voterId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch voter');
  }

  return response.json();
}

export async function addVoter(
  electionId: string,
  input: VoterInput
): Promise<{ voter: Voter }> {
  const response = await fetch(`/api/elections/${electionId}/voters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add voter');
  }

  return response.json();
}

export async function addVotersBatch(
  electionId: string,
  voters: VoterInput[]
): Promise<BatchResult> {
  const response = await fetch(`/api/elections/${electionId}/voters/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voters }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add voters');
  }

  return response.json();
}

export async function updateVoter(
  electionId: string,
  voterId: string,
  updates: Partial<VoterInput>
): Promise<{ voter: Voter }> {
  const response = await fetch(`/api/elections/${electionId}/voters/${voterId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update voter');
  }

  return response.json();
}

export async function deleteVoter(
  electionId: string,
  voterId: string
): Promise<{ success: boolean }> {
  const response = await fetch(`/api/elections/${electionId}/voters/${voterId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete voter');
  }

  return response.json();
}

export async function generateCredential(
  electionId: string,
  voterId: string
): Promise<{ credential: VoterCredential }> {
  const response = await fetch(`/api/elections/${electionId}/voters/${voterId}/credential`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate credential');
  }

  return response.json();
}

export async function generateCredentialsBatch(
  electionId: string,
  voterIds: string[]
): Promise<CredentialBatchResult> {
  const response = await fetch(`/api/elections/${electionId}/voters/credentials/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voterIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate credentials');
  }

  return response.json();
}

export async function sendCredentials(
  electionId: string,
  voterIds: string[],
  method: 'email' | 'download'
): Promise<SendCredentialsResult> {
  const response = await fetch(`/api/elections/${electionId}/voters/credentials/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voterIds, method }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send credentials');
  }

  return response.json();
}

export async function importVotersFromCSV(
  electionId: string,
  file: File
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/elections/${electionId}/voters/import`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to import voters');
  }

  return response.json();
}

export async function exportVoters(
  electionId: string,
  format: 'csv' | 'json'
): Promise<ExportResult> {
  const response = await fetch(`/api/elections/${electionId}/voters/export?format=${format}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to export voters');
  }

  return response.json();
}

export async function getVoterStats(
  electionId: string
): Promise<{ stats: VoterStats }> {
  const response = await fetch(`/api/elections/${electionId}/voters/stats`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch voter stats');
  }

  return response.json();
}
