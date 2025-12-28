-- Edge Sync Schema Extensions for TVS
-- Adds support for Raspberry Pi edge nodes syncing to central cloud

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Edge Node Registry
-- ============================================================================

-- Edge node registry - tracks all registered Pi edge nodes
CREATE TABLE IF NOT EXISTS edge_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  public_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'inactive', 'syncing', 'revoked')),

  -- Sync tracking
  last_sync_at TIMESTAMPTZ,
  last_sync_position BIGINT DEFAULT 0,
  total_votes_synced BIGINT DEFAULT 0,

  -- Network info
  ip_address INET,
  last_seen_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(jurisdiction_id, name)
);

-- Indexes for edge_nodes
CREATE INDEX IF NOT EXISTS idx_edge_nodes_jurisdiction ON edge_nodes(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_edge_nodes_status ON edge_nodes(status);
CREATE INDEX IF NOT EXISTS idx_edge_nodes_last_sync ON edge_nodes(last_sync_at);

-- ============================================================================
-- Sync Batches (for idempotency and auditing)
-- ============================================================================

-- Sync batches - tracks all vote batches synced from edge nodes
CREATE TABLE IF NOT EXISTS sync_batches (
  id UUID PRIMARY KEY,  -- Same as batchId from edge node (for idempotency)
  node_id UUID NOT NULL REFERENCES edge_nodes(id),
  election_id UUID NOT NULL REFERENCES elections(id),

  -- Batch stats
  vote_count INT NOT NULL,
  accepted_count INT NOT NULL,
  rejected_count INT NOT NULL,

  -- Merkle verification
  batch_merkle_root TEXT NOT NULL,
  cloud_merkle_root TEXT,
  cloud_start_position BIGINT,

  -- Authentication
  signature TEXT NOT NULL,

  -- Rejection details (JSONB array of rejected votes with reasons)
  rejected_votes JSONB,

  -- Timestamps
  submitted_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for sync_batches
CREATE INDEX IF NOT EXISTS idx_sync_batches_node ON sync_batches(node_id);
CREATE INDEX IF NOT EXISTS idx_sync_batches_election ON sync_batches(election_id);
CREATE INDEX IF NOT EXISTS idx_sync_batches_processed ON sync_batches(processed_at);

-- ============================================================================
-- Extended Votes Table
-- ============================================================================

-- Add source tracking columns to votes table
-- Note: Run these only if the columns don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'votes' AND column_name = 'source_node_id') THEN
    ALTER TABLE votes ADD COLUMN source_node_id UUID REFERENCES edge_nodes(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'votes' AND column_name = 'synced_at') THEN
    ALTER TABLE votes ADD COLUMN synced_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'votes' AND column_name = 'local_position') THEN
    ALTER TABLE votes ADD COLUMN local_position BIGINT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'votes' AND column_name = 'local_merkle_root') THEN
    ALTER TABLE votes ADD COLUMN local_merkle_root TEXT;
  END IF;
END $$;

-- Index for source node tracking
CREATE INDEX IF NOT EXISTS idx_votes_source_node ON votes(source_node_id);
CREATE INDEX IF NOT EXISTS idx_votes_synced_at ON votes(synced_at);

-- ============================================================================
-- Sync Checkpoints
-- ============================================================================

-- Tracks sync progress per node per election
CREATE TABLE IF NOT EXISTS sync_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES edge_nodes(id),
  election_id UUID NOT NULL REFERENCES elections(id),

  -- Progress tracking
  last_synced_position BIGINT NOT NULL DEFAULT 0,
  last_synced_batch_id UUID REFERENCES sync_batches(id),
  cloud_merkle_root TEXT,

  -- Timestamps
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique per node/election
  UNIQUE(node_id, election_id)
);

-- Index for checkpoint lookup
CREATE INDEX IF NOT EXISTS idx_sync_checkpoints_lookup ON sync_checkpoints(node_id, election_id);

-- ============================================================================
-- Nullifier Index (for fast duplicate detection)
-- ============================================================================

-- Nullifier index for cross-node duplicate detection
-- Uses the format: election_id:question_id:nullifier
CREATE TABLE IF NOT EXISTS nullifier_index (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id),
  question_id UUID NOT NULL,
  nullifier TEXT NOT NULL,

  -- Source tracking (which node submitted first)
  source_node_id UUID REFERENCES edge_nodes(id),
  vote_id UUID,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint ensures first-write-wins
  UNIQUE(election_id, question_id, nullifier)
);

-- Indexes for nullifier lookup
CREATE INDEX IF NOT EXISTS idx_nullifier_lookup ON nullifier_index(election_id, question_id, nullifier);
CREATE INDEX IF NOT EXISTS idx_nullifier_source ON nullifier_index(source_node_id);

-- ============================================================================
-- Audit Log
-- ============================================================================

-- Audit log for sync operations
CREATE TABLE IF NOT EXISTS sync_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID REFERENCES edge_nodes(id),
  action TEXT NOT NULL,  -- 'register', 'activate', 'revoke', 'sync', 'error'
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_sync_audit_node ON sync_audit_log(node_id);
CREATE INDEX IF NOT EXISTS idx_sync_audit_action ON sync_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_sync_audit_time ON sync_audit_log(created_at);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to check if a nullifier has been used
CREATE OR REPLACE FUNCTION check_nullifier_exists(
  p_election_id UUID,
  p_question_id UUID,
  p_nullifier TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM nullifier_index
    WHERE election_id = p_election_id
      AND question_id = p_question_id
      AND nullifier = p_nullifier
  );
END;
$$ LANGUAGE plpgsql;

-- Function to register a nullifier (returns false if already exists)
CREATE OR REPLACE FUNCTION register_nullifier(
  p_election_id UUID,
  p_question_id UUID,
  p_nullifier TEXT,
  p_source_node_id UUID,
  p_vote_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO nullifier_index (election_id, question_id, nullifier, source_node_id, vote_id)
  VALUES (p_election_id, p_question_id, p_nullifier, p_source_node_id, p_vote_id)
  ON CONFLICT (election_id, question_id, nullifier) DO NOTHING;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update edge_nodes.updated_at on changes
CREATE OR REPLACE FUNCTION update_edge_nodes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS edge_nodes_updated_at ON edge_nodes;
CREATE TRIGGER edge_nodes_updated_at
  BEFORE UPDATE ON edge_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_edge_nodes_timestamp();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE edge_nodes IS 'Registry of Raspberry Pi edge nodes that can sync votes to the central cloud';
COMMENT ON TABLE sync_batches IS 'Audit trail of all vote batches synced from edge nodes';
COMMENT ON TABLE sync_checkpoints IS 'Tracks sync progress per node per election';
COMMENT ON TABLE nullifier_index IS 'Fast lookup index for nullifiers to detect duplicates across nodes';
COMMENT ON TABLE sync_audit_log IS 'Audit log for all sync-related operations';
