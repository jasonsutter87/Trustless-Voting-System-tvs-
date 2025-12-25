/**
 * Client-side Merkle Proof Verification
 *
 * Allows voters to independently verify their vote is included in the Merkle tree
 * without trusting the API.
 */

/**
 * Merkle proof structure
 */
export interface MerkleProof {
  leaf: string
  root: string
  siblings: Array<{
    hash: string
    position: "left" | "right"
  }>
}

/**
 * Verification result
 */
export interface VerificationResult {
  valid: boolean
  computedRoot: string
  expectedRoot: string
  steps: Array<{
    step: number
    operation: string
    leftHash: string
    rightHash: string
    result: string
  }>
  explanation: string
}

/**
 * Hash two values together using SHA-256
 */
async function hashPair(left: string, right: string): Promise<string> {
  const data = left + right
  const msgBuffer = new TextEncoder().encode(data)
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}

/**
 * Verify a Merkle proof locally without trusting the API
 *
 * This recomputes the Merkle root from the leaf and siblings,
 * then compares it to the expected root.
 *
 * @param proof - The Merkle proof to verify
 * @returns Verification result with step-by-step explanation
 */
export async function verifyMerkleProof(
  proof: MerkleProof
): Promise<VerificationResult> {
  const steps: VerificationResult["steps"] = []
  let currentHash = proof.leaf

  try {
    // Traverse up the tree, hashing with siblings
    for (let i = 0; i < proof.siblings.length; i++) {
      const sibling = proof.siblings[i]
      const left = sibling.position === "left" ? sibling.hash : currentHash
      const right = sibling.position === "left" ? currentHash : sibling.hash

      const newHash = await hashPair(left, right)

      steps.push({
        step: i + 1,
        operation: `Hash ${sibling.position} sibling with current`,
        leftHash: left,
        rightHash: right,
        result: newHash,
      })

      currentHash = newHash
    }

    const valid = currentHash === proof.root

    return {
      valid,
      computedRoot: currentHash,
      expectedRoot: proof.root,
      steps,
      explanation: valid
        ? "Proof is valid! Your vote is cryptographically proven to be included in the Merkle tree. The computed root matches the expected root."
        : "Proof is invalid. The computed root does not match the expected root. This vote may not be in the ledger, or the proof is incorrect.",
    }
  } catch (error) {
    return {
      valid: false,
      computedRoot: currentHash,
      expectedRoot: proof.root,
      steps,
      explanation: `Error during verification: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

/**
 * Format hash for display (truncated with copy button)
 */
export function formatHashForDisplay(hash: string, maxLength = 16): string {
  if (hash.length <= maxLength) return hash
  const halfLength = Math.floor(maxLength / 2) - 2
  return `${hash.slice(0, halfLength)}...${hash.slice(-halfLength)}`
}
