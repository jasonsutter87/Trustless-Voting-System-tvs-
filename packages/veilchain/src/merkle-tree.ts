/**
 * @tvs/veilchain - TVS Wrapper for VeilChain
 *
 * Provides a simplified API for the Trustless Voting System.
 * Uses @veilchain/core for the underlying Merkle tree implementation.
 */

import {
  FastMerkleTree,
  MerkleTree,
  sha256 as veilchainSha256,
  type MerkleProof as VeilChainProof,
} from '@veilchain/core';

// ============================================================================
// Types - TVS-specific
// ============================================================================

export interface VoteEntry {
  id: string;
  encryptedVote: string;
  commitment: string;
  zkProof: string;
  nullifier: string;
  timestamp: number;
}

export interface MerkleProof {
  leaf: string;
  proof: string[];
  positions: ('left' | 'right')[];
  root: string;
}

export interface LedgerSnapshot {
  root: string;
  voteCount: number;
  timestamp: number;
}

// ============================================================================
// VoteLedger - TVS wrapper around @veilchain/core MerkleTree
// ============================================================================

/**
 * Vote Ledger - append-only Merkle tree for vote storage
 * Wraps @veilchain/core for TVS-specific functionality
 *
 * Uses FastMerkleTree for O(log n) appends instead of O(n)
 */
export class VoteLedger {
  private entries: VoteEntry[] = [];
  private tree: FastMerkleTree;
  private electionId: string;

  constructor(electionId: string) {
    this.electionId = electionId;
    this.tree = new FastMerkleTree();
  }

  /**
   * Hash a vote entry for the Merkle tree
   */
  private hashEntry(entry: VoteEntry): string {
    return veilchainSha256(JSON.stringify({
      id: entry.id,
      encryptedVote: entry.encryptedVote,
      commitment: entry.commitment,
      nullifier: entry.nullifier,
    }));
  }

  /**
   * Append a vote to the ledger (immutable operation)
   */
  append(entry: VoteEntry): { position: number; proof: MerkleProof } {
    // Check for duplicate nullifier (double-vote prevention)
    const existing = this.entries.find(e => e.nullifier === entry.nullifier);
    if (existing) {
      throw new Error('Duplicate nullifier - vote already cast with this credential');
    }

    // Append entry
    this.entries.push(entry);

    // Hash and add to tree
    const hash = this.hashEntry(entry);
    const position = this.tree.append(hash);

    // Generate proof
    const proof = this.getProof(position);

    return { position, proof };
  }

  /**
   * Get inclusion proof for a vote at given position
   */
  getProof(position: number): MerkleProof {
    if (position < 0 || position >= this.entries.length) {
      throw new Error('Invalid position');
    }

    const veilchainProof = this.tree.getProof(position);

    return {
      leaf: veilchainProof.leaf,
      proof: veilchainProof.proof,
      positions: veilchainProof.directions,
      root: veilchainProof.root,
    };
  }

  /**
   * Get current Merkle root
   */
  getRoot(): string {
    return this.tree.root;
  }

  /**
   * Verify an inclusion proof
   */
  static verify(proof: MerkleProof): boolean {
    // Convert to VeilChain proof format
    const veilchainProof: VeilChainProof = {
      leaf: proof.leaf,
      index: 0, // Not used in verification
      proof: proof.proof,
      directions: proof.positions,
      root: proof.root,
    };

    return FastMerkleTree.verify(veilchainProof);
  }

  /**
   * Get vote count
   */
  getVoteCount(): number {
    return this.entries.length;
  }

  /**
   * Get ledger snapshot for anchoring
   */
  getSnapshot(): LedgerSnapshot {
    return {
      root: this.getRoot(),
      voteCount: this.entries.length,
      timestamp: Date.now(),
    };
  }

  /**
   * Get entry by position
   */
  getEntry(position: number): VoteEntry | undefined {
    return this.entries[position];
  }

  /**
   * Find entry by nullifier
   */
  findByNullifier(nullifier: string): { entry: VoteEntry; position: number } | undefined {
    const position = this.entries.findIndex(e => e.nullifier === nullifier);
    if (position === -1) return undefined;
    return { entry: this.entries[position]!, position };
  }

  /**
   * Export all entries (for persistence)
   */
  export(): VoteEntry[] {
    return [...this.entries];
  }

  /**
   * Import entries (for loading from database)
   */
  import(entries: VoteEntry[]): void {
    this.entries = [];
    this.tree = new FastMerkleTree();

    // Use batch append for efficiency
    const hashes = entries.map(entry => this.hashEntry(entry));
    this.entries = [...entries];
    if (hashes.length > 0) {
      this.tree.appendBatch(hashes);
    }
  }
}
