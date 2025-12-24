-- Migration: Add Organizations and Multi-tenant Support
-- Created: 2025-12-24
-- Description: Adds organizations table and org_members for multi-tenant admin portal

-- ============================================
-- ORGANIZATIONS (Multi-tenant support)
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,          -- for URLs: org-name.veilsuite.com
  type TEXT CHECK (type IN ('hoa', 'company', 'nonprofit', 'government', 'other')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);

-- ============================================
-- ORGANIZATION MEMBERS (links users to orgs with roles)
-- ============================================
CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(org_id, email)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_email ON org_members(email);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON org_members(org_id, role);

-- ============================================
-- ALTER ELECTIONS TABLE
-- ============================================
-- Add org_id to elections table
ALTER TABLE elections
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_elections_org ON elections(org_id);

-- ============================================
-- TRIGGERS
-- ============================================
-- Add updated_at trigger for organizations
DROP TRIGGER IF EXISTS organizations_updated_at ON organizations;
CREATE TRIGGER organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE organizations IS 'Multi-tenant organizations (HOAs, companies, nonprofits, etc.) that run elections';
COMMENT ON TABLE org_members IS 'Links users to organizations with roles (owner, admin, member)';
COMMENT ON COLUMN elections.org_id IS 'Organization that owns this election';
