"use client"

/**
 * Election Integrity Summary Card
 *
 * Displays key integrity metrics for an election
 */

import { Shield, Lock, Clock, CheckCircle, ExternalLink } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatTimestamp, truncateHash } from "@/lib/utils"

interface IntegrityCardProps {
  integrity: {
    voteCount: number
    merkleRoot: string | null
    lastUpdate: number | null
  }
  bitcoinAnchors?: {
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
}

export function IntegrityCard({
  integrity,
  bitcoinAnchors,
}: IntegrityCardProps) {
  const hasCloseAnchor = bitcoinAnchors?.close
  const isAnchored = hasCloseAnchor?.status === "confirmed"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <CardTitle>Election Integrity</CardTitle>
        </div>
        <CardDescription>
          Cryptographic verification of election data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vote Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Votes</span>
          </div>
          <span className="text-lg font-semibold">{integrity.voteCount}</span>
        </div>

        {/* Merkle Root */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Merkle Root</span>
          </div>
          {integrity.merkleRoot ? (
            <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 font-mono text-xs break-all">
              {integrity.merkleRoot}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No votes recorded yet
            </div>
          )}
        </div>

        {/* Last Update */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Last Update</span>
          </div>
          <span className="text-sm">{formatTimestamp(integrity.lastUpdate)}</span>
        </div>

        {/* Bitcoin Anchoring */}
        {bitcoinAnchors && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-sm">Bitcoin Anchoring</h4>

            {hasCloseAnchor && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Election Close Anchor
                  </span>
                  <Badge
                    variant={isAnchored ? "default" : "secondary"}
                  >
                    {hasCloseAnchor.status}
                  </Badge>
                </div>

                {hasCloseAnchor.txid && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Transaction ID
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs">
                        {truncateHash(hasCloseAnchor.txid, 8)}
                      </code>
                      {hasCloseAnchor.explorerUrl && (
                        <a
                          href={hasCloseAnchor.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {isAnchored && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-400">
                    <p className="font-medium mb-1">Anchored to Bitcoin</p>
                    <p className="text-xs">
                      The Merkle root has been permanently recorded on the
                      Bitcoin blockchain, providing immutable proof of the
                      election state.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!hasCloseAnchor && (
              <div className="text-sm text-muted-foreground">
                Bitcoin anchoring will be available after the election closes
              </div>
            )}
          </div>
        )}

        {/* Verification Instructions */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm">
          <p className="font-medium mb-2">Independent Verification:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Copy the Merkle root above</li>
            <li>Compare it with published anchors</li>
            <li>
              {isAnchored
                ? "Verify the Bitcoin transaction confirms the root"
                : "Check for published signatures from election officials"}
            </li>
            <li>Anyone can verify without trusting this system</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
