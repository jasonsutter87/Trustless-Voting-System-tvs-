#!/usr/bin/env npx tsx
/**
 * Test script: 10,000 Voters with 3-Question Ballot
 *
 * Simulates a complete election with 10,000 voters:
 * - Q1: Single choice (Best Programming Language)
 * - Q2: Pick 2 of 5 (Important Language Features)
 * - Q3: Single choice + write-in (Preferred Code Editor)
 *
 * Tests the full TVS stack with multi-question ballots.
 */

import { createCipheriv, randomBytes, createHash } from 'crypto';

const API_URL = 'http://localhost:3000';
const VOTER_COUNT = 10000;

// ============================================================================
// Types
// ============================================================================

interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
  keyId: string;
}

interface BallotData {
  electionId: string;
  timestamp: number;
  answers: {
    q1: string;           // Single choice
    q2: string[];         // Pick 2
    q3: string;           // Single choice or write-in value
    q3IsWriteIn: boolean;
  };
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
  ballot?: BallotData['answers'];
  confirmationCode?: string;
}

// Question definitions
const QUESTIONS = {
  q1: {
    title: 'Best Programming Language 2025',
    type: 'single',
    options: ['rust', 'typescript', 'python', 'go'],
    weights: [0.35, 0.30, 0.20, 0.15],
  },
  q2: {
    title: 'Most Important Language Features',
    type: 'pick2',
    options: ['type-safety', 'performance', 'ecosystem', 'simplicity', 'concurrency'],
  },
  q3: {
    title: 'Preferred Code Editor',
    type: 'single-writein',
    options: ['vscode', 'neovim', 'jetbrains'],
    weights: [0.45, 0.20, 0.25],
    writeInChance: 0.10,
    writeInOptions: ['Emacs', 'Vim', 'Sublime', 'Zed', 'Helix', 'Atom'],
  },
};

// ============================================================================
// Crypto Helpers
// ============================================================================

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function encryptBallot(ballot: BallotData): EncryptedPayload {
  const aesKey = randomBytes(32);
  const iv = randomBytes(12);

  const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
  const plaintext = JSON.stringify(ballot);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  const keyId = sha256(aesKey.toString('hex')).slice(0, 32);

  return { ciphertext, iv: iv.toString('hex'), tag, keyId };
}

function createBallotCommitment(ballot: BallotData['answers']): { commitment: string; salt: string } {
  const salt = randomBytes(32).toString('hex');
  const commitment = sha256(`${JSON.stringify(ballot)}:${salt}`);
  return { commitment, salt };
}

// ============================================================================
// Vote Generation
// ============================================================================

function weightedChoice<T>(options: T[], weights: number[]): T {
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < options.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) return options[i];
  }
  return options[0];
}

function generateBallotAnswers(): BallotData['answers'] {
  // Q1: Weighted single choice
  const q1 = weightedChoice(QUESTIONS.q1.options, QUESTIONS.q1.weights);

  // Q2: Random 2 from 5
  const shuffled = [...QUESTIONS.q2.options].sort(() => Math.random() - 0.5);
  const q2 = shuffled.slice(0, 2);

  // Q3: Weighted single choice with write-in chance
  let q3: string;
  let q3IsWriteIn = false;

  if (Math.random() < QUESTIONS.q3.writeInChance) {
    q3 = QUESTIONS.q3.writeInOptions[Math.floor(Math.random() * QUESTIONS.q3.writeInOptions.length)];
    q3IsWriteIn = true;
  } else {
    q3 = weightedChoice(QUESTIONS.q3.options, QUESTIONS.q3.weights);
  }

  return { q1, q2, q3, q3IsWriteIn };
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
// Results Tracking
// ============================================================================

interface Results {
  q1: Record<string, number>;
  q2: Record<string, number>;
  q3: Record<string, number>;
  q3WriteIns: Record<string, number>;
}

function initResults(): Results {
  return {
    q1: Object.fromEntries(QUESTIONS.q1.options.map(o => [o, 0])),
    q2: Object.fromEntries(QUESTIONS.q2.options.map(o => [o, 0])),
    q3: Object.fromEntries(QUESTIONS.q3.options.map(o => [o, 0])),
    q3WriteIns: {},
  };
}

function recordBallot(results: Results, answers: BallotData['answers']) {
  results.q1[answers.q1]++;
  answers.q2.forEach(opt => results.q2[opt]++);
  if (answers.q3IsWriteIn) {
    results.q3WriteIns[answers.q3] = (results.q3WriteIns[answers.q3] || 0) + 1;
  } else {
    results.q3[answers.q3]++;
  }
}

// ============================================================================
// Main Test Flow
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   TVS - 10,000 Voters × 3-Question Ballot E2E Test             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const testStart = Date.now();
  const results = initResults();

  // Load VeilKey dynamically
  console.log('🔧 Loading VeilKey...');
  let feldmanSplit: any;
  try {
    const veilkey = await import('../../VeilKey/dist/index.js');
    feldmanSplit = veilkey.feldmanSplit;
    console.log('   ✓ VeilKey loaded\n');
  } catch (e) {
    console.error('   ✗ VeilKey not found. Run: cd ../VeilKey && pnpm build');
    process.exit(1);
  }

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
  console.log('📋 Step 1: Creating multi-question election...');

  const now = new Date();
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const electionData = await api('/api/elections', {
    method: 'POST',
    body: JSON.stringify({
      name: '10K Voters - 3 Question Ballot Test',
      description: 'Testing multi-question ballots at scale',
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      threshold: 3,
      totalTrustees: 5,
      questions: [
        {
          id: 'q1',
          title: QUESTIONS.q1.title,
          type: 'single',
          options: QUESTIONS.q1.options,
        },
        {
          id: 'q2',
          title: QUESTIONS.q2.title,
          type: 'multiple',
          maxSelections: 2,
          options: QUESTIONS.q2.options,
        },
        {
          id: 'q3',
          title: QUESTIONS.q3.title,
          type: 'single-writein',
          options: QUESTIONS.q3.options,
        },
      ],
      // Legacy candidates field for compatibility
      candidates: QUESTIONS.q1.options.map(name => ({ name })),
    }),
  });

  const electionId = electionData.election.id;

  console.log(`   ✓ Election created: ${electionId}`);
  console.log(`   ✓ Questions: 3 (single, pick-2, single+write-in)\n`);

  // ==========================================================================
  // Step 2: Key Ceremony
  // ==========================================================================
  console.log('🔐 Step 2: Key ceremony - 3-of-5 threshold...');

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
  }

  for (const trustee of trustees) {
    const secret = BigInt('0x' + randomBytes(32).toString('hex'));
    const feldmanResult = feldmanSplit(secret, 3, 5);

    const feldmanCommitments = feldmanResult.commitments.map((pt: any) => ({
      x: pt.x.toString(),
      y: pt.y.toString(),
    }));

    await api(`/api/elections/${electionId}/trustees/${trustee.id}/commitment`, {
      method: 'POST',
      body: JSON.stringify({
        commitmentHash: sha256(JSON.stringify(feldmanCommitments)),
        feldmanCommitments,
      }),
    });
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

  console.log('   ✓ Registration open\n');

  // ==========================================================================
  // Step 4: Register 10,000 Voters
  // ==========================================================================
  console.log(`👥 Step 4: Registering ${VOTER_COUNT.toLocaleString()} voters...`);

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

    if (i % 500 === 0 || i === VOTER_COUNT) {
      const elapsed = ((Date.now() - registrationStart) / 1000).toFixed(1);
      const rate = (i / parseFloat(elapsed)).toFixed(0);
      process.stdout.write(`   Registered: ${i.toLocaleString()}/${VOTER_COUNT.toLocaleString()} (${rate}/sec)\r`);
    }
  }

  const registrationTime = Date.now() - registrationStart;
  console.log(`\n   ✓ Registration complete: ${(registrationTime / 1000).toFixed(2)}s\n`);

  // ==========================================================================
  // Step 5: Open Voting
  // ==========================================================================
  console.log('🗳️  Step 5: Opening voting...');

  await api(`/api/elections/${electionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'voting' }),
  });

  console.log('   ✓ Voting open\n');

  // ==========================================================================
  // Step 6: Cast 10,000 Votes
  // ==========================================================================
  console.log(`🗳️  Step 6: Casting ${VOTER_COUNT.toLocaleString()} ballots (3 questions each)...`);

  const votingStart = Date.now();
  let successfulVotes = 0;
  let failedVotes = 0;

  for (let i = 0; i < voters.length; i++) {
    const voter = voters[i];
    const answers = generateBallotAnswers();

    const ballot: BallotData = {
      electionId,
      timestamp: Date.now(),
      answers,
    };

    const encryptedPayload = encryptBallot(ballot);
    const { commitment } = createBallotCommitment(answers);
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

      voter.ballot = answers;
      voter.confirmationCode = result.confirmationCode;
      recordBallot(results, answers);
      successfulVotes++;

      if ((i + 1) % 500 === 0 || i === voters.length - 1) {
        const elapsed = ((Date.now() - votingStart) / 1000).toFixed(1);
        const rate = ((i + 1) / parseFloat(elapsed)).toFixed(0);
        process.stdout.write(`   Votes: ${(i + 1).toLocaleString()}/${VOTER_COUNT.toLocaleString()} (${rate}/sec)\r`);
      }
    } catch (error: any) {
      failedVotes++;
      if (failedVotes <= 5) {
        console.error(`\n   ✗ Vote failed: ${error.message}`);
      }
    }
  }

  const votingTime = Date.now() - votingStart;
  console.log(`\n   ✓ Voting complete: ${(votingTime / 1000).toFixed(2)}s`);
  if (failedVotes > 0) {
    console.log(`   ⚠ ${failedVotes} votes failed\n`);
  } else {
    console.log('');
  }

  // ==========================================================================
  // Step 7: Display Results
  // ==========================================================================
  const totalTime = Date.now() - testStart;

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      ELECTION RESULTS                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Q1 Results
  console.log(`📊 Q1: ${QUESTIONS.q1.title}`);
  console.log('   ┌────────────────────────────────────────────────────────┐');
  const q1Sorted = Object.entries(results.q1).sort(([, a], [, b]) => b - a);
  for (const [name, count] of q1Sorted) {
    const pct = ((count / VOTER_COUNT) * 100).toFixed(1);
    const barLen = Math.round((count / VOTER_COUNT) * 40);
    const bar = '█'.repeat(barLen);
    console.log(`   │ ${name.padEnd(12)} ${String(count).padStart(5)} (${pct.padStart(5)}%) ${bar}`);
  }
  console.log('   └────────────────────────────────────────────────────────┘');
  console.log(`   🏆 Winner: ${q1Sorted[0][0]}\n`);

  // Q2 Results
  console.log(`📊 Q2: ${QUESTIONS.q2.title} (pick 2)`);
  console.log('   ┌────────────────────────────────────────────────────────┐');
  const q2Sorted = Object.entries(results.q2).sort(([, a], [, b]) => b - a);
  const q2Max = q2Sorted[0][1];
  for (const [name, count] of q2Sorted) {
    const barLen = Math.round((count / q2Max) * 40);
    const bar = '█'.repeat(barLen);
    console.log(`   │ ${name.padEnd(12)} ${String(count).padStart(5)} ${bar}`);
  }
  console.log('   └────────────────────────────────────────────────────────┘\n');

  // Q3 Results
  console.log(`📊 Q3: ${QUESTIONS.q3.title}`);
  console.log('   ┌────────────────────────────────────────────────────────┐');

  // Combine fixed options and write-ins
  const q3All: [string, number, boolean][] = [
    ...Object.entries(results.q3).map(([k, v]) => [k, v, false] as [string, number, boolean]),
    ...Object.entries(results.q3WriteIns).map(([k, v]) => [k, v, true] as [string, number, boolean]),
  ];
  const q3Sorted = q3All.sort((a, b) => b[1] - a[1]);

  for (const [name, count, isWriteIn] of q3Sorted) {
    const pct = ((count / VOTER_COUNT) * 100).toFixed(1);
    const barLen = Math.round((count / VOTER_COUNT) * 40);
    const bar = '█'.repeat(barLen);
    const label = isWriteIn ? `${name} (write-in)` : name;
    console.log(`   │ ${label.padEnd(20)} ${String(count).padStart(5)} (${pct.padStart(5)}%) ${bar}`);
  }
  console.log('   └────────────────────────────────────────────────────────┘');
  console.log(`   🏆 Winner: ${q3Sorted[0][0]}\n`);

  // ==========================================================================
  // Performance Metrics
  // ==========================================================================
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    PERFORMANCE METRICS                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('   ┌────────────────────────────────────────────────────────┐');
  console.log(`   │ Voters:           ${VOTER_COUNT.toLocaleString().padStart(10)}`);
  console.log(`   │ Questions:                   3`);
  console.log(`   │ Total Answers:    ${(VOTER_COUNT * 3).toLocaleString().padStart(10)}`);
  console.log('   ├────────────────────────────────────────────────────────┤');
  console.log(`   │ Registration:     ${(registrationTime / 1000).toFixed(2).padStart(10)}s  (${(registrationTime / VOTER_COUNT).toFixed(1)}ms/voter)`);
  console.log(`   │ Voting:           ${(votingTime / 1000).toFixed(2).padStart(10)}s  (${(votingTime / VOTER_COUNT).toFixed(1)}ms/vote)`);
  console.log(`   │ Total Time:       ${(totalTime / 1000).toFixed(2).padStart(10)}s`);
  console.log('   ├────────────────────────────────────────────────────────┤');
  console.log(`   │ Reg Throughput:   ${(VOTER_COUNT / (registrationTime / 1000)).toFixed(1).padStart(10)} voters/sec`);
  console.log(`   │ Vote Throughput:  ${(VOTER_COUNT / (votingTime / 1000)).toFixed(1).padStart(10)} votes/sec`);
  console.log(`   │ Success Rate:     ${((successfulVotes / VOTER_COUNT) * 100).toFixed(2).padStart(10)}%`);
  console.log('   └────────────────────────────────────────────────────────┘\n');

  console.log('✅ 10,000 voter × 3 question E2E test completed!\n');
}

main().catch(console.error);
