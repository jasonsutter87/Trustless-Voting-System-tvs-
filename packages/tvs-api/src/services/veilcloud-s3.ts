/**
 * VeilCloud S3 Storage Adapter
 *
 * Extends VeilCloud storage to use S3/GCS for cloud deployments.
 * Maintains the same interface as local filesystem storage.
 *
 * Configuration via environment variables:
 * - VEILCLOUD_STORAGE_TYPE: 's3' to enable S3 storage
 * - VEILCLOUD_BUCKET: S3 bucket name
 * - VEILCLOUD_REGION: AWS region (default: us-east-1)
 * - VEILCLOUD_PREFIX: Key prefix (default: 'veilcloud')
 * - AWS_ACCESS_KEY_ID: AWS credentials (or use IAM role)
 * - AWS_SECRET_ACCESS_KEY: AWS credentials (or use IAM role)
 */

import { createHash } from 'crypto';
import type { StoredVote, StoredNullifier, ElectionSnapshot } from './veilcloud-storage.js';

// S3 client - dynamically imported to avoid bundling when not used
let s3Client: S3ClientType | null = null;

// Types for AWS SDK (to avoid requiring it at compile time)
interface S3ClientType {
  send(command: unknown): Promise<unknown>;
}

interface S3Config {
  bucket: string;
  region: string;
  prefix: string;
  enabled: boolean;
}

function getS3Config(): S3Config {
  return {
    bucket: process.env['VEILCLOUD_BUCKET'] || '',
    region: process.env['VEILCLOUD_REGION'] || 'us-east-1',
    prefix: process.env['VEILCLOUD_PREFIX'] || 'veilcloud',
    enabled: process.env['VEILCLOUD_STORAGE_TYPE'] === 's3',
  };
}

/**
 * Initialize S3 client (lazy load AWS SDK)
 */
async function getS3Client(): Promise<S3ClientType> {
  if (s3Client) {
    return s3Client;
  }

  try {
    const { S3Client } = await import('@aws-sdk/client-s3');
    const config = getS3Config();

    s3Client = new S3Client({
      region: config.region,
    }) as unknown as S3ClientType;

    return s3Client;
  } catch (err) {
    throw new Error(
      'AWS SDK not installed. Run: npm install @aws-sdk/client-s3'
    );
  }
}

/**
 * VeilCloud S3 Storage Service
 */
export class VeilCloudS3Storage {
  private readonly config: S3Config;

  constructor() {
    this.config = getS3Config();
  }

  /**
   * Check if S3 storage is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled && !!this.config.bucket;
  }

  /**
   * Get S3 key for a path
   */
  private getKey(path: string): string {
    return `${this.config.prefix}/${path}`;
  }

  /**
   * Store votes in JSONL format to S3
   */
  async storeVotesBatch(votes: StoredVote[]): Promise<void> {
    if (votes.length === 0) return;

    const client = await getS3Client();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');

    // Group by question
    const byQuestion = new Map<string, StoredVote[]>();
    for (const vote of votes) {
      const key = `${vote.electionId}/${vote.questionId}`;
      const list = byQuestion.get(key) || [];
      list.push(vote);
      byQuestion.set(key, list);
    }

    // Write each question's votes
    const promises: Promise<void>[] = [];
    for (const [path, questionVotes] of byQuestion) {
      const s3Key = this.getKey(`elections/${path}/votes/${Date.now()}-${randomId()}.jsonl`);
      const content = questionVotes.map((v) => JSON.stringify(v)).join('\n') + '\n';

      promises.push(
        client.send(
          new PutObjectCommand({
            Bucket: this.config.bucket,
            Key: s3Key,
            Body: content,
            ContentType: 'application/x-ndjson',
          })
        ) as Promise<void>
      );
    }

    await Promise.all(promises);
  }

  /**
   * Store nullifiers batch to S3
   */
  async storeNullifiersBatch(
    electionId: string,
    nullifiers: StoredNullifier[]
  ): Promise<void> {
    if (nullifiers.length === 0) return;

    const client = await getS3Client();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');

    const s3Key = this.getKey(
      `elections/${electionId}/nullifiers/${Date.now()}-${randomId()}.jsonl`
    );
    const content = nullifiers.map((n) => JSON.stringify(n)).join('\n') + '\n';

    await client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: s3Key,
        Body: content,
        ContentType: 'application/x-ndjson',
      })
    );
  }

  /**
   * Store election snapshot
   */
  async storeSnapshot(snapshot: ElectionSnapshot): Promise<void> {
    const client = await getS3Client();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');

    const s3Key = this.getKey(
      `elections/${snapshot.electionId}/${snapshot.questionId}/snapshot.json`
    );

    await client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: s3Key,
        Body: JSON.stringify(snapshot, null, 2),
        ContentType: 'application/json',
      })
    );
  }

  /**
   * Load all votes for a question from S3
   */
  async loadVotes(electionId: string, questionId: string): Promise<StoredVote[]> {
    const client = await getS3Client();
    const { ListObjectsV2Command, GetObjectCommand } = await import(
      '@aws-sdk/client-s3'
    );

    const prefix = this.getKey(`elections/${electionId}/${questionId}/votes/`);

    // List all JSONL files
    const listResponse = (await client.send(
      new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
      })
    )) as { Contents?: Array<{ Key?: string }> };

    const votes: StoredVote[] = [];

    for (const obj of listResponse.Contents || []) {
      if (!obj.Key?.endsWith('.jsonl')) continue;

      const getResponse = (await client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: obj.Key,
        })
      )) as { Body?: { transformToString(): Promise<string> } };

      const content = await getResponse.Body?.transformToString();
      if (!content) continue;

      const lines = content.trim().split('\n').filter((l) => l);
      for (const line of lines) {
        votes.push(JSON.parse(line));
      }
    }

    return votes.sort((a, b) => a.position - b.position);
  }

  /**
   * Load all nullifiers for an election
   */
  async loadNullifiers(electionId: string): Promise<StoredNullifier[]> {
    const client = await getS3Client();
    const { ListObjectsV2Command, GetObjectCommand } = await import(
      '@aws-sdk/client-s3'
    );

    const prefix = this.getKey(`elections/${electionId}/nullifiers/`);

    const listResponse = (await client.send(
      new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
      })
    )) as { Contents?: Array<{ Key?: string }> };

    const nullifiers: StoredNullifier[] = [];

    for (const obj of listResponse.Contents || []) {
      if (!obj.Key?.endsWith('.jsonl')) continue;

      const getResponse = (await client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: obj.Key,
        })
      )) as { Body?: { transformToString(): Promise<string> } };

      const content = await getResponse.Body?.transformToString();
      if (!content) continue;

      const lines = content.trim().split('\n').filter((l) => l);
      for (const line of lines) {
        nullifiers.push(JSON.parse(line));
      }
    }

    return nullifiers;
  }

  /**
   * Load snapshot for a question
   */
  async loadSnapshot(
    electionId: string,
    questionId: string
  ): Promise<ElectionSnapshot | null> {
    const client = await getS3Client();
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');

    const s3Key = this.getKey(
      `elections/${electionId}/${questionId}/snapshot.json`
    );

    try {
      const response = (await client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: s3Key,
        })
      )) as { Body?: { transformToString(): Promise<string> } };

      const content = await response.Body?.transformToString();
      if (!content) return null;

      return JSON.parse(content);
    } catch (err) {
      // File doesn't exist
      return null;
    }
  }

  /**
   * Check if a nullifier exists (requires loading all nullifiers - use index in production)
   */
  async hasNullifier(
    electionId: string,
    questionId: string,
    nullifier: string
  ): Promise<boolean> {
    // NOTE: This is inefficient for production use.
    // Use DynamoDB or Redis for O(1) nullifier lookups at scale.
    const nullifiers = await this.loadNullifiers(electionId);
    return nullifiers.some(
      (n) => n.questionId === questionId && n.nullifier === nullifier
    );
  }

  /**
   * List all elections in storage
   */
  async listElections(): Promise<string[]> {
    const client = await getS3Client();
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');

    const prefix = this.getKey('elections/');

    const response = (await client.send(
      new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
        Delimiter: '/',
      })
    )) as { CommonPrefixes?: Array<{ Prefix?: string }> };

    const elections: string[] = [];
    for (const prefix of response.CommonPrefixes || []) {
      if (prefix.Prefix) {
        const parts = prefix.Prefix.split('/');
        const electionId = parts[parts.length - 2];
        if (electionId) {
          elections.push(electionId);
        }
      }
    }

    return elections;
  }
}

/**
 * Generate a random ID for unique file names
 */
function randomId(): string {
  return createHash('sha256')
    .update(Math.random().toString() + Date.now().toString())
    .digest('hex')
    .substring(0, 8);
}

// ============================================================================
// Singleton Instance
// ============================================================================

let s3Storage: VeilCloudS3Storage | null = null;

export function getVeilCloudS3Storage(): VeilCloudS3Storage {
  if (!s3Storage) {
    s3Storage = new VeilCloudS3Storage();
  }
  return s3Storage;
}

/**
 * Get the appropriate storage service based on configuration
 */
export function getStorageService(): VeilCloudS3Storage | null {
  const storage = getVeilCloudS3Storage();
  return storage.isEnabled() ? storage : null;
}
