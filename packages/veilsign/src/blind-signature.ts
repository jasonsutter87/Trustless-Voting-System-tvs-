/**
 * VeilSign - Anonymous Credential Service
 *
 * Wraps the blind-signatures library to provide anonymous voter credentials.
 * Authority signs credentials without seeing the content.
 */

import BlindSignature from 'blind-signatures';
import { sha256, randomBytesHex } from '@tvs/core';

export interface AuthorityKeys {
  publicKey: {
    n: string;  // Modulus
    e: string;  // Exponent
  };
  privateKey: {
    n: string;
    e: string;
    d: string;  // Private exponent
    p: string;
    q: string;
  };
}

export interface Credential {
  electionId: string;
  nullifier: string;         // Unique per credential, used to prevent double-voting
  message: string;           // The credential message that gets signed
}

export interface BlindedCredential {
  blinded: string;           // Blinded message to send to authority
  blindingFactor: string;    // Keep secret - needed to unblind
}

export interface SignedCredential extends Credential {
  signature: string;
}

/**
 * Generate authority keypair for signing credentials
 */
export function generateAuthorityKeys(bits: number = 2048): AuthorityKeys {
  const key = BlindSignature.keyGeneration({ b: bits });
  return {
    publicKey: {
      n: key.keyPair.n.toString(),
      e: key.keyPair.e.toString(),
    },
    privateKey: {
      n: key.keyPair.n.toString(),
      e: key.keyPair.e.toString(),
      d: key.keyPair.d.toString(),
      p: key.keyPair.p.toString(),
      q: key.keyPair.q.toString(),
    },
  };
}

/**
 * Create a new credential for a voter
 */
export function createCredential(electionId: string): Credential {
  const nullifier = randomBytesHex(32);
  const message = sha256(`${electionId}:${nullifier}`);

  return {
    electionId,
    nullifier,
    message,
  };
}

/**
 * Voter: Blind the credential before sending to authority
 */
export function blindCredential(
  credential: Credential,
  authorityPublicKey: AuthorityKeys['publicKey']
): BlindedCredential {
  const { blinded, r } = BlindSignature.blind({
    message: credential.message,
    N: authorityPublicKey.n,
    E: authorityPublicKey.e,
  });

  return {
    blinded: blinded.toString(),
    blindingFactor: r.toString(),
  };
}

/**
 * Authority: Sign a blinded credential (cannot see the actual content)
 */
export function signBlindedCredential(
  blindedMessage: string,
  authorityPrivateKey: AuthorityKeys['privateKey']
): string {
  const signed = BlindSignature.sign({
    blinded: blindedMessage,
    key: {
      n: authorityPrivateKey.n,
      e: authorityPrivateKey.e,
      d: authorityPrivateKey.d,
      p: authorityPrivateKey.p,
      q: authorityPrivateKey.q,
    },
  });

  return signed.toString();
}

/**
 * Voter: Unblind the signature to get a valid credential
 */
export function unblindSignature(
  blindedSignature: string,
  blindingFactor: string,
  authorityPublicKey: AuthorityKeys['publicKey']
): string {
  const unblinded = BlindSignature.unblind({
    signed: blindedSignature,
    r: blindingFactor,
    N: authorityPublicKey.n,
  });

  return unblinded.toString();
}

/**
 * Anyone: Verify a signed credential
 */
export function verifyCredential(
  credential: SignedCredential,
  authorityPublicKey: AuthorityKeys['publicKey']
): boolean {
  const result = BlindSignature.verify({
    unblinded: credential.signature,
    message: credential.message,
    N: authorityPublicKey.n,
    E: authorityPublicKey.e,
  });

  return result;
}

/**
 * Complete flow: Issue a credential (for testing/demo)
 */
export function issueCredential(
  electionId: string,
  authorityKeys: AuthorityKeys
): SignedCredential {
  // 1. Create credential
  const credential = createCredential(electionId);

  // 2. Blind it
  const { blinded, blindingFactor } = blindCredential(
    credential,
    authorityKeys.publicKey
  );

  // 3. Authority signs (never sees original)
  const blindedSignature = signBlindedCredential(
    blinded,
    authorityKeys.privateKey
  );

  // 4. Voter unblinds
  const signature = unblindSignature(
    blindedSignature,
    blindingFactor,
    authorityKeys.publicKey
  );

  return {
    ...credential,
    signature,
  };
}
