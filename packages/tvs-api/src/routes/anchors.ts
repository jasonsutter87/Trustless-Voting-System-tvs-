/**
 * Bitcoin Anchors Routes
 *
 * API endpoints for viewing and managing Bitcoin anchor records.
 */

import { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { bitcoinAnchor } from '../services/bitcoin-anchor.js';
import * as anchorsDb from '../db/anchors.js';

export async function anchorsRoutes(fastify: FastifyInstance) {
  /**
   * Get Bitcoin anchoring status
   *
   * GET /api/anchors/status
   */
  fastify.get('/status', async (_request, reply) => {
    if (!config.useBitcoinAnchoring) {
      return {
        enabled: false,
        message: 'Bitcoin anchoring is disabled',
      };
    }

    const connectionStatus = await bitcoinAnchor.testConnection();

    return {
      enabled: true,
      network: config.bitcoinNetwork,
      connected: connectionStatus.connected,
      nodeVersion: connectionStatus.version,
      walletBalance: connectionStatus.balance,
      error: connectionStatus.error,
    };
  });

  /**
   * Get anchors for an election
   *
   * GET /api/anchors/:electionId
   */
  fastify.get('/:electionId', async (request, reply) => {
    const { electionId } = request.params as { electionId: string };

    if (!config.useDatabase) {
      return reply.status(400).send({
        error: 'Database required for anchor records',
      });
    }

    const summary = await anchorsDb.getAnchorSummary(electionId);

    const formatAnchor = (anchor: anchorsDb.BitcoinAnchor | null) => {
      if (!anchor) return null;

      return {
        id: anchor.id,
        type: anchor.anchor_type,
        status: anchor.status,
        dataHash: anchor.data_hash,
        bitcoin: anchor.bitcoin_txid
          ? {
              txid: anchor.bitcoin_txid,
              blockHeight: anchor.bitcoin_block_height,
              confirmations: anchor.confirmations,
              explorerUrl: getExplorerUrl(anchor.bitcoin_txid),
            }
          : null,
        createdAt: anchor.created_at,
        broadcastAt: anchor.broadcast_at,
        confirmedAt: anchor.confirmed_at,
        error: anchor.error_message,
      };
    };

    return {
      electionId,
      fullyAnchored: summary.fullyAnchored,
      anchors: {
        start: formatAnchor(summary.start),
        close: formatAnchor(summary.close),
      },
    };
  });

  /**
   * Verify anchors against Bitcoin node
   *
   * GET /api/anchors/:electionId/verify
   */
  fastify.get('/:electionId/verify', async (request, reply) => {
    const { electionId } = request.params as { electionId: string };

    if (!config.useBitcoinAnchoring) {
      return reply.status(400).send({
        error: 'Bitcoin anchoring is disabled',
      });
    }

    if (!config.useDatabase) {
      return reply.status(400).send({
        error: 'Database required for anchor records',
      });
    }

    const anchors = await anchorsDb.getAnchorsByElection(electionId);

    const verificationResults = await Promise.all(
      anchors.map(async (anchor) => {
        if (!anchor.bitcoin_txid) {
          return {
            type: anchor.anchor_type,
            verified: false,
            reason: 'Not yet broadcast',
          };
        }

        const txInfo = await bitcoinAnchor.getConfirmations(anchor.bitcoin_txid);

        if (!txInfo) {
          return {
            type: anchor.anchor_type,
            verified: false,
            reason: 'Transaction not found on node',
            txid: anchor.bitcoin_txid,
          };
        }

        return {
          type: anchor.anchor_type,
          verified: true,
          txid: anchor.bitcoin_txid,
          confirmations: txInfo.confirmations,
          blockHeight: txInfo.blockHeight,
          sufficient: txInfo.confirmations >= 6,
        };
      })
    );

    const allVerified = verificationResults.every((r) => r.verified && r.sufficient);

    return {
      electionId,
      verified: allVerified,
      network: config.bitcoinNetwork,
      anchors: verificationResults,
    };
  });

  /**
   * Refresh confirmation counts for pending anchors
   *
   * POST /api/anchors/:electionId/refresh
   */
  fastify.post('/:electionId/refresh', async (request, reply) => {
    const { electionId } = request.params as { electionId: string };

    if (!config.useBitcoinAnchoring) {
      return reply.status(400).send({
        error: 'Bitcoin anchoring is disabled',
      });
    }

    if (!config.useDatabase) {
      return reply.status(400).send({
        error: 'Database required for anchor records',
      });
    }

    const anchors = await anchorsDb.getAnchorsByElection(electionId);
    const updates: Array<{ type: string; updated: boolean; confirmations?: number }> = [];

    for (const anchor of anchors) {
      if (!anchor.bitcoin_txid || anchor.status === 'confirmed') {
        updates.push({ type: anchor.anchor_type, updated: false });
        continue;
      }

      const txInfo = await bitcoinAnchor.getConfirmations(anchor.bitcoin_txid);

      if (txInfo) {
        await anchorsDb.updateAnchorConfirmations(
          anchor.id,
          txInfo.confirmations,
          txInfo.blockHeight,
          txInfo.blockHash
        );
        updates.push({
          type: anchor.anchor_type,
          updated: true,
          confirmations: txInfo.confirmations,
        });
      } else {
        updates.push({ type: anchor.anchor_type, updated: false });
      }
    }

    return {
      electionId,
      updates,
    };
  });

  /**
   * Manual anchor trigger (admin only, for testing)
   *
   * POST /api/anchors/:electionId/trigger/:type
   */
  fastify.post('/:electionId/trigger/:type', async (request, reply) => {
    const { electionId, type } = request.params as {
      electionId: string;
      type: 'start' | 'close';
    };

    if (!config.useBitcoinAnchoring) {
      return reply.status(400).send({
        error: 'Bitcoin anchoring is disabled',
      });
    }

    // This endpoint is primarily for testing
    // In production, anchoring happens automatically on status transitions

    return reply.status(501).send({
      error: 'Manual trigger not implemented - anchoring happens automatically',
      hint: 'Transition election to voting (start) or tallying (close) to trigger anchors',
    });
  });
}

/**
 * Get block explorer URL for a transaction
 */
function getExplorerUrl(txid: string): string {
  const baseUrl =
    config.bitcoinNetwork === 'mainnet'
      ? 'https://mempool.space/tx/'
      : config.bitcoinNetwork === 'testnet'
        ? 'https://mempool.space/testnet/tx/'
        : 'http://localhost:8080/tx/'; // regtest

  return `${baseUrl}${txid}`;
}

export default anchorsRoutes;
