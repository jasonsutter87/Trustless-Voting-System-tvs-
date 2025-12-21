---
title: "Elections API"
description: "API reference for election management."
---

## Create Election

```http
POST /api/elections
Content-Type: application/json

{
  "name": "Student Government 2025",
  "description": "Annual student government election",
  "startTime": "2025-03-01T09:00:00Z",
  "endTime": "2025-03-03T17:00:00Z",
  "candidates": [
    { "name": "Alice Johnson" },
    { "name": "Bob Smith" }
  ]
}
```

### Response

```json
{
  "election": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Student Government 2025",
    "description": "Annual student government election",
    "startTime": "2025-03-01T09:00:00Z",
    "endTime": "2025-03-03T17:00:00Z",
    "status": "draft",
    "candidates": [
      { "id": "...", "name": "Alice Johnson", "position": 0 },
      { "id": "...", "name": "Bob Smith", "position": 1 }
    ],
    "createdAt": "2024-12-21T..."
  },
  "publicKey": {
    "n": "...",
    "e": "65537"
  }
}
```

---

## Get Election

```http
GET /api/elections/:id
```

### Response

```json
{
  "election": { ... },
  "publicKey": { ... }
}
```

---

## List Elections

```http
GET /api/elections
```

### Response

```json
{
  "elections": [
    { "id": "...", "name": "...", "status": "voting" },
    { "id": "...", "name": "...", "status": "complete" }
  ]
}
```

---

## Update Status

Advance the election through its lifecycle.

```http
PATCH /api/elections/:id/status
Content-Type: application/json

{
  "status": "registration"
}
```

### Valid Transitions

| From | To |
|------|-----|
| draft | registration |
| registration | voting |
| voting | tallying |
| tallying | complete |

### Response

```json
{
  "election": {
    "id": "...",
    "status": "registration"
  }
}
```

---

## Get Results

Only available after status is `complete`.

```http
GET /api/elections/:id/results
```

### Response

```json
{
  "election": { ... },
  "results": [
    { "candidate": { "id": "...", "name": "Alice Johnson" }, "votes": 142 },
    { "candidate": { "id": "...", "name": "Bob Smith" }, "votes": 98 }
  ]
}
```
