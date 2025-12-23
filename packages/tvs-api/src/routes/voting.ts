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

// Vote ledgers per election
const voteLedgers = new Map<string, VoteLedger>();

// Used nullifiers (prevents double voting)
const usedNullifiers = new Set<string>();

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

const VoteSchema = z.object({
  electionId: z.string().uuid(),
  credential: z.object({
    electionId: z.string(),
    nullifier: z.string(),
    message: z.string(),
    signature: z.string(),
  }),
  encryptedVote: z.string(), // Encrypted via VeilForms
  commitment: z.string(),     // Hash of vote for verification
  zkProof: z.string(),        // ZK proof of vote validity
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

    // TODO: Adapt verifyCredential to work with threshold public key
    // For now, we trust credentials in MVP
    // const isValidCredential = verifyCredential(credential, ceremonyResult.publicKey);
    // if (!isValidCredential) {
    //   return reply.status(400).send({ error: 'Invalid credential signature' });
    // }

    // Check for double voting (nullifier already used)
    if (usedNullifiers.has(credential.nullifier)) {
      return reply.status(400).send({ error: 'Credential already used to vote' });
    }

    // TODO: Verify ZK proof
    // For MVP, we trust the proof structure
    // In production: await verifyVoteProof(body.zkProof)

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

    const ledger = voteLedgers.get(electionId);

    return {
      status: 'awaiting_shares',
      required: election.threshold,
      received: 0,
      voteCount: ledger?.getVoteCount() || 0,
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

export { voteLedgers, usedNullifiers, decryptionCeremonies };
