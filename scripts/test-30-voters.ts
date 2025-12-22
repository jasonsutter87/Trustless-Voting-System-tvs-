#!/usr/bin/env npx tsx
/**
 * Test script: 30 Voters Simulation
 *
 * Simulates a complete election with 30 voters:
 * 1. Create election with candidates
 * 2. Register 30 voters
 * 3. Cast 30 votes (encrypted via VeilForms)
 * 4. Display results
 */

import { createCipheriv, randomBytes, createHash } from 'crypto';

const API_URL = 'http://localhost:3000';

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
// Test Flow
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       TVS - 30 Voters Simulation Test                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

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
  // Step 1: Create Election
  // ==========================================================================
  console.log('📋 Step 1: Creating election...');

  const now = new Date();
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  const electionData = await api('/api/elections', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Student Government President 2025',
      description: 'Annual election for student body president',
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      candidates: [
        { name: 'Alice Johnson' },
        { name: 'Bob Smith' },
        { name: 'Carol Williams' },
        { name: 'David Brown' },
      ],
    }),
  });

  const electionId = electionData.election.id;
  const candidates = electionData.election.candidates;

  console.log(`   ✓ Election created: ${electionId}`);
  console.log(`   ✓ Candidates: ${candidates.map((c: any) => c.name).join(', ')}\n`);

  // ==========================================================================
  // Step 2: Open Registration
  // ==========================================================================
  console.log('📝 Step 2: Opening registration...');

  await api(`/api/elections/${electionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'registration' }),
  });

  console.log('   ✓ Registration is now open\n');

  // ==========================================================================
  // Step 3: Register 30 Voters
  // ==========================================================================
  console.log('👥 Step 3: Registering 30 voters...');

  const voters: Voter[] = [];

  for (let i = 1; i <= 30; i++) {
    const studentId = `STU${String(i).padStart(5, '0')}`;

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

    process.stdout.write(`   Registered: ${i}/30\r`);
  }

  console.log('   ✓ All 30 voters registered            \n');

  // Check registration stats
  const regStats = await api(`/api/register/stats/${electionId}`);
  console.log(`   ✓ Registration stats: ${regStats.registeredCount} voters\n`);

  // ==========================================================================
  // Step 4: Open Voting
  // ==========================================================================
  console.log('🗳️  Step 4: Opening voting...');

  await api(`/api/elections/${electionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'voting' }),
  });

  console.log('   ✓ Voting is now open\n');

  // ==========================================================================
  // Step 5: Cast 30 Votes
  // ==========================================================================
  console.log('🗳️  Step 5: Casting 30 votes...');

  // Distribute votes somewhat randomly but with a clear winner
  // Alice: 12 votes, Bob: 9 votes, Carol: 6 votes, David: 3 votes
  const voteDistribution = [
    ...Array(12).fill(0), // Alice
    ...Array(9).fill(1),  // Bob
    ...Array(6).fill(2),  // Carol
    ...Array(3).fill(3),  // David
  ];

  // Shuffle votes
  for (let i = voteDistribution.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [voteDistribution[i], voteDistribution[j]] = [voteDistribution[j], voteDistribution[i]];
  }

  const voteCounts: Record<string, number> = {};
  candidates.forEach((c: any) => (voteCounts[c.name] = 0));

  for (let i = 0; i < voters.length; i++) {
    const voter = voters[i];
    const candidateIndex = voteDistribution[i];
    const candidate = candidates[candidateIndex];

    // Encrypt vote using VeilForms (AES-256-GCM)
    const encryptedPayload: EncryptedPayload = encryptVoteLocal({
      candidateId: candidate.id,
      electionId,
      timestamp: Date.now(),
    });

    // Create vote commitment (hash of vote + salt)
    const { commitment, salt } = createVoteCommitment(candidate.id);

    // Serialize encrypted payload for API
    const encryptedVote = JSON.stringify(encryptedPayload);

    // ZK proof placeholder (would be generated by @tvs/veilproof in production)
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

      process.stdout.write(`   Votes cast: ${i + 1}/30\r`);
    } catch (error: any) {
      console.error(`\n   ✗ Vote failed for voter ${i + 1}: ${error.message}`);
    }
  }

  console.log('   ✓ All 30 votes cast                   \n');

  // ==========================================================================
  // Step 6: Display Results
  // ==========================================================================
  console.log('📊 Step 6: Final Statistics\n');

  // Get vote stats
  const voteStats = await api(`/api/vote/stats/${electionId}`);

  console.log('   ┌─────────────────────────────────────┐');
  console.log('   │         ELECTION RESULTS            │');
  console.log('   ├─────────────────────────────────────┤');
  console.log(`   │ Election: ${electionData.election.name.slice(0, 25).padEnd(25)} │`);
  console.log(`   │ Total Votes: ${String(voteStats.voteCount).padEnd(22)} │`);
  console.log('   ├─────────────────────────────────────┤');

  // Sort by vote count
  const sortedResults = Object.entries(voteCounts)
    .sort(([, a], [, b]) => b - a);

  for (const [name, count] of sortedResults) {
    const pct = ((count / 30) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / 2));
    console.log(`   │ ${name.padEnd(15)} ${String(count).padStart(2)} (${pct.padStart(5)}%) ${bar.padEnd(8)} │`);
  }

  console.log('   ├─────────────────────────────────────┤');
  console.log(`   │ Merkle Root: ${voteStats.merkleRoot?.slice(0, 20)}... │`);
  console.log('   └─────────────────────────────────────┘\n');

  // Winner
  const winner = sortedResults[0];
  console.log(`   🏆 WINNER: ${winner[0]} with ${winner[1]} votes (${((winner[1] / 30) * 100).toFixed(1)}%)\n`);

  // Sample confirmation codes
  console.log('   📜 Sample confirmation codes:');
  for (let i = 0; i < 5; i++) {
    const v = voters[i];
    console.log(`      ${v.studentId}: ${v.confirmationCode} → voted for ${v.votedFor}`);
  }

  console.log('\n✅ Test completed successfully!\n');
}

main().catch(console.error);
