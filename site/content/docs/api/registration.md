---
title: "Registration API"
description: "API reference for voter registration."
---

## Register Voter (Complete Flow)

The simplest way to register — handles all steps automatically.

```http
POST /api/register/complete
Content-Type: application/json

{
  "electionId": "550e8400-e29b-41d4-a716-446655440000",
  "studentId": "STU123456"
}
```

### Response

```json
{
  "credential": {
    "electionId": "550e8400-...",
    "nullifier": "a1b2c3d4e5f6...",
    "message": "hash...",
    "signature": "sig..."
  },
  "publicKey": {
    "n": "...",
    "e": "65537"
  },
  "message": "Save this credential securely. You will need it to vote."
}
```

**Important**: The `credential` object must be saved by the voter. It's required to cast a vote and cannot be recovered.

---

## Step-by-Step Registration

For clients that want more control, use the two-step flow:

### Step 1: Get Blinding Parameters

```http
POST /api/register
Content-Type: application/json

{
  "electionId": "550e8400-...",
  "studentId": "STU123456"
}
```

### Response

```json
{
  "registrationId": "...",
  "credential": {
    "electionId": "...",
    "nullifier": "...",
    "message": "..."
  },
  "blinded": "blinded_message...",
  "blindingFactor": "factor...",
  "publicKey": { "n": "...", "e": "..." },
  "message": "Send blinded message to /api/register/sign to get signature"
}
```

### Step 2: Sign Blinded Credential

```http
POST /api/register/sign
Content-Type: application/json

{
  "electionId": "550e8400-...",
  "blindedMessage": "blinded_message..."
}
```

### Response

```json
{
  "blindedSignature": "signed...",
  "message": "Use unblindSignature() with your blindingFactor to get final credential"
}
```

---

## Get Registration Stats

```http
GET /api/register/stats/:electionId
```

### Response

```json
{
  "electionId": "550e8400-...",
  "registeredCount": 1234
}
```

---

## Error Responses

### Already Registered

```json
{
  "error": "Already registered for this election"
}
```

### Election Not Open

```json
{
  "error": "Registration not open. Current status: draft"
}
```
