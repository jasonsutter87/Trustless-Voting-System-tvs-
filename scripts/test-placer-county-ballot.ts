#!/usr/bin/env npx tsx
/**
 * Placer County Multi-Jurisdiction Ballot Test
 *
 * Tests the complete flow:
 * 1. Create election with threshold key ceremony
 * 2. Add ballot questions at Federal, State (CA), County (Placer) levels
 * 3. Generate ballot for Placer County voter
 * 4. Submit votes for all questions
 * 5. Verify per-question Merkle trees
 *
 * Usage: npx tsx scripts/test-placer-county-ballot.ts
 */

import { randomBytes, createHash } from 'crypto';

const API_BASE = 'http://localhost:3000';

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

interface Trustee {
  id: string;
  name: string;
  commitment: string;
  index: number;
}

// VeilKey dynamic import
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

async function main() {
  console.log('='.repeat(60));
  console.log('TVS Multi-Jurisdiction Ballot Test');
  console.log('Scenario: Placer County, California Voter');
  console.log('='.repeat(60));
  console.log();

  // Load VeilKey dynamically
  const veilkey = await import('../../VeilKey/dist/index.js');
  feldmanSplit = veilkey.feldmanSplit;

  // Step 1: Health check
  console.log('1. Checking API health...');
  const health = await api('/health');
  console.log(`   API Status: ${health.status}`);
  console.log();

  // Step 2: Check jurisdiction hierarchy
  console.log('2. Verifying jurisdiction hierarchy...');

  // Get Federal
  const federal = await api('/api/jurisdictions/US');
  console.log(`   Federal: ${federal.jurisdiction.name} (${federal.jurisdiction.code})`);

  // Get California (should be auto-created)
  const california = await api('/api/jurisdictions/US-CA');
  console.log(`   State: ${california.jurisdiction.name} (${california.jurisdiction.code})`);

  // Get Placer County
  const placer = await api('/api/jurisdictions/US-CA-PLACER');
  console.log(`   County: ${placer.jurisdiction.name} (${placer.jurisdiction.code})`);

  // Get jurisdiction chain for Placer County
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
      name: '2025 Multi-Jurisdiction Test Election',
      description: 'Tests Federal, State, and County ballot questions',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      threshold: 3,
      totalTrustees: 5,
      candidates: [
        { name: 'Placeholder Candidate 1' },
        { name: 'Placeholder Candidate 2' },
      ],
    }),
  });

  const electionId = electionRes.election.id;
  console.log(`   Election ID: ${electionId}`);
  console.log(`   Status: ${electionRes.election.status}`);
  console.log();

  // Step 4: Complete key ceremony
  console.log('4. Running threshold key ceremony...');

  const trusteeNames = ['Trustee-Alpha', 'Trustee-Beta', 'Trustee-Gamma', 'Trustee-Delta', 'Trustee-Epsilon'];
  const trustees: Trustee[] = [];

  for (const name of trusteeNames) {
    const res = await api(`/api/elections/${electionId}/trustees`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        publicKey: randomBytes(32).toString('hex'),
      }),
    });
    trustees.push(res.trustee);
    console.log(`   Registered: ${name}`);
  }

  console.log('   Submitting Feldman commitments...');

  for (const trustee of trustees) {
    const secret = BigInt('0x' + randomBytes(32).toString('hex'));
    const feldmanResult = feldmanSplit(secret, 3, 5); // threshold=3, total=5

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      console.log(`   Ceremony finalized! Public key generated.`);
    }
  }

  console.log('   Key ceremony complete');
  console.log();

  // Step 5: Add ballot questions at each jurisdiction level
  console.log('5. Creating ballot questions at each jurisdiction level...');

  // Federal question (President)
  const federalQuestion = await api('/api/ballot/questions', {
    method: 'POST',
    body: JSON.stringify({
      electionId,
      jurisdictionId: federal.jurisdiction.id,
      title: 'President of the United States',
      description: 'Choose one candidate for President',
      questionType: 'single_choice',
      maxSelections: 1,
      displayOrder: 0,
      candidates: [
        { name: 'Alice Adams', party: 'Democratic' },
        { name: 'Bob Brown', party: 'Republican' },
        { name: 'Carol Chen', party: 'Independent' },
      ],
    }),
  });
  console.log(`   Federal: ${federalQuestion.question.title}`);
  console.log(`      Candidates: ${federalQuestion.question.candidates.map((c: { name: string }) => c.name).join(', ')}`);

  // State question (CA Governor)
  const stateQuestion = await api('/api/ballot/questions', {
    method: 'POST',
    body: JSON.stringify({
      electionId,
      jurisdictionId: california.jurisdiction.id,
      title: 'California Governor',
      description: 'Choose one candidate for Governor',
      questionType: 'single_choice',
      maxSelections: 1,
      displayOrder: 0,
      candidates: [
        { name: 'Diana Davis', party: 'Democratic' },
        { name: 'Edward Evans', party: 'Republican' },
      ],
    }),
  });
  console.log(`   State: ${stateQuestion.question.title}`);
  console.log(`      Candidates: ${stateQuestion.question.candidates.map((c: { name: string }) => c.name).join(', ')}`);

  // State proposition
  const stateProp = await api('/api/ballot/questions', {
    method: 'POST',
    body: JSON.stringify({
      electionId,
      jurisdictionId: california.jurisdiction.id,
      title: 'Proposition 99: Funding for State Parks',
      description: 'Shall the state issue bonds for park improvements?',
      questionType: 'yes_no',
      maxSelections: 1,
      displayOrder: 1,
      candidates: [
        { name: 'Yes' },
        { name: 'No' },
      ],
    }),
  });
  console.log(`   State: ${stateProp.question.title}`);

  // County question (Sheriff)
  const countyQuestion = await api('/api/ballot/questions', {
    method: 'POST',
    body: JSON.stringify({
      electionId,
      jurisdictionId: placer.jurisdiction.id,
      title: 'Placer County Sheriff',
      description: 'Choose one candidate for County Sheriff',
      questionType: 'single_choice',
      maxSelections: 1,
      displayOrder: 0,
      candidates: [
        { name: 'Frank Foster', party: 'Republican' },
        { name: 'Grace Garcia', party: 'Democratic' },
      ],
    }),
  });
  console.log(`   County: ${countyQuestion.question.title}`);
  console.log(`      Candidates: ${countyQuestion.question.candidates.map((c: { name: string }) => c.name).join(', ')}`);

  // County measure
  const countyMeasure = await api('/api/ballot/questions', {
    method: 'POST',
    body: JSON.stringify({
      electionId,
      jurisdictionId: placer.jurisdiction.id,
      title: 'Measure A: County Road Improvements',
      description: 'Shall Placer County levy a 0.5% sales tax for road improvements?',
      questionType: 'yes_no',
      maxSelections: 1,
      displayOrder: 1,
      candidates: [
        { name: 'Yes' },
        { name: 'No' },
      ],
    }),
  });
  console.log(`   County: ${countyMeasure.question.title}`);
  console.log();

  // Step 6: Generate ballot for Placer County voter
  console.log('6. Generating ballot for Placer County voter...');

  // Transition election to voting (ceremony already moved to draft)
  await api(`/api/elections/${electionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'registration' }),
  });
  await api(`/api/elections/${electionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'voting' }),
  });

  const ballot = await api(`/api/ballot/${electionId}/${placer.jurisdiction.id}`);

  console.log(`   Voter jurisdiction: ${ballot.voter.jurisdictionName} (${ballot.voter.jurisdictionCode})`);
  console.log(`   Total questions: ${ballot.totalQuestions}`);
  console.log();
  console.log('   Ballot Sections:');
  for (const section of ballot.sections) {
    console.log(`   ┌─ ${section.jurisdiction.name} (Level ${section.jurisdiction.level})`);
    for (const q of section.questions) {
      console.log(`   │  • ${q.title}`);
    }
    console.log('   └───');
  }
  console.log();

  // Step 7: Submit votes for all questions
  console.log('7. Submitting ballot with votes for all questions...');

  // Create mock credential (in production this comes from VeilSign)
  const mockCredential = {
    electionId,
    nullifier: `voter-placer-${Date.now()}`,
    message: 'authorized voter',
    signature: 'mock-signature-for-testing',
  };

  // Create answers for each question
  const answers = [];

  // Federal - vote for Alice Adams
  answers.push({
    questionId: federalQuestion.question.id,
    encryptedVote: JSON.stringify({ candidateId: federalQuestion.question.candidates[0].id }),
    commitment: `commit-${federalQuestion.question.id}`,
    zkProof: 'mock-proof',
  });

  // State Governor - vote for Diana Davis
  answers.push({
    questionId: stateQuestion.question.id,
    encryptedVote: JSON.stringify({ candidateId: stateQuestion.question.candidates[0].id }),
    commitment: `commit-${stateQuestion.question.id}`,
    zkProof: 'mock-proof',
  });

  // State Prop - vote Yes
  answers.push({
    questionId: stateProp.question.id,
    encryptedVote: JSON.stringify({ candidateId: stateProp.question.candidates[0].id }),
    commitment: `commit-${stateProp.question.id}`,
    zkProof: 'mock-proof',
  });

  // County Sheriff - vote for Grace Garcia
  answers.push({
    questionId: countyQuestion.question.id,
    encryptedVote: JSON.stringify({ candidateId: countyQuestion.question.candidates[1].id }),
    commitment: `commit-${countyQuestion.question.id}`,
    zkProof: 'mock-proof',
  });

  // County Measure A - vote No
  answers.push({
    questionId: countyMeasure.question.id,
    encryptedVote: JSON.stringify({ candidateId: countyMeasure.question.candidates[1].id }),
    commitment: `commit-${countyMeasure.question.id}`,
    zkProof: 'mock-proof',
  });

  const voteResult = await api('/api/vote/ballot', {
    method: 'POST',
    body: JSON.stringify({
      electionId,
      credential: mockCredential,
      answers,
    }),
  });

  console.log(`   Confirmation code: ${voteResult.confirmationCode}`);
  console.log(`   Answers submitted: ${voteResult.answersSubmitted}/${voteResult.answersTotal}`);
  console.log(`   Message: ${voteResult.message}`);
  console.log();

  // Step 8: Verify per-question Merkle trees
  console.log('8. Verifying per-question Merkle trees...');

  for (const result of voteResult.results) {
    const stats = await api(`/api/vote/question/${result.questionId}/stats`);
    console.log(`   ${stats.questionTitle}:`);
    console.log(`      Votes: ${stats.voteCount}`);
    console.log(`      Merkle root: ${stats.merkleRoot?.substring(0, 16)}...`);
  }
  console.log();

  // Step 9: Try double voting (should fail)
  console.log('9. Testing double-vote prevention...');

  const doubleVoteResult = await api('/api/vote/ballot', {
    method: 'POST',
    body: JSON.stringify({
      electionId,
      credential: mockCredential, // Same credential
      answers: [answers[0]], // Try to vote again on same question
    }),
  });

  if (doubleVoteResult.answersSubmitted === 0 &&
      doubleVoteResult.results[0].error === 'Already voted on this question') {
    console.log('   Double vote correctly rejected');
    console.log(`   Error: ${doubleVoteResult.results[0].error}`);
  } else {
    console.log('   ERROR: Double vote should have been rejected!');
  }
  console.log();

  // Summary
  console.log('='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
  console.log();
  console.log('Summary:');
  console.log(`  Election: ${electionRes.election.name}`);
  console.log(`  Voter jurisdiction: Placer County, California`);
  console.log(`  Questions on ballot: ${ballot.totalQuestions}`);
  console.log('    - 1 Federal (President)');
  console.log('    - 2 State (Governor, Prop 99)');
  console.log('    - 2 County (Sheriff, Measure A)');
  console.log(`  Votes cast: ${voteResult.answersSubmitted}`);
  console.log(`  Confirmation: ${voteResult.confirmationCode}`);
  console.log();
  console.log('Each question has its own Merkle tree for independent');
  console.log('verification and jurisdiction-specific tallying.');
  console.log();
}

main().catch(console.error);
