/**
 * Organizations Repository
 *
 * Manages multi-tenant organizations (HOAs, companies, nonprofits, etc.)
 * that run elections on the TVS platform.
 */

import { sql } from './connection.js';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'hoa' | 'company' | 'nonprofit' | 'government' | 'other' | null;
  settings: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface OrgMember {
  id: string;
  org_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  invited_at: Date;
  joined_at: Date | null;
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
  type?: Organization['type'];
  settings?: Record<string, unknown>;
}

export interface UpdateOrganizationData {
  name?: string;
  slug?: string;
  type?: Organization['type'];
  settings?: Record<string, unknown>;
}

// ============================================
// ORGANIZATIONS
// ============================================

/**
 * Create a new organization
 */
export async function createOrganization(data: CreateOrganizationData): Promise<Organization> {
  const [organization] = await sql<Organization[]>`
    INSERT INTO organizations (name, slug, type, settings)
    VALUES (
      ${data.name},
      ${data.slug},
      ${data.type || null},
      ${JSON.stringify(data.settings || {})}
    )
    RETURNING *
  `;
  return organization!;
}

/**
 * Get organization by ID
 */
export async function getOrganization(id: string): Promise<Organization | null> {
  const [org] = await sql<Organization[]>`
    SELECT * FROM organizations WHERE id = ${id}
  `;
  return org || null;
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const [org] = await sql<Organization[]>`
    SELECT * FROM organizations WHERE slug = ${slug}
  `;
  return org || null;
}

/**
 * List all organizations (for a specific user via their email)
 */
export async function listOrganizationsForUser(email: string): Promise<(Organization & { role: OrgMember['role']; member_count: number })[]> {
  return sql<(Organization & { role: OrgMember['role']; member_count: number })[]>`
    SELECT
      o.*,
      om.role,
      (SELECT COUNT(*)::int FROM org_members WHERE org_id = o.id) as member_count
    FROM organizations o
    INNER JOIN org_members om ON om.org_id = o.id
    WHERE om.email = ${email}
    ORDER BY o.created_at DESC
  `;
}

/**
 * Update organization
 */
export async function updateOrganization(id: string, data: UpdateOrganizationData): Promise<Organization | null> {
  // Get current organization
  const current = await getOrganization(id);
  if (!current) return null;

  // Merge with updates
  const name = data.name ?? current.name;
  const slug = data.slug ?? current.slug;
  const type = data.type ?? current.type;
  const settings = data.settings !== undefined ? data.settings : current.settings;

  const [org] = await sql<Organization[]>`
    UPDATE organizations
    SET
      name = ${name},
      slug = ${slug},
      type = ${type},
      settings = ${JSON.stringify(settings)},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  return org || null;
}

/**
 * Delete organization
 */
export async function deleteOrganization(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM organizations WHERE id = ${id}
  `;
  return result.count > 0;
}

// ============================================
// ORGANIZATION MEMBERS
// ============================================

/**
 * Invite a member to an organization
 */
export async function inviteMember(
  orgId: string,
  email: string,
  role: OrgMember['role']
): Promise<OrgMember> {
  const [member] = await sql<OrgMember[]>`
    INSERT INTO org_members (org_id, email, role)
    VALUES (${orgId}, ${email}, ${role})
    ON CONFLICT (org_id, email) DO UPDATE SET
      role = ${role},
      invited_at = NOW()
    RETURNING *
  `;
  return member!;
}

/**
 * Mark a member as joined (when they accept invitation)
 */
export async function markMemberJoined(orgId: string, email: string): Promise<OrgMember | null> {
  const [member] = await sql<OrgMember[]>`
    UPDATE org_members
    SET joined_at = NOW()
    WHERE org_id = ${orgId} AND email = ${email} AND joined_at IS NULL
    RETURNING *
  `;
  return member || null;
}

/**
 * Get member by org and email
 */
export async function getMember(orgId: string, email: string): Promise<OrgMember | null> {
  const [member] = await sql<OrgMember[]>`
    SELECT * FROM org_members
    WHERE org_id = ${orgId} AND email = ${email}
  `;
  return member || null;
}

/**
 * List all members of an organization
 */
export async function listMembers(orgId: string): Promise<OrgMember[]> {
  return sql<OrgMember[]>`
    SELECT * FROM org_members
    WHERE org_id = ${orgId}
    ORDER BY invited_at DESC
  `;
}

/**
 * Update member role
 */
export async function updateMemberRole(
  orgId: string,
  email: string,
  role: OrgMember['role']
): Promise<OrgMember | null> {
  const [member] = await sql<OrgMember[]>`
    UPDATE org_members
    SET role = ${role}
    WHERE org_id = ${orgId} AND email = ${email}
    RETURNING *
  `;
  return member || null;
}

/**
 * Remove member from organization
 */
export async function removeMember(orgId: string, email: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM org_members
    WHERE org_id = ${orgId} AND email = ${email}
  `;
  return result.count > 0;
}

/**
 * Check if user has a specific role or higher in an organization
 * Hierarchy: owner > admin > member
 */
export async function hasRole(
  orgId: string,
  email: string,
  requiredRole: OrgMember['role']
): Promise<boolean> {
  const member = await getMember(orgId, email);
  if (!member) return false;

  const roleHierarchy: Record<OrgMember['role'], number> = {
    owner: 3,
    admin: 2,
    member: 1,
  };

  return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
}

/**
 * Get organization with member count
 */
export async function getOrganizationWithStats(id: string): Promise<(Organization & { member_count: number; election_count: number }) | null> {
  const [org] = await sql<(Organization & { member_count: number; election_count: number })[]>`
    SELECT
      o.*,
      (SELECT COUNT(*)::int FROM org_members WHERE org_id = o.id) as member_count,
      (SELECT COUNT(*)::int FROM elections WHERE org_id = o.id) as election_count
    FROM organizations o
    WHERE o.id = ${id}
  `;
  return org || null;
}
