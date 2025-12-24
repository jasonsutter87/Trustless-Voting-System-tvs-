# Organization Model - TVS Admin Portal

## Overview

The organization model provides multi-tenant support for the TVS (Trustless Voting System) admin portal. Organizations represent entities like HOAs, companies, nonprofits, or government agencies that run elections on the platform.

## Database Schema

### Organizations Table

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT CHECK (type IN ('hoa', 'company', 'nonprofit', 'government', 'other')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Fields:**
- `id` - Unique identifier
- `name` - Display name (e.g., "Acme HOA")
- `slug` - URL-friendly identifier (e.g., "acme-hoa") for subdomains like `acme-hoa.veilsuite.com`
- `type` - Organization category: `hoa`, `company`, `nonprofit`, `government`, or `other`
- `settings` - JSON object for organization-specific configuration
- `created_at` / `updated_at` - Timestamps

### Org Members Table

```sql
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(org_id, email)
);
```

**Fields:**
- `id` - Unique identifier
- `org_id` - Foreign key to organizations
- `email` - User email (pre-auth, will integrate with auth system)
- `role` - Permission level: `owner`, `admin`, or `member`
- `invited_at` - When the invitation was sent
- `joined_at` - When the user accepted (NULL = pending)

**Role Hierarchy:**
- `owner` - Full control, can delete org, manage all members
- `admin` - Can create elections, invite/remove members
- `member` - Read-only access to org elections

### Elections Table Updates

Elections now link to organizations:

```sql
ALTER TABLE elections
ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
```

When an organization is deleted, all its elections are cascade deleted.

## API Routes

### Organization Management

#### POST /api/orgs
Create a new organization

**Request:**
```json
{
  "name": "Acme HOA",
  "slug": "acme-hoa",
  "type": "hoa",
  "settings": {
    "branding": {
      "primaryColor": "#007bff"
    }
  },
  "ownerEmail": "admin@acme-hoa.com"
}
```

**Response (201):**
```json
{
  "organization": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme HOA",
    "slug": "acme-hoa",
    "type": "hoa",
    "settings": {},
    "created_at": "2025-12-24T12:00:00Z",
    "updated_at": "2025-12-24T12:00:00Z"
  },
  "message": "Organization created successfully"
}
```

#### GET /api/orgs?email=user@example.com
List user's organizations

**Response:**
```json
{
  "organizations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Acme HOA",
      "slug": "acme-hoa",
      "type": "hoa",
      "role": "owner",
      "member_count": 5,
      "created_at": "2025-12-24T12:00:00Z",
      "updated_at": "2025-12-24T12:00:00Z"
    }
  ],
  "count": 1
}
```

#### GET /api/orgs/:id
Get organization details

**Response:**
```json
{
  "organization": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme HOA",
    "slug": "acme-hoa",
    "type": "hoa",
    "settings": {},
    "member_count": 5,
    "election_count": 3,
    "created_at": "2025-12-24T12:00:00Z",
    "updated_at": "2025-12-24T12:00:00Z"
  }
}
```

#### PATCH /api/orgs/:id
Update organization (requires admin/owner role)

**Request:**
```json
{
  "name": "Acme Homeowners Association",
  "settings": {
    "branding": {
      "primaryColor": "#0056b3"
    }
  }
}
```

#### DELETE /api/orgs/:id
Delete organization (requires owner role)

### Member Management

#### POST /api/orgs/:id/members
Invite a member (requires admin/owner role)

**Request:**
```json
{
  "email": "user@example.com",
  "role": "member"
}
```

**Response (201):**
```json
{
  "member": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "org_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "member",
    "invited_at": "2025-12-24T12:00:00Z",
    "joined_at": null
  },
  "message": "Invitation sent to user@example.com"
}
```

#### GET /api/orgs/:id/members
List organization members

**Response:**
```json
{
  "members": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "org_id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "member",
      "invited_at": "2025-12-24T12:00:00Z",
      "joined_at": "2025-12-24T12:30:00Z"
    }
  ],
  "count": 1
}
```

#### PATCH /api/orgs/:id/members/:email
Update member role (requires owner role)

**Request:**
```json
{
  "role": "admin"
}
```

#### DELETE /api/orgs/:id/members/:email
Remove member (requires admin/owner role)

#### POST /api/orgs/:id/members/:email/accept
Accept invitation (user accepting their own invitation)

## Database Layer

Location: `/packages/tvs-api/src/db/organizations.ts`

### Key Functions

**Organization CRUD:**
- `createOrganization(data)` - Create new organization
- `getOrganization(id)` - Get by ID
- `getOrganizationBySlug(slug)` - Get by slug
- `listOrganizationsForUser(email)` - List user's orgs with roles
- `updateOrganization(id, data)` - Update organization
- `deleteOrganization(id)` - Delete organization
- `getOrganizationWithStats(id)` - Get org with member/election counts

**Member Management:**
- `inviteMember(orgId, email, role)` - Invite new member
- `markMemberJoined(orgId, email)` - Accept invitation
- `getMember(orgId, email)` - Get specific member
- `listMembers(orgId)` - List all members
- `updateMemberRole(orgId, email, role)` - Change role
- `removeMember(orgId, email)` - Remove member
- `hasRole(orgId, email, requiredRole)` - Check permissions

## Migration

To apply the schema changes to an existing database:

```bash
psql -d tvs_db -f scripts/db/migrations/001_add_organizations.sql
```

Or rebuild from scratch:

```bash
psql -d tvs_db -f scripts/db/schema.sql
```

## Security Considerations

### TODO: Authentication
The current implementation uses email as a query parameter for MVP purposes. Production implementation should:

1. **JWT/Session-based auth** - Verify user identity from auth token
2. **Role-based access control** - Enforce permissions at route level
3. **Email verification** - Verify email ownership before joining
4. **Audit logging** - Track all member/org changes

### Permission Checks

All routes include TODO comments for permission checks:

```typescript
// TODO: Check user has admin/owner role for this org
```

Before production, implement middleware like:

```typescript
async function requireOrgRole(orgId: string, email: string, minRole: 'member' | 'admin' | 'owner') {
  const hasPermission = await organizationsDb.hasRole(orgId, email, minRole);
  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }
}
```

## Usage Example

### Creating an Organization and Inviting Members

```typescript
// 1. Create organization
const org = await organizationsDb.createOrganization({
  name: "Acme HOA",
  slug: "acme-hoa",
  type: "hoa",
  settings: {}
});

// 2. Add owner
await organizationsDb.inviteMember(org.id, "admin@acme.com", "owner");
await organizationsDb.markMemberJoined(org.id, "admin@acme.com");

// 3. Invite additional members
await organizationsDb.inviteMember(org.id, "treasurer@acme.com", "admin");
await organizationsDb.inviteMember(org.id, "resident@acme.com", "member");

// 4. List all members
const members = await organizationsDb.listMembers(org.id);
```

### Creating an Election for an Organization

When creating elections, link them to the organization:

```typescript
const election = await electionsDb.createElection({
  orgId: "550e8400-e29b-41d4-a716-446655440000",
  name: "2025 Board Election",
  description: "Annual board member election",
  startTime: new Date("2025-03-01"),
  endTime: new Date("2025-03-15"),
  publicKey: "..."
});
```

## Files Changed

### Database
- `/scripts/db/schema.sql` - Added organizations and org_members tables, updated elections
- `/scripts/db/migrations/001_add_organizations.sql` - Migration script

### API
- `/packages/tvs-api/src/db/organizations.ts` - Database layer
- `/packages/tvs-api/src/routes/organizations.ts` - API routes
- `/packages/tvs-api/src/db/index.ts` - Export organizations module
- `/packages/tvs-api/src/server.ts` - Register organization routes

## Next Steps

1. **Authentication Integration** - Replace email query params with JWT/session auth
2. **Email Invitations** - Send actual emails when members are invited
3. **Frontend Admin Portal** - Build React/Vue UI for managing organizations
4. **Subdomain Routing** - Configure nginx/CloudFlare for `{slug}.veilsuite.com`
5. **Settings Schema** - Define TypeScript interfaces for organization settings
6. **Audit Logging** - Track all org/member changes in audit_log table
7. **Soft Deletes** - Consider soft deletes for organizations (retain election data)
