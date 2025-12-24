'use server';

import { apiFetch } from '../api-config';

// Types
export interface Candidate {
  id: string;
  name: string;
  position: number;
}

export interface Election {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'setup' | 'draft' | 'registration' | 'voting' | 'tallying' | 'complete';
  threshold: number;
  totalTrustees: number;
  candidates: Candidate[];
  createdAt: string;
}

export interface CeremonyStatus {
  phase: 'CREATED' | 'REGISTRATION' | 'COMMITMENT' | 'SHARE_DISTRIBUTION' | 'FINALIZED';
  registeredCount: number;
  requiredCount: number;
  committedCount: number;
}

export interface CreateElectionInput {
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  threshold: number;
  totalTrustees: number;
  candidates: { name: string }[];
}

// Actions
export async function createElection(input: CreateElectionInput): Promise<{
  election: Election;
  ceremonyStatus: CeremonyStatus;
}> {
  return apiFetch('/api/elections', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getElection(id: string): Promise<{
  election: Election;
  ceremonyStatus?: CeremonyStatus;
  publicKey?: string;
}> {
  return apiFetch(`/api/elections/${id}`);
}

export async function getElections(): Promise<{ elections: Election[] }> {
  return apiFetch('/api/elections');
}

export async function updateElectionStatus(
  id: string,
  status: Election['status']
): Promise<{
  election: Election;
  bitcoinAnchor?: { submitted?: boolean; pending?: string; error?: string };
}> {
  return apiFetch(`/api/elections/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getElectionResults(id: string): Promise<{
  election: Election;
  results: { candidate: Candidate; votes: number }[];
}> {
  return apiFetch(`/api/elections/${id}/results`);
}
