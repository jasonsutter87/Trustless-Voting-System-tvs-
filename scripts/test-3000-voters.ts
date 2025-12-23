#!/usr/bin/env npx tsx
/**
 * Test script: 3000 Voters Simulation (E2E Stress Test)
 *
 * Simulates a complete election with 3000 voters:
 * 1. Create election with threshold key ceremony
 * 2. Register trustees and complete ceremony
 * 3. Register 3000 voters
 * 4. Cast 3000 votes (encrypted via VeilForms)
 * 5. Display results and performance metrics
 */

import { createCipheriv, randomBytes, createHash } from 'crypto';

const API_URL = 'http://localhost:3000';
const VOTER_COUNT = 3000;

// VeilKey will be loaded dynamically
let feldmanSplit: any;

// ============================================================================
// VeilForms Encryption (inline from @tvs/veilforms)
// ============================================================================

interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
  keyId: string;
}

interface VoteData {
  candidateId: string;
  electionId: string;
  timestamp: number;
}

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Encrypt vote using AES-256-GCM (VeilForms encryption)
 */
function encryptVoteLocal(vote: VoteData): EncryptedPayload {
  const aesKey = randomBytes(32);
  const iv = randomBytes(12);

  const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
  const plaintext = JSON.stringify(vote);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  const keyId = sha256(aesKey.toString('hex')).slice(0, 32);

  return { ciphertext, iv: iv.toString('hex'), tag, keyId };
}

/**
 * Create vote commitment (hash of vote + salt)
 */
function createVoteCommitment(candidateId: string): { commitment: string; salt: string } {
  const salt = randomBytes(32).toString('hex');
  const commitment = sha256(`${candidateId}:${salt}`);
  return { commitment, salt };
}

interface Credential {
  electionId: string;
  nullifier: string;
  message: string;
  signature: string;
}

interface Voter {
  studentId: string;
  credential?: Credential;
  votedFor?: string;
  confirmationCode?: string;
}

// ============================================================================
// API Helpers
// ============================================================================

async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`API Error: ${JSON.stringify(data)}`);
  }

  return data;
}

// ============================================================================
// Performance Tracking
// ============================================================================

interface PerfMetrics {
  registrationTime: number;
  votingTime: number;
  avgRegistrationMs: number;
  avgVotingMs: number;
  totalTime: number;
}

// ============================================================================
// Test Flow
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       TVS - 3000 Voters E2E Stress Test                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const testStart = Date.now();

  // Load VeilKey dynamically
  const veilkey = await import('../../VeilKey/dist/index.js');
  feldmanSplit = veilkey.feldmanSplit;

  // Check API health
  console.log('🔍 Checking API health...');
  try {
    await api('/health');
    console.log('   ✓ API is healthy\n');
  } catch (e) {
    console.error('   ✗ API not available. Start with: pnpm dev:api');
    process.exit(1);
  }

  // ==========================================================================
  // Step 1: Create Election with Threshold Key Ceremony
  // ==========================================================================
  console.log('📋 Step 1: Creating election with 3-of-5 threshold...');

  const now = new Date();
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const electionData = await api('/api/elections', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Large Scale Election Test 2025',
      description: 'Stress test with 3000 voters',
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      threshold: 3,
      totalTrustees: 5,
      candidates: [
        { name: 'Alice Johnson' },
        { name: 'Bob Smith' },
        { name: 'Carol Williams' },
        { name: 'David Brown' },
        { name: 'Eve Martinez' },
      ],
    }),
  });

  const electionId = electionData.election.id;
  const candidates = electionData.election.candidates;

  console.log(`   ✓ Election created: ${electionId}`);
  console.log(`   ✓ Threshold: 3-of-5 trustees`);
  console.log(`   ✓ Candidates: ${candidates.map((c: any) => c.name).join(', ')}\n`);

  // ==========================================================================
  // Step 2: Register Trustees and Complete Key Ceremony
  // ==========================================================================
  console.log('🔐 Step 2: Key ceremony - registering 5 trustees...');

  const trusteeNames = ['Trustee-Alpha', 'Trustee-Beta', 'Trustee-Gamma', 'Trustee-Delta', 'Trustee-Epsilon'];
  const trustees: any[] = [];

  for (const name of trusteeNames) {
    const result = await api(`/api/elections/${electionId}/trustees`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        publicKey: randomBytes(32).toString('hex'),
      }),
    });
    trustees.push(result.trustee);
    console.log(`   ✓ Registered: ${name}`);
  }

  console.log('   Submitting Feldman commitments...');

  for (const trustee of trustees) {
    const secret = BigInt('0x' + randomBytes(32).toString('hex'));
    const feldmanResult = feldmanSplit(secret, 3, 5); // threshold=3, total=5

    const feldmanCommitments = feldmanResult.commitments.map((pt: any) => ({
      x: pt.x.toString(),
      y: pt.y.toString(),
    }));

    const result = await api(`/api/elections/${electionId}/trustees/${trustee.id}/commitment`, {
      method: 'POST',
      body: JSON.stringify({
        commitmentHash: sha256(JSON.stringify(feldmanCommitments)),
        feldmanCommitments,
      }),
    });

    if (result.status === 'finalized') {
      console.log(`   ✓ Ceremony finalized! Public key generated.`);
    }
  }

  console.log('   ✓ Key ceremony complete\n');

  // ==========================================================================
  // Step 3: Open Registration
  // ==========================================================================
  console.log('📝 Step 3: Opening voter registration...');

  await api(`/api/elections/${electionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'registration' }),
  });

  console.log('   ✓ Registration is now open\n');

  // ==========================================================================
  // Step 4: Register 3000 Voters
  // ==========================================================================
  console.log(`👥 Step 4: Registering ${VOTER_COUNT} voters...`);

  const voters: Voter[] = [];
  const registrationStart = Date.now();

  for (let i = 1; i <= VOTER_COUNT; i++) {
    const studentId = `STU${String(i).padStart(6, '0')}`;

    const result = await api('/api/register/complete', {
      method: 'POST',
      body: JSON.stringify({
        electionId,
        studentId,
      }),
    });

    voters.push({
      studentId,
      credential: result.credential,
    });

    if (i % 50 === 0 || i === VOTER_COUNT) {
      process.stdout.write(`   Registered: ${i}/${VOTER_COUNT}\r`);
    }
  }

  const registrationTime = Date.now() - registrationStart;
  console.log(`   ✓ All ${VOTER_COUNT} voters registered in ${(registrationTime / 1000).toFixed(2)}s\n`);

  const regStats = await api(`/api/register/stats/${electionId}`);
  console.log(`   ✓ Registration stats: ${regStats.registeredCount} voters\n`);

  // ==========================================================================
  // Step 5: Open Voting
  // ==========================================================================
  console.log('🗳️  Step 5: Opening voting...');

  await api(`/api/elections/${electionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'voting' }),
  });

  console.log('   ✓ Voting is now open\n');

  // ==========================================================================
  // Step 6: Cast 3000 Votes
  // ==========================================================================
  console.log(`🗳️  Step 6: Casting ${VOTER_COUNT} votes...`);

  // Distribute votes (5 candidates)
  // Alice: 900, Bob: 750, Carol: 600, David: 450, Eve: 300
  const voteDistribution = [
    ...Array(900).fill(0),  // Alice
    ...Array(750).fill(1),  // Bob
    ...Array(600).fill(2),  // Carol
    ...Array(450).fill(3),  // David
    ...Array(300).fill(4),  // Eve
  ];

  // Shuffle votes
  for (let i = voteDistribution.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [voteDistribution[i], voteDistribution[j]] = [voteDistribution[j], voteDistribution[i]];
  }

  const voteCounts: Record<string, number> = {};
  candidates.forEach((c: any) => (voteCounts[c.name] = 0));

  const votingStart = Date.now();
  let successfulVotes = 0;
  let failedVotes = 0;

  for (let i = 0; i < voters.length; i++) {
    const voter = voters[i];
    const candidateIndex = voteDistribution[i];
    const candidate = candidates[candidateIndex];

    const encryptedPayload: EncryptedPayload = encryptVoteLocal({
      candidateId: candidate.id,
      electionId,
      timestamp: Date.now(),
    });

    const { commitment } = createVoteCommitment(candidate.id);
    const encryptedVote = JSON.stringify(encryptedPayload);

    const zkProof = JSON.stringify({
      type: 'groth16',
      proof: { pi_a: [], pi_b: [], pi_c: [] },
      publicSignals: [electionId, voter.credential?.nullifier, commitment],
    });

    try {
      const result = await api('/api/vote', {
        method: 'POST',
        body: JSON.stringify({
          electionId,
          credential: voter.credential,
          encryptedVote,
          commitment,
          zkProof,
        }),
      });

      voter.votedFor = candidate.name;
      voter.confirmationCode = result.confirmationCode;
      voteCounts[candidate.name]++;
      successfulVotes++;

      if ((i + 1) % 50 === 0 || i === voters.length - 1) {
        process.stdout.write(`   Votes cast: ${i + 1}/${VOTER_COUNT}\r`);
      }
    } catch (error: any) {
      failedVotes++;
      console.error(`\n   ✗ Vote failed for voter ${i + 1}: ${error.message}`);
    }
  }

  const votingTime = Date.now() - votingStart;
  console.log(`   ✓ ${successfulVotes} votes cast in ${(votingTime / 1000).toFixed(2)}s\n`);

  if (failedVotes > 0) {
    console.log(`   ⚠ ${failedVotes} votes failed\n`);
  }

  // ==========================================================================
  // Step 7: Display Results
  // ==========================================================================
  console.log('📊 Step 7: Final Statistics\n');

  const voteStats = await api(`/api/vote/stats/${electionId}`);

  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │           ELECTION RESULTS                  │');
  console.log('   ├─────────────────────────────────────────────┤');
  console.log(`   │ Election: ${electionData.election.name.slice(0, 30).padEnd(30)} │`);
  console.log(`   │ Total Votes: ${String(voteStats.voteCount).padEnd(27)} │`);
  console.log('   ├─────────────────────────────────────────────┤');

  const sortedResults = Object.entries(voteCounts)
    .sort(([, a], [, b]) => b - a);

  for (const [name, count] of sortedResults) {
    const pct = ((count / VOTER_COUNT) * 100).toFixed(1);
    const barLength = Math.round(count / 10);
    const bar = '█'.repeat(barLength);
    console.log(`   │ ${name.padEnd(15)} ${String(count).padStart(3)} (${pct.padStart(5)}%) ${bar.padEnd(10)} │`);
  }

  console.log('   ├─────────────────────────────────────────────┤');
  console.log(`   │ Merkle Root: ${voteStats.merkleRoot?.slice(0, 24)}...     │`);
  console.log('   └─────────────────────────────────────────────┘\n');

  // Winner
  const winner = sortedResults[0];
  console.log(`   🏆 WINNER: ${winner[0]} with ${winner[1]} votes (${((winner[1] / VOTER_COUNT) * 100).toFixed(1)}%)\n`);

  // ==========================================================================
  // Performance Metrics
  // ==========================================================================
  const totalTime = Date.now() - testStart;

  console.log('   ⏱️  PERFORMANCE METRICS:');
  console.log('   ├─────────────────────────────────────────────┤');
  console.log(`   │ Registration: ${(registrationTime / 1000).toFixed(2)}s (${(registrationTime / VOTER_COUNT).toFixed(1)}ms/voter)`);
  console.log(`   │ Voting:       ${(votingTime / 1000).toFixed(2)}s (${(votingTime / VOTER_COUNT).toFixed(1)}ms/vote)`);
  console.log(`   │ Total:        ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`   │ Throughput:   ${(VOTER_COUNT / (votingTime / 1000)).toFixed(1)} votes/sec`);
  console.log('   └─────────────────────────────────────────────┘\n');

  console.log('✅ 3000 voter E2E test completed successfully!\n');
}

main().catch(console.error);
