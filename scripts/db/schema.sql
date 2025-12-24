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
-- JURISDICTIONS (Hierarchical: Federal > State > County > City)
-- ============================================
CREATE TABLE jurisdictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES jurisdictions(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,                           -- "Placer County"
  type TEXT NOT NULL CHECK (type IN ('federal', 'state', 'county', 'city', 'district', 'precinct')),
  code TEXT NOT NULL UNIQUE,                    -- "US-CA-PLACER"
  full_path TEXT NOT NULL,                      -- "United States > California > Placer County"
  level INT NOT NULL,                           -- 0=federal, 1=state, 2=county, 3=city

  -- Threshold cryptography per jurisdiction
  public_key TEXT,                              -- RSA public key for vote encryption
  threshold INT,                                -- Required trustees for decryption
  total_trustees INT,

  metadata JSONB,                               -- Population, geographic data, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_name_at_level UNIQUE(parent_id, name)
);

CREATE INDEX idx_jurisdictions_parent ON jurisdictions(parent_id);
CREATE INDEX idx_jurisdictions_code ON jurisdictions(code);
CREATE INDEX idx_jurisdictions_level ON jurisdictions(level);
CREATE INDEX idx_jurisdictions_type ON jurisdictions(type);

-- Get jurisdiction ancestry chain (from current up to federal)
CREATE OR REPLACE FUNCTION get_jurisdiction_chain(p_jurisdiction_id UUID)
RETURNS TABLE(id UUID, name TEXT, code TEXT, type TEXT, level INT) AS $$
  WITH RECURSIVE chain AS (
    SELECT j.id, j.name, j.code, j.type, j.level, j.parent_id
    FROM jurisdictions j
    WHERE j.id = p_jurisdiction_id

    UNION ALL

    SELECT j.id, j.name, j.code, j.type, j.level, j.parent_id
    FROM jurisdictions j
    JOIN chain c ON j.id = c.parent_id
  )
  SELECT id, name, code, type, level FROM chain ORDER BY level ASC;
$$ LANGUAGE sql;

-- ============================================
-- BALLOT QUESTIONS (belong to jurisdictions)
-- ============================================
CREATE TABLE ballot_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),

  title TEXT NOT NULL,                          -- "County Sheriff", "Proposition 47"
  description TEXT,
  question_type TEXT NOT NULL CHECK (question_type IN
    ('single_choice', 'multi_choice', 'ranked_choice', 'yes_no', 'write_in')),
  max_selections INT NOT NULL DEFAULT 1,        -- For multi_choice: how many can be selected
  allow_write_in BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL,                   -- Order within jurisdiction section

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(election_id, jurisdiction_id, display_order)
);

CREATE INDEX idx_questions_election ON ballot_questions(election_id);
CREATE INDEX idx_questions_jurisdiction ON ballot_questions(jurisdiction_id);

-- ============================================
-- CANDIDATES / BALLOT OPTIONS (belong to questions)
-- ============================================
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES ballot_questions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  party TEXT,                         -- Political party (optional)
  position INT NOT NULL,              -- Display order within question
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_id, position)
);

CREATE INDEX idx_candidates_question ON candidates(question_id);

-- ============================================
-- VOTERS (Identity side - before credential issuance)
-- ============================================
CREATE TABLE voters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),  -- Voter's home jurisdiction (most specific)
  voter_id_hash TEXT NOT NULL,        -- SHA-256 of voter ID (never store plaintext)
  email_hash TEXT,                    -- SHA-256 of email (for notifications)
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  credential_issued BOOLEAN NOT NULL DEFAULT FALSE,
  credential_issued_at TIMESTAMPTZ,

  -- Cache the jurisdiction chain at registration time for ballot generation
  jurisdiction_chain UUID[],          -- [federal_id, state_id, county_id, ...]

  UNIQUE(election_id, voter_id_hash)
);

CREATE INDEX idx_voters_election ON voters(election_id);
CREATE INDEX idx_voters_jurisdiction ON voters(jurisdiction_id);
CREATE INDEX idx_voters_credential ON voters(election_id, credential_issued);

-- ============================================
-- JURISDICTION TRUSTEES (for threshold decryption)
-- ============================================
CREATE TABLE jurisdiction_trustees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id) ON DELETE CASCADE,
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  trustee_name TEXT NOT NULL,
  email TEXT,
  public_key TEXT,                    -- Trustee's public key for share encryption
  key_share_encrypted TEXT,           -- Encrypted portion of jurisdiction's private key
  share_index INT,                    -- Position in threshold scheme
  status TEXT NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'registered', 'confirmed', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(jurisdiction_id, election_id, trustee_name)
);

CREATE INDEX idx_trustees_jurisdiction ON jurisdiction_trustees(jurisdiction_id);
CREATE INDEX idx_trustees_election ON jurisdiction_trustees(election_id);

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
-- VEILCHAIN: Merkle Tree Nodes (per question for jurisdiction separation)
-- ============================================
CREATE TABLE merkle_nodes (
  id BIGSERIAL PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES ballot_questions(id) ON DELETE CASCADE,
  level INT NOT NULL,                 -- 0 = leaves, higher = internal nodes
  position BIGINT NOT NULL,           -- Position at this level
  hash TEXT NOT NULL,                 -- SHA-256 hash
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(question_id, level, position)
);

CREATE INDEX idx_merkle_question_level ON merkle_nodes(question_id, level);

-- ============================================
-- VEILCHAIN: Vote Entries (APPEND-ONLY, per question)
-- ============================================
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES ballot_questions(id),
  encrypted_vote TEXT NOT NULL,       -- Encrypted answer (VeilForms format)
  commitment TEXT NOT NULL,           -- Vote commitment hash
  zk_proof TEXT NOT NULL,             -- Zero-knowledge proof of validity
  credential_nullifier TEXT NOT NULL, -- Prevents double voting (unique per election)
  merkle_position BIGINT NOT NULL,    -- Position in question's Merkle tree
  confirmation_code TEXT NOT NULL,    -- Voter's receipt code
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Nullifier is unique per question (voter can vote on multiple questions)
  UNIQUE(question_id, credential_nullifier),
  UNIQUE(question_id, merkle_position)
);

CREATE INDEX idx_votes_question ON votes(question_id);
CREATE INDEX idx_votes_confirmation ON votes(confirmation_code);
CREATE INDEX idx_votes_nullifier ON votes(credential_nullifier);

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
-- MERKLE ROOT SNAPSHOTS (per question for independent verification)
-- ============================================
CREATE TABLE merkle_roots (
  id BIGSERIAL PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES ballot_questions(id),
  root_hash TEXT NOT NULL,
  vote_count BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_merkle_roots_question ON merkle_roots(question_id, created_at DESC);

-- ============================================
-- BITCOIN ANCHORS (Immutable timestamping via OP_RETURN)
-- ============================================
CREATE TABLE bitcoin_anchors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  anchor_type TEXT NOT NULL CHECK (anchor_type IN ('start', 'close')),

  -- What was anchored
  data_hash TEXT NOT NULL,              -- SHA-256 of anchored data
  op_return_data TEXT NOT NULL,         -- Raw OP_RETURN payload (hex)

  -- Bitcoin transaction details
  bitcoin_txid TEXT,                    -- Transaction hash (null until broadcast)
  bitcoin_block_height BIGINT,          -- Block number (null until confirmed)
  bitcoin_block_hash TEXT,              -- Block hash for verification
  confirmations INT NOT NULL DEFAULT 0,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'broadcast', 'confirmed', 'failed')),
  error_message TEXT,                   -- If status = 'failed'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  broadcast_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,

  -- One anchor per type per election
  UNIQUE(election_id, anchor_type)
);

CREATE INDEX idx_anchors_election ON bitcoin_anchors(election_id);
CREATE INDEX idx_anchors_status ON bitcoin_anchors(status);
CREATE INDEX idx_anchors_txid ON bitcoin_anchors(bitcoin_txid);

-- ============================================
-- AUDIT LOG (with jurisdiction/question scoping)
-- ============================================
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  election_id UUID REFERENCES elections(id),
  jurisdiction_id UUID REFERENCES jurisdictions(id),  -- For jurisdiction-specific audits
  question_id UUID REFERENCES ballot_questions(id),   -- For question-specific audits
  action TEXT NOT NULL,
  actor TEXT,                         -- System component or admin ID
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_election ON audit_log(election_id, created_at DESC);
CREATE INDEX idx_audit_jurisdiction ON audit_log(jurisdiction_id, created_at DESC);
CREATE INDEX idx_audit_question ON audit_log(question_id, created_at DESC);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current Merkle root for a ballot question
CREATE OR REPLACE FUNCTION get_merkle_root(p_question_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_root TEXT;
BEGIN
  SELECT hash INTO v_root
  FROM merkle_nodes
  WHERE question_id = p_question_id
  ORDER BY level DESC, position ASC
  LIMIT 1;

  RETURN v_root;
END;
$$ LANGUAGE plpgsql;

-- Get vote count for a ballot question
CREATE OR REPLACE FUNCTION get_vote_count(p_question_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM votes WHERE question_id = p_question_id);
END;
$$ LANGUAGE plpgsql;

-- Get ballot questions for a voter's jurisdiction chain
CREATE OR REPLACE FUNCTION get_ballot_for_voter(p_election_id UUID, p_jurisdiction_id UUID)
RETURNS TABLE(
  question_id UUID,
  jurisdiction_id UUID,
  jurisdiction_name TEXT,
  jurisdiction_level INT,
  title TEXT,
  question_type TEXT,
  max_selections INT,
  display_order INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bq.id as question_id,
    bq.jurisdiction_id,
    j.name as jurisdiction_name,
    j.level as jurisdiction_level,
    bq.title,
    bq.question_type,
    bq.max_selections,
    bq.display_order
  FROM ballot_questions bq
  JOIN jurisdictions j ON bq.jurisdiction_id = j.id
  WHERE bq.election_id = p_election_id
    AND bq.jurisdiction_id IN (
      SELECT id FROM get_jurisdiction_chain(p_jurisdiction_id)
    )
  ORDER BY j.level ASC, bq.display_order ASC;
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
