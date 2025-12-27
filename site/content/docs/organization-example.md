---
title: "Organization Setup Example"
description: "Complete walkthrough for setting up an organization"
weight: 5
---

This guide demonstrates a complete workflow for creating and managing organizations in TVS.

## Scenario: Setting up "Sunset Hills HOA"

### Step 1: Create the Organization

```bash
curl -X POST http://localhost:3000/api/orgs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sunset Hills HOA",
    "slug": "sunset-hills",
    "type": "hoa",
    "ownerEmail": "president@sunsethills.org",
    "settings": {
      "branding": {
        "primaryColor": "#FF6B35",
        "logo": "https://sunsethills.org/logo.png"
      },
      "address": {
        "street": "123 Main St",
        "city": "Sacramento",
        "state": "CA",
        "zip": "95814"
      }
    }
  }'
```

**Response:**
```json
{
  "organization": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "name": "Sunset Hills HOA",
    "slug": "sunset-hills",
    "type": "hoa",
    "settings": {
      "branding": {
        "primaryColor": "#FF6B35",
        "logo": "https://sunsethills.org/logo.png"
      }
    },
    "created_at": "2025-12-24T12:00:00Z"
  },
  "message": "Organization created successfully"
}
```

### Step 2: Invite Board Members

**Invite Treasurer (Admin Role):**
```bash
curl -X POST http://localhost:3000/api/orgs/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d/members \
  -H "Content-Type: application/json" \
  -d '{
    "email": "treasurer@sunsethills.org",
    "role": "admin"
  }'
```

**Invite Secretary (Admin Role):**
```bash
curl -X POST http://localhost:3000/api/orgs/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d/members \
  -H "Content-Type: application/json" \
  -d '{
    "email": "secretary@sunsethills.org",
    "role": "admin"
  }'
```

**Invite Regular Member:**
```bash
curl -X POST http://localhost:3000/api/orgs/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d/members \
  -H "Content-Type: application/json" \
  -d '{
    "email": "resident1@sunsethills.org",
    "role": "member"
  }'
```

### Step 3: Members Accept Invitations

```bash
# Treasurer accepts
curl -X POST http://localhost:3000/api/orgs/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d/members/treasurer@sunsethills.org/accept

# Secretary accepts
curl -X POST http://localhost:3000/api/orgs/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d/members/secretary@sunsethills.org/accept
```

### Step 4: View All Members

```bash
curl http://localhost:3000/api/orgs/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d/members
```

**Response:**
```json
{
  "members": [
    {
      "email": "president@sunsethills.org",
      "role": "owner",
      "joined_at": "2025-12-24T12:00:00Z"
    },
    {
      "email": "treasurer@sunsethills.org",
      "role": "admin",
      "joined_at": "2025-12-24T12:10:00Z"
    },
    {
      "email": "secretary@sunsethills.org",
      "role": "admin",
      "joined_at": "2025-12-24T12:11:00Z"
    },
    {
      "email": "resident1@sunsethills.org",
      "role": "member",
      "joined_at": null
    }
  ],
  "count": 4
}
```

### Step 5: View Organization Details

```bash
curl http://localhost:3000/api/orgs/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d
```

**Response:**
```json
{
  "organization": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "name": "Sunset Hills HOA",
    "slug": "sunset-hills",
    "type": "hoa",
    "member_count": 4,
    "election_count": 0,
    "created_at": "2025-12-24T12:00:00Z"
  }
}
```

### Step 6: Update Organization Settings

```bash
curl -X PATCH http://localhost:3000/api/orgs/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "branding": {
        "primaryColor": "#FF6B35",
        "secondaryColor": "#004E89",
        "logo": "https://sunsethills.org/logo-v2.png"
      },
      "features": {
        "advancedReporting": true,
        "smsNotifications": false
      }
    }
  }'
```

### Step 7: Promote Member to Admin

```bash
curl -X PATCH http://localhost:3000/api/orgs/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d/members/resident1@sunsethills.org \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

## Creating Elections for the Organization

Once the organization is set up, create elections:

```bash
curl -X POST http://localhost:3000/api/elections \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "name": "2025 Board Election",
    "description": "Annual election for HOA board positions",
    "startTime": "2025-03-01T00:00:00Z",
    "endTime": "2025-03-15T23:59:59Z",
    "threshold": 3,
    "totalTrustees": 5,
    "candidates": [
      { "name": "Alice Johnson" },
      { "name": "Bob Smith" },
      { "name": "Carol Williams" }
    ]
  }'
```

## Multi-tenant Subdomain Setup

Each organization gets a subdomain based on their slug:

- `sunset-hills.veilsuite.com` - Sunset Hills HOA
- `acme-corp.veilsuite.com` - Acme Corporation
- `city-council.veilsuite.com` - City Council

Configure nginx or your CDN to route subdomains to the admin portal frontend, passing the slug as context.
