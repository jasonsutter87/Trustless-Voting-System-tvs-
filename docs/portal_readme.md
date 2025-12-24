# TVS Portal Development Plan

Two separate Next.js applications for the Trustless Voting System frontend.

---

## Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                         TVS Architecture                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   admin.veilsuite.com              vote.veilsuite.com                  │
│   ──────────────────               ─────────────────                   │
│   Admin Portal (Next.js)           Voter Portal (Next.js)              │
│                                                                         │
│   • Organization management        • Credential entry                   │
│   • Election creation              • Ballot display                     │
│   • Ballot builder (VeilForms)     • Vote submission                    │
│   • Trustee coordination           • Confirmation receipt               │
│   • Start/stop elections           • Vote verification                  │
│   • Tally & results                • Public results view                │
│                                                                         │
│                    ↓                         ↓                          │
│              ┌─────────────────────────────────────┐                    │
│              │       api.veilsuite.com             │                    │
│              │       TVS API (Fastify)             │                    │
│              └─────────────────────────────────────┘                    │
│                              ↓                                          │
│              ┌─────────────────────────────────────┐                    │
│              │   PostgreSQL  │  OpenTimestamps     │                    │
│              └─────────────────────────────────────┘                    │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Portal 1: Admin Portal (`admin.veilsuite.com`)

**Purpose**: Election administrators create and manage elections.

**Users**: HOA board members, organization admins, election officials.

### Features

| Feature | Description | API Endpoints |
|---------|-------------|---------------|
| Auth | Magic link or OAuth login | New: `/api/auth/*` |
| Organizations | Create/manage orgs (HOA, company, etc.) | New: `/api/orgs/*` |
| Elections | Create, configure, manage lifecycle | `POST/GET /api/elections` |
| Ballot Builder | Drag-drop question builder (VeilForms) | VeilForms SDK |
| Voter Registry | Upload voter list, issue credentials | `POST /api/credentials` |
| Trustee Setup | Invite trustees, run key ceremony | `/api/elections/:id/ceremony/*` |
| Election Control | Start voting, stop voting, trigger tally | `PATCH /api/elections/:id/status` |
| Results Dashboard | Live vote counts, final results | `/api/elections/:id/results` |
| Audit & Anchors | View Bitcoin proofs, download .ots files | `/api/anchors/*` |

### Pages

```
/                       → Dashboard (list of elections)
/login                  → Magic link auth
/org/new                → Create organization
/org/[orgId]            → Organization settings
/elections/new          → Create election wizard
/elections/[id]         → Election dashboard
/elections/[id]/ballot  → Ballot builder (VeilForms)
/elections/[id]/voters  → Voter registry
/elections/[id]/trustees → Trustee management & ceremony
/elections/[id]/results → Results & analytics
/elections/[id]/audit   → Bitcoin anchors & proofs
```

---

## Portal 2: Voter Portal (`vote.veilsuite.com`)

**Purpose**: Voters cast ballots and verify their votes.

**Users**: Anyone with a valid voting credential.

### Features

| Feature | Description | API Endpoints |
|---------|-------------|---------------|
| Credential Entry | Enter nullifier/code to access ballot | Validates locally |
| Ballot View | Display personalized ballot (jurisdiction-aware) | `GET /api/ballot/:electionId` |
| Vote Casting | Select candidates, encrypt, submit | `POST /api/vote` |
| Confirmation | Show confirmation code, Merkle proof | Response from vote |
| Verification | Verify vote is in ledger | `GET /api/verify/:electionId/:nullifier` |
| Public Results | View results after election closes | `GET /api/elections/:id/results` |
| Proof Viewer | Verify Bitcoin anchors independently | `/api/anchors/:id/:type/data` |

### Pages

```
/                       → Enter election code or credential
/vote/[electionId]      → Ballot (after credential validation)
/confirm/[code]         → Confirmation receipt
/verify                 → Vote verification tool
/results/[electionId]   → Public results page
/audit/[electionId]     → Public audit & Bitcoin proofs
```

### Design Requirements

- **Mobile-first**: Most voters will use phones
- **Accessible**: WCAG 2.1 AA compliance
- **Simple**: Minimal steps to vote
- **Trustworthy**: Clear security indicators

---

## Shared Infrastructure

### Packages (monorepo)

```
packages/
├── portal-admin/       # Admin Next.js app
├── portal-voter/       # Voter Next.js app
├── ui/                 # Shared component library
│   ├── Button, Input, Card, Modal
│   ├── BallotQuestion, CandidateCard
│   ├── ConfirmationReceipt
│   └── BitcoinProofBadge
├── hooks/              # Shared React hooks
│   ├── useElection
│   ├── useVote
│   └── useVerification
└── api-client/         # Typed API client
    └── Generated from OpenAPI spec
```

### Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 14 (App Router) | SSR, API routes, great DX |
| Styling | Tailwind CSS | Rapid development, consistent |
| Components | shadcn/ui | Accessible, customizable |
| State | Zustand or Jotai | Simple, performant |
| Forms | React Hook Form + Zod | Validation, type safety |
| API Client | tRPC or openapi-fetch | Type-safe API calls |
| Auth (Admin) | NextAuth.js | Magic link, OAuth |
| Deployment | Vercel | Easy, scalable |

---

## Development Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Basic infrastructure and admin auth.

- [ ] Initialize monorepo structure with Next.js apps
- [ ] Set up shared UI component library
- [ ] Implement admin authentication (magic link)
- [ ] Create organization model (API + DB)
- [ ] Basic admin dashboard layout
- [ ] API client generation from OpenAPI

**Deliverable**: Admin can log in and see empty dashboard.

---

### Phase 2: Election Creation (Week 3-4)

**Goal**: Admins can create and configure elections.

- [ ] Election creation wizard
- [ ] Basic ballot builder (questions + candidates)
- [ ] VeilForms integration for advanced ballot design
- [ ] Election settings (dates, thresholds)
- [ ] Trustee invitation flow
- [ ] Election preview mode

**Deliverable**: Admin can create a complete election with ballot.

---

### Phase 3: Key Ceremony UI (Week 5)

**Goal**: Guided trustee key ceremony.

- [ ] Trustee registration page
- [ ] Key generation UI (client-side)
- [ ] Contribution submission flow
- [ ] Ceremony status dashboard
- [ ] Ceremony completion & public key display
- [ ] Error handling for failed ceremonies

**Deliverable**: Trustees can complete key ceremony through UI.

---

### Phase 4: Voter Registry (Week 6)

**Goal**: Manage voters and issue credentials.

- [ ] CSV upload for voter list
- [ ] Manual voter addition
- [ ] Credential generation (batch)
- [ ] Credential distribution (email, download)
- [ ] Voter status tracking
- [ ] Jurisdiction assignment (for multi-jurisdiction)

**Deliverable**: Admin can import voters and distribute credentials.

---

### Phase 5: Voter Portal MVP (Week 7-8)

**Goal**: Voters can cast ballots.

- [ ] Credential entry page
- [ ] Ballot display component
- [ ] Vote selection UI
- [ ] Client-side vote encryption
- [ ] Vote submission flow
- [ ] Confirmation receipt page
- [ ] Mobile optimization

**Deliverable**: End-to-end voting works on mobile.

---

### Phase 6: Verification & Results (Week 9)

**Goal**: Transparency and auditability.

- [ ] Vote verification tool (nullifier lookup)
- [ ] Merkle proof visualization
- [ ] Public results page
- [ ] Results charts/graphs
- [ ] Bitcoin anchor status display
- [ ] .ots proof download
- [ ] Independent verification instructions

**Deliverable**: Anyone can verify election integrity.

---

### Phase 7: Election Lifecycle (Week 10)

**Goal**: Full admin control over election states.

- [ ] Start voting button (with anchor confirmation)
- [ ] Stop voting / close election
- [ ] Tally initiation UI
- [ ] Decryption ceremony UI (partial decryptions)
- [ ] Results certification
- [ ] Election archival

**Deliverable**: Admin can run complete election lifecycle.

---

### Phase 8: Polish & Production (Week 11-12)

**Goal**: Production-ready deployment.

- [ ] Error handling & edge cases
- [ ] Loading states & optimistic updates
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Security audit (OWASP)
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment pipeline (Vercel)
- [ ] Monitoring & alerting

**Deliverable**: Production deployment ready.

---

## Future Phases

### Phase 9: Multi-Jurisdiction
- Hierarchical ballot builder (federal > state > county)
- Voter jurisdiction detection
- Jurisdiction-specific trustees

### Phase 10: Advanced Features
- Real-time vote count updates (WebSocket)
- Email/SMS notifications
- Audit log viewer
- Election templates
- White-labeling / custom branding

### Phase 11: Enterprise
- SSO integration (SAML, OIDC)
- Role-based access control
- API rate limiting
- SLA monitoring
- Compliance reports

---

## Quick Start Commands

```bash
# Initialize (from repo root)
pnpm create next-app packages/portal-admin --typescript --tailwind --app
pnpm create next-app packages/portal-voter --typescript --tailwind --app

# Shared UI
pnpm add -D @shadcn/ui --filter portal-admin --filter portal-voter

# Dev
pnpm dev --filter portal-admin  # Admin on :3001
pnpm dev --filter portal-voter  # Voter on :3002
pnpm dev --filter tvs-api       # API on :3000
```

---

## Domain Structure (Production)

| Domain | App | Purpose |
|--------|-----|---------|
| `api.veilsuite.com` | TVS API | Backend |
| `admin.veilsuite.com` | Admin Portal | Election management |
| `vote.veilsuite.com` | Voter Portal | Ballot casting |
| `veilsuite.com` | Marketing site | Landing page |

---

*Last updated: December 2025*
