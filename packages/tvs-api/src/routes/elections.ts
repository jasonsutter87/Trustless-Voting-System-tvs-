/**
 * Election Management Routes
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { uuid } from '@tvs/core';
import { CeremonyCoordinator, type CeremonyResult } from '@veilkey/core';
import { config } from '../config.js';
import { bitcoinAnchor, BitcoinAnchorService } from '../services/bitcoin-anchor.js';
import * as anchorsDb from '../db/anchors.js';

// In-memory store for MVP (replace with PostgreSQL)
const elections = new Map<string, Election>();
const keyCeremonies = new Map<string, CeremonyCoordinator>();
const ceremonyResults = new Map<string, CeremonyResult>();

interface Election {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'setup' | 'draft' | 'registration' | 'voting' | 'tallying' | 'complete';
  threshold: number;
  totalTrustees: number;
  candidates: Candidate[];
  createdAt: string;
}

interface Candidate {
  id: string;
  name: string;
  position: number;
}

const CreateElectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  threshold: z.number().int().min(1),
  totalTrustees: z.number().int().min(1),
  candidates: z.array(z.object({
    name: z.string().min(1),
  })).min(2),
}).refine(data => data.threshold <= data.totalTrustees, {
  message: 'Threshold cannot exceed total trustees',
});

export async function electionRoutes(fastify: FastifyInstance) {
  // Create election with threshold key ceremony
  fastify.post('/', async (request, reply) => {
    const body = CreateElectionSchema.parse(request.body);

    const id = uuid();

    // Create threshold key ceremony (replaces single-key generation)
    const ceremony = new CeremonyCoordinator({
      id: `ceremony-${id}`,
      threshold: body.threshold,
      totalParticipants: body.totalTrustees,
    });

    keyCeremonies.set(id, ceremony);

    const election: Election = {
      id,
      name: body.name,
      description: body.description,
      startTime: body.startTime,
      endTime: body.endTime,
      status: 'setup', // Awaiting trustee registration
      threshold: body.threshold,
      totalTrustees: body.totalTrustees,
      candidates: body.candidates.map((c, i) => ({
        id: uuid(),
        name: c.name,
        position: i,
      })),
      createdAt: new Date().toISOString(),
    };

    elections.set(id, election);

    return {
      election,
      ceremonyStatus: ceremony.getStatus(),
    };
  });

  // Get election
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const election = elections.get(id);

    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    const ceremony = keyCeremonies.get(id);
    const result = ceremonyResults.get(id);

    return {
      election,
      ceremonyStatus: ceremony?.getStatus(),
      publicKey: result?.publicKey,
    };
  });

  // List elections
  fastify.get('/', async () => {
    return {
      elections: Array.from(elections.values()),
    };
  });

  // Update election status
  fastify.patch('/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: Election['status'] };

    const election = elections.get(id);
    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    // Validate status transitions
    const validTransitions: Record<Election['status'], Election['status'][]> = {
      setup: ['draft'], // After key ceremony completes
      draft: ['registration'],
      registration: ['voting'],
      voting: ['tallying'],
      tallying: ['complete'],
      complete: [],
    };

    if (!validTransitions[election.status].includes(status)) {
      return reply.status(400).send({
        error: `Cannot transition from ${election.status} to ${status}`,
      });
    }

    // Bitcoin anchoring via OpenTimestamps on status transitions
    let anchorResult: { submitted?: boolean; pending?: string; error?: string } | null = null;

    if (status === 'voting' && config.useBitcoinAnchoring && config.useDatabase) {
      // Anchor election START when transitioning to voting
      try {
        const result = ceremonyResults.get(id);
        const publicKeyHash = result?.publicKey
          ? BitcoinAnchorService.sha256(result.publicKey)
          : BitcoinAnchorService.sha256('no-key');

        // Hash trustee info (for now, just use threshold config)
        const trusteesHash = BitcoinAnchorService.sha256(
          JSON.stringify({ threshold: election.threshold, total: election.totalTrustees })
        );

        const anchorData = bitcoinAnchor.buildStartAnchorData(
          id,
          publicKeyHash,
          trusteesHash,
          Date.now()
        );

        // Store anchor record
        const anchorRecord = await anchorsDb.createAnchor({
          electionId: id,
          anchorType: 'start',
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

    election.status = status;
    elections.set(id, election);

    return {
      election,
      bitcoinAnchor: anchorResult,
    };
  });

  // Get election results (only after tallying)
  fastify.get('/:id/results', async (request, reply) => {
    const { id } = request.params as { id: string };
    const election = elections.get(id);

    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    if (election.status !== 'complete') {
      return reply.status(400).send({
        error: 'Results not available until election is complete',
      });
    }

    // TODO: Implement actual tallying from VeilChain
    return {
      election,
      results: election.candidates.map(c => ({
        candidate: c,
        votes: 0, // Placeholder
      })),
    };
  });
}

// Export for use by other routes
export { elections, keyCeremonies, ceremonyResults };
