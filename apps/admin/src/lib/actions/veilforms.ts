'use server';

import { apiFetch } from '../api-config';

export interface VeilFormsStatus {
  configured: boolean;
  publicKey?: string;
  formId?: string;
  error?: string;
}

export async function getVeilFormsStatus(electionId: string): Promise<VeilFormsStatus> {
  try {
    // Try to get the public key for this election
    // The API will create a VeilForms form if needed when election transitions to draft
    const result = await apiFetch<{ publicKey?: string; formId?: string }>(
      `/api/elections/${electionId}/encryption`
    ).catch(() => null);

    if (result?.publicKey) {
      return {
        configured: true,
        publicKey: result.publicKey,
        formId: result.formId,
      };
    }

    return {
      configured: false,
    };
  } catch (err) {
    return {
      configured: false,
      error: err instanceof Error ? err.message : 'Failed to check VeilForms status',
    };
  }
}
