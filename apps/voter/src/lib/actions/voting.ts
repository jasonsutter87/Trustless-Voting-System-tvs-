/**
 * Server-side API actions for voting
 *
 * These functions communicate with the TVS API backend
 */

'use server'

import { z } from 'zod';

// Configure API base URL from environment or default to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Credential schema for validation
 */
const CredentialSchema = z.object({
  electionId: z.string(),
  nullifier: z.string(),
  message: z.string(),
  signature: z.string(),
});

export type Credential = z.infer<typeof CredentialSchema>;

/**
 * Ballot question interface from API
 */
export interface BallotQuestion {
  id: string;
  electionId: string;
  jurisdictionId: string;
  title: string;
  description?: string;
  questionType: 'single_choice' | 'multi_choice' | 'ranked_choice' | 'yes_no' | 'write_in';
  maxSelections: number;
  allowWriteIn: boolean;
  displayOrder: number;
  candidates: Array<{
    id: string;
    name: string;
    description?: string;
    party?: string;
    position: number;
  }>;
}

/**
 * Ballot section grouped by jurisdiction
 */
export interface BallotSection {
  jurisdiction: {
    id: string;
    name: string;
    type: string;
    code: string;
    level: number;
  };
  questions: BallotQuestion[];
}

/**
 * Ballot response from API
 */
export interface BallotResponse {
  electionId: string;
  electionName: string;
  voter: {
    jurisdictionId: string;
    jurisdictionName: string;
    jurisdictionCode: string;
  };
  jurisdictionChain: Array<{
    id: string;
    name: string;
    code: string;
    level: number;
  }>;
  sections: BallotSection[];
  totalQuestions: number;
}

/**
 * Election details interface
 */
export interface Election {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'setup' | 'draft' | 'registration' | 'voting' | 'tallying' | 'complete';
  threshold: number;
  totalTrustees: number;
  publicKey?: string;
}

/**
 * Vote submission result
 */
export interface VoteSubmissionResult {
  success: boolean;
  confirmationCode: string;
  electionId: string;
  answersSubmitted: number;
  answersTotal: number;
  results: Array<{
    questionId: string;
    success: boolean;
    position?: number;
    merkleRoot?: string;
    error?: string;
  }>;
  message: string;
}

/**
 * Validate a voting credential
 * Checks format and attempts to parse the credential string
 */
export async function validateCredential(credentialString: string): Promise<{
  valid: boolean;
  credential?: Credential;
  error?: string;
}> {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(credentialString);
    const credential = CredentialSchema.parse(parsed);

    return {
      valid: true,
      credential,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid credential format',
    };
  }
}

/**
 * Fetch election details
 */
export async function fetchElection(electionId: string): Promise<{
  success: boolean;
  election?: Election;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elections/${electionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always get fresh data
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to fetch election: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      election: data.election,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch election',
    };
  }
}

/**
 * Fetch ballot for a specific election and jurisdiction
 */
export async function fetchBallot(
  electionId: string,
  jurisdictionId: string
): Promise<{
  success: boolean;
  ballot?: BallotResponse;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/ballot/${electionId}/${jurisdictionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to fetch ballot: ${response.status}`,
      };
    }

    const ballot = await response.json();

    return {
      success: true,
      ballot,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch ballot',
    };
  }
}

/**
 * Submit encrypted ballot
 */
export async function submitVote(params: {
  electionId: string;
  credential: Credential;
  answers: Array<{
    questionId: string;
    encryptedVote: string;
    commitment: string;
    zkProof: string;
  }>;
}): Promise<{
  success: boolean;
  result?: VoteSubmissionResult;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/vote/ballot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        electionId: params.electionId,
        credential: params.credential,
        answers: params.answers,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to submit vote: ${response.status}`,
      };
    }

    const result = await response.json();

    return {
      success: result.success,
      result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit vote',
    };
  }
}
