"use client"

/**
 * Merkle Proof Tree Visualization
 *
 * Shows the cryptographic path from leaf to root
 */

import { Check, X } from "lucide-react"
import { cn, truncateHash } from "@/lib/utils"

interface ProofTreeProps {
  proof: {
    leaf: string
    root: string
    siblings: Array<{
      hash: string
      position: "left" | "right"
    }>
  }
  steps?: Array<{
    step: number
    operation: string
    leftHash: string
    rightHash: string
    result: string
  }>
  valid?: boolean
}

export function ProofTree({ proof, steps, valid }: ProofTreeProps) {
  const showSteps = steps && steps.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Merkle Proof Path</h3>
        {valid !== undefined && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
              valid
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            {valid ? (
              <>
                <Check className="h-4 w-4" />
                Valid Proof
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                Invalid Proof
              </>
            )}
          </div>
        )}
      </div>

      {/* Tree Visualization */}
      <div className="space-y-4">
        {/* Root */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md">
            <div className="text-xs text-muted-foreground mb-1">
              Merkle Root
            </div>
            <div
              className={cn(
                "rounded-lg border p-3 font-mono text-sm",
                valid
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-300 bg-gray-50 dark:bg-gray-800"
              )}
            >
              <div className="break-all">{truncateHash(proof.root, 12)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {proof.root}
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        {showSteps ? (
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.step} className="flex flex-col items-center">
                {/* Arrow */}
                <div className="h-8 w-0.5 bg-gray-300 dark:bg-gray-600" />

                {/* Step */}
                <div className="w-full max-w-md">
                  <div className="text-xs text-muted-foreground mb-2">
                    Step {step.step}: {step.operation}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded border p-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        Left
                      </div>
                      <div className="font-mono text-xs break-all">
                        {truncateHash(step.leftHash, 8)}
                      </div>
                    </div>
                    <div className="rounded border p-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        Right
                      </div>
                      <div className="font-mono text-xs break-all">
                        {truncateHash(step.rightHash, 8)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-center text-xs text-muted-foreground">
                    ↓ SHA-256
                  </div>
                  <div className="mt-1 rounded border bg-blue-50 dark:bg-blue-900/20 p-2">
                    <div className="font-mono text-xs break-all">
                      {truncateHash(step.result, 8)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Arrow to leaf */}
            <div className="flex flex-col items-center">
              <div className="h-8 w-0.5 bg-gray-300 dark:bg-gray-600" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Show siblings without detailed steps */}
            {proof.siblings.map((sibling, index) => (
              <div key={index} className="flex flex-col items-center w-full">
                <div className="h-8 w-0.5 bg-gray-300 dark:bg-gray-600" />
                <div className="w-full max-w-md">
                  <div className="rounded border p-2">
                    <div className="text-xs text-muted-foreground mb-1">
                      {sibling.position === "left" ? "Left" : "Right"} Sibling
                    </div>
                    <div className="font-mono text-xs break-all">
                      {truncateHash(sibling.hash, 8)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="h-8 w-0.5 bg-gray-300 dark:bg-gray-600" />
          </div>
        )}

        {/* Leaf */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md">
            <div className="text-xs text-muted-foreground mb-1">
              Your Vote (Leaf)
            </div>
            <div className="rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-3 font-mono text-sm">
              <div className="break-all">{truncateHash(proof.leaf, 12)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {proof.leaf}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm">
        <p className="font-medium mb-2">How Merkle Proofs Work:</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Your vote is hashed to create the leaf</li>
          <li>The leaf is combined with sibling hashes up the tree</li>
          <li>Each step uses SHA-256 cryptographic hashing</li>
          <li>
            The final hash should match the published Merkle root
          </li>
          <li>
            This proves your vote is in the ledger without revealing it
          </li>
        </ol>
      </div>
    </div>
  )
}
