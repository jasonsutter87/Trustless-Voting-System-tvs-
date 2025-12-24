/**
 * TVS API Server
 *
 * Unified API integrating VeilSign, VeilChain, and VeilProof
 * for end-to-end verifiable voting.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { electionRoutes } from './routes/elections.js';
import { trusteeRoutes } from './routes/trustees.js';
import { registrationRoutes } from './routes/registration.js';
import { votingRoutes } from './routes/voting.js';
import { verifyRoutes } from './routes/verify.js';
import { jurisdictionRoutes } from './routes/jurisdictions.js';

const fastify = Fastify({
  logger: true,
});

// Register plugins
await fastify.register(cors, {
  origin: true,
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
await fastify.register(electionRoutes, { prefix: '/api/elections' });
await fastify.register(trusteeRoutes, { prefix: '/api/elections' }); // Mounted under elections for /elections/:id/trustees
await fastify.register(registrationRoutes, { prefix: '/api/register' });
await fastify.register(votingRoutes, { prefix: '/api/vote' });
await fastify.register(verifyRoutes, { prefix: '/api/verify' });
await fastify.register(jurisdictionRoutes, { prefix: '/api/jurisdictions' });

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env['PORT'] || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`TVS API running at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export { fastify };
