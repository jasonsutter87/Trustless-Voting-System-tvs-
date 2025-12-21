// Core types used across all TVS packages

export interface Election {
  id: string;
  name: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  publicKey: string;
  status: 'draft' | 'registration' | 'voting' | 'tallying' | 'complete';
  createdAt: Date;
}

export interface Candidate {
  id: string;
  electionId: string;
  name: string;
  position: number;
}

export interface Voter {
  id: string;
  electionId: string;
  studentIdHash: string;
  registeredAt: Date;
  credentialIssued: boolean;
}

export interface Vote {
  id: string;
  electionId: string;
  encryptedVote: string;
  commitment: string;
  zkProof: string;
  credentialNullifier: string;
  merklePosition: bigint;
  createdAt: Date;
}

export interface MerkleProof {
  leaf: string;
  path: string[];
  indices: number[];
  root: string;
}

export interface BlindSignatureRequest {
  blindedMessage: string;
  blindingFactor: string;
}

export interface Credential {
  signature: string;
  nullifier: string;
  electionId: string;
}
