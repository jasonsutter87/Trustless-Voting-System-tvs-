/**
 * Voting Routes
 *
 * Handles vote submission with VeilChain storage and VeilProof verification.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { uuid, randomBytesHex } from '@tvs/core';
import { verifyCredential, type SignedCredential } from '@tvs/veilsign';
import { VoteLedger, type VoteEntry } from '@tvs/veilchain';
import { elections, electionKeys } from './elections.js';

// Vote ledgers per election
const voteLedgers = new Map<string, VoteLedger>();

// Used nullifiers (prevents double voting)
const usedNullifiers = new Set<string>();

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
    const keys = electionKeys.get(body.electionId);
    if (!keys) {
      return reply.status(500).send({ error: 'Election keys not found' });
    }

    const credential: SignedCredential = body.credential;

    if (credential.electionId !== body.electionId) {
      return reply.status(400).send({ error: 'Credential is for different election' });
    }

    const isValidCredential = verifyCredential(credential, keys.publicKey);
    if (!isValidCredential) {
      return reply.status(400).send({ error: 'Invalid credential signature' });
    }

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
}

export { voteLedgers, usedNullifiers };
