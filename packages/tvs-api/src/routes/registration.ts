/**
 * Voter Registration Routes
 *
 * Handles voter registration and anonymous credential issuance via VeilSign.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sha256, uuid } from '@tvs/core';
import {
  createCredential,
  blindCredential,
  signBlindedCredential,
  unblindSignature,
  type SignedCredential,
} from '@tvs/veilsign';
import { elections, electionKeys } from './elections.js';

// Track registered voters (by student ID hash)
const registeredVoters = new Map<string, Set<string>>(); // electionId -> Set<studentIdHash>

// Track issued credentials (for debugging, remove in production)
const issuedCredentials = new Map<string, SignedCredential[]>();

const RegisterSchema = z.object({
  electionId: z.string().uuid(),
  studentId: z.string().min(1), // Will be hashed immediately
  email: z.string().email().optional(),
});

export async function registrationRoutes(fastify: FastifyInstance) {
  /**
   * Step 1: Register voter and get blinding parameters
   *
   * POST /api/register
   * Body: { electionId, studentId }
   * Returns: { blindingParams, registrationId }
   */
  fastify.post('/', async (request, reply) => {
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

    // Hash student ID immediately (never store plaintext)
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

    // Create credential for voter
    const credential = createCredential(body.electionId);

    // Blind the credential
    const { blinded, blindingFactor } = blindCredential(credential, keys.publicKey);

    // Store registration
    electionVoters.add(studentIdHash);

    return {
      registrationId: uuid(),
      credential: {
        electionId: credential.electionId,
        nullifier: credential.nullifier,
        message: credential.message,
      },
      blinded,
      blindingFactor,
      publicKey: keys.publicKey,
      message: 'Send blinded message to /api/register/sign to get signature',
    };
  });

  /**
   * Step 2: Sign blinded credential
   *
   * POST /api/register/sign
   * Body: { electionId, blindedMessage }
   * Returns: { blindedSignature }
   */
  fastify.post('/sign', async (request, reply) => {
    const { electionId, blindedMessage } = request.body as {
      electionId: string;
      blindedMessage: string;
    };

    const keys = electionKeys.get(electionId);
    if (!keys) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    // Authority signs the blinded message (cannot see the credential)
    const blindedSignature = signBlindedCredential(blindedMessage, keys.privateKey);

    return {
      blindedSignature,
      message: 'Use unblindSignature() with your blindingFactor to get final credential',
    };
  });

  /**
   * Complete registration (for convenience - combines steps)
   *
   * POST /api/register/complete
   * Body: { electionId, studentId }
   * Returns: { credential } - Ready to use signed credential
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

    // Hash student ID
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

    // Create and sign credential (complete flow)
    const credential = createCredential(body.electionId);
    const { blinded, blindingFactor } = blindCredential(credential, keys.publicKey);
    const blindedSignature = signBlindedCredential(blinded, keys.privateKey);
    const signature = unblindSignature(blindedSignature, blindingFactor, keys.publicKey);

    const signedCredential: SignedCredential = {
      ...credential,
      signature,
    };

    // Store registration
    electionVoters.add(studentIdHash);

    // Track credential (for debugging)
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

  // Get registration stats
  fastify.get('/stats/:electionId', async (request, reply) => {
    const { electionId } = request.params as { electionId: string };

    const voters = registeredVoters.get(electionId);

    return {
      electionId,
      registeredCount: voters?.size || 0,
    };
  });
}

export { registeredVoters };
