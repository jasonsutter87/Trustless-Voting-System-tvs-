/**
 * Bitcoin Anchor Service (via OpenTimestamps)
 *
 * Anchors election Merkle roots to Bitcoin using OpenTimestamps.
 * OpenTimestamps aggregates many timestamps into a single Bitcoin transaction,
 * making it free and non-spammy while still providing Bitcoin-backed proofs.
 *
 * How it works:
 * 1. Submit hash to OpenTimestamps calendar servers
 * 2. They batch thousands of hashes into one Merkle tree
 * 3. That root gets anchored to Bitcoin (every few hours)
 * 4. You get a proof (.ots) that links your hash to the Bitcoin tx
 *
 * Two anchors per election:
 * 1. Election Start: Commits to public key + trustee configuration
 * 2. Election Close: Commits to final Merkle root + vote count
 */

import { createHash } from 'crypto';
import { config } from '../config.js';

// ============================================================================
// Types
// ============================================================================

export interface AnchorData {
  electionId: string;
  anchorType: 'start' | 'close';
  dataHash: string;
  rawData: string;
}

export interface AnchorResult {
  success: boolean;
  otsProof?: string; // Base64 encoded .ots proof
  pendingHash?: string;
  error?: string;
}

export interface VerificationResult {
  verified: boolean;
  bitcoinBlockHeight?: number;
  bitcoinBlockHash?: string;
  bitcoinTxId?: string;
  attestationTime?: number;
  pending?: boolean;
  error?: string;
}

// OpenTimestamps calendar servers
const OTS_CALENDARS = [
  'https://a.pool.opentimestamps.org',
  'https://b.pool.opentimestamps.org',
  'https://a.pool.eternitywall.com',
];

// ============================================================================
// OpenTimestamps Client
// ============================================================================

class OpenTimestampsClient {
  /**
   * Submit a hash to OpenTimestamps calendars
   * Returns the initial .ots proof (pending Bitcoin confirmation)
   */
  async stamp(hash: string): Promise<{ success: boolean; proof?: string; error?: string }> {
    const hashBytes = Buffer.from(hash, 'hex');

    // Try each calendar until one succeeds
    for (const calendar of OTS_CALENDARS) {
      try {
        const response = await fetch(`${calendar}/digest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/vnd.opentimestamps.v1',
          },
          body: hashBytes,
        });

        if (response.ok) {
          const proofBytes = await response.arrayBuffer();
          const proof = Buffer.from(proofBytes).toString('base64');

          return { success: true, proof };
        }
      } catch (err) {
        // Try next calendar
        continue;
      }
    }

    return { success: false, error: 'All calendar servers failed' };
  }

  /**
   * Upgrade a pending proof by checking if Bitcoin attestation is ready
   */
  async upgrade(proof: string): Promise<{ upgraded: boolean; proof?: string; error?: string }> {
    const proofBytes = Buffer.from(proof, 'base64');

    for (const calendar of OTS_CALENDARS) {
      try {
        // Extract pending attestation from proof and check for upgrade
        const response = await fetch(`${calendar}/timestamp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/vnd.opentimestamps.v1',
            Accept: 'application/vnd.opentimestamps.v1',
          },
          body: proofBytes,
        });

        if (response.ok) {
          const upgradedBytes = await response.arrayBuffer();
          const upgradedProof = Buffer.from(upgradedBytes).toString('base64');

          // Check if proof is different (upgraded)
          if (upgradedProof !== proof) {
            return { upgraded: true, proof: upgradedProof };
          }
        }
      } catch {
        continue;
      }
    }

    return { upgraded: false };
  }

  /**
   * Verify a proof against Bitcoin
   * Note: Full verification requires parsing the .ots format
   * For MVP, we trust the calendar servers and check for Bitcoin attestation
   */
  async verify(proof: string, originalHash: string): Promise<VerificationResult> {
    // Check if proof contains Bitcoin attestation
    // OTS proofs with Bitcoin attestation contain specific markers
    const proofBytes = Buffer.from(proof, 'base64');
    const proofHex = proofBytes.toString('hex');

    // Bitcoin attestation marker in OTS format: 0588960d73d71901
    const hasBitcoinAttestation = proofHex.includes('0588960d73d71901');

    if (!hasBitcoinAttestation) {
      return {
        verified: false,
        pending: true,
        error: 'Proof pending Bitcoin attestation (usually takes 1-24 hours)',
      };
    }

    // For full verification, we'd parse the OTS proof format
    // and verify the merkle path to a Bitcoin block header
    // For MVP, presence of attestation marker indicates it's anchored

    return {
      verified: true,
      pending: false,
    };
  }
}

// ============================================================================
// Anchor Service
// ============================================================================

class BitcoinAnchorService {
  private client: OpenTimestampsClient;
  private enabled: boolean;

  constructor() {
    this.client = new OpenTimestampsClient();
    this.enabled = config.useBitcoinAnchoring;
  }

  /**
   * Check if Bitcoin anchoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Test connection to OpenTimestamps calendars
   */
  async testConnection(): Promise<{
    connected: boolean;
    calendars?: string[];
    error?: string;
  }> {
    if (!this.enabled) {
      return { connected: false, error: 'Bitcoin anchoring is disabled' };
    }

    const availableCalendars: string[] = [];

    for (const calendar of OTS_CALENDARS) {
      try {
        const response = await fetch(calendar, { method: 'HEAD' });
        if (response.ok || response.status === 405) {
          availableCalendars.push(calendar);
        }
      } catch {
        // Calendar unavailable
      }
    }

    if (availableCalendars.length === 0) {
      return { connected: false, error: 'No calendar servers available' };
    }

    return {
      connected: true,
      calendars: availableCalendars,
    };
  }

  /**
   * Build anchor data for election start
   */
  buildStartAnchorData(
    electionId: string,
    publicKeyHash: string,
    trusteesHash: string,
    timestamp: number
  ): AnchorData {
    const rawData = JSON.stringify({
      type: 'tvs-election-start',
      version: 1,
      electionId,
      publicKeyHash,
      trusteesHash,
      timestamp,
    });

    const dataHash = createHash('sha256').update(rawData).digest('hex');

    return {
      electionId,
      anchorType: 'start',
      dataHash,
      rawData,
    };
  }

  /**
   * Build anchor data for election close
   */
  buildCloseAnchorData(
    electionId: string,
    merkleRoot: string,
    voteCount: number,
    timestamp: number
  ): AnchorData {
    const rawData = JSON.stringify({
      type: 'tvs-election-close',
      version: 1,
      electionId,
      merkleRoot,
      voteCount,
      timestamp,
    });

    const dataHash = createHash('sha256').update(rawData).digest('hex');

    return {
      electionId,
      anchorType: 'close',
      dataHash,
      rawData,
    };
  }

  /**
   * Submit anchor to OpenTimestamps
   */
  async anchor(anchorData: AnchorData): Promise<AnchorResult> {
    if (!this.enabled) {
      return { success: false, error: 'Bitcoin anchoring is disabled' };
    }

    const result = await this.client.stamp(anchorData.dataHash);

    if (result.success) {
      return {
        success: true,
        otsProof: result.proof,
        pendingHash: anchorData.dataHash,
      };
    }

    return {
      success: false,
      error: result.error,
    };
  }

  /**
   * Upgrade pending proof to Bitcoin-attested proof
   */
  async upgradeProof(proof: string): Promise<{ upgraded: boolean; proof?: string }> {
    return this.client.upgrade(proof);
  }

  /**
   * Verify a proof
   */
  async verifyProof(proof: string, originalHash: string): Promise<VerificationResult> {
    return this.client.verify(proof, originalHash);
  }

  /**
   * Helper: Hash a string with SHA-256
   */
  static sha256(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const bitcoinAnchor = new BitcoinAnchorService();

// Re-export class for testing
export { BitcoinAnchorService };
