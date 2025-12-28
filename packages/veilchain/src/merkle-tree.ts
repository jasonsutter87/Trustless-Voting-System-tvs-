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
  private nullifierSet: Set<string> = new Set(); // O(1) lookup instead of O(n)
  private nullifierToPosition: Map<string, number> = new Map(); // O(1) position lookup
  private tree: FastMerkleTree;
  private electionId: string;
  private _entryCount: number = 0; // Track count without storing entries

  // Memory optimization: don't store full entries in memory for large elections
  private storeEntriesInMemory: boolean = true;
  private static readonly MEMORY_THRESHOLD = 100_000; // Switch to low-memory mode after 100k

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
    // Check for duplicate nullifier - O(1) with Set
    if (this.nullifierSet.has(entry.nullifier)) {
      throw new Error('Duplicate nullifier - vote already cast with this credential');
    }

    // Add to nullifier set - O(1)
    this.nullifierSet.add(entry.nullifier);

    const position = this._entryCount;

    // Memory optimization: stop storing entries after threshold
    if (this._entryCount >= VoteLedger.MEMORY_THRESHOLD) {
      this.storeEntriesInMemory = false;
      // Clear existing entries to free memory (keep first batch for debugging)
      if (this.entries.length > 1000) {
        this.entries = this.entries.slice(0, 1000);
      }
    }

    if (this.storeEntriesInMemory) {
      this.entries.push(entry);
    }

    // Track nullifier -> position mapping for lookups
    this.nullifierToPosition.set(entry.nullifier, position);
    this._entryCount++;

    // Hash and add to tree
    const hash = this.hashEntry(entry);
    this.tree.append(hash);

    // Generate proof
    const proof = this.getProof(position);

    return { position, proof };
  }

  /**
   * Append multiple votes to the ledger in batch (more efficient for bulk operations)
   * Returns results for each entry with position and proof
   */
  appendBatch(batchEntries: VoteEntry[]): Array<{ position: number; proof: MerkleProof }> {
    // Check for duplicate nullifiers within batch AND against existing - O(m) where m = batch size
    const nullifiersInBatch = new Set<string>();
    for (const entry of batchEntries) {
      if (nullifiersInBatch.has(entry.nullifier)) {
        throw new Error(`Duplicate nullifier in batch: ${entry.nullifier}`);
      }
      // O(1) check against existing entries
      if (this.nullifierSet.has(entry.nullifier)) {
        throw new Error('Duplicate nullifier - vote already cast with this credential');
      }
      nullifiersInBatch.add(entry.nullifier);
    }

    // Record start position
    const startPosition = this._entryCount;

    // Memory optimization: stop storing entries after threshold
    if (this._entryCount >= VoteLedger.MEMORY_THRESHOLD) {
      this.storeEntriesInMemory = false;
      if (this.entries.length > 1000) {
        this.entries = this.entries.slice(0, 1000);
      }
    }

    // Add all nullifiers and track positions - O(m)
    for (let i = 0; i < batchEntries.length; i++) {
      const entry = batchEntries[i]!;
      this.nullifierSet.add(entry.nullifier);
      this.nullifierToPosition.set(entry.nullifier, startPosition + i);

      if (this.storeEntriesInMemory) {
        this.entries.push(entry);
      }
    }
    this._entryCount += batchEntries.length;

    // Hash all entries
    const hashes = batchEntries.map(entry => this.hashEntry(entry));

    // Batch append to tree
    this.tree.appendBatch(hashes);

    // Generate proofs for each entry
    const results: Array<{ position: number; proof: MerkleProof }> = [];
    for (let i = 0; i < batchEntries.length; i++) {
      const position = startPosition + i;
      const proof = this.getProof(position);
      results.push({ position, proof });
    }

    return results;
  }

  /**
   * Get inclusion proof for a vote at given position
   */
  getProof(position: number): MerkleProof {
    if (position < 0 || position >= this._entryCount) {
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
    return this._entryCount;
  }

  /**
   * Get ledger snapshot for anchoring
   */
  getSnapshot(): LedgerSnapshot {
    return {
      root: this.getRoot(),
      voteCount: this._entryCount,
      timestamp: Date.now(),
    };
  }

  /**
   * Get entry by position (only works if entries are stored in memory)
   */
  getEntry(position: number): VoteEntry | undefined {
    if (!this.storeEntriesInMemory && position >= this.entries.length) {
      // Entry not in memory - would need to load from VeilCloud
      return undefined;
    }
    return this.entries[position];
  }

  /**
   * Find position by nullifier - O(1) lookup
   */
  findPositionByNullifier(nullifier: string): number | undefined {
    return this.nullifierToPosition.get(nullifier);
  }

  /**
   * Find entry by nullifier (only works if entries are stored in memory)
   */
  findByNullifier(nullifier: string): { entry: VoteEntry; position: number } | undefined {
    const position = this.nullifierToPosition.get(nullifier);
    if (position === undefined) return undefined;

    const entry = this.entries[position];
    if (!entry) {
      // Entry not in memory - return just position
      return undefined;
    }
    return { entry, position };
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
  import(importEntries: VoteEntry[]): void {
    this.entries = [];
    this.nullifierSet = new Set();
    this.nullifierToPosition = new Map();
    this.tree = new FastMerkleTree();
    this._entryCount = importEntries.length;

    // Memory optimization: don't store if too many entries
    this.storeEntriesInMemory = importEntries.length < VoteLedger.MEMORY_THRESHOLD;

    if (this.storeEntriesInMemory) {
      this.entries = [...importEntries];
    }

    // Populate nullifier set and position map for O(1) lookups
    for (let i = 0; i < importEntries.length; i++) {
      const entry = importEntries[i]!;
      this.nullifierSet.add(entry.nullifier);
      this.nullifierToPosition.set(entry.nullifier, i);
    }

    // Use batch append for efficiency
    const hashes = importEntries.map(entry => this.hashEntry(entry));
    if (hashes.length > 0) {
      this.tree.appendBatch(hashes);
    }
  }
}
