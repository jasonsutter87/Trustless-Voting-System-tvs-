/**
 * Verification API Actions
 *
 * Server actions for interacting with the verification API
 */

"use server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

/**
 * Vote verification result
 */
export interface VoteVerificationResult {
  exists: boolean
  position?: number
  commitment?: string
  timestamp?: number
  merkleProof?: {
    leaf: string
    root: string
    siblings: Array<{
      hash: string
      position: "left" | "right"
    }>
  }
  message: string
}

/**
 * Election integrity summary
 */
export interface ElectionIntegrity {
  election: {
    id: string
    name: string
    status: string
    startTime: string | null
    endTime: string | null
    candidateCount: number
  }
  integrity: {
    voteCount: number
    merkleRoot: string | null
    lastUpdate: number | null
  }
  bitcoinAnchors: {
    start?: {
      status: string
      txid?: string
      explorerUrl?: string
    }
    close?: {
      status: string
      txid?: string
      explorerUrl?: string
    }
  } | null
  verification: {
    message: string
    instructions: string[]
  }
}

/**
 * Ledger export data
 */
export interface LedgerExport {
  electionId: string
  electionName: string
  merkleRoot: string
  voteCount: number
  votes: Array<{
    position: number
    commitment: string
    nullifier: string
    timestamp: number
  }>
}

/**
 * Election results
 */
export interface ElectionResults {
  electionId: string
  electionName: string
  status: string
  totalVotes: number
  results: Array<{
    candidateId: string
    candidateName: string
    votes: number
    percentage: number
  }>
  winner?: {
    candidateId: string
    candidateName: string
    votes: number
  }
}

/**
 * Verify a vote by nullifier
 *
 * @param electionId - The election ID
 * @param nullifier - The vote nullifier (from confirmation code)
 * @returns Verification result
 */
export async function verifyVote(
  electionId: string,
  nullifier: string
): Promise<VoteVerificationResult> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/verify/${electionId}/${nullifier}`,
      {
        cache: "no-store",
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to verify vote")
    }

    return await response.json()
  } catch (error) {
    console.error("Error verifying vote:", error)
    throw error
  }
}

/**
 * Get election integrity summary
 *
 * @param electionId - The election ID
 * @returns Election integrity data
 */
export async function getIntegrity(
  electionId: string
): Promise<ElectionIntegrity> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/verify/integrity/${electionId}`,
      {
        cache: "no-store",
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get integrity data")
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting integrity:", error)
    throw error
  }
}

/**
 * Get public ledger export for auditing
 *
 * @param electionId - The election ID
 * @returns Ledger export data
 */
export async function getLedgerExport(
  electionId: string
): Promise<LedgerExport> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/verify/export/${electionId}`,
      {
        cache: "no-store",
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to export ledger")
    }

    return await response.json()
  } catch (error) {
    console.error("Error exporting ledger:", error)
    throw error
  }
}

/**
 * Get election results (only available after election is complete)
 *
 * @param electionId - The election ID
 * @returns Election results
 */
export async function getResults(
  electionId: string
): Promise<ElectionResults> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elections/${electionId}/results`,
      {
        cache: "no-store",
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get results")
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting results:", error)
    throw error
  }
}

/**
 * Get list of elections for the selector
 */
export async function getElections(): Promise<
  Array<{ id: string; name: string; status: string }>
> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elections`, {
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch elections")
    }

    const elections = await response.json()
    return elections.map((e: any) => ({
      id: e.id,
      name: e.name,
      status: e.status,
    }))
  } catch (error) {
    console.error("Error getting elections:", error)
    return []
  }
}
