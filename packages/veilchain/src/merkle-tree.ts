/**
 * VeilChain - Merkle Tree Ledger
 *
 * Append-only ledger with cryptographic proofs of inclusion.
 * Uses merkletreejs for the heavy lifting.
 */

import { MerkleTree } from 'merkletreejs';
import CryptoJS from 'crypto-js';
import { sha256 } from '@tvs/core';

const SHA256 = CryptoJS.SHA256;

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

/**
 * Vote Ledger - append-only Merkle tree for vote storage
 */
export class VoteLedger {
  private entries: VoteEntry[] = [];
  private tree: MerkleTree | null = null;
  private electionId: string;

  constructor(electionId: string) {
    this.electionId = electionId;
  }

  /**
   * Hash a vote entry for the Merkle tree
   */
  private hashEntry(entry: VoteEntry): string {
    return sha256(JSON.stringify({
      id: entry.id,
      encryptedVote: entry.encryptedVote,
      commitment: entry.commitment,
      nullifier: entry.nullifier,
    }));
  }

  /**
   * Rebuild the Merkle tree from entries
   */
  private rebuildTree(): void {
    if (this.entries.length === 0) {
      this.tree = null;
      return;
    }

    const leaves = this.entries.map(e => this.hashEntry(e));
    this.tree = new MerkleTree(leaves, SHA256, { sortPairs: true });
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
    const position = this.entries.length - 1;

    // Rebuild tree
    this.rebuildTree();

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

    if (!this.tree) {
      throw new Error('Ledger is empty');
    }

    const entry = this.entries[position]!;
    const leaf = this.hashEntry(entry);
    const proof = this.tree.getProof(leaf);

    return {
      leaf,
      proof: proof.map(p => p.data.toString('hex')),
      positions: proof.map(p => p.position),
      root: this.getRoot(),
    };
  }

  /**
   * Get current Merkle root
   */
  getRoot(): string {
    if (!this.tree) {
      return sha256('empty');
    }
    return this.tree.getRoot().toString('hex');
  }

  /**
   * Verify an inclusion proof
   */
  static verify(proof: MerkleProof): boolean {
    const leaves = [proof.leaf];
    const proofData = proof.proof.map((p, i) => ({
      data: Buffer.from(p, 'hex'),
      position: proof.positions[i]!,
    }));

    // Reconstruct root from proof
    let hash = proof.leaf;
    for (let i = 0; i < proofData.length; i++) {
      const node = proofData[i]!;
      const sibling = node.data.toString('hex');
      if (node.position === 'left') {
        hash = SHA256(sibling + hash).toString();
      } else {
        hash = SHA256(hash + sibling).toString();
      }
    }

    return hash === proof.root;
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
    this.entries = [...entries];
    this.rebuildTree();
  }
}
