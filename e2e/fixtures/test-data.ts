/**
 * E2E Test Fixtures
 *
 * Mock data and utilities for end-to-end testing.
 */

export const testElection = {
  id: 'e2e-test-election',
  name: 'E2E Test Election 2025',
  description: 'Automated end-to-end test election',
  status: 'active',
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  threshold: 2,
  totalTrustees: 3,
};

export const testVoter = {
  email: 'test-voter@example.com',
  name: 'Test Voter',
  voterId: 'VOTER-001',
  jurisdictionId: 'US-CA',
};

export const testCredential = {
  voterId: 'VOTER-001',
  token: 'test-credential-token-12345',
  electionId: 'e2e-test-election',
  jurisdictionId: 'US-CA',
};

export const testBallot = {
  electionId: 'e2e-test-election',
  sections: [
    {
      id: 'section-1',
      title: 'Federal Offices',
      jurisdiction: {
        id: 'US',
        name: 'United States',
        level: 'federal',
      },
      questions: [
        {
          id: 'q1',
          title: 'President',
          description: 'Vote for one candidate for President of the United States',
          type: 'single',
          maxChoices: 1,
          minChoices: 1,
          candidates: [
            { id: 'c1', name: 'Alice Johnson', party: 'Democratic', description: 'Senator' },
            { id: 'c2', name: 'Bob Smith', party: 'Republican', description: 'Governor' },
            { id: 'c3', name: 'Carol White', party: 'Independent', description: 'Business Leader' },
          ],
        },
        {
          id: 'q2',
          title: 'Senate',
          description: 'Vote for one candidate for US Senate',
          type: 'single',
          maxChoices: 1,
          minChoices: 1,
          candidates: [
            { id: 'c4', name: 'David Brown', party: 'Democratic', description: 'Representative' },
            { id: 'c5', name: 'Eve Davis', party: 'Republican', description: 'Attorney' },
          ],
        },
      ],
    },
    {
      id: 'section-2',
      title: 'State Propositions',
      jurisdiction: {
        id: 'US-CA',
        name: 'California',
        level: 'state',
      },
      questions: [
        {
          id: 'q3',
          title: 'Proposition 1: Education Funding',
          description: 'Should the state increase education funding by 5%?',
          type: 'single',
          maxChoices: 1,
          minChoices: 1,
          candidates: [
            { id: 'yes', name: 'Yes', description: 'Support increased funding' },
            { id: 'no', name: 'No', description: 'Oppose increased funding' },
          ],
        },
      ],
    },
  ],
};

export const testResults = {
  electionId: 'e2e-test-election',
  electionName: 'E2E Test Election 2025',
  status: 'complete',
  totalVotes: 1000,
  results: [
    { candidateId: 'c1', candidateName: 'Alice Johnson', votes: 450 },
    { candidateId: 'c2', candidateName: 'Bob Smith', votes: 400 },
    { candidateId: 'c3', candidateName: 'Carol White', votes: 150 },
  ],
  winner: { candidateId: 'c1', candidateName: 'Alice Johnson', votes: 450 },
};

export const testMerkleProof = {
  leaf: 'abc123def456',
  root: 'rootHash789xyz',
  path: [
    { hash: 'hash1', position: 'left' },
    { hash: 'hash2', position: 'right' },
    { hash: 'hash3', position: 'left' },
  ],
};

export const testIntegrity = {
  electionId: 'e2e-test-election',
  status: 'healthy',
  checks: {
    merkleRoot: { status: 'pass', message: 'Merkle root verified' },
    voteCount: { status: 'pass', message: 'Vote count matches ledger entries' },
    signatures: { status: 'pass', message: 'All signatures valid' },
    bitcoinAnchor: { status: 'confirmed', txId: 'btc-tx-123', confirmations: 6 },
  },
  lastChecked: new Date().toISOString(),
};

/**
 * Generate a random confirmation code
 */
export function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Generate a mock vote submission result
 */
export function generateVoteResult(confirmationCode: string) {
  return {
    success: true,
    confirmationCode,
    answersSubmitted: 3,
    answersTotal: 3,
    results: [
      { questionId: 'q1', success: true, merkleRoot: 'root1' },
      { questionId: 'q2', success: true, merkleRoot: 'root2' },
      { questionId: 'q3', success: true, merkleRoot: 'root3' },
    ],
  };
}
