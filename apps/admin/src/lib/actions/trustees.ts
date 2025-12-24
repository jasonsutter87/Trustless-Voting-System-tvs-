'use server';

import { apiFetch } from '../api-config';

// Types
export interface Trustee {
  id: string;
  electionId: string;
  name: string;
  publicKey: string;
  shareIndex?: number;
  status: 'registered' | 'committed' | 'share_received';
}

export interface CeremonyStatus {
  phase: 'CREATED' | 'REGISTRATION' | 'COMMITMENT' | 'SHARE_DISTRIBUTION' | 'FINALIZED';
  registeredCount: number;
  requiredCount: number;
  committedCount: number;
}

export interface FeldmanCommitment {
  x: string;
  y: string;
}

// Actions
export async function registerTrustee(
  electionId: string,
  input: { name: string; publicKey: string }
): Promise<{
  trustee: Trustee;
  ceremonyStatus: CeremonyStatus;
}> {
  return apiFetch(`/api/elections/${electionId}/trustees`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getTrustees(electionId: string): Promise<{
  trustees: Trustee[];
  ceremonyStatus?: CeremonyStatus;
}> {
  return apiFetch(`/api/elections/${electionId}/trustees`);
}

export async function getTrustee(
  electionId: string,
  trusteeId: string
): Promise<{ trustee: Trustee }> {
  return apiFetch(`/api/elections/${electionId}/trustees/${trusteeId}`);
}

export async function submitCommitment(
  electionId: string,
  trusteeId: string,
  input: {
    commitmentHash: string;
    feldmanCommitments: FeldmanCommitment[];
  }
): Promise<
  | { status: 'awaiting_commitments'; ceremonyStatus: CeremonyStatus }
  | {
      status: 'finalized';
      publicKey: string;
      threshold: number;
      totalParticipants: number;
      completedAt: string;
    }
> {
  return apiFetch(`/api/elections/${electionId}/trustees/${trusteeId}/commitment`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getTrusteeShare(
  electionId: string,
  trusteeId: string
): Promise<{ share: string }> {
  return apiFetch(`/api/elections/${electionId}/trustees/${trusteeId}/share`);
}
