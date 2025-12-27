/**
 * VeilCloud Storage Service for TVS API
 *
 * Persists votes and election data to local filesystem using VeilCloud's
 * zero-knowledge storage pattern. Configured via environment variables:
 *
 * - VEILCLOUD_STORAGE_PATH: Base path for storage (default: ./data/veilcloud)
 * - VEILCLOUD_ENABLED: Set to 'true' to enable persistent storage
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';

// ============================================================================
// Configuration
// ============================================================================

export interface VeilCloudStorageConfig {
  basePath: string;
  enabled: boolean;
}

export function getConfig(): VeilCloudStorageConfig {
  return {
    basePath: process.env['VEILCLOUD_STORAGE_PATH'] || './data/veilcloud',
    enabled: process.env['VEILCLOUD_ENABLED'] === 'true',
  };
}

// ============================================================================
// Types
// ============================================================================

export interface StoredVote {
  id: string;
  questionId: string;
  electionId: string;
  encryptedVote: string;
  commitment: string;
  zkProof: string;
  nullifier: string;
  timestamp: number;
  position: number;
  merkleRoot: string;
}

export interface StoredNullifier {
  nullifier: string;
  questionId: string;
  timestamp: number;
}

export interface ElectionSnapshot {
  electionId: string;
  questionId: string;
  voteCount: number;
  merkleRoot: string;
  lastUpdated: number;
}

// ============================================================================
// VeilCloud Storage Service
// ============================================================================

export class VeilCloudStorageService {
  private readonly basePath: string;
  private readonly enabled: boolean;

  constructor(config?: Partial<VeilCloudStorageConfig>) {
    const defaultConfig = getConfig();
    this.basePath = config?.basePath || defaultConfig.basePath;
    this.enabled = config?.enabled ?? defaultConfig.enabled;
  }

  /**
   * Check if storage is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Ensure directory exists
   */
  private async ensureDir(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  /**
   * Get path for election data
   */
  private getElectionPath(electionId: string): string {
    return join(this.basePath, 'elections', electionId);
  }

  /**
   * Get path for question data
   */
  private getQuestionPath(electionId: string, questionId: string): string {
    return join(this.getElectionPath(electionId), 'questions', questionId);
  }

  /**
   * Get path for votes
   */
  private getVotesPath(electionId: string, questionId: string): string {
    return join(this.getQuestionPath(electionId, questionId), 'votes');
  }

  /**
   * Get path for nullifiers
   */
  private getNullifiersPath(electionId: string): string {
    return join(this.getElectionPath(electionId), 'nullifiers.json');
  }

  /**
   * Get path for snapshot
   */
  private getSnapshotPath(electionId: string, questionId: string): string {
    return join(this.getQuestionPath(electionId, questionId), 'snapshot.json');
  }

  // =========================================================================
  // Vote Storage
  // =========================================================================

  /**
   * Store a vote
   */
  async storeVote(vote: StoredVote): Promise<void> {
    if (!this.enabled) return;

    const votePath = join(
      this.getVotesPath(vote.electionId, vote.questionId),
      `${vote.position.toString().padStart(8, '0')}-${vote.id}.json`
    );

    await this.ensureDir(votePath);
    await fs.writeFile(votePath, JSON.stringify(vote, null, 2));
  }

  /**
   * Store multiple votes in batch (legacy - individual files)
   */
  async storeVotesBatch(votes: StoredVote[]): Promise<void> {
    if (!this.enabled || votes.length === 0) return;

    // Group by question for efficient writing
    const byQuestion = new Map<string, StoredVote[]>();
    for (const vote of votes) {
      const key = `${vote.electionId}:${vote.questionId}`;
      const list = byQuestion.get(key) || [];
      list.push(vote);
      byQuestion.set(key, list);
    }

    // Write each group
    for (const [, questionVotes] of byQuestion) {
      for (const vote of questionVotes) {
        await this.storeVote(vote);
      }
    }
  }

  /**
   * Store multiple votes using streaming JSONL format (much faster)
   * Appends to a single votes.jsonl file per question
   */
  async storeVotesBatchStream(votes: StoredVote[]): Promise<void> {
    if (!this.enabled || votes.length === 0) return;

    // Group by question for efficient writing
    const byQuestion = new Map<string, StoredVote[]>();
    for (const vote of votes) {
      const key = `${vote.electionId}:${vote.questionId}`;
      const list = byQuestion.get(key) || [];
      list.push(vote);
      byQuestion.set(key, list);
    }

    // Write each question's votes to a JSONL file
    for (const [key, questionVotes] of byQuestion) {
      const [electionId, questionId] = key.split(':');
      const jsonlPath = join(this.getQuestionPath(electionId, questionId), 'votes.jsonl');
      await this.ensureDir(jsonlPath);

      // Build JSONL content (one JSON object per line)
      const lines = questionVotes.map(vote => JSON.stringify(vote)).join('\n') + '\n';

      // Append to file
      await fs.appendFile(jsonlPath, lines);
    }
  }

  /**
   * Load votes from JSONL format
   */
  async loadVotesStream(electionId: string, questionId: string): Promise<StoredVote[]> {
    if (!this.enabled) return [];

    const jsonlPath = join(this.getQuestionPath(electionId, questionId), 'votes.jsonl');

    try {
      const content = await fs.readFile(jsonlPath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      return lines.map(line => JSON.parse(line));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Fall back to individual files
        return this.loadVotes(electionId, questionId);
      }
      throw error;
    }
  }

  /**
   * Load votes for a question
   */
  async loadVotes(electionId: string, questionId: string): Promise<StoredVote[]> {
    if (!this.enabled) return [];

    const votesDir = this.getVotesPath(electionId, questionId);
    const votes: StoredVote[] = [];

    try {
      const files = await fs.readdir(votesDir);
      const jsonFiles = files.filter(f => f.endsWith('.json')).sort();

      for (const file of jsonFiles) {
        const content = await fs.readFile(join(votesDir, file), 'utf-8');
        votes.push(JSON.parse(content));
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return votes;
  }

  /**
   * Get vote count for a question
   */
  async getVoteCount(electionId: string, questionId: string): Promise<number> {
    if (!this.enabled) return 0;

    const votesDir = this.getVotesPath(electionId, questionId);

    try {
      const files = await fs.readdir(votesDir);
      return files.filter(f => f.endsWith('.json')).length;
    } catch {
      return 0;
    }
  }

  // =========================================================================
  // Nullifier Storage
  // =========================================================================

  /**
   * Store a nullifier
   */
  async storeNullifier(electionId: string, nullifier: StoredNullifier): Promise<void> {
    if (!this.enabled) return;

    const nullifiersPath = this.getNullifiersPath(electionId);
    await this.ensureDir(nullifiersPath);

    // Load existing nullifiers
    let nullifiers: StoredNullifier[] = [];
    try {
      const content = await fs.readFile(nullifiersPath, 'utf-8');
      nullifiers = JSON.parse(content);
    } catch {
      // File doesn't exist yet
    }

    // Add new nullifier
    nullifiers.push(nullifier);

    // Write back
    await fs.writeFile(nullifiersPath, JSON.stringify(nullifiers, null, 2));
  }

  /**
   * Store multiple nullifiers in batch using JSONL append
   */
  async storeNullifiersBatch(electionId: string, nullifiers: StoredNullifier[]): Promise<void> {
    if (!this.enabled || nullifiers.length === 0) return;

    const nullifiersJsonlPath = join(this.getElectionPath(electionId), 'nullifiers.jsonl');
    await this.ensureDir(nullifiersJsonlPath);

    // Build JSONL content
    const lines = nullifiers.map(n => JSON.stringify(n)).join('\n') + '\n';

    // Append to file
    await fs.appendFile(nullifiersJsonlPath, lines);
  }

  /**
   * Load nullifiers from JSONL format
   */
  async loadNullifiersStream(electionId: string): Promise<Set<string>> {
    if (!this.enabled) return new Set();

    const nullifiersJsonlPath = join(this.getElectionPath(electionId), 'nullifiers.jsonl');

    try {
      const content = await fs.readFile(nullifiersJsonlPath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      const nullifiers: StoredNullifier[] = lines.map(line => JSON.parse(line));
      return new Set(nullifiers.map(n => `${n.questionId}:${n.nullifier}`));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Fall back to JSON format
        return this.loadNullifiers(electionId);
      }
      throw error;
    }
  }

  /**
   * Load all nullifiers for an election
   */
  async loadNullifiers(electionId: string): Promise<Set<string>> {
    if (!this.enabled) return new Set();

    const nullifiersPath = this.getNullifiersPath(electionId);

    try {
      const content = await fs.readFile(nullifiersPath, 'utf-8');
      const nullifiers: StoredNullifier[] = JSON.parse(content);
      return new Set(nullifiers.map(n => `${n.questionId}:${n.nullifier}`));
    } catch {
      return new Set();
    }
  }

  /**
   * Check if a nullifier exists
   */
  async hasNullifier(electionId: string, questionId: string, nullifier: string): Promise<boolean> {
    const nullifiers = await this.loadNullifiers(electionId);
    return nullifiers.has(`${questionId}:${nullifier}`);
  }

  // =========================================================================
  // Snapshot Storage
  // =========================================================================

  /**
   * Store question snapshot (Merkle root, vote count)
   */
  async storeSnapshot(snapshot: ElectionSnapshot): Promise<void> {
    if (!this.enabled) return;

    const snapshotPath = this.getSnapshotPath(snapshot.electionId, snapshot.questionId);
    await this.ensureDir(snapshotPath);
    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
  }

  /**
   * Load question snapshot
   */
  async loadSnapshot(electionId: string, questionId: string): Promise<ElectionSnapshot | null> {
    if (!this.enabled) return null;

    const snapshotPath = this.getSnapshotPath(electionId, questionId);

    try {
      const content = await fs.readFile(snapshotPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  // =========================================================================
  // Stats & Utilities
  // =========================================================================

  /**
   * Get storage stats
   */
  async getStats(): Promise<{
    enabled: boolean;
    basePath: string;
    totalFiles: number;
    totalSizeBytes: number;
  }> {
    if (!this.enabled) {
      return {
        enabled: false,
        basePath: this.basePath,
        totalFiles: 0,
        totalSizeBytes: 0,
      };
    }

    let totalFiles = 0;
    let totalSizeBytes = 0;

    const countDir = async (dirPath: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dirPath, entry.name);
          if (entry.isDirectory()) {
            await countDir(fullPath);
          } else {
            totalFiles++;
            const stat = await fs.stat(fullPath);
            totalSizeBytes += stat.size;
          }
        }
      } catch {
        // Directory doesn't exist
      }
    };

    await countDir(this.basePath);

    return {
      enabled: true,
      basePath: this.basePath,
      totalFiles,
      totalSizeBytes,
    };
  }

  /**
   * Clear all data (for testing)
   */
  async clear(): Promise<void> {
    if (!this.enabled) return;

    try {
      await fs.rm(this.basePath, { recursive: true, force: true });
    } catch {
      // Already empty
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let instance: VeilCloudStorageService | null = null;

export function getVeilCloudStorage(): VeilCloudStorageService {
  if (!instance) {
    instance = new VeilCloudStorageService();
  }
  return instance;
}

/**
 * Initialize with custom config (for testing)
 */
export function initVeilCloudStorage(config: Partial<VeilCloudStorageConfig>): VeilCloudStorageService {
  instance = new VeilCloudStorageService(config);
  return instance;
}
