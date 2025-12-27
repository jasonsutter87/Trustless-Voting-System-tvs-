/**
 * TVS API Server
 *
 * Unified API integrating VeilSign, VeilChain, and VeilProof
 * for end-to-end verifiable voting.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { electionRoutes } from './routes/elections.js';
import { trusteeRoutes } from './routes/trustees.js';
import { registrationRoutes } from './routes/registration.js';
import { votingRoutes } from './routes/voting.js';
import { verifyRoutes } from './routes/verify.js';
import { jurisdictionRoutes } from './routes/jurisdictions.js';
import { ballotRoutes } from './routes/ballot.js';
import { anchorsRoutes } from './routes/anchors.js';
import { organizationRoutes } from './routes/organizations.js';

const fastify = Fastify({
  logger: true,
});

// Register plugins
await fastify.register(cors, {
  origin: process.env['ALLOWED_ORIGINS']?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
});

// Rate limiting - prevents brute force and DoS attacks
// Can be disabled with DISABLE_RATE_LIMIT=true for stress testing
if (process.env['DISABLE_RATE_LIMIT'] !== 'true') {
  await fastify.register(rateLimit, {
    max: 100, // Max 100 requests per window
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
  });
}

// Custom error handler - sanitize errors in production
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  const isProd = process.env['NODE_ENV'] === 'production';
  reply.status(error.statusCode || 500).send({
    error: isProd ? 'Internal server error' : error.message,
    ...(isProd ? {} : { stack: error.stack }),
  });
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
await fastify.register(organizationRoutes, { prefix: '/api/orgs' });
await fastify.register(electionRoutes, { prefix: '/api/elections' });
await fastify.register(trusteeRoutes, { prefix: '/api/elections' }); // Mounted under elections for /elections/:id/trustees
await fastify.register(registrationRoutes, { prefix: '/api/register' });
await fastify.register(votingRoutes, { prefix: '/api/vote' });
await fastify.register(verifyRoutes, { prefix: '/api/verify' });
await fastify.register(jurisdictionRoutes, { prefix: '/api/jurisdictions' });
await fastify.register(ballotRoutes, { prefix: '/api/ballot' });
await fastify.register(anchorsRoutes, { prefix: '/api/anchors' });

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
