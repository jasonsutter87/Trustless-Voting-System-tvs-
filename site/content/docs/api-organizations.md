---
title: "Organizations API"
description: "API reference for organization management"
weight: 4
---

Quick reference for organization management endpoints.

## Base URL
```
/api/orgs
```

## Endpoints

### Organizations

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/orgs` | Create organization | Yes |
| GET | `/api/orgs` | List user's organizations | Yes |
| GET | `/api/orgs/:id` | Get organization details | Yes |
| PATCH | `/api/orgs/:id` | Update organization | Admin/Owner |
| DELETE | `/api/orgs/:id` | Delete organization | Owner |

### Members

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/orgs/:id/members` | Invite member | Admin/Owner |
| GET | `/api/orgs/:id/members` | List members | Member+ |
| PATCH | `/api/orgs/:id/members/:email` | Update member role | Owner |
| DELETE | `/api/orgs/:id/members/:email` | Remove member | Admin/Owner |
| POST | `/api/orgs/:id/members/:email/accept` | Accept invitation | Self |

## Examples

### Create Organization

```bash
curl -X POST http://localhost:3000/api/orgs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme HOA",
    "slug": "acme-hoa",
    "type": "hoa",
    "ownerEmail": "admin@acme.com"
  }'
```

### List Organizations

```bash
curl "http://localhost:3000/api/orgs?email=admin@acme.com"
```

### Invite Member

```bash
curl -X POST http://localhost:3000/api/orgs/{org-id}/members \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "role": "member"
  }'
```

### Accept Invitation

```bash
curl -X POST http://localhost:3000/api/orgs/{org-id}/members/user@example.com/accept
```

## Organization Types

- `hoa` - Homeowners Association
- `company` - Private Company
- `nonprofit` - Nonprofit Organization
- `government` - Government Entity
- `other` - Other

## Member Roles

- `owner` - Full control (delete org, all permissions)
- `admin` - Manage elections and members
- `member` - View-only access

## Settings Schema

The `settings` field is a flexible JSON object. Common patterns:

```json
{
  "branding": {
    "primaryColor": "#007bff",
    "logo": "https://cdn.example.com/logo.png"
  },
  "notifications": {
    "emailEnabled": true,
    "smsEnabled": false
  },
  "features": {
    "advancedReporting": true
  }
}
```
