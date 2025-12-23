/**
 * Trustee Management Routes
 *
 * Handles trustee registration, commitment submission, and share distribution
 * for threshold key ceremonies.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { elections, keyCeremonies, ceremonyResults } from './elections.js';
import type { CeremonyPhase } from '@veilkey/core';

// In-memory trustee storage
interface Trustee {
  id: string;
  electionId: string;
  name: string;
  publicKey: string;
  shareIndex?: number;
  status: 'registered' | 'committed' | 'share_received';
}

const trustees = new Map<string, Trustee[]>();

export async function trusteeRoutes(fastify: FastifyInstance) {
  // Register a trustee for an election
  fastify.post('/:electionId/trustees', async (request, reply) => {
    const { electionId } = request.params as { electionId: string };
    const body = z.object({
      name: z.string().min(1),
      publicKey: z.string().min(1),
    }).parse(request.body);

    const ceremony = keyCeremonies.get(electionId);
    if (!ceremony) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    const election = elections.get(electionId);
    if (!election || election.status !== 'setup') {
      return reply.status(400).send({ error: 'Election is not in setup phase' });
    }

    // Start registration if ceremony is in CREATED phase
    if (ceremony.getCurrentPhase() === 'CREATED') {
      ceremony.startRegistration();
    }

    // Add participant to ceremony
    const participant = ceremony.addParticipant(body.name, body.publicKey);

    const trustee: Trustee = {
      id: participant.id,
      electionId,
      name: body.name,
      publicKey: body.publicKey,
      shareIndex: participant.shareIndex,
      status: 'registered',
    };

    const electionTrustees = trustees.get(electionId) || [];
    electionTrustees.push(trustee);
    trustees.set(electionId, electionTrustees);

    return {
      trustee,
      ceremonyStatus: ceremony.getStatus(),
    };
  });

  // Submit commitment from a trustee
  fastify.post('/:electionId/trustees/:trusteeId/commitment', async (request, reply) => {
    const { electionId, trusteeId } = request.params as { electionId: string; trusteeId: string };
    const body = z.object({
      commitmentHash: z.string().min(1),
      feldmanCommitments: z.array(z.object({
        x: z.string(),
        y: z.string(),
      })),
    }).parse(request.body);

    const ceremony = keyCeremonies.get(electionId);
    if (!ceremony) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    // Start commitment phase if all trustees registered
    if (ceremony.getCurrentPhase() === 'REGISTRATION' && ceremony.canProgressToNextPhase()) {
      ceremony.startCommitmentPhase();
    }

    // Convert string coordinates to bigint (JSON doesn't support bigint)
    const feldmanCommitments = body.feldmanCommitments.map(pt => ({
      x: BigInt(pt.x),
      y: BigInt(pt.y),
    }));

    // Submit the commitment
    ceremony.submitCommitment(trusteeId, body.commitmentHash, feldmanCommitments);

    // Update trustee status
    const electionTrustees = trustees.get(electionId) || [];
    const trustee = electionTrustees.find(t => t.id === trusteeId);
    if (trustee) {
      trustee.status = 'committed';
    }

    // Check if all commitments received - finalize ceremony
    if (ceremony.canProgressToNextPhase()) {
      const result = ceremony.finalize();

      // Store ceremony result
      ceremonyResults.set(electionId, result);

      // Update election status to draft (ready for normal flow)
      const election = elections.get(electionId);
      if (election) {
        election.status = 'draft';
        elections.set(electionId, election);
      }

      // Convert BigInt values to strings for JSON serialization
      return {
        status: 'finalized',
        publicKey: result.publicKey,
        threshold: result.threshold,
        totalParticipants: result.totalParticipants,
        completedAt: result.completedAt.toISOString(),
      };
    }

    return {
      status: 'awaiting_commitments',
      ceremonyStatus: ceremony.getStatus(),
    };
  });

  // Get share for a trustee (after ceremony finalization)
  fastify.get('/:electionId/trustees/:trusteeId/share', async (request, reply) => {
    const { electionId, trusteeId } = request.params as { electionId: string; trusteeId: string };

    const ceremony = keyCeremonies.get(electionId);
    if (!ceremony) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    if (!ceremony.isComplete()) {
      return reply.status(400).send({ error: 'Ceremony not yet finalized' });
    }

    const share = ceremony.getShareForParticipant(trusteeId);
    if (!share) {
      return reply.status(404).send({ error: 'Share not found for trustee' });
    }

    // Update trustee status
    const electionTrustees = trustees.get(electionId) || [];
    const trustee = electionTrustees.find(t => t.id === trusteeId);
    if (trustee) {
      trustee.status = 'share_received';
    }

    return { share };
  });

  // List all trustees for an election
  fastify.get('/:electionId/trustees', async (request, reply) => {
    const { electionId } = request.params as { electionId: string };

    const election = elections.get(electionId);
    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    return {
      trustees: trustees.get(electionId) || [],
      ceremonyStatus: keyCeremonies.get(electionId)?.getStatus(),
    };
  });

  // Get a specific trustee
  fastify.get('/:electionId/trustees/:trusteeId', async (request, reply) => {
    const { electionId, trusteeId } = request.params as { electionId: string; trusteeId: string };

    const electionTrustees = trustees.get(electionId) || [];
    const trustee = electionTrustees.find(t => t.id === trusteeId);

    if (!trustee) {
      return reply.status(404).send({ error: 'Trustee not found' });
    }

    return { trustee };
  });
}

// Export for use by other routes
export { trustees };
