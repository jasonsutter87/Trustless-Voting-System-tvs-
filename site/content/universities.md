---
title: "TVS for Universities"
description: "Bring verifiable voting to your student government elections."
---

## Why Universities?

University student governments are the perfect testing ground for trustless voting:

- **Tech-savvy voters** who understand and appreciate cryptographic verification
- **Low stakes** for initial pilots, but real elections that matter
- **Annual cycles** providing regular opportunities to iterate
- **Academic interest** in election security and cryptography

## What You Get

### For Students
- **Verify your vote**: Cryptographic proof your ballot was counted
- **Complete privacy**: No one can see how you voted
- **Vote from anywhere**: Web-based, works on any device
- **No trust required**: Math, not institutions

### For Administrators
- **Open source**: Full audit capability, no black boxes
- **Self-hostable**: Run on your own infrastructure
- **Compliance-ready**: Detailed audit logs and Merkle proofs
- **Cost-effective**: No licensing fees, commodity hardware

## How It Works

1. **Setup** (1 week before)
   - Deploy TVS to your servers (Docker)
   - Create election with candidates
   - Import voter roll (student IDs)

2. **Registration** (Days before)
   - Students register with student ID
   - Receive anonymous voting credential
   - Credential stored locally

3. **Voting** (Election day)
   - Students vote from any device
   - Votes encrypted and recorded
   - Confirmation code provided

4. **Verification** (After voting)
   - Students verify their vote exists
   - Results tallied publicly
   - Full audit trail available

## Pilot Program

We're accepting applications for the Spring 2025 pilot program.

**What's included**:
- Free TVS deployment assistance
- Technical support during election
- Post-election analysis and feedback
- Recognition as early adopter

**Requirements**:
- Upcoming student government election
- IT staff to manage deployment
- Willingness to provide feedback

<div style="background: var(--bg-secondary); padding: 2rem; border-radius: 16px; margin-top: 2rem;">
  <h3 style="margin-bottom: 1rem;">Apply for the Pilot Program</h3>
  <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
    Interested in bringing verifiable voting to your university? Let's talk.
  </p>
  <a href="mailto:pilot@tvs.vote" class="btn btn-primary">Contact Us</a>
</div>

---

## FAQ

### Is it secure?
TVS uses battle-tested cryptographic primitives. All code is open source and auditable. We encourage security researchers to review and test.

### What about accessibility?
The voting interface is designed to work with screen readers and keyboard navigation. We're continuously improving accessibility.

### Can it scale?
TVS is designed for elections with thousands of voters. The Merkle tree structure means performance doesn't degrade with more votes.

### What if something goes wrong?
Elections can be cancelled or reset by administrators. All actions are logged for accountability.

### Is it free?
TVS is open source under AGPL-3.0. You can self-host for free. We offer paid support for institutions that need it.
