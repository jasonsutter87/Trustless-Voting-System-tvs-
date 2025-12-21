/**
 * Verification Routes
 *
 * Allows voters to verify their vote was recorded correctly.
 */

import { FastifyInstance } from 'fastify';
import { VoteLedger } from '@tvs/veilchain';
import { elections } from './elections.js';
import { voteLedgers } from './voting.js';

export async function verifyRoutes(fastify: FastifyInstance) {
  /**
   * Verify vote by nullifier
   *
   * GET /api/verify/:electionId/:nullifier
   * Returns: { exists, position, merkleProof }
   */
  fastify.get('/:electionId/:nullifier', async (request, reply) => {
    const { electionId, nullifier } = request.params as {
      electionId: string;
      nullifier: string;
    };

    const election = elections.get(electionId);
    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    const ledger = voteLedgers.get(electionId);
    if (!ledger) {
      return reply.status(404).send({ error: 'No votes recorded' });
    }

    const result = ledger.findByNullifier(nullifier);
    if (!result) {
      return {
        exists: false,
        message: 'Vote not found with this credential',
      };
    }

    const proof = ledger.getProof(result.position);

    return {
      exists: true,
      position: result.position,
      commitment: result.entry.commitment,
      timestamp: result.entry.timestamp,
      merkleProof: proof,
      message: 'Your vote exists in the ledger',
    };
  });

  /**
   * Verify Merkle proof independently
   *
   * POST /api/verify/proof
   * Body: { proof }
   * Returns: { valid }
   */
  fastify.post('/proof', async (request, reply) => {
    const { proof } = request.body as { proof: any };

    try {
      const isValid = VoteLedger.verify(proof);
      return {
        valid: isValid,
        message: isValid
          ? 'Proof is valid - vote is included in the ledger'
          : 'Proof is invalid',
      };
    } catch (error) {
      return reply.status(400).send({
        valid: false,
        error: 'Invalid proof format',
      });
    }
  });

  /**
   * Get election integrity summary
   *
   * GET /api/verify/integrity/:electionId
   */
  fastify.get('/integrity/:electionId', async (request, reply) => {
    const { electionId } = request.params as { electionId: string };

    const election = elections.get(electionId);
    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    const ledger = voteLedgers.get(electionId);
    const snapshot = ledger?.getSnapshot();

    return {
      election: {
        id: election.id,
        name: election.name,
        status: election.status,
        startTime: election.startTime,
        endTime: election.endTime,
        candidateCount: election.candidates.length,
      },
      integrity: {
        voteCount: snapshot?.voteCount || 0,
        merkleRoot: snapshot?.root || null,
        lastUpdate: snapshot?.timestamp || null,
      },
      verification: {
        message: 'Compare this Merkle root with published anchors',
        instructions: [
          '1. Save the Merkle root displayed above',
          '2. Check published anchors (Bitcoin, Ethereum, etc.)',
          '3. Roots should match for integrity verification',
        ],
      },
    };
  });

  /**
   * Public ledger export (for external auditing)
   *
   * GET /api/verify/export/:electionId
   */
  fastify.get('/export/:electionId', async (request, reply) => {
    const { electionId } = request.params as { electionId: string };

    const election = elections.get(electionId);
    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    // Only allow export after voting ends
    if (!['tallying', 'complete'].includes(election.status)) {
      return reply.status(400).send({
        error: 'Export only available after voting ends',
      });
    }

    const ledger = voteLedgers.get(electionId);
    if (!ledger) {
      return reply.status(404).send({ error: 'No votes recorded' });
    }

    const entries = ledger.export();

    return {
      electionId,
      electionName: election.name,
      merkleRoot: ledger.getRoot(),
      voteCount: entries.length,
      // Return only public data (no encrypted votes for privacy)
      votes: entries.map((e, i) => ({
        position: i,
        commitment: e.commitment,
        nullifier: e.nullifier,
        timestamp: e.timestamp,
      })),
    };
  });
}
