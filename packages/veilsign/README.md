# @tvs/veilsign

Chaum blind signature implementation for anonymous voter credentials.

## Overview

VeilSign provides cryptographic blind signatures that allow an authority to sign a credential without seeing its contents. This enables anonymous voting where:

1. The authority verifies voter eligibility and signs their credential
2. The authority cannot link the signed credential to the voter's identity
3. The credential can later be verified as legitimately signed

## Installation

```bash
pnpm add @tvs/veilsign
```

## Usage

### Generate Authority Keys

```typescript
import { generateAuthorityKeys } from '@tvs/veilsign';

// Generate RSA keypair (2048-bit default, 1024 for dev)
const keys = generateAuthorityKeys(2048);

// keys.publicKey  - share with voters for verification
// keys.privateKey - keep secret, used for signing
```

### Issue Anonymous Credential

```typescript
import { issueCredential } from '@tvs/veilsign';

// Complete blind signature flow in one call
const credential = issueCredential(electionId, keys);

// Returns:
// {
//   electionId: string,
//   nullifier: string,    // Unique, prevents double-voting
//   message: string,      // Hash of election + nullifier
//   signature: string     // Blind signature
// }
```

### Verify Credential

```typescript
import { verifyCredential } from '@tvs/veilsign';

const isValid = verifyCredential(credential, keys.publicKey);
// true if signature is valid
```

## Step-by-Step API

For custom implementations, use the low-level functions:

```typescript
import {
  createCredential,
  blindMessage,
  signBlinded,
  unblindSignature,
  verifySignature
} from '@tvs/veilsign';

// 1. Voter creates credential locally
const credential = createCredential(electionId);

// 2. Voter blinds the message
const { blinded, r } = blindMessage(credential.message, publicKey);

// 3. Authority signs (cannot see original message)
const signedBlinded = signBlinded(blinded, privateKey);

// 4. Voter unblinds to get final signature
const signature = unblindSignature(signedBlinded, r, publicKey);

// 5. Anyone can verify
const valid = verifySignature(credential.message, signature, publicKey);
```

## Cryptographic Details

### Algorithm

RSA-based Chaum blind signatures:

```
Blinding:    blinded = message × r^e mod n
Signing:     signed = blinded^d mod n
Unblinding:  signature = signed × r^(-1) mod n
Verification: signature^e mod n == message
```

### Implementation

- **Key Generation**: Node.js `crypto.generateKeyPairSync('rsa', ...)`
- **Modular Arithmetic**: Native JavaScript `BigInt`
- **Random Numbers**: Node.js `crypto.randomBytes()`
- **Hashing**: SHA-256 via `@tvs/core`

### Security Properties

| Property | Description |
|----------|-------------|
| **Blindness** | Authority cannot see the message being signed |
| **Unforgeability** | Only the authority can create valid signatures |
| **Unlinkability** | Signed credential cannot be linked to signing session |

## Types

```typescript
interface AuthorityKeys {
  keyId: string;
  publicKey: {
    n: string;  // Modulus (hex)
    e: string;  // Public exponent (hex)
  };
  privateKey: {
    n: string;
    e: string;
    d: string;  // Private exponent (hex)
  };
}

interface Credential {
  electionId: string;
  nullifier: string;
  message: string;
}

interface SignedCredential extends Credential {
  signature: string;
}

interface BlindedData {
  blinded: string;  // Blinded message (hex)
  r: string;        // Blinding factor (hex)
}
```

## Integration with TVS

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Voter     │     │  Authority  │     │  Verifier   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ createCredential  │                   │
       │ blindMessage      │                   │
       │                   │                   │
       │──── blinded ─────>│                   │
       │                   │ signBlinded       │
       │<── signedBlinded ─│                   │
       │                   │                   │
       │ unblindSignature  │                   │
       │                   │                   │
       │───────────── credential ─────────────>│
       │                   │                   │ verifyCredential
       │                   │                   │
```

## Dependencies

- `@tvs/core` - SHA-256 and random bytes utilities

Zero external cryptographic dependencies. Uses only Node.js native `crypto` module.

## License

MIT
