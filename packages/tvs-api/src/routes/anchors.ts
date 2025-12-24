/**
 * Bitcoin Anchors Routes (OpenTimestamps)
 *
 * API endpoints for viewing and managing OpenTimestamps anchor records.
 * OTS provides free Bitcoin timestamping by aggregating hashes into
 * single Bitcoin transactions.
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
      method: 'OpenTimestamps',
      connected: connectionStatus.connected,
      calendars: connectionStatus.calendars,
      network: config.bitcoinNetwork,
      note: 'OpenTimestamps is free - no Bitcoin node or wallet required',
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
        hasOtsProof: !!anchor.ots_proof,
        bitcoin: anchor.bitcoin_txid
          ? {
              txid: anchor.bitcoin_txid,
              blockHeight: anchor.bitcoin_block_height,
              attestationTime: anchor.attestation_time,
              explorerUrl: getExplorerUrl(anchor.bitcoin_txid),
            }
          : null,
        timestamps: {
          created: anchor.created_at,
          submitted: anchor.submitted_at,
          upgraded: anchor.upgraded_at,
          verified: anchor.verified_at,
        },
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
      info: {
        method: 'OpenTimestamps',
        note: 'Proofs are Bitcoin-backed but free via OTS aggregation',
        statuses: {
          pending: 'Record created, not yet submitted',
          submitted: 'Submitted to OTS calendars, awaiting Bitcoin attestation (1-24 hours)',
          upgraded: 'Bitcoin attestation received',
          verified: 'Proof verified against Bitcoin blockchain',
          failed: 'Submission or verification failed',
        },
      },
    };
  });

  /**
   * Verify anchor proofs
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
        if (!anchor.ots_proof) {
          return {
            type: anchor.anchor_type,
            verified: false,
            reason: 'No OTS proof stored',
          };
        }

        const verification = await bitcoinAnchor.verifyProof(
          anchor.ots_proof,
          anchor.data_hash
        );

        if (verification.pending) {
          return {
            type: anchor.anchor_type,
            verified: false,
            pending: true,
            reason: 'Awaiting Bitcoin attestation (usually 1-24 hours)',
          };
        }

        return {
          type: anchor.anchor_type,
          verified: verification.verified,
          bitcoinBlockHeight: verification.bitcoinBlockHeight,
          bitcoinBlockHash: verification.bitcoinBlockHash,
          bitcoinTxId: verification.bitcoinTxId,
          attestationTime: verification.attestationTime,
        };
      })
    );

    const allVerified = verificationResults.every((r) => r.verified);

    return {
      electionId,
      verified: allVerified,
      network: config.bitcoinNetwork,
      anchors: verificationResults,
    };
  });

  /**
   * Upgrade pending proofs (check for Bitcoin attestation)
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
    const updates: Array<{
      type: string;
      updated: boolean;
      status?: string;
      message?: string;
    }> = [];

    for (const anchor of anchors) {
      // Skip if already verified or no proof
      if (anchor.status === 'verified' || !anchor.ots_proof) {
        updates.push({
          type: anchor.anchor_type,
          updated: false,
          status: anchor.status,
          message: anchor.status === 'verified' ? 'Already verified' : 'No proof to upgrade',
        });
        continue;
      }

      // Try to upgrade the proof
      const upgradeResult = await bitcoinAnchor.upgradeProof(anchor.ots_proof);

      if (upgradeResult.upgraded && upgradeResult.proof) {
        // Store upgraded proof
        await anchorsDb.markAnchorUpgraded(anchor.id, upgradeResult.proof);

        // Verify it
        const verification = await bitcoinAnchor.verifyProof(
          upgradeResult.proof,
          anchor.data_hash
        );

        if (verification.verified) {
          await anchorsDb.markAnchorVerified(anchor.id, {
            txid: verification.bitcoinTxId,
            blockHeight: verification.bitcoinBlockHeight,
            blockHash: verification.bitcoinBlockHash,
            attestationTime: verification.attestationTime,
          });
          updates.push({
            type: anchor.anchor_type,
            updated: true,
            status: 'verified',
            message: 'Bitcoin attestation verified!',
          });
        } else {
          updates.push({
            type: anchor.anchor_type,
            updated: true,
            status: 'upgraded',
            message: 'Proof upgraded, verification pending',
          });
        }
      } else {
        updates.push({
          type: anchor.anchor_type,
          updated: false,
          status: anchor.status,
          message: 'Bitcoin attestation not yet available (check again in a few hours)',
        });
      }
    }

    return {
      electionId,
      updates,
      tip: 'Bitcoin attestations typically take 1-24 hours after submission',
    };
  });

  /**
   * Download OTS proof file
   *
   * GET /api/anchors/:electionId/:type/proof
   */
  fastify.get('/:electionId/:type/proof', async (request, reply) => {
    const { electionId, type } = request.params as {
      electionId: string;
      type: 'start' | 'close';
    };

    if (!config.useDatabase) {
      return reply.status(400).send({
        error: 'Database required for anchor records',
      });
    }

    const anchor = await anchorsDb.getAnchor(electionId, type);

    if (!anchor) {
      return reply.status(404).send({
        error: 'Anchor not found',
      });
    }

    if (!anchor.ots_proof) {
      return reply.status(404).send({
        error: 'No proof available yet',
      });
    }

    // Return the proof as a downloadable file
    const proofBuffer = Buffer.from(anchor.ots_proof, 'base64');

    return reply
      .header('Content-Type', 'application/octet-stream')
      .header(
        'Content-Disposition',
        `attachment; filename="${electionId}-${type}.ots"`
      )
      .send(proofBuffer);
  });

  /**
   * Get raw anchor data (for independent verification)
   *
   * GET /api/anchors/:electionId/:type/data
   */
  fastify.get('/:electionId/:type/data', async (request, reply) => {
    const { electionId, type } = request.params as {
      electionId: string;
      type: 'start' | 'close';
    };

    if (!config.useDatabase) {
      return reply.status(400).send({
        error: 'Database required for anchor records',
      });
    }

    const anchor = await anchorsDb.getAnchor(electionId, type);

    if (!anchor) {
      return reply.status(404).send({
        error: 'Anchor not found',
      });
    }

    return {
      electionId,
      anchorType: anchor.anchor_type,
      dataHash: anchor.data_hash,
      rawData: JSON.parse(anchor.raw_data),
      verification: {
        instructions: [
          '1. Hash the rawData JSON with SHA-256',
          '2. Compare result with dataHash',
          '3. Download the .ots proof file',
          '4. Verify with: ots verify <filename>.ots',
          '5. Or use https://opentimestamps.org to verify online',
        ],
        otsCliInstall: 'pip install opentimestamps-client',
      },
    };
  });
}

/**
 * Get block explorer URL for a transaction
 */
function getExplorerUrl(txid: string): string {
  const baseUrl =
    config.bitcoinNetwork === 'mainnet'
      ? 'https://mempool.space/tx/'
      : 'https://mempool.space/testnet/tx/';

  return `${baseUrl}${txid}`;
}

export default anchorsRoutes;
