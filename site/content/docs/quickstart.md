---
title: "Quick Start"
description: "Get TVS running in 5 minutes."
---

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker (optional, for PostgreSQL)

## Installation

```bash
# Clone the repository
git clone https://github.com/jasonsutter87/Trustless-Voting-System-tvs-.git
cd TVS

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

This starts:
- **API**: http://localhost:3000
- **Admin**: http://localhost:8080/admin/
- **Voter**: http://localhost:8080/voter/

## Create Your First Election

### 1. Open Admin Dashboard

Navigate to http://localhost:8080/admin/

### 2. Create Election

Fill in:
- **Name**: "Test Election"
- **Start/End Time**: Pick times
- **Candidates**: Add at least 2

Click "Create Election"

### 3. Open Registration

In the election list, click your election, then "Advance to registration"

### 4. Register a Voter

Open http://localhost:8080/voter/ in another tab:

1. Select your election
2. Enter a student ID (any string)
3. Click "Get Voting Credential"
4. Save your credential!

### 5. Open Voting

Back in Admin, advance the election to "voting"

### 6. Cast a Vote

In the Voter portal:

1. Select a candidate
2. Click "Submit Vote"
3. Save your confirmation code

### 7. Verify Your Vote

Switch to the "Verify" tab:

1. Enter your credential nullifier
2. Click "Verify Vote"
3. See your vote is recorded!

## Next Steps

- [Deploy with Docker](/docs/deployment/)
- [API Reference](/docs/api/elections/)
- [Security Guide](/docs/guides/security/)
