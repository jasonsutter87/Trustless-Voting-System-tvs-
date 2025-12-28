/**
 * Edge Sync Routes
 *
 * API endpoints for syncing votes between Raspberry Pi edge nodes
 * and the central cloud VeilCloud.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  getCloudSyncServer,
  type VoteSyncBatch,
  type EdgeNodeRegistration,
} from '../services/edge-sync/index.js';

// ============================================================================
// Request Schemas
// ============================================================================

const SyncVoteSchema = z.object({
  id: z.string().uuid(),
  questionId: z.string().uuid(),
  encryptedVote: z.string(),
  commitment: z.string(),
  zkProof: z.string(),
  nullifier: z.string(),
  timestamp: z.number(),
  localPosition: z.number(),
  localMerkleRoot: z.string(),
});

const VoteSyncBatchSchema = z.object({
  batchId: z.string().uuid(),
  nodeId: z.string(),
  electionId: z.string().uuid(),
  votes: z.array(SyncVoteSchema),
  batchMerkleRoot: z.string(),
  signature: z.string(),
  submittedAt: z.number(),
});

const EdgeNodeRegistrationSchema = z.object({
  name: z.string().min(1).max(255),
  jurisdictionId: z.string().uuid(),
  publicKey: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// Routes
// ============================================================================

export async function syncRoutes(fastify: FastifyInstance): Promise<void> {
  const cloudSync = getCloudSyncServer();

  /**
   * POST /api/sync/upload - Upload vote batch from edge node
   *
   * Used by Pi edge nodes to sync votes to the central cloud.
   * Batches are signed with the node's private key for authentication.
   */
  fastify.post('/upload', async (request, reply) => {
    try {
      const batch = VoteSyncBatchSchema.parse(request.body) as VoteSyncBatch;

      // Log incoming sync
      console.log(
        `[Sync] Received batch ${batch.batchId} from node ${batch.nodeId} with ${batch.votes.length} votes`
      );

      const result = await cloudSync.processBatch(batch);

      return result;
    } catch (err) {
      console.error('[Sync] Upload error:', err);

      if (err instanceof z.ZodError) {
        reply.status(400);
        return { error: 'Invalid batch format', details: err.errors };
      }

      if (err instanceof Error) {
        // Authentication/authorization errors
        if (
          err.message.includes('Unknown node') ||
          err.message.includes('not active') ||
          err.message.includes('Invalid node signature')
        ) {
          reply.status(401);
          return { error: err.message };
        }

        // Validation errors
        if (err.message.includes('Invalid batch')) {
          reply.status(400);
          return { error: err.message };
        }
      }

      reply.status(500);
      return { error: 'Internal sync error' };
    }
  });

  /**
   * GET /api/sync/status/:nodeId - Get sync status for edge node
   *
   * Returns the current sync status for a registered edge node.
   */
  fastify.get('/status/:nodeId', async (request, reply) => {
    const { nodeId } = request.params as { nodeId: string };

    try {
      const status = await cloudSync.getNodeStatus(nodeId);

      if (!status.node) {
        reply.status(404);
        return { error: 'Node not found' };
      }

      return {
        nodeId: status.node.id,
        nodeName: status.node.name,
        status: status.node.status,
        lastSyncAt: status.node.lastSyncAt,
        totalVotesSynced: status.totalVotesSynced,
        lastBatchId: status.lastBatchId,
      };
    } catch (err) {
      console.error('[Sync] Status error:', err);
      reply.status(500);
      return { error: 'Failed to get sync status' };
    }
  });

  /**
   * POST /api/sync/register - Register new edge node
   *
   * Registers a new Pi edge node with the central cloud.
   * Newly registered nodes are in 'pending' status until approved by admin.
   */
  fastify.post('/register', async (request, reply) => {
    try {
      const registration = EdgeNodeRegistrationSchema.parse(request.body) as EdgeNodeRegistration;

      console.log(`[Sync] Registering new node: ${registration.name}`);

      const node = await cloudSync.registerNode(registration);

      return {
        nodeId: node.id,
        name: node.name,
        status: node.status,
        registeredAt: node.registeredAt,
        message:
          node.status === 'pending'
            ? 'Node registered. Awaiting admin approval.'
            : 'Node registered and active.',
      };
    } catch (err) {
      console.error('[Sync] Registration error:', err);

      if (err instanceof z.ZodError) {
        reply.status(400);
        return { error: 'Invalid registration data', details: err.errors };
      }

      reply.status(500);
      return { error: 'Failed to register node' };
    }
  });

  /**
   * GET /api/sync/nodes - List registered edge nodes (admin)
   *
   * Returns all registered edge nodes. Admin endpoint.
   */
  fastify.get('/nodes', async (request, reply) => {
    // TODO: Add admin authentication check

    try {
      const nodes = await cloudSync.listNodes();

      return {
        nodes: nodes.map((node) => ({
          id: node.id,
          name: node.name,
          jurisdictionId: node.jurisdictionId,
          status: node.status,
          lastSyncAt: node.lastSyncAt,
          registeredAt: node.registeredAt,
        })),
        total: nodes.length,
      };
    } catch (err) {
      console.error('[Sync] List nodes error:', err);
      reply.status(500);
      return { error: 'Failed to list nodes' };
    }
  });

  /**
   * POST /api/sync/nodes/:nodeId/activate - Activate a pending node (admin)
   *
   * Activates a pending edge node, allowing it to sync votes.
   */
  fastify.post('/nodes/:nodeId/activate', async (request, reply) => {
    // TODO: Add admin authentication check

    const { nodeId } = request.params as { nodeId: string };

    try {
      const node = await cloudSync.activateNode(nodeId);

      if (!node) {
        reply.status(404);
        return { error: 'Node not found' };
      }

      return {
        nodeId: node.id,
        name: node.name,
        status: node.status,
        message: 'Node activated successfully',
      };
    } catch (err) {
      console.error('[Sync] Activate node error:', err);
      reply.status(500);
      return { error: 'Failed to activate node' };
    }
  });

  /**
   * POST /api/sync/nodes/:nodeId/revoke - Revoke a node (admin)
   *
   * Revokes an edge node, preventing it from syncing votes.
   */
  fastify.post('/nodes/:nodeId/revoke', async (request, reply) => {
    // TODO: Add admin authentication check

    const { nodeId } = request.params as { nodeId: string };

    try {
      const success = await cloudSync.revokeNode(nodeId);

      if (!success) {
        reply.status(404);
        return { error: 'Node not found' };
      }

      return {
        nodeId,
        message: 'Node revoked successfully',
      };
    } catch (err) {
      console.error('[Sync] Revoke node error:', err);
      reply.status(500);
      return { error: 'Failed to revoke node' };
    }
  });
}

export default syncRoutes;
