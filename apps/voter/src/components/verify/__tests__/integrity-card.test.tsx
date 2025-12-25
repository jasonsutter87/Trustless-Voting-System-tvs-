/**
 * Comprehensive TDD tests for IntegrityCard component
 * Testing election integrity display, Bitcoin anchoring, and various states
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntegrityCard } from '../integrity-card'

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(' '),
  formatTimestamp: (timestamp: number | null | undefined) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  },
  truncateHash: (hash: string, length = 8) => {
    if (hash.length <= length * 2) return hash
    return `${hash.slice(0, length)}...${hash.slice(-length)}`
  },
}))

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: { children: React.ReactNode }) => (
    <h2 data-testid="card-title" {...props}>
      {children}
    </h2>
  ),
  CardDescription: ({ children, ...props }: { children: React.ReactNode }) => (
    <p data-testid="card-description" {...props}>
      {children}
    </p>
  ),
  CardContent: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="card-content" {...props}>
      {children}
    </div>
  ),
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, ...props }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant} {...props}>
      {children}
    </span>
  ),
}))

const mockIntegrityBasic = {
  voteCount: 1250,
  merkleRoot: 'abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456',
  lastUpdate: Date.now(),
}

const mockIntegrityNoVotes = {
  voteCount: 0,
  merkleRoot: null,
  lastUpdate: null,
}

const mockBitcoinAnchorsConfirmed = {
  start: {
    status: 'confirmed',
    txid: 'tx1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    explorerUrl: 'https://blockstream.info/tx/tx1234567890abcdef',
  },
  close: {
    status: 'confirmed',
    txid: 'tx9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    explorerUrl: 'https://blockstream.info/tx/tx9876543210fedcba',
  },
}

const mockBitcoinAnchorsPending = {
  close: {
    status: 'pending',
    txid: 'tx9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    explorerUrl: 'https://blockstream.info/tx/tx9876543210fedcba',
  },
}

const mockBitcoinAnchorsNoTxid = {
  close: {
    status: 'pending',
  },
}

describe('IntegrityCard Component', () => {
  describe('Basic Rendering', () => {
    it('renders the component', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('renders title', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText(/election integrity/i)).toBeInTheDocument()
    })

    it('renders description', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText(/cryptographic verification/i)).toBeInTheDocument()
    })

    it('renders shield icon', () => {
      const { container } = render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('renders vote count section', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText(/total votes/i)).toBeInTheDocument()
    })

    it('renders merkle root section', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const merkleLabels = screen.getAllByText(/merkle root/i)
      expect(merkleLabels.length).toBeGreaterThan(0)
    })

    it('renders last update section', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText(/last update/i)).toBeInTheDocument()
    })

    it('renders verification instructions', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText(/independent verification/i)).toBeInTheDocument()
    })
  })

  describe('Vote Count Display', () => {
    it('displays vote count', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText('1250')).toBeInTheDocument()
    })

    it('displays zero votes', () => {
      render(<IntegrityCard integrity={mockIntegrityNoVotes} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('displays large vote count', () => {
      const largeCount = { ...mockIntegrityBasic, voteCount: 1000000 }
      render(<IntegrityCard integrity={largeCount} />)
      expect(screen.getByText('1000000')).toBeInTheDocument()
    })

    it('shows check circle icon for vote count', () => {
      const { container } = render(<IntegrityCard integrity={mockIntegrityBasic} />)
      // Check for multiple SVGs (icons)
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('displays vote count with large font', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const voteCountElement = screen.getByText('1250')
      expect(voteCountElement).toHaveClass('text-lg', 'font-semibold')
    })
  })

  describe('Merkle Root Display', () => {
    it('displays merkle root when present', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText(mockIntegrityBasic.merkleRoot!)).toBeInTheDocument()
    })

    it('displays full merkle root hash', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const rootHash = screen.getByText(mockIntegrityBasic.merkleRoot!)
      expect(rootHash).toHaveClass('font-mono')
    })

    it('applies monospace font to merkle root', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const rootHash = screen.getByText(mockIntegrityBasic.merkleRoot!)
      expect(rootHash.closest('div')).toHaveClass('font-mono')
    })

    it('shows placeholder when no merkle root', () => {
      render(<IntegrityCard integrity={mockIntegrityNoVotes} />)
      expect(screen.getByText(/no votes recorded yet/i)).toBeInTheDocument()
    })

    it('does not display merkle root when null', () => {
      render(<IntegrityCard integrity={mockIntegrityNoVotes} />)
      expect(screen.queryByText(/abc123/)).not.toBeInTheDocument()
    })

    it('applies gray background to merkle root', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const rootContainer = screen.getByText(mockIntegrityBasic.merkleRoot!).closest('div')
      expect(rootContainer).toHaveClass('bg-gray-100')
    })

    it('makes merkle root text breakable', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const rootContainer = screen.getByText(mockIntegrityBasic.merkleRoot!).closest('div')
      expect(rootContainer).toHaveClass('break-all')
    })
  })

  describe('Last Update Display', () => {
    it('displays formatted timestamp', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      // Should show formatted date, not raw timestamp
      expect(screen.queryByText(mockIntegrityBasic.lastUpdate!.toString())).not.toBeInTheDocument()
    })

    it('displays N/A when no timestamp', () => {
      render(<IntegrityCard integrity={mockIntegrityNoVotes} />)
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })

    it('shows clock icon for last update', () => {
      const { container } = render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('displays last update label', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText(/last update/i)).toBeInTheDocument()
    })
  })

  describe('Bitcoin Anchoring - Not Present', () => {
    it('does not show bitcoin section when anchors is undefined', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.queryByText(/bitcoin anchoring/i)).not.toBeInTheDocument()
    })

    it('does not show bitcoin section when anchors is null', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={null} />)
      expect(screen.queryByText(/bitcoin anchoring/i)).not.toBeInTheDocument()
    })
  })

  describe('Bitcoin Anchoring - Confirmed', () => {
    it('displays bitcoin anchoring section', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      expect(screen.getByText(/bitcoin anchoring/i)).toBeInTheDocument()
    })

    it('displays election close anchor label', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      expect(screen.getByText(/election close anchor/i)).toBeInTheDocument()
    })

    it('displays confirmed status badge', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      expect(screen.getByText(/confirmed/i)).toBeInTheDocument()
    })

    it('displays transaction ID label', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      expect(screen.getByText(/transaction id/i)).toBeInTheDocument()
    })

    it('displays truncated transaction ID', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      const txid = mockBitcoinAnchorsConfirmed.close.txid!
      const truncated = `${txid.slice(0, 8)}...${txid.slice(-8)}`
      expect(screen.getByText(truncated)).toBeInTheDocument()
    })

    it('displays view transaction link', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      const viewLink = screen.getByRole('link', { name: /view/i })
      expect(viewLink).toHaveAttribute('href', mockBitcoinAnchorsConfirmed.close.explorerUrl)
    })

    it('opens explorer link in new tab', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      const viewLink = screen.getByRole('link', { name: /view/i })
      expect(viewLink).toHaveAttribute('target', '_blank')
      expect(viewLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('displays anchored to bitcoin message', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      expect(screen.getByText(/anchored to bitcoin/i)).toBeInTheDocument()
    })

    it('displays immutable proof explanation', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      expect(screen.getByText(/immutable proof/i)).toBeInTheDocument()
    })

    it('applies green styling to anchored message', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      const anchoredMessage = screen.getByText(/anchored to bitcoin/i).closest('div')
      expect(anchoredMessage).toHaveClass('bg-green-50')
    })

    it('applies default variant to confirmed badge', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'default')
    })
  })

  describe('Bitcoin Anchoring - Pending', () => {
    it('displays pending status badge', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsPending} />
      )
      expect(screen.getByText(/pending/i)).toBeInTheDocument()
    })

    it('applies secondary variant to pending badge', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsPending} />
      )
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'secondary')
    })

    it('does not show anchored message when pending', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsPending} />
      )
      expect(screen.queryByText(/anchored to bitcoin/i)).not.toBeInTheDocument()
    })

    it('displays transaction ID for pending anchor', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsPending} />
      )
      expect(screen.getByText(/transaction id/i)).toBeInTheDocument()
    })

    it('shows explorer link for pending anchor', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsPending} />
      )
      expect(screen.getByRole('link', { name: /view/i })).toBeInTheDocument()
    })
  })

  describe('Bitcoin Anchoring - No Transaction', () => {
    it('does not show transaction ID when not available', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsNoTxid} />
      )
      expect(screen.queryByText(/transaction id/i)).not.toBeInTheDocument()
    })

    it('does not show view link when no explorer URL', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsNoTxid} />
      )
      expect(screen.queryByRole('link', { name: /view/i })).not.toBeInTheDocument()
    })

    it('still shows status badge', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsNoTxid} />
      )
      expect(screen.getByText(/pending/i)).toBeInTheDocument()
    })
  })

  describe('Bitcoin Anchoring - No Close Anchor', () => {
    it('shows placeholder message when no close anchor', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={{}} />)
      expect(
        screen.getByText(/bitcoin anchoring will be available after the election closes/i)
      ).toBeInTheDocument()
    })

    it('displays bitcoin anchoring section even without close anchor', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={{}} />)
      const anchorLabels = screen.getAllByText(/bitcoin anchoring/i)
      expect(anchorLabels.length).toBeGreaterThan(0)
    })

    it('does not show election close anchor label', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={{}} />)
      expect(screen.queryByText(/election close anchor/i)).not.toBeInTheDocument()
    })
  })

  describe('Verification Instructions', () => {
    it('displays verification heading', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText(/independent verification/i)).toBeInTheDocument()
    })

    it('instructs to copy merkle root', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText(/copy the merkle root/i)).toBeInTheDocument()
    })

    it('instructs to compare with published anchors', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText(/compare.*published anchors/i)).toBeInTheDocument()
    })

    it('instructs to verify bitcoin transaction when anchored', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      expect(screen.getByText(/verify the bitcoin transaction/i)).toBeInTheDocument()
    })

    it('suggests checking signatures when not anchored', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText(/published signatures/i)).toBeInTheDocument()
    })

    it('emphasizes independent verification', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText(/anyone can verify without trusting/i)).toBeInTheDocument()
    })

    it('renders all instruction steps', () => {
      const { container } = render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const listItems = container.querySelectorAll('ol li')
      expect(listItems.length).toBe(4)
    })

    it('applies blue styling to instructions box', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const instructionsBox = screen.getByText(/independent verification/i).closest('div')
      expect(instructionsBox).toHaveClass('bg-blue-50')
    })
  })

  describe('Edge Cases', () => {
    it('handles very large vote count', () => {
      const largeIntegrity = { ...mockIntegrityBasic, voteCount: Number.MAX_SAFE_INTEGER }
      render(<IntegrityCard integrity={largeIntegrity} />)
      expect(screen.getByText(Number.MAX_SAFE_INTEGER.toString())).toBeInTheDocument()
    })

    it('handles negative vote count gracefully', () => {
      const negativeIntegrity = { ...mockIntegrityBasic, voteCount: -1 }
      render(<IntegrityCard integrity={negativeIntegrity} />)
      expect(screen.getByText('-1')).toBeInTheDocument()
    })

    it('handles empty merkle root string', () => {
      const emptyRoot = { ...mockIntegrityBasic, merkleRoot: '' }
      render(<IntegrityCard integrity={emptyRoot} />)
      expect(screen.getByText(/no votes recorded yet/i)).toBeInTheDocument()
    })

    it('handles very short merkle root', () => {
      const shortRoot = { ...mockIntegrityBasic, merkleRoot: 'abc' }
      render(<IntegrityCard integrity={shortRoot} />)
      expect(screen.getByText('abc')).toBeInTheDocument()
    })

    it('handles very long merkle root', () => {
      const longRoot = { ...mockIntegrityBasic, merkleRoot: 'a'.repeat(256) }
      render(<IntegrityCard integrity={longRoot} />)
      expect(screen.getByText('a'.repeat(256))).toBeInTheDocument()
    })

    it('handles missing explorerUrl with txid present', () => {
      const noExplorer = {
        close: {
          status: 'confirmed',
          txid: 'tx1234',
        },
      }
      render(<IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={noExplorer} />)
      expect(screen.queryByRole('link', { name: /view/i })).not.toBeInTheDocument()
    })

    it('handles timestamp of 0', () => {
      const zeroTime = { ...mockIntegrityBasic, lastUpdate: 0 }
      render(<IntegrityCard integrity={zeroTime} />)
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })

    it('handles future timestamp', () => {
      const futureTime = { ...mockIntegrityBasic, lastUpdate: Date.now() + 86400000 }
      render(<IntegrityCard integrity={futureTime} />)
      // Should still format and display
      const lastUpdateSection = screen.getByText(/last update/i)
      expect(lastUpdateSection).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('applies proper spacing to sections', () => {
      const { container } = render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const contentSection = screen.getByTestId('card-content')
      expect(contentSection).toHaveClass('space-y-6')
    })

    it('has border separator before bitcoin section', () => {
      const { container } = render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      const bitcoinSection = screen.getByText(/bitcoin anchoring/i).closest('div')
      expect(bitcoinSection).toHaveClass('border-t')
    })

    it('applies rounded corners to merkle root box', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const rootBox = screen.getByText(mockIntegrityBasic.merkleRoot!).closest('div')
      expect(rootBox).toHaveClass('rounded-lg')
    })

    it('applies padding to merkle root', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const rootBox = screen.getByText(mockIntegrityBasic.merkleRoot!).closest('div')
      expect(rootBox).toHaveClass('p-3')
    })

    it('uses small font for labels', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const label = screen.getByText(/total votes/i)
      expect(label).toHaveClass('text-sm')
    })

    it('displays transaction ID in code element', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      const txid = mockBitcoinAnchorsConfirmed.close.txid!
      const truncated = `${txid.slice(0, 8)}...${txid.slice(-8)}`
      const codeElement = screen.getByText(truncated)
      expect(codeElement.tagName).toBe('CODE')
    })
  })

  describe('Accessibility', () => {
    it('has proper heading for card title', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const title = screen.getByTestId('card-title')
      expect(title.tagName).toBe('H2')
    })

    it('has descriptive labels for all metrics', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText(/total votes/i)).toBeInTheDocument()
      const merkleLabels = screen.getAllByText(/merkle root/i)
      expect(merkleLabels.length).toBeGreaterThan(0)
      expect(screen.getByText(/last update/i)).toBeInTheDocument()
    })

    it('uses semantic list for instructions', () => {
      const { container } = render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const orderedList = container.querySelector('ol')
      expect(orderedList).toBeInTheDocument()
    })

    it('has accessible external link attributes', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      const link = screen.getByRole('link', { name: /view/i })
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('provides context for transaction ID', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      expect(screen.getByText(/transaction id/i)).toBeInTheDocument()
    })
  })

  describe('Dark Mode Support', () => {
    it('includes dark mode classes for backgrounds', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const rootBox = screen.getByText(mockIntegrityBasic.merkleRoot!).closest('div')
      expect(rootBox?.className).toContain('dark:')
    })

    it('includes dark mode classes for anchored message', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      const message = screen.getByText(/anchored to bitcoin/i).closest('div')
      expect(message?.className).toContain('dark:')
    })

    it('includes dark mode classes for instructions', () => {
      render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const instructions = screen.getByText(/independent verification/i).closest('div')
      expect(instructions?.className).toContain('dark:')
    })
  })

  describe('Icon Display', () => {
    it('displays shield icon in header', () => {
      const { container } = render(<IntegrityCard integrity={mockIntegrityBasic} />)
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('displays external link icon for explorer', () => {
      render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      const { container } = render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      // Should have multiple icons including ExternalLink
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(1)
    })
  })

  describe('Conditional Rendering Logic', () => {
    it('renders bitcoin section only when bitcoinAnchors provided', () => {
      const { rerender } = render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.queryByText(/bitcoin anchoring/i)).not.toBeInTheDocument()

      rerender(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      expect(screen.getByText(/bitcoin anchoring/i)).toBeInTheDocument()
    })

    it('renders different verification instructions based on anchor status', () => {
      const { rerender } = render(<IntegrityCard integrity={mockIntegrityBasic} />)
      expect(screen.getByText(/published signatures/i)).toBeInTheDocument()

      rerender(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      expect(screen.getByText(/verify the bitcoin transaction/i)).toBeInTheDocument()
    })

    it('shows different badge variants based on status', () => {
      const { rerender } = render(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsConfirmed} />
      )
      let badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'default')

      rerender(
        <IntegrityCard integrity={mockIntegrityBasic} bitcoinAnchors={mockBitcoinAnchorsPending} />
      )
      badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', 'secondary')
    })
  })
})
