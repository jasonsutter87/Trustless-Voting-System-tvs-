---
title: "Building Privacy-First Applications with the VeilCloud SDK"
date: 2024-12-18
author: "VeilSuite Team"
tags: ["veilcloud", "sdk", "tutorial", "development"]
---

Ready to build an application where user data stays private? This guide walks through the VeilCloud SDK from installation to production.

## Installation

```bash
npm install @veilcloud/sdk
# or
pnpm add @veilcloud/sdk
```

## Quick Start

```typescript
import { VeilCloudClient, generateKey } from '@veilcloud/sdk';

// Generate or derive an encryption key
const encryptionKey = await generateKey();

// Initialize the client
const client = new VeilCloudClient({
  baseUrl: 'https://api.veilcloud.io',
  credential: 'your-api-credential',
  encryptionKey
});

// Store encrypted data
await client.storage.put('my-project', 'user-data', {
  data: btoa(JSON.stringify({ secret: 'information' }))
});

// Retrieve and decrypt
const result = await client.storage.get('my-project', 'user-data');
const userData = JSON.parse(atob(result.data));
```

## Key Management Patterns

### Pattern 1: Password-Derived Keys

Best for: Personal applications, single-user scenarios.

```typescript
import { deriveKey } from '@veilcloud/sdk';

// Derive key from user password
const encryptionKey = await deriveKey({
  password: userPassword,
  salt: await getSaltForUser(userId),  // Store salt, not password
  memoryCost: 65536,  // 64 MB - resistant to GPU attacks
  timeCost: 3
});

const client = new VeilCloudClient({
  baseUrl: 'https://api.veilcloud.io',
  credential: apiCredential,
  encryptionKey
});
```

**Pros**: Simple, no key storage needed.

**Cons**: Password changes require re-encryption, password loss = data loss.

### Pattern 2: Generated Keys with Backup

Best for: Applications where you control authentication.

```typescript
import { generateKey, exportKey, importKey } from '@veilcloud/sdk';

// On account creation
const encryptionKey = await generateKey();
const exportedKey = await exportKey(encryptionKey);

// Store encrypted backup (with user's password)
const keyBackup = await encryptWithPassword(exportedKey, userPassword);
await storeKeyBackup(userId, keyBackup);

// On login
const keyBackup = await getKeyBackup(userId);
const exportedKey = await decryptWithPassword(keyBackup, userPassword);
const encryptionKey = await importKey(exportedKey);
```

**Pros**: Password change doesn't require re-encryption.

**Cons**: Key backup storage required.

### Pattern 3: VeilKey Threshold (Teams)

Best for: Team collaboration, enterprise applications.

```typescript
import { VeilCloudClient } from '@veilcloud/sdk';
import { VeilKey } from '@veilkey/sdk';

// Initialize VeilKey for the team
const veilkey = new VeilKey({
  threshold: 3,
  totalShares: 5
});

// Each team member holds a share
const teamKey = await veilkey.combineShares([
  currentUserShare,
  ...collectedShares  // Need 3 total
]);

const client = new VeilCloudClient({
  baseUrl: 'https://api.veilcloud.io',
  credential: teamCredential,
  encryptionKey: teamKey
});
```

**Pros**: No single point of failure, team-friendly.

**Cons**: Requires share collection for decryption.

## Common Operations

### Storing Data

```typescript
// Store a simple value
await client.storage.put('project', 'key', {
  data: btoa('my data')
});

// Store with metadata (also encrypted)
await client.storage.put('project', 'key', {
  data: btoa(JSON.stringify(document)),
  metadata: JSON.stringify({
    type: 'document',
    created: new Date().toISOString()
  })
});
```

### Retrieving Data

```typescript
// Get single item
const result = await client.storage.get('project', 'key');
const data = atob(result.data);

// List items in project
const items = await client.storage.list('project');
// Note: list returns encrypted metadata only
```

### Deleting Data

```typescript
// Delete single item
await client.storage.delete('project', 'key');

// Delete entire project
await client.projects.delete('project');
```

## Building a Private Notes App

Let's build a complete example: an encrypted notes application.

```typescript
// notes-app.ts
import { VeilCloudClient, deriveKey } from '@veilcloud/sdk';

class PrivateNotesApp {
  private client: VeilCloudClient | null = null;
  private userId: string;

  async login(email: string, password: string) {
    // Authenticate with your auth system
    const { userId, salt, apiCredential } = await yourAuthSystem.login(email, password);
    this.userId = userId;

    // Derive encryption key from password
    const encryptionKey = await deriveKey({
      password,
      salt: new Uint8Array(Buffer.from(salt, 'hex')),
      memoryCost: 65536,
      timeCost: 3
    });

    // Initialize VeilCloud client
    this.client = new VeilCloudClient({
      baseUrl: 'https://api.veilcloud.io',
      credential: apiCredential,
      encryptionKey
    });
  }

  async createNote(title: string, content: string): Promise<string> {
    const noteId = crypto.randomUUID();
    const note = {
      id: noteId,
      title,
      content,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    await this.client!.storage.put(
      `notes-${this.userId}`,
      noteId,
      {
        data: btoa(JSON.stringify(note)),
        metadata: JSON.stringify({
          type: 'note',
          updated: note.updated
        })
      }
    );

    return noteId;
  }

  async getNote(noteId: string): Promise<Note> {
    const result = await this.client!.storage.get(
      `notes-${this.userId}`,
      noteId
    );
    return JSON.parse(atob(result.data));
  }

  async listNotes(): Promise<NoteSummary[]> {
    const items = await this.client!.storage.list(`notes-${this.userId}`);

    // Fetch each note to get title (metadata is also encrypted)
    return Promise.all(items.map(async item => {
      const note = await this.getNote(item.id);
      return {
        id: note.id,
        title: note.title,
        updated: note.updated
      };
    }));
  }

  async updateNote(noteId: string, title: string, content: string) {
    const note = await this.getNote(noteId);
    note.title = title;
    note.content = content;
    note.updated = new Date().toISOString();

    await this.client!.storage.put(
      `notes-${this.userId}`,
      noteId,
      {
        data: btoa(JSON.stringify(note)),
        metadata: JSON.stringify({
          type: 'note',
          updated: note.updated
        })
      }
    );
  }

  async deleteNote(noteId: string) {
    await this.client!.storage.delete(`notes-${this.userId}`, noteId);
  }
}
```

## Error Handling

```typescript
import { VeilCloudError, DecryptionError, AuthenticationError } from '@veilcloud/sdk';

try {
  await client.storage.get('project', 'key');
} catch (error) {
  if (error instanceof DecryptionError) {
    // Wrong key - data was encrypted with different key
    console.error('Cannot decrypt: wrong key');
  } else if (error instanceof AuthenticationError) {
    // Invalid or expired credential
    console.error('Authentication failed');
  } else if (error instanceof VeilCloudError) {
    // Other VeilCloud errors
    console.error('VeilCloud error:', error.code, error.message);
  }
}
```

## Best Practices

### 1. Never Log Sensitive Data

```typescript
// Bad
console.log('Storing user data:', userData);

// Good
console.log('Storing user data for user:', userId);
```

### 2. Clear Keys from Memory

```typescript
// When user logs out
client.destroy();  // Clears encryption key from memory
```

### 3. Use Strong Key Derivation

```typescript
// Bad - weak key derivation
const key = crypto.subtle.digest('SHA-256', password);

// Good - memory-hard key derivation
const key = await deriveKey({
  password,
  salt,
  memoryCost: 65536,  // 64 MB minimum
  timeCost: 3
});
```

### 4. Handle Key Loss Gracefully

```typescript
// Provide key recovery options
async function setupRecovery(userId: string, encryptionKey: CryptoKey) {
  const exportedKey = await exportKey(encryptionKey);

  // Option 1: Recovery phrase
  const recoveryPhrase = await generateRecoveryPhrase(exportedKey);
  displayToUser(recoveryPhrase);  // User writes down

  // Option 2: Trusted contact recovery (VeilKey)
  await setupThresholdRecovery(userId, exportedKey);
}
```

## Next Steps

- [VeilCloud GitHub](https://github.com/jasonsutter87/VeilCloud) - Source code
- [API Reference](/docs/api/) - Full API documentation
- [VeilKey Integration](/products/veilkey/) - Team key management

---

*"Privacy by default. Trust not required."*
