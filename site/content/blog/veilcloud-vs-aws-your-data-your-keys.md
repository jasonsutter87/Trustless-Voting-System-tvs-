---
title: "Your Data, Your Keys: How VeilCloud Differs from AWS"
date: 2024-12-22
author: "VeilSuite Team"
tags: ["veilcloud", "aws", "comparison", "privacy"]
---

AWS is the industry standard. Fortune 500 companies trust it with their most sensitive data. So why would you use VeilCloud instead?

One reason: **key ownership**.

## The AWS Key Problem

AWS offers several encryption options:

### SSE-S3 (Server-Side Encryption with S3-Managed Keys)
- AWS generates the key
- AWS manages the key
- AWS can decrypt anytime
- **You have zero control**

### SSE-KMS (Server-Side Encryption with KMS)
- AWS generates the key in KMS
- You manage access policies
- AWS still holds the actual key material
- **AWS can still decrypt**

### SSE-C (Server-Side Encryption with Customer Keys)
- You provide the key with each request
- AWS encrypts/decrypts server-side
- Key is transmitted over the network
- **AWS sees your key on every request**

### Client-Side Encryption
- You encrypt before upload
- You manage your own keys
- AWS never sees plaintext
- **Finally, real privacy — but you're on your own**

AWS supports client-side encryption, but:
- You need to implement it yourself
- No SDK support for key management
- No integration with team collaboration
- No audit trails

## The VeilCloud Approach

VeilCloud is client-side encryption **by default and by design**.

```typescript
// VeilCloud SDK - encryption is automatic
const client = new VeilCloudClient(config);
await client.storage.put('project', 'secret.pdf', data);
// ↑ Data is encrypted before this line completes
```

```typescript
// AWS SDK - you're on your own
const s3 = new S3Client(config);
const encrypted = await yourEncryptionCode(data);  // Hope you got this right
await s3.send(new PutObjectCommand({ Body: encrypted }));
```

## Feature Comparison

| Feature | AWS S3 | VeilCloud |
|---------|--------|-----------|
| Default encryption | Server-side | Client-side |
| Who holds keys | AWS (usually) | You (always) |
| Provider can read data | Yes | No |
| Key management built-in | KMS (server-side) | VeilKey (client-side) |
| Team key sharing | IAM policies | Threshold cryptography |
| Audit trail | CloudTrail | VeilChain (tamper-proof) |
| Open source | No | Yes |

## Key Management: KMS vs VeilKey

### AWS KMS
```
Your Key → Stored in AWS HSM → AWS controls access → AWS can decrypt
```

KMS is a key management service, but AWS still holds your keys. They're in an HSM, which is more secure, but AWS employees with the right access can still use them.

### VeilKey
```
Your Key → Split into shares → Distributed to trustees → No single point of compromise
```

VeilKey uses threshold cryptography. Your key is split into N shares, where any T shares can reconstruct it. No single entity (including VeilCloud) ever holds the complete key.

Example: 3-of-5 threshold
- Share 1: Your device
- Share 2: Your backup device
- Share 3: Trusted colleague
- Share 4: Hardware key
- Share 5: Escrow service

You need any 3 to decrypt. VeilCloud holds zero.

## Audit Trails: CloudTrail vs VeilChain

### AWS CloudTrail
- Logs stored in S3
- AWS can modify logs
- Logs can be deleted
- You trust AWS's integrity

### VeilChain
- Merkle tree structure
- Cryptographically tamper-evident
- Anchored to public blockchains
- Mathematically verifiable

If someone modifies a VeilChain audit log, the Merkle root changes. The tampering is detectable by anyone.

## When to Use AWS

AWS is the right choice when:
- You need maximum feature set
- You trust Amazon's security practices
- Compliance requires specific AWS certifications
- You're building on AWS ecosystem

## When to Use VeilCloud

VeilCloud is the right choice when:
- Privacy is non-negotiable
- You can't trust any third party
- You need mathematical guarantees, not policies
- You want to verify, not trust

## The Migration Path

Already on AWS? You can use VeilCloud alongside it:

```typescript
// Encrypt with VeilCloud SDK
const encrypted = await veilcloud.encrypt(sensitiveData);

// Store in S3 (or anywhere)
await s3.send(new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'encrypted-file',
  Body: encrypted
}));
```

Get VeilCloud's encryption with AWS's infrastructure.

## Conclusion

AWS is not a bad choice. It's an excellent choice for many use cases.

But if you need true privacy — where no third party can access your data, ever — AWS architecturally cannot provide that.

VeilCloud can.

---

*"AWS secures your data from others. VeilCloud secures your data from everyone — including us."*
