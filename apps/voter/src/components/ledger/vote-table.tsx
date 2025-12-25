"use client"

/**
 * Vote Table Component
 *
 * Displays votes in a paginated table with search functionality
 */

import { useState, useMemo } from "react"
import { Search, Download, Copy, Check } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatTimestamp, truncateHash, copyToClipboard } from "@/lib/utils"

interface Vote {
  position: number
  commitment: string
  nullifier: string
  timestamp: number
}

interface VoteTableProps {
  votes: Vote[]
  electionName: string
  merkleRoot: string
}

const VOTES_PER_PAGE = 50

export function VoteTable({ votes, electionName, merkleRoot }: VoteTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Filter votes based on search
  const filteredVotes = useMemo(() => {
    if (!searchTerm) return votes

    const term = searchTerm.toLowerCase()
    return votes.filter(
      (vote) =>
        vote.position.toString().includes(term) ||
        vote.commitment.toLowerCase().includes(term) ||
        vote.nullifier.toLowerCase().includes(term)
    )
  }, [votes, searchTerm])

  // Paginate
  const totalPages = Math.ceil(filteredVotes.length / VOTES_PER_PAGE)
  const paginatedVotes = useMemo(() => {
    const start = (currentPage - 1) * VOTES_PER_PAGE
    return filteredVotes.slice(start, start + VOTES_PER_PAGE)
  }, [filteredVotes, currentPage])

  // Handle copy
  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Position", "Commitment", "Nullifier", "Timestamp"]
    const rows = votes.map((vote) => [
      vote.position,
      vote.commitment,
      vote.nullifier,
      new Date(vote.timestamp).toISOString(),
    ])

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${electionName.replace(/\s+/g, "_")}_ledger.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by position, commitment, or nullifier..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1) // Reset to first page on search
            }}
            className="pl-9"
          />
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedVotes.length} of {filteredVotes.length} votes
        {searchTerm && ` (filtered from ${votes.length} total)`}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Position</TableHead>
              <TableHead>Commitment</TableHead>
              <TableHead>Nullifier</TableHead>
              <TableHead className="w-48">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm ? "No votes match your search" : "No votes yet"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedVotes.map((vote) => (
                <TableRow key={vote.position}>
                  <TableCell className="font-mono">{vote.position}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs">
                        {truncateHash(vote.commitment, 8)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          handleCopy(vote.commitment, `commitment-${vote.position}`)
                        }
                      >
                        {copiedField === `commitment-${vote.position}` ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs">
                        {truncateHash(vote.nullifier, 8)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          handleCopy(vote.nullifier, `nullifier-${vote.position}`)
                        }
                      >
                        {copiedField === `nullifier-${vote.position}` ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatTimestamp(vote.timestamp)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Merkle Root Display */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
        <div className="text-sm font-medium mb-2">Merkle Root</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-white dark:bg-gray-800 px-3 py-2 text-xs break-all">
            {merkleRoot}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(merkleRoot, "merkle-root")}
          >
            {copiedField === "merkle-root" ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This root cryptographically commits to all votes in the ledger. Anyone
          can verify vote inclusion using Merkle proofs.
        </p>
      </div>
    </div>
  )
}
