---
title: "Getting Started"
description: "How to run TVS locally"
weight: 1
---

## Prerequisites

- **Node.js** 18+
- **pnpm** (recommended) or npm
- **Docker** (for PostgreSQL)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/jasonsutter87/Trustless-Voting-System-tvs-.git
cd Trustless-Voting-System-tvs-
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start the Database

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432.

### 4. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials if needed.

### 5. Run the API

```bash
pnpm --filter tvs-api dev
```

The API will be available at `http://localhost:3000`.

### 6. Run Tests

```bash
pnpm test
```

## Project Structure

```
TVS/
├── packages/
│   ├── core/           # Shared types and utilities
│   ├── tvs-api/        # Express API server
│   ├── veilsign/       # Blind signature implementation
│   ├── veilforms/      # Client-side encryption
│   ├── veilchain/      # Merkle tree ledger
│   └── veilproof/      # Zero-knowledge proofs
├── scripts/            # Test and utility scripts
├── docs/               # Documentation
└── site-hugo/          # This website
```

## API Endpoints

### Elections

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/elections` | Create a new election |
| GET | `/api/elections/:id` | Get election details |
| POST | `/api/elections/:id/trustees` | Register a trustee |
| POST | `/api/elections/:id/finalize` | Finalize key ceremony |

### Voting

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/elections/:id/register` | Register to vote |
| POST | `/api/elections/:id/vote` | Cast a vote |
| GET | `/api/elections/:id/verify/:code` | Verify a vote |

### Tallying

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/elections/:id/tally` | Start tallying |
| GET | `/api/elections/:id/results` | Get results |

## Next Steps

- [Run the Demo](/demo/) - See TVS in action
- [Read the Whitepaper](/docs/whitepaper/) - Technical details
- [View on GitHub](https://github.com/jasonsutter87/Trustless-Voting-System-tvs-) - Source code
