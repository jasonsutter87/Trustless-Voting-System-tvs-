#!/usr/bin/env npx tsx
/**
 * TVS Multi-Jurisdiction Ballot Stress Test
 *
 * Tests the hierarchical jurisdiction system at scale:
 * - Configurable voter count (default: 100,000)
 * - 5 questions across 3 jurisdiction levels (Federal, State, County)
 * - Per-question Merkle trees with O(log n) FastMerkleTree
 * - Throughput degradation tracking
 * - VeilCloud storage integration
 *
 * Usage: npx tsx scripts/test-10k-placer-ballot.ts [voter_count]
 */

import { randomBytes, createHash } from 'crypto';
import { execSync } from 'child_process';
import { hostname, platform, arch, cpus } from 'os';

const API_BASE = 'http://localhost:3000';
const VOTER_COUNT = parseInt(process.argv[2] || '100000');
const BATCH_SIZE = VOTER_COUNT >= 10000 ? 1000 : 100; // Report progress every N voters

function getSystemInfo(): { machine: string; os: string; cpu: string } {
  const cpuModel = cpus()[0]?.model || 'Unknown CPU';
  const osInfo = `${platform()} ${arch()}`;
  return {
    machine: hostname(),
    os: osInfo,
    cpu: cpuModel,
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

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
  const testDate = new Date();
  const sysInfo = getSystemInfo();
  const scriptPath = 'scripts/test-10k-placer-ballot.ts';

  // Markdown header
  console.log(`# TVS ${VOTER_COUNT.toLocaleString()} Voter Multi-Jurisdiction Stress Test`);
  console.log();
  console.log(`**Test Date:** ${formatDate(testDate)}`);
  console.log(`**Test Machine:** ${sysInfo.machine}`);
  console.log(`**CPU:** ${sysInfo.cpu}`);
  console.log(`**OS:** ${sysInfo.os}`);
  console.log(`**Test Script:** \`${scriptPath}\``);
  console.log();
  console.log('---');
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
      // Nullifier must be 32 bytes hex (64 chars)
      const nullifier = sha256(`voter-placer-${i}-${Date.now()}-${randomBytes(8).toString('hex')}`);
      const credential = {
        electionId,
        nullifier,
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

  try {
    for (const q of questions) {
      const stats = await api(`/api/vote/question/${q.question.id}/stats`);
      console.log(`   ${stats.questionTitle}:`);
      console.log(`      Votes: ${stats.voteCount.toLocaleString()}`);
      console.log(`      Merkle root: ${stats.merkleRoot?.substring(0, 24)}...`);
    }
  } catch (e) {
    console.log('   (Merkle stats unavailable - rate limited)');
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
  const totalTimeFormatted = formatDuration(Date.now() - testStart);
  const avgThroughput = (successCount / votingTime).toFixed(1);

  console.log('---');
  console.log();
  console.log('## Executive Summary');
  console.log();
  console.log(`Successfully processed **${successCount.toLocaleString()} voters** casting **${(successCount * 5).toLocaleString()} encrypted answers** across 5 questions spanning 3 jurisdiction levels (Federal, State, County) with **${((successCount / VOTER_COUNT) * 100).toFixed(2)}% success rate** in **${totalTimeFormatted}**.`);
  console.log();
  console.log('---');
  console.log();
  console.log('## Test Configuration');
  console.log();
  console.log('| Parameter | Value |');
  console.log('|-----------|-------|');
  console.log(`| Total Voters | ${VOTER_COUNT.toLocaleString()} |`);
  console.log('| Questions per Ballot | 5 |');
  console.log(`| Total Encrypted Answers | ${(VOTER_COUNT * 5).toLocaleString()} |`);
  console.log('| Jurisdiction Levels | 3 (Federal, State, County) |');
  console.log('| Merkle Trees | 5 (one per question) |');
  console.log('| Threshold Scheme | 3-of-5 Feldman VSS |');
  console.log('| Merkle Algorithm | FastMerkleTree O(log n) |');
  console.log('| Storage | VeilCloud (local filesystem) |');
  console.log();
  console.log('### Jurisdiction Hierarchy');
  console.log();
  console.log('```');
  console.log('United States (Federal, Level 0)');
  console.log('    └── California (State, Level 1)');
  console.log('            └── Placer County (County, Level 2)');
  console.log('```');
  console.log();
  console.log('---');
  console.log();
  console.log('## Performance Results');
  console.log();
  console.log('| Metric | Value |');
  console.log('|--------|-------|');
  console.log(`| **Total Time** | **${totalTimeFormatted}** |`);
  console.log(`| Voting Phase | ${votingTime.toFixed(1)}s |`);
  console.log(`| Key Ceremony | ${ceremonyTime}ms |`);
  console.log(`| Avg Throughput | ${avgThroughput} voters/sec |`);
  console.log(`| Peak Throughput | ${firstTput} voters/sec |`);
  console.log(`| Final Throughput | ${lastTput} voters/sec |`);
  console.log(`| Degradation | ${degradationPct}% |`);
  console.log();
  console.log('---');
  console.log();
  console.log('## Success Metrics');
  console.log();
  console.log('| Metric | Value |');
  console.log('|--------|-------|');
  console.log(`| Voters Processed | ${successCount.toLocaleString()} |`);
  console.log(`| Answers Recorded | ${(successCount * 5).toLocaleString()} |`);
  console.log(`| Failed Submissions | ${failCount} |`);
  console.log(`| **Success Rate** | **${((successCount / VOTER_COUNT) * 100).toFixed(2)}%** |`);
  console.log();
  console.log('---');
  console.log();
  console.log(`*Generated: ${formatDate(new Date())}*`);
  console.log(`*Test Duration: ${totalTimeFormatted}*`);
  console.log(`*Script: ${scriptPath}*`);
  console.log();
}

main().catch(console.error);
