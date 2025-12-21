-- TVS Database Schema
-- Trustless Voting System - PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ELECTIONS
-- ============================================
CREATE TABLE elections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  public_key TEXT NOT NULL,           -- RSA public key for encryption
  private_key_shares TEXT[],          -- Encrypted key shares for threshold decryption
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'registration', 'voting', 'tallying', 'complete', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_elections_status ON elections(status);
CREATE INDEX idx_elections_time ON elections(start_time, end_time);

-- ============================================
-- CANDIDATES / BALLOT OPTIONS
-- ============================================
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position INT NOT NULL,              -- Display order
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(election_id, position)
);

CREATE INDEX idx_candidates_election ON candidates(election_id);

-- ============================================
-- VOTERS (Identity side - before credential issuance)
-- ============================================
CREATE TABLE voters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  student_id_hash TEXT NOT NULL,      -- SHA-256 of student ID (never store plaintext)
  email_hash TEXT,                    -- SHA-256 of email (for notifications)
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  credential_issued BOOLEAN NOT NULL DEFAULT FALSE,
  credential_issued_at TIMESTAMPTZ,

  UNIQUE(election_id, student_id_hash)
);

CREATE INDEX idx_voters_election ON voters(election_id);
CREATE INDEX idx_voters_credential ON voters(election_id, credential_issued);

-- ============================================
-- VEILSIGN: Blind Signature Authority Keys
-- ============================================
CREATE TABLE signing_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,           -- RSA public key for verification
  private_key_encrypted TEXT NOT NULL, -- Encrypted private key
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(election_id)
);

-- ============================================
-- VEILCHAIN: Merkle Tree Nodes
-- ============================================
CREATE TABLE merkle_nodes (
  id BIGSERIAL PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  level INT NOT NULL,                 -- 0 = leaves, higher = internal nodes
  position BIGINT NOT NULL,           -- Position at this level
  hash TEXT NOT NULL,                 -- SHA-256 hash
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(election_id, level, position)
);

CREATE INDEX idx_merkle_election_level ON merkle_nodes(election_id, level);

-- ============================================
-- VEILCHAIN: Vote Entries (APPEND-ONLY)
-- ============================================
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id),
  encrypted_vote TEXT NOT NULL,       -- Encrypted ballot (VeilForms format)
  commitment TEXT NOT NULL,           -- Vote commitment hash
  zk_proof TEXT NOT NULL,             -- Zero-knowledge proof of validity
  credential_nullifier TEXT NOT NULL, -- Prevents double voting (unique per credential)
  merkle_position BIGINT NOT NULL,    -- Position in Merkle tree
  confirmation_code TEXT NOT NULL,    -- Voter's receipt code
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(credential_nullifier),       -- One vote per credential
  UNIQUE(election_id, merkle_position)
);

CREATE INDEX idx_votes_election ON votes(election_id);
CREATE INDEX idx_votes_confirmation ON votes(confirmation_code);

-- ============================================
-- APPEND-ONLY ENFORCEMENT
-- ============================================
CREATE OR REPLACE FUNCTION prevent_vote_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Votes are immutable - updates not allowed';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Votes are immutable - deletes not allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER votes_immutable
BEFORE UPDATE OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION prevent_vote_modification();

-- ============================================
-- MERKLE ROOT SNAPSHOTS (for anchoring)
-- ============================================
CREATE TABLE merkle_roots (
  id BIGSERIAL PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES elections(id),
  root_hash TEXT NOT NULL,
  vote_count BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_merkle_roots_election ON merkle_roots(election_id, created_at DESC);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  election_id UUID REFERENCES elections(id),
  action TEXT NOT NULL,
  actor TEXT,                         -- System component or admin ID
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_election ON audit_log(election_id, created_at DESC);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current Merkle root for an election
CREATE OR REPLACE FUNCTION get_merkle_root(p_election_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_root TEXT;
BEGIN
  SELECT hash INTO v_root
  FROM merkle_nodes
  WHERE election_id = p_election_id
  ORDER BY level DESC, position ASC
  LIMIT 1;

  RETURN v_root;
END;
$$ LANGUAGE plpgsql;

-- Get vote count for an election
CREATE OR REPLACE FUNCTION get_vote_count(p_election_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM votes WHERE election_id = p_election_id);
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER elections_updated_at
BEFORE UPDATE ON elections
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
