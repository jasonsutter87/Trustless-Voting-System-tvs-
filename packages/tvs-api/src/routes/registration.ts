/**
 * Voter Registration Routes
 *
 * Handles voter registration and anonymous credential issuance via VeilSign.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sha256 } from '@tvs/core';
import { issueCredential, type SignedCredential } from '@tvs/veilsign';
import { elections, electionKeys } from './elections.js';

// Track registered voters (by student ID hash)
const registeredVoters = new Map<string, Set<string>>();

// Track issued credentials (for debugging)
const issuedCredentials = new Map<string, SignedCredential[]>();

const RegisterSchema = z.object({
  electionId: z.string().uuid(),
  studentId: z.string().min(1),
});

export async function registrationRoutes(fastify: FastifyInstance) {
  /**
   * Complete registration - issue anonymous credential
   *
   * POST /api/register/complete
   */
  fastify.post('/complete', async (request, reply) => {
    const body = RegisterSchema.parse(request.body);

    const election = elections.get(body.electionId);
    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    if (election.status !== 'registration') {
      return reply.status(400).send({
        error: `Registration not open. Current status: ${election.status}`,
      });
    }

    const keys = electionKeys.get(body.electionId);
    if (!keys) {
      return reply.status(500).send({ error: 'Election keys not found' });
    }

    // Hash student ID (never store plaintext)
    const studentIdHash = sha256(body.studentId);

    // Check if already registered
    let electionVoters = registeredVoters.get(body.electionId);
    if (!electionVoters) {
      electionVoters = new Set();
      registeredVoters.set(body.electionId, electionVoters);
    }

    if (electionVoters.has(studentIdHash)) {
      return reply.status(400).send({
        error: 'Already registered for this election',
      });
    }

    // Issue anonymous credential
    const signedCredential = issueCredential(body.electionId, keys);

    // Mark as registered
    electionVoters.add(studentIdHash);

    // Track for debugging
    let electionCreds = issuedCredentials.get(body.electionId);
    if (!electionCreds) {
      electionCreds = [];
      issuedCredentials.set(body.electionId, electionCreds);
    }
    electionCreds.push(signedCredential);

    return {
      credential: signedCredential,
      publicKey: keys.publicKey,
      message: 'Save this credential securely. You will need it to vote.',
    };
  });

  // Registration stats
  fastify.get('/stats/:electionId', async (request) => {
    const { electionId } = request.params as { electionId: string };
    const voters = registeredVoters.get(electionId);

    return {
      electionId,
      registeredCount: voters?.size || 0,
    };
  });
}

export { registeredVoters };
