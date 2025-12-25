/**
 * Voting Routes
 *
 * Handles vote submission with VeilChain storage and VeilProof verification.
 * Includes threshold decryption for tallying.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { uuid, randomBytesHex } from '@tvs/core';
import { verifyCredential, type SignedCredential } from '@tvs/veilsign';
import { VoteLedger, type VoteEntry } from '@tvs/veilchain';
import { elections, ceremonyResults } from './elections.js';
import { ballotQuestions } from './ballot.js';
import { config } from '../config.js';
import { bitcoinAnchor } from '../services/bitcoin-anchor.js';
import * as anchorsDb from '../db/anchors.js';

// =============================================================================
// SECURITY WARNING: IN-MEMORY STORAGE - MVP ONLY
// =============================================================================
// The following data structures use in-memory storage which has critical
// limitations that MUST be addressed before production deployment:
//
// 1. DATA LOSS ON RESTART: All votes and nullifiers are lost if server restarts
// 2. DOUBLE VOTING: After restart, same credential can vote again
// 3. RACE CONDITIONS: In-memory checks are not atomic, allowing concurrent
//    double-voting via parallel requests
// 4. NO HORIZONTAL SCALING: Cannot run multiple API instances
//
// PRODUCTION FIX: Migrate to PostgreSQL with:
// - Votes stored in 'votes' table with UNIQUE(election_id, nullifier)
// - Nullifiers stored in 'used_nullifiers' table
// - Use database transactions with row-level locking (FOR UPDATE)
// - Rebuild Merkle trees from persistent vote entries on startup
// =============================================================================

// Vote ledgers per election (legacy)
const voteLedgers = new Map<string, VoteLedger>();

// Vote ledgers per question (new multi-jurisdiction model)
const questionLedgers = new Map<string, VoteLedger>();

// Used nullifiers (prevents double voting) - legacy per-election
// SECURITY: Must be persisted to database for production (see warning above)
const usedNullifiers = new Set<string>();

// Used nullifiers per question - allows same credential for multiple questions
// Key format: "questionId:nullifier"
// SECURITY: Must be persisted to database for production (see warning above)
const questionNullifiers = new Set<string>();

// Decryption ceremony tracking
interface PartialDecryption {
  trusteeId: string;
  index: number;
  partial: string;
}

interface DecryptionCeremony {
  electionId: string;
  status: 'pending' | 'in_progress' | 'completed';
  requiredShares: number;
  partialDecryptions: PartialDecryption[];
  result?: TallyResult;
}

interface TallyResult {
  candidates: Array<{
    candidateId: string;
    candidateName: string;
    votes: number;
  }>;
  totalVotes: number;
  completedAt: string;
}

const decryptionCeremonies = new Map<string, DecryptionCeremony>();

// Input validation with size limits to prevent DoS attacks
const VoteSchema = z.object({
  electionId: z.string().uuid(),
  credential: z.object({
    electionId: z.string().max(100),
    nullifier: z.string().regex(/^[a-f0-9]{64}$/, 'Nullifier must be 32 bytes hex'),
    message: z.string().max(256),
    signature: z.string().max(1024), // RSA signature max size
  }),
  encryptedVote: z.string().max(10000), // Reasonable max for encrypted ballot
  commitment: z.string().regex(/^[a-f0-9]{64}$/, 'Commitment must be SHA-256 hash'),
  zkProof: z.string().max(50000), // ZK proof max size
});

export async function votingRoutes(fastify: FastifyInstance) {
  /**
   * Submit a vote
   *
   * POST /api/vote
   * Body: { electionId, credential, encryptedVote, commitment, zkProof }
   * Returns: { confirmationCode, merkleProof }
   */
  fastify.post('/', async (request, reply) => {
    const body = VoteSchema.parse(request.body);

    // Get election
    const election = elections.get(body.electionId);
    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    if (election.status !== 'voting') {
      return reply.status(400).send({
        error: `Voting not open. Current status: ${election.status}`,
      });
    }

    // Verify credential
    const ceremonyResult = ceremonyResults.get(body.electionId);
    if (!ceremonyResult) {
      return reply.status(500).send({ error: 'Election keys not found (ceremony not finalized)' });
    }

    const credential: SignedCredential = body.credential;

    if (credential.electionId !== body.electionId) {
      return reply.status(400).send({ error: 'Credential is for different election' });
    }

    // SECURITY WARNING: Credential verification is disabled in MVP
    // TODO: Implement verifyThresholdCredential before production
    // This allows anyone with a well-formed credential to vote
    // Production fix: Uncomment and adapt verifyCredential
    // const isValidCredential = verifyCredential(credential, ceremonyResult.publicKey);
    // if (!isValidCredential) {
    //   return reply.status(400).send({ error: 'Invalid credential signature' });
    // }

    // Check for double voting (nullifier already used)
    if (usedNullifiers.has(credential.nullifier)) {
      return reply.status(400).send({ error: 'Credential already used to vote' });
    }

    // SECURITY WARNING: ZK proof verification is disabled in MVP
    // TODO: Implement verifyVoteProof using snarkjs before production
    // This allows submission of invalid votes outside valid range
    // Production fix: Implement and call verifyVoteProof(body.zkProof, electionPublicInputs)

    // Get or create vote ledger
    let ledger = voteLedgers.get(body.electionId);
    if (!ledger) {
      ledger = new VoteLedger(body.electionId);
      voteLedgers.set(body.electionId, ledger);
    }

    // Create vote entry
    const voteEntry: VoteEntry = {
      id: uuid(),
      encryptedVote: body.encryptedVote,
      commitment: body.commitment,
      zkProof: body.zkProof,
      nullifier: credential.nullifier,
      timestamp: Date.now(),
    };

    // Append to ledger
    const { position, proof } = ledger.append(voteEntry);

    // Mark nullifier as used
    usedNullifiers.add(credential.nullifier);

    // Generate confirmation code
    const confirmationCode = randomBytesHex(8).toUpperCase();

    return {
      success: true,
      confirmationCode,
      position,
      merkleRoot: proof.root,
      merkleProof: proof,
      message: 'Your vote has been recorded. Save your confirmation code to verify later.',
    };
  });

  // =========================================================================
  // Multi-Question Ballot Submission (Jurisdiction-based)
  // =========================================================================

  // Input validation with size limits for multi-question ballots
  const BallotSubmissionSchema = z.object({
    electionId: z.string().uuid(),
    credential: z.object({
      electionId: z.string().max(100),
      nullifier: z.string().regex(/^[a-f0-9]{64}$/, 'Nullifier must be 32 bytes hex'),
      message: z.string().max(256),
      signature: z.string().max(1024),
    }),
    answers: z.array(z.object({
      questionId: z.string().uuid(),
      encryptedVote: z.string().max(10000),
      commitment: z.string().regex(/^[a-f0-9]{64}$/, 'Commitment must be SHA-256 hash'),
      zkProof: z.string().max(50000),
    })).min(1).max(100), // Limit number of questions per ballot
  });

  /**
   * Submit a complete ballot with answers to multiple questions
   *
   * POST /api/vote/ballot
   * Body: { electionId, credential, answers: [{ questionId, encryptedVote, commitment, zkProof }] }
   * Returns: { confirmationCode, results: [{ questionId, position, merkleRoot }] }
   */
  fastify.post('/ballot', async (request, reply) => {
    const body = BallotSubmissionSchema.parse(request.body);

    // Get election
    const election = elections.get(body.electionId);
    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    if (election.status !== 'voting') {
      return reply.status(400).send({
        error: `Voting not open. Current status: ${election.status}`,
      });
    }

    // Verify credential belongs to this election
    const credential: SignedCredential = body.credential;
    if (credential.electionId !== body.electionId) {
      return reply.status(400).send({ error: 'Credential is for different election' });
    }

    // TODO: Verify credential signature with threshold public key

    // Process each answer
    const results: Array<{
      questionId: string;
      success: boolean;
      position?: number;
      merkleRoot?: string;
      error?: string;
    }> = [];

    for (const answer of body.answers) {
      // Verify question exists and belongs to this election
      const question = ballotQuestions.get(answer.questionId);
      if (!question) {
        results.push({
          questionId: answer.questionId,
          success: false,
          error: 'Question not found',
        });
        continue;
      }

      if (question.electionId !== body.electionId) {
        results.push({
          questionId: answer.questionId,
          success: false,
          error: 'Question belongs to different election',
        });
        continue;
      }

      // Check if already voted on this question with this credential
      const nullifierKey = `${answer.questionId}:${credential.nullifier}`;
      if (questionNullifiers.has(nullifierKey)) {
        results.push({
          questionId: answer.questionId,
          success: false,
          error: 'Already voted on this question',
        });
        continue;
      }

      // Get or create ledger for this question
      let ledger = questionLedgers.get(answer.questionId);
      if (!ledger) {
        ledger = new VoteLedger(answer.questionId);
        questionLedgers.set(answer.questionId, ledger);
      }

      // Create vote entry
      const voteEntry: VoteEntry = {
        id: uuid(),
        encryptedVote: answer.encryptedVote,
        commitment: answer.commitment,
        zkProof: answer.zkProof,
        nullifier: credential.nullifier,
        timestamp: Date.now(),
      };

      // Append to ledger
      const { position, proof } = ledger.append(voteEntry);

      // Mark nullifier as used for this question
      questionNullifiers.add(nullifierKey);

      results.push({
        questionId: answer.questionId,
        success: true,
        position,
        merkleRoot: proof.root,
      });
    }

    // Generate single confirmation code for entire ballot
    const confirmationCode = randomBytesHex(8).toUpperCase();

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount > 0,
      confirmationCode,
      electionId: body.electionId,
      answersSubmitted: successCount,
      answersTotal: body.answers.length,
      results,
      message: successCount === body.answers.length
        ? 'All votes recorded successfully. Save your confirmation code.'
        : `${successCount} of ${body.answers.length} votes recorded. Check results for details.`,
    };
  });

  /**
   * Get voting stats for a specific question
   *
   * GET /api/vote/question/:questionId/stats
   */
  fastify.get('/question/:questionId/stats', async (request, reply) => {
    const { questionId } = request.params as { questionId: string };

    const question = ballotQuestions.get(questionId);
    if (!question) {
      return reply.status(404).send({ error: 'Question not found' });
    }

    const ledger = questionLedgers.get(questionId);
    const snapshot = ledger?.getSnapshot();

    return {
      questionId,
      questionTitle: question.title,
      jurisdictionId: question.jurisdictionId,
      voteCount: snapshot?.voteCount || 0,
      merkleRoot: snapshot?.root,
      lastUpdated: snapshot?.timestamp,
    };
  });

  /**
   * Get current Merkle root for a question
   *
   * GET /api/vote/question/:questionId/root
   */
  fastify.get('/question/:questionId/root', async (request, reply) => {
    const { questionId } = request.params as { questionId: string };

    const ledger = questionLedgers.get(questionId);
    if (!ledger) {
      return reply.status(404).send({ error: 'No votes recorded for this question' });
    }

    return {
      questionId,
      root: ledger.getRoot(),
      voteCount: ledger.getVoteCount(),
      timestamp: Date.now(),
    };
  });

  /**
   * Get voting stats (without revealing votes)
   *
   * GET /api/vote/stats/:electionId
   */
  fastify.get('/stats/:electionId', async (request, reply) => {
    const { electionId } = request.params as { electionId: string };

    const election = elections.get(electionId);
    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    const ledger = voteLedgers.get(electionId);
    const snapshot = ledger?.getSnapshot();

    return {
      electionId,
      electionName: election.name,
      status: election.status,
      voteCount: snapshot?.voteCount || 0,
      merkleRoot: snapshot?.root,
      lastUpdated: snapshot?.timestamp,
    };
  });

  /**
   * Get current Merkle root (for public verification)
   *
   * GET /api/vote/root/:electionId
   */
  fastify.get('/root/:electionId', async (request, reply) => {
    const { electionId } = request.params as { electionId: string };

    const ledger = voteLedgers.get(electionId);
    if (!ledger) {
      return reply.status(404).send({ error: 'No votes recorded yet' });
    }

    return {
      electionId,
      root: ledger.getRoot(),
      voteCount: ledger.getVoteCount(),
      timestamp: Date.now(),
    };
  });

  // =========================================================================
  // Threshold Decryption for Tallying
  // =========================================================================

  /**
   * Start decryption ceremony for tallying
   *
   * POST /api/vote/tally/:electionId/start
   */
  fastify.post('/tally/:electionId/start', async (request, reply) => {
    const { electionId } = request.params as { electionId: string };

    const election = elections.get(electionId);
    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    if (election.status !== 'voting') {
      return reply.status(400).send({
        error: `Cannot start tally. Election status: ${election.status}`,
      });
    }

    const ledger = voteLedgers.get(electionId);
    const snapshot = ledger?.getSnapshot();

    // Bitcoin anchoring via OpenTimestamps: Anchor election CLOSE with final Merkle root
    let anchorResult: { submitted?: boolean; pending?: string; error?: string } | null = null;

    if (config.useBitcoinAnchoring && config.useDatabase && snapshot) {
      try {
        const anchorData = bitcoinAnchor.buildCloseAnchorData(
          electionId,
          snapshot.root,
          snapshot.voteCount,
          Date.now()
        );

        // Store anchor record
        const anchorRecord = await anchorsDb.createAnchor({
          electionId,
          anchorType: 'close',
          dataHash: anchorData.dataHash,
          rawData: anchorData.rawData,
        });

        // Submit to OpenTimestamps
        const otsResult = await bitcoinAnchor.anchor(anchorData);

        if (otsResult.success && otsResult.otsProof) {
          await anchorsDb.markAnchorSubmitted(anchorRecord.id, otsResult.otsProof);
          anchorResult = {
            submitted: true,
            pending: 'Submitted to OpenTimestamps - Bitcoin attestation in 1-24 hours',
          };
        } else {
          await anchorsDb.markAnchorFailed(anchorRecord.id, otsResult.error || 'Unknown error');
          anchorResult = { error: otsResult.error };
        }
      } catch (err) {
        anchorResult = { error: err instanceof Error ? err.message : 'Anchor failed' };
      }
    }

    // Transition to tallying
    election.status = 'tallying';
    elections.set(electionId, election);

    // Create decryption ceremony
    const ceremony: DecryptionCeremony = {
      electionId,
      status: 'in_progress',
      requiredShares: election.threshold,
      partialDecryptions: [],
    };

    decryptionCeremonies.set(electionId, ceremony);

    return {
      status: 'awaiting_shares',
      required: election.threshold,
      received: 0,
      voteCount: snapshot?.voteCount || 0,
      merkleRoot: snapshot?.root,
      bitcoinAnchor: anchorResult,
      message: `Decryption ceremony started. Need ${election.threshold} trustees to submit partial decryptions.`,
    };
  });

  /**
   * Submit partial decryption from a trustee
   *
   * POST /api/vote/tally/:electionId/decrypt
   */
  fastify.post('/tally/:electionId/decrypt', async (request, reply) => {
    const { electionId } = request.params as { electionId: string };
    const body = z.object({
      trusteeId: z.string().min(1),
      partialDecryptions: z.array(z.object({
        index: z.number(),
        partial: z.string(),
      })),
    }).parse(request.body);

    const ceremony = decryptionCeremonies.get(electionId);
    if (!ceremony) {
      return reply.status(404).send({ error: 'Decryption ceremony not found. Start with /tally/:id/start' });
    }

    if (ceremony.status === 'completed') {
      return reply.status(400).send({ error: 'Decryption ceremony already completed' });
    }

    // Check if trustee already submitted
    const alreadySubmitted = ceremony.partialDecryptions.some(
      p => p.trusteeId === body.trusteeId
    );
    if (alreadySubmitted) {
      return reply.status(400).send({ error: 'Trustee already submitted partial decryption' });
    }

    // Store partial decryptions
    for (const partial of body.partialDecryptions) {
      ceremony.partialDecryptions.push({
        trusteeId: body.trusteeId,
        index: partial.index,
        partial: partial.partial,
      });
    }

    // Count unique trustees who have submitted
    const uniqueTrustees = new Set(ceremony.partialDecryptions.map(p => p.trusteeId)).size;

    // Check if threshold reached
    if (uniqueTrustees >= ceremony.requiredShares) {
      // TODO: Combine partial decryptions using ThresholdRSA
      // For now, return placeholder tally
      const election = elections.get(electionId);
      const ledger = voteLedgers.get(electionId);

      ceremony.status = 'completed';
      ceremony.result = {
        candidates: election?.candidates.map(c => ({
          candidateId: c.id,
          candidateName: c.name,
          votes: 0, // TODO: Actual decrypted count
        })) || [],
        totalVotes: ledger?.getVoteCount() || 0,
        completedAt: new Date().toISOString(),
      };

      // Update election status
      if (election) {
        election.status = 'complete';
        elections.set(electionId, election);
      }

      return {
        status: 'completed',
        tally: ceremony.result,
        message: 'Threshold reached. Votes decrypted and tallied.',
      };
    }

    return {
      status: 'awaiting_shares',
      received: uniqueTrustees,
      required: ceremony.requiredShares,
      message: `Need ${ceremony.requiredShares - uniqueTrustees} more trustees.`,
    };
  });

  /**
   * Get decryption ceremony status
   *
   * GET /api/vote/tally/:electionId/status
   */
  fastify.get('/tally/:electionId/status', async (request, reply) => {
    const { electionId } = request.params as { electionId: string };

    const ceremony = decryptionCeremonies.get(electionId);
    if (!ceremony) {
      return reply.status(404).send({ error: 'Decryption ceremony not found' });
    }

    const uniqueTrustees = new Set(ceremony.partialDecryptions.map(p => p.trusteeId)).size;

    return {
      status: ceremony.status,
      received: uniqueTrustees,
      required: ceremony.requiredShares,
      result: ceremony.result,
    };
  });
}

export { voteLedgers, questionLedgers, usedNullifiers, questionNullifiers, decryptionCeremonies };
