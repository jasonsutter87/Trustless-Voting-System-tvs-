/**
 * Voter Registration Routes
 *
 * Handles voter registration and anonymous credential issuance via VeilSign.
 *
 * TODO: Adapt to threshold signing for credentials. Currently uses placeholder
 * credentials until VeilSign is integrated with VeilKey threshold RSA.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sha256, randomBytesHex } from '@tvs/core';
import { elections, ceremonyResults } from './elections.js';

// Track registered voters (by student ID hash)
const registeredVoters = new Map<string, Set<string>>();

// Track issued credentials (for debugging)
interface PlaceholderCredential {
  electionId: string;
  nullifier: string;
  message: string;
  signature: string; // TODO: Replace with threshold signature
}

const issuedCredentials = new Map<string, PlaceholderCredential[]>();

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

    const ceremonyResult = ceremonyResults.get(body.electionId);
    if (!ceremonyResult) {
      return reply.status(500).send({ error: 'Key ceremony not yet finalized' });
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

    // TODO: Integrate threshold signing for credentials
    // For now, issue placeholder credential
    const nullifier = randomBytesHex(32);
    const message = `vote:${body.electionId}:${nullifier}`;
    const credential: PlaceholderCredential = {
      electionId: body.electionId,
      nullifier,
      message,
      signature: 'placeholder-signature', // TODO: Threshold RSA signature
    };

    // Mark as registered
    electionVoters.add(studentIdHash);

    // Track for debugging
    let electionCreds = issuedCredentials.get(body.electionId);
    if (!electionCreds) {
      electionCreds = [];
      issuedCredentials.set(body.electionId, electionCreds);
    }
    electionCreds.push(credential);

    return {
      credential,
      publicKey: ceremonyResult.publicKey,
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
