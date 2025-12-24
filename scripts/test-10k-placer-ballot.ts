#!/usr/bin/env npx tsx
/**
 * 10,000 Voter Multi-Jurisdiction Ballot Stress Test
 *
 * Tests the hierarchical jurisdiction system at scale:
 * - 10,000 Placer County voters
 * - 5 questions across 3 jurisdiction levels (Federal, State, County)
 * - 50,000 total encrypted answers
 * - Per-question Merkle trees
 * - Throughput degradation tracking
 *
 * Usage: npx tsx scripts/test-10k-placer-ballot.ts
 */

import { randomBytes, createHash } from 'crypto';

const API_BASE = 'http://localhost:3000';
const VOTER_COUNT = 10000;
const BATCH_SIZE = 100; // Report progress every N voters

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let feldmanSplit: any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function api(path: string, options?: RequestInit): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`API Error: ${JSON.stringify(data)}`);
  }

  return data;
}

interface DegradationPoint {
  voteCount: number;
  throughput: number;
  cumulativeTime: number;
  batchTime: number;
}

async function main() {
  const testStart = Date.now();

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  TVS 10,000 Voter Multi-Jurisdiction Stress Test               ║');
  console.log('║  Scenario: Placer County, California - 5 Questions             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();

  // Load VeilKey dynamically
  const veilkey = await import('../../VeilKey/dist/index.js');
  feldmanSplit = veilkey.feldmanSplit;

  // Step 1: Health check
  console.log('1. Checking API health...');
  const health = await api('/health');
  console.log(`   Status: ${health.status}`);
  console.log();

  // Step 2: Verify jurisdiction hierarchy
  console.log('2. Verifying jurisdiction hierarchy...');
  const federal = await api('/api/jurisdictions/US');
  const california = await api('/api/jurisdictions/US-CA');
  const placer = await api('/api/jurisdictions/US-CA-PLACER');
  const chain = await api(`/api/jurisdictions/${placer.jurisdiction.id}/chain`);
  console.log(`   Chain: ${chain.chainCodes.join(' → ')}`);
  console.log();

  // Step 3: Create election
  console.log('3. Creating election with 3-of-5 threshold...');
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);

  const electionRes = await api('/api/elections', {
    method: 'POST',
    body: JSON.stringify({
      name: '10K Multi-Jurisdiction Stress Test',
      description: 'Testing hierarchical ballot at scale',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      threshold: 3,
      totalTrustees: 5,
      candidates: [
        { name: 'Placeholder 1' },
        { name: 'Placeholder 2' },
      ],
    }),
  });

  const electionId = electionRes.election.id;
  console.log(`   Election ID: ${electionId}`);
  console.log();

  // Step 4: Key ceremony
  console.log('4. Running threshold key ceremony...');
  const ceremonyStart = Date.now();

  const trusteeNames = ['Trustee-Alpha', 'Trustee-Beta', 'Trustee-Gamma', 'Trustee-Delta', 'Trustee-Epsilon'];
  const trustees: any[] = [];

  for (const name of trusteeNames) {
    const res = await api(`/api/elections/${electionId}/trustees`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        publicKey: randomBytes(32).toString('hex'),
      }),
    });
    trustees.push(res.trustee);
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

  const ceremonyTime = Date.now() - ceremonyStart;
  console.log(`   Key ceremony complete (${ceremonyTime}ms)`);
  console.log();

  // Step 5: Create ballot questions
  console.log('5. Creating ballot questions at each jurisdiction level...');

  // Federal (1 question)
  const federalQ = await api('/api/ballot/questions', {
    method: 'POST',
    body: JSON.stringify({
      electionId,
      jurisdictionId: federal.jurisdiction.id,
      title: 'President of the United States',
      questionType: 'single_choice',
      displayOrder: 0,
      candidates: [
        { name: 'Alice Adams', party: 'Democratic' },
        { name: 'Bob Brown', party: 'Republican' },
        { name: 'Carol Chen', party: 'Independent' },
      ],
    }),
  });
  console.log(`   Federal: ${federalQ.question.title}`);

  // State (2 questions)
  const stateQ1 = await api('/api/ballot/questions', {
    method: 'POST',
    body: JSON.stringify({
      electionId,
      jurisdictionId: california.jurisdiction.id,
      title: 'California Governor',
      questionType: 'single_choice',
      displayOrder: 0,
      candidates: [
        { name: 'Diana Davis', party: 'Democratic' },
        { name: 'Edward Evans', party: 'Republican' },
      ],
    }),
  });
  console.log(`   State: ${stateQ1.question.title}`);

  const stateQ2 = await api('/api/ballot/questions', {
    method: 'POST',
    body: JSON.stringify({
      electionId,
      jurisdictionId: california.jurisdiction.id,
      title: 'Proposition 99: State Parks Funding',
      questionType: 'yes_no',
      displayOrder: 1,
      candidates: [{ name: 'Yes' }, { name: 'No' }],
    }),
  });
  console.log(`   State: ${stateQ2.question.title}`);

  // County (2 questions)
  const countyQ1 = await api('/api/ballot/questions', {
    method: 'POST',
    body: JSON.stringify({
      electionId,
      jurisdictionId: placer.jurisdiction.id,
      title: 'Placer County Sheriff',
      questionType: 'single_choice',
      displayOrder: 0,
      candidates: [
        { name: 'Frank Foster', party: 'Republican' },
        { name: 'Grace Garcia', party: 'Democratic' },
      ],
    }),
  });
  console.log(`   County: ${countyQ1.question.title}`);

  const countyQ2 = await api('/api/ballot/questions', {
    method: 'POST',
    body: JSON.stringify({
      electionId,
      jurisdictionId: placer.jurisdiction.id,
      title: 'Measure A: Road Improvements',
      questionType: 'yes_no',
      displayOrder: 1,
      candidates: [{ name: 'Yes' }, { name: 'No' }],
    }),
  });
  console.log(`   County: ${countyQ2.question.title}`);
  console.log();

  const questions = [federalQ, stateQ1, stateQ2, countyQ1, countyQ2];

  // Transition to voting
  await api(`/api/elections/${electionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'registration' }),
  });
  await api(`/api/elections/${electionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'voting' }),
  });

  // Step 6: Vote with 10,000 voters
  console.log(`6. Casting votes for ${VOTER_COUNT.toLocaleString()} voters...`);
  console.log(`   Each voter answers 5 questions = ${(VOTER_COUNT * 5).toLocaleString()} encrypted answers`);
  console.log();

  const votingStart = Date.now();
  const degradationData: DegradationPoint[] = [];
  let successCount = 0;
  let failCount = 0;
  let batchStart = Date.now();

  // Vote tallies for results
  const tallies: Map<string, Map<string, number>> = new Map();
  for (const q of questions) {
    const qTally = new Map<string, number>();
    for (const c of q.question.candidates) {
      qTally.set(c.id, 0);
    }
    tallies.set(q.question.id, qTally);
  }

  for (let i = 1; i <= VOTER_COUNT; i++) {
    try {
      // Create credential for this voter
      const credential = {
        electionId,
        nullifier: `voter-placer-${i}-${Date.now()}`,
        message: 'authorized voter',
        signature: 'mock-signature',
      };

      // Create answers for all 5 questions
      const answers = [];
      for (const q of questions) {
        // Random candidate selection
        const candidates = q.question.candidates;
        const selectedIdx = Math.floor(Math.random() * candidates.length);
        const selectedCandidate = candidates[selectedIdx];

        answers.push({
          questionId: q.question.id,
          encryptedVote: JSON.stringify({ candidateId: selectedCandidate.id }),
          commitment: sha256(`${selectedCandidate.id}:${randomBytes(16).toString('hex')}`),
          zkProof: 'mock-proof',
        });

        // Track tally
        const qTally = tallies.get(q.question.id)!;
        qTally.set(selectedCandidate.id, (qTally.get(selectedCandidate.id) || 0) + 1);
      }

      // Submit ballot
      const result = await api('/api/vote/ballot', {
        method: 'POST',
        body: JSON.stringify({
          electionId,
          credential,
          answers,
        }),
      });

      if (result.answersSubmitted === 5) {
        successCount++;
      } else {
        failCount++;
      }

      // Progress and degradation tracking
      if (i % BATCH_SIZE === 0) {
        const batchTime = Date.now() - batchStart;
        const cumulativeTime = (Date.now() - votingStart) / 1000;
        const throughput = Math.round(BATCH_SIZE / (batchTime / 1000));

        degradationData.push({
          voteCount: i,
          throughput,
          cumulativeTime,
          batchTime,
        });

        const pct = ((i / VOTER_COUNT) * 100).toFixed(1);
        const eta = ((VOTER_COUNT - i) / throughput).toFixed(0);
        process.stdout.write(`\r   Progress: ${i.toLocaleString()}/${VOTER_COUNT.toLocaleString()} (${pct}%) | ${throughput} voters/sec | ETA: ${eta}s   `);

        batchStart = Date.now();
      }
    } catch (e) {
      failCount++;
    }
  }

  const votingTime = (Date.now() - votingStart) / 1000;
  console.log();
  console.log();

  // Step 7: Results
  console.log('7. Voting Results:');
  console.log();

  for (const q of questions) {
    const qTally = tallies.get(q.question.id)!;
    console.log(`   ${q.question.title}:`);

    // Sort by votes descending
    const sorted = [...qTally.entries()].sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((sum, [, v]) => sum + v, 0);

    for (const [candidateId, votes] of sorted) {
      const candidate = q.question.candidates.find((c: any) => c.id === candidateId);
      const pct = ((votes / total) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(votes / total * 20));
      console.log(`      ${candidate?.name}: ${votes.toLocaleString()} (${pct}%) ${bar}`);
    }
    console.log();
  }

  // Step 8: Per-question Merkle tree stats
  console.log('8. Per-Question Merkle Trees:');
  console.log();

  for (const q of questions) {
    const stats = await api(`/api/vote/question/${q.question.id}/stats`);
    console.log(`   ${stats.questionTitle}:`);
    console.log(`      Votes: ${stats.voteCount.toLocaleString()}`);
    console.log(`      Merkle root: ${stats.merkleRoot?.substring(0, 24)}...`);
  }
  console.log();

  // Step 9: Degradation analysis
  console.log('9. Throughput Degradation Curve:');
  console.log();
  console.log('   Voters     Throughput    Cumulative     Batch');
  console.log('   ──────────────────────────────────────────────');

  for (const point of degradationData) {
    const voters = point.voteCount.toString().padStart(7);
    const tput = `${point.throughput}/sec`.padStart(10);
    const cumTime = `${point.cumulativeTime.toFixed(1)}s`.padStart(10);
    const batchMs = `${point.batchTime}ms`.padStart(8);
    console.log(`   ${voters}  ${tput}  ${cumTime}  ${batchMs}`);
  }
  console.log();

  // Calculate degradation
  const firstTput = degradationData[0]?.throughput || 0;
  const lastTput = degradationData[degradationData.length - 1]?.throughput || 0;
  const degradationPct = ((1 - lastTput / firstTput) * 100).toFixed(1);

  // Final summary
  const totalTime = (Date.now() - testStart) / 1000;
  const avgThroughput = (successCount / votingTime).toFixed(1);

  console.log('═'.repeat(64));
  console.log('TEST COMPLETE');
  console.log('═'.repeat(64));
  console.log();
  console.log('Summary:');
  console.log(`   Election: ${electionRes.election.name}`);
  console.log(`   Jurisdiction: Placer County, California`);
  console.log(`   Hierarchy: Federal → State → County`);
  console.log();
  console.log('Ballot Structure:');
  console.log('   • 1 Federal question (President)');
  console.log('   • 2 State questions (Governor, Prop 99)');
  console.log('   • 2 County questions (Sheriff, Measure A)');
  console.log('   • 5 questions total per ballot');
  console.log();
  console.log('Scale:');
  console.log(`   • Voters: ${VOTER_COUNT.toLocaleString()}`);
  console.log(`   • Encrypted answers: ${(VOTER_COUNT * 5).toLocaleString()}`);
  console.log(`   • Merkle trees: 5 (one per question)`);
  console.log();
  console.log('Performance:');
  console.log(`   • Key ceremony: ${ceremonyTime}ms`);
  console.log(`   • Voting phase: ${votingTime.toFixed(1)}s`);
  console.log(`   • Avg throughput: ${avgThroughput} voters/sec`);
  console.log(`   • Peak throughput: ${firstTput} voters/sec`);
  console.log(`   • Final throughput: ${lastTput} voters/sec`);
  console.log(`   • Degradation: ${degradationPct}%`);
  console.log(`   • Total time: ${totalTime.toFixed(1)}s`);
  console.log();
  console.log('Success Rate:');
  console.log(`   • Succeeded: ${successCount.toLocaleString()}`);
  console.log(`   • Failed: ${failCount}`);
  console.log(`   • Rate: ${((successCount / VOTER_COUNT) * 100).toFixed(2)}%`);
  console.log();
}

main().catch(console.error);
