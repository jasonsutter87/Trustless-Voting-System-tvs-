/**
 * Election Management Routes
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { uuid } from '@tvs/core';
import { generateAuthorityKeys, type AuthorityKeys } from '@tvs/veilsign';

// In-memory store for MVP (replace with PostgreSQL)
const elections = new Map<string, Election>();
const electionKeys = new Map<string, AuthorityKeys>();

interface Election {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'draft' | 'registration' | 'voting' | 'tallying' | 'complete';
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
  candidates: z.array(z.object({
    name: z.string().min(1),
  })).min(2),
});

export async function electionRoutes(fastify: FastifyInstance) {
  // Create election
  fastify.post('/', async (request, reply) => {
    const body = CreateElectionSchema.parse(request.body);

    const id = uuid();

    // Generate signing keys for this election
    const keys = generateAuthorityKeys(2048);
    electionKeys.set(id, keys);

    const election: Election = {
      id,
      name: body.name,
      description: body.description,
      startTime: body.startTime,
      endTime: body.endTime,
      status: 'draft',
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
      publicKey: keys.publicKey, // Share public key for credential verification
    };
  });

  // Get election
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const election = elections.get(id);

    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    const keys = electionKeys.get(id);

    return {
      election,
      publicKey: keys?.publicKey,
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

    election.status = status;
    elections.set(id, election);

    return { election };
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
export { elections, electionKeys };
