/**
 * Comprehensive TDD tests for ProofTree component
 * Testing Merkle proof visualization, various states, and accessibility
 */

import { render, screen } from '@testing-library/react'
import { ProofTree } from '../proof-tree'

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(' '),
  truncateHash: (hash: string, length = 8) => {
    if (hash.length <= length * 2) return hash
    return `${hash.slice(0, length)}...${hash.slice(-length)}`
  },
}))

const mockProofBasic = {
  leaf: 'abc123def456abc123def456abc123def456abc123def456abc123def456abc123def456',
  root: 'xyz789uvw012xyz789uvw012xyz789uvw012xyz789uvw012xyz789uvw012xyz789uvw012',
  siblings: [
    { hash: 'hash1111222233334444', position: 'left' as const },
    { hash: 'hash5555666677778888', position: 'right' as const },
  ],
}

const mockSteps = [
  {
    step: 1,
    operation: 'Combine with left sibling',
    leftHash: 'hash1111222233334444',
    rightHash: 'abc123def456abc123def456',
    result: 'intermediate1111222233334444',
  },
  {
    step: 2,
    operation: 'Combine with right sibling',
    leftHash: 'intermediate1111222233334444',
    rightHash: 'hash5555666677778888',
    result: 'xyz789uvw012xyz789uvw012',
  },
]

describe('ProofTree Component', () => {
  describe('Basic Rendering', () => {
    it('renders the component', () => {
      render(<ProofTree proof={mockProofBasic} />)
      expect(screen.getByText(/merkle proof path/i)).toBeInTheDocument()
    })

    it('renders heading text', () => {
      render(<ProofTree proof={mockProofBasic} />)
      const heading = screen.getByRole('heading', { name: /merkle proof path/i })
      expect(heading).toBeInTheDocument()
    })

    it('renders merkle root section', () => {
      render(<ProofTree proof={mockProofBasic} />)
      const labels = screen.getAllByText(/merkle root/i)
      expect(labels.length).toBeGreaterThan(0)
    })

    it('renders leaf section', () => {
      render(<ProofTree proof={mockProofBasic} />)
      const labels = screen.getAllByText(/your vote|leaf/i)
      expect(labels.length).toBeGreaterThan(0)
    })

    it('renders explanation section', () => {
      render(<ProofTree proof={mockProofBasic} />)
      expect(screen.getByText(/how merkle proofs work/i)).toBeInTheDocument()
    })

    it('displays root hash', () => {
      render(<ProofTree proof={mockProofBasic} />)
      expect(screen.getByText(mockProofBasic.root)).toBeInTheDocument()
    })

    it('displays leaf hash', () => {
      render(<ProofTree proof={mockProofBasic} />)
      expect(screen.getByText(mockProofBasic.leaf)).toBeInTheDocument()
    })

    it('truncates root hash for display', () => {
      render(<ProofTree proof={mockProofBasic} />)
      const truncated = `${mockProofBasic.root.slice(0, 12)}...${mockProofBasic.root.slice(-12)}`
      expect(screen.getByText(truncated)).toBeInTheDocument()
    })

    it('truncates leaf hash for display', () => {
      render(<ProofTree proof={mockProofBasic} />)
      const truncated = `${mockProofBasic.leaf.slice(0, 12)}...${mockProofBasic.leaf.slice(-12)}`
      expect(screen.getByText(truncated)).toBeInTheDocument()
    })
  })

  describe('Valid Proof State', () => {
    it('displays valid proof badge when valid is true', () => {
      render(<ProofTree proof={mockProofBasic} valid={true} />)
      expect(screen.getByText(/valid proof/i)).toBeInTheDocument()
    })

    it('shows check icon for valid proof', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} valid={true} />)
      const validSection = screen.getByText(/valid proof/i).closest('div')
      expect(validSection).toHaveClass('bg-green-100')
    })

    it('applies green styling to valid proof badge', () => {
      render(<ProofTree proof={mockProofBasic} valid={true} />)
      const badge = screen.getByText(/valid proof/i).closest('div')
      expect(badge).toHaveClass('text-green-800')
    })

    it('applies green border to root when valid', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} valid={true} />)
      const greenBorders = container.querySelectorAll('.border-green-500')
      expect(greenBorders.length).toBeGreaterThan(0)
    })

    it('applies green background to root when valid', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} valid={true} />)
      const greenBackgrounds = container.querySelectorAll('.bg-green-50')
      expect(greenBackgrounds.length).toBeGreaterThan(0)
    })
  })

  describe('Invalid Proof State', () => {
    it('displays invalid proof badge when valid is false', () => {
      render(<ProofTree proof={mockProofBasic} valid={false} />)
      expect(screen.getByText(/invalid proof/i)).toBeInTheDocument()
    })

    it('shows X icon for invalid proof', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} valid={false} />)
      const invalidSection = screen.getByText(/invalid proof/i).closest('div')
      expect(invalidSection).toHaveClass('bg-red-100')
    })

    it('applies red styling to invalid proof badge', () => {
      render(<ProofTree proof={mockProofBasic} valid={false} />)
      const badge = screen.getByText(/invalid proof/i).closest('div')
      expect(badge).toHaveClass('text-red-800')
    })

    it('does not apply green styling when invalid', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} valid={false} />)
      const rootHash = screen.getByText(mockProofBasic.root).closest('div')
      expect(rootHash).not.toHaveClass('border-green-500')
    })

    it('applies default styling to root when invalid', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} valid={false} />)
      const grayBackgrounds = container.querySelectorAll('.bg-gray-50')
      expect(grayBackgrounds.length).toBeGreaterThan(0)
    })
  })

  describe('Unknown Validity State', () => {
    it('does not show badge when valid is undefined', () => {
      render(<ProofTree proof={mockProofBasic} />)
      expect(screen.queryByText(/valid proof/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/invalid proof/i)).not.toBeInTheDocument()
    })

    it('applies default styling when valid is undefined', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} />)
      const grayBackgrounds = container.querySelectorAll('.bg-gray-50')
      expect(grayBackgrounds.length).toBeGreaterThan(0)
    })
  })

  describe('Siblings Display (No Steps)', () => {
    it('displays sibling hashes when no steps provided', () => {
      render(<ProofTree proof={mockProofBasic} />)
      expect(screen.getByText(/left sibling/i)).toBeInTheDocument()
      expect(screen.getByText(/right sibling/i)).toBeInTheDocument()
    })

    it('shows left sibling position', () => {
      render(<ProofTree proof={mockProofBasic} />)
      const leftSibling = screen.getByText(/left sibling/i)
      expect(leftSibling).toBeInTheDocument()
    })

    it('shows right sibling position', () => {
      render(<ProofTree proof={mockProofBasic} />)
      const rightSibling = screen.getByText(/right sibling/i)
      expect(rightSibling).toBeInTheDocument()
    })

    it('truncates sibling hashes', () => {
      render(<ProofTree proof={mockProofBasic} />)
      const truncated = `${mockProofBasic.siblings[0].hash.slice(0, 8)}...${mockProofBasic.siblings[0].hash.slice(-8)}`
      expect(screen.getByText(truncated)).toBeInTheDocument()
    })

    it('renders all siblings', () => {
      render(<ProofTree proof={mockProofBasic} />)
      mockProofBasic.siblings.forEach((sibling) => {
        const truncated = `${sibling.hash.slice(0, 8)}...${sibling.hash.slice(-8)}`
        expect(screen.getByText(truncated)).toBeInTheDocument()
      })
    })

    it('displays visual connectors between nodes', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} />)
      const connectors = container.querySelectorAll('.bg-gray-300, .dark\\:bg-gray-600')
      expect(connectors.length).toBeGreaterThan(0)
    })
  })

  describe('Steps Display', () => {
    it('displays detailed steps when provided', () => {
      render(<ProofTree proof={mockProofBasic} steps={mockSteps} />)
      expect(screen.getByText(/step 1/i)).toBeInTheDocument()
      expect(screen.getByText(/step 2/i)).toBeInTheDocument()
    })

    it('shows step operation description', () => {
      render(<ProofTree proof={mockProofBasic} steps={mockSteps} />)
      expect(screen.getByText(/combine with left sibling/i)).toBeInTheDocument()
      expect(screen.getByText(/combine with right sibling/i)).toBeInTheDocument()
    })

    it('displays left hash in steps', () => {
      render(<ProofTree proof={mockProofBasic} steps={mockSteps} />)
      expect(screen.getAllByText(/left/i).length).toBeGreaterThan(0)
    })

    it('displays right hash in steps', () => {
      render(<ProofTree proof={mockProofBasic} steps={mockSteps} />)
      expect(screen.getAllByText(/right/i).length).toBeGreaterThan(0)
    })

    it('shows SHA-256 operation label', () => {
      render(<ProofTree proof={mockProofBasic} steps={mockSteps} />)
      expect(screen.getAllByText(/sha-256/i).length).toBeGreaterThan(0)
    })

    it('displays step result hashes', () => {
      render(<ProofTree proof={mockProofBasic} steps={mockSteps} />)
      // Step results are displayed, checking for presence of truncated hashes
      const { container } = render(<ProofTree proof={mockProofBasic} steps={mockSteps} />)
      const resultBoxes = container.querySelectorAll('.bg-blue-50, .dark\\:bg-blue-900\\/20')
      expect(resultBoxes.length).toBeGreaterThan(0)
    })

    it('applies blue background to result hashes', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} steps={mockSteps} />)
      const resultBoxes = container.querySelectorAll('.bg-blue-50, .dark\\:bg-blue-900\\/20')
      expect(resultBoxes.length).toBeGreaterThan(0)
    })

    it('shows steps instead of simple sibling list', () => {
      render(<ProofTree proof={mockProofBasic} steps={mockSteps} />)
      // When steps are provided, should show step operations
      expect(screen.getByText(/step 1/i)).toBeInTheDocument()
      expect(screen.getByText(/step 2/i)).toBeInTheDocument()
    })

    it('renders all steps in order', () => {
      render(<ProofTree proof={mockProofBasic} steps={mockSteps} />)
      mockSteps.forEach((step) => {
        expect(screen.getByText(new RegExp(`step ${step.step}`, 'i'))).toBeInTheDocument()
      })
    })

    it('truncates step hashes correctly', () => {
      render(<ProofTree proof={mockProofBasic} steps={mockSteps} />)
      const truncatedLeft = `${mockSteps[0].leftHash.slice(0, 8)}...${mockSteps[0].leftHash.slice(-8)}`
      expect(screen.getByText(truncatedLeft)).toBeInTheDocument()
    })
  })

  describe('Empty Steps Array', () => {
    it('shows siblings when steps is empty array', () => {
      render(<ProofTree proof={mockProofBasic} steps={[]} />)
      expect(screen.getByText(/left sibling/i)).toBeInTheDocument()
    })
  })

  describe('Explanation Section', () => {
    it('renders explanation heading', () => {
      render(<ProofTree proof={mockProofBasic} />)
      expect(screen.getByText(/how merkle proofs work/i)).toBeInTheDocument()
    })

    it('explains vote hashing', () => {
      render(<ProofTree proof={mockProofBasic} />)
      expect(screen.getByText(/your vote is hashed/i)).toBeInTheDocument()
    })

    it('explains sibling combination', () => {
      render(<ProofTree proof={mockProofBasic} />)
      expect(screen.getByText(/combined with sibling hashes/i)).toBeInTheDocument()
    })

    it('explains SHA-256 usage', () => {
      render(<ProofTree proof={mockProofBasic} />)
      expect(screen.getByText(/sha-256 cryptographic hashing/i)).toBeInTheDocument()
    })

    it('explains root matching', () => {
      render(<ProofTree proof={mockProofBasic} />)
      expect(screen.getByText(/match the published merkle root/i)).toBeInTheDocument()
    })

    it('explains privacy protection', () => {
      render(<ProofTree proof={mockProofBasic} />)
      expect(screen.getByText(/without revealing it/i)).toBeInTheDocument()
    })

    it('renders all explanation points', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} />)
      const listItems = container.querySelectorAll('.list-decimal li')
      expect(listItems.length).toBe(5)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty siblings array', () => {
      const emptyProof = { ...mockProofBasic, siblings: [] }
      render(<ProofTree proof={emptyProof} />)
      expect(screen.getByText(/merkle proof path/i)).toBeInTheDocument()
    })

    it('handles single sibling', () => {
      const singleSiblingProof = {
        ...mockProofBasic,
        siblings: [mockProofBasic.siblings[0]],
      }
      render(<ProofTree proof={singleSiblingProof} />)
      expect(screen.getByText(/left sibling/i)).toBeInTheDocument()
    })

    it('handles many siblings', () => {
      const manySiblings = Array.from({ length: 10 }, (_, i) => ({
        hash: `hash${i}`.repeat(8),
        position: i % 2 === 0 ? ('left' as const) : ('right' as const),
      }))
      const manyProof = { ...mockProofBasic, siblings: manySiblings }
      render(<ProofTree proof={manyProof} />)
      expect(screen.getAllByText(/sibling/i).length).toBeGreaterThan(0)
    })

    it('handles short hash values', () => {
      const shortProof = {
        leaf: 'abc',
        root: 'xyz',
        siblings: [{ hash: 'h1', position: 'left' as const }],
      }
      render(<ProofTree proof={shortProof} />)
      // Short hashes are displayed without truncation
      const allText = screen.getAllByText(/abc|xyz/)
      expect(allText.length).toBeGreaterThan(0)
    })

    it('handles very long hash values', () => {
      const longHash = 'a'.repeat(256)
      const longProof = {
        leaf: longHash,
        root: longHash,
        siblings: [{ hash: longHash, position: 'left' as const }],
      }
      render(<ProofTree proof={longProof} />)
      // Long hash should be present in the document
      const allText = screen.getAllByText(longHash)
      expect(allText.length).toBeGreaterThan(0)
    })

    it('handles single step', () => {
      render(<ProofTree proof={mockProofBasic} steps={[mockSteps[0]]} />)
      expect(screen.getByText(/step 1/i)).toBeInTheDocument()
      expect(screen.queryByText(/step 2/i)).not.toBeInTheDocument()
    })

    it('handles many steps', () => {
      const manySteps = Array.from({ length: 20 }, (_, i) => ({
        step: i + 1,
        operation: `Operation ${i + 1}`,
        leftHash: `left${i}`,
        rightHash: `right${i}`,
        result: `result${i}`,
      }))
      render(<ProofTree proof={mockProofBasic} steps={manySteps} />)
      // Check that first and last steps are present
      const step1 = screen.getAllByText(/step 1|operation 1/i)
      const step20 = screen.getAllByText(/step 20|operation 20/i)
      expect(step1.length).toBeGreaterThan(0)
      expect(step20.length).toBeGreaterThan(0)
    })
  })

  describe('Styling and Layout', () => {
    it('applies blue border to leaf', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} />)
      const blueBorders = container.querySelectorAll('.border-blue-500')
      expect(blueBorders.length).toBeGreaterThan(0)
    })

    it('applies blue background to leaf', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} />)
      const blueBackgrounds = container.querySelectorAll('.bg-blue-50')
      expect(blueBackgrounds.length).toBeGreaterThan(0)
    })

    it('applies monospace font to hashes', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} />)
      const monoFonts = container.querySelectorAll('.font-mono')
      expect(monoFonts.length).toBeGreaterThan(0)
    })

    it('has rounded corners on hash displays', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} />)
      const roundedCorners = container.querySelectorAll('.rounded-lg, .rounded')
      expect(roundedCorners.length).toBeGreaterThan(0)
    })

    it('applies correct spacing classes', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} />)
      const mainContainer = container.querySelector('.space-y-6')
      expect(mainContainer).toBeInTheDocument()
    })

    it('renders visual arrows between nodes', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} steps={mockSteps} />)
      const arrows = container.querySelectorAll('.h-8.w-0\\.5')
      expect(arrows.length).toBeGreaterThan(0)
    })

    it('applies blue background to explanation box', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} />)
      const explanationBox = screen.getByText(/how merkle proofs work/i).closest('div')
      expect(explanationBox).toHaveClass('bg-blue-50')
    })
  })

  describe('Accessibility', () => {
    it('has proper heading level', () => {
      render(<ProofTree proof={mockProofBasic} />)
      const heading = screen.getByRole('heading', { name: /merkle proof path/i })
      expect(heading.tagName).toBe('H3')
    })

    it('uses semantic HTML for list', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} />)
      const list = container.querySelector('ol')
      expect(list).toBeInTheDocument()
    })

    it('has descriptive labels for sections', () => {
      render(<ProofTree proof={mockProofBasic} />)
      const labels = screen.getAllByText(/merkle root|your vote|leaf/i)
      expect(labels.length).toBeGreaterThan(0)
    })

    it('displays full hash in accessible way', () => {
      render(<ProofTree proof={mockProofBasic} />)
      // Full hash should be visible in addition to truncated version
      expect(screen.getByText(mockProofBasic.root)).toBeInTheDocument()
    })

    it('provides context for hash values', () => {
      render(<ProofTree proof={mockProofBasic} />)
      const labels = screen.getAllByText(/merkle root|your vote|leaf/i)
      expect(labels.length).toBeGreaterThan(1)
    })
  })

  describe('Dark Mode Support', () => {
    it('includes dark mode classes for valid state', () => {
      render(<ProofTree proof={mockProofBasic} valid={true} />)
      const badge = screen.getByText(/valid proof/i).closest('div')
      expect(badge?.className).toContain('dark:')
    })

    it('includes dark mode classes for invalid state', () => {
      render(<ProofTree proof={mockProofBasic} valid={false} />)
      const badge = screen.getByText(/invalid proof/i).closest('div')
      expect(badge?.className).toContain('dark:')
    })

    it('includes dark mode classes for backgrounds', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} />)
      const darkModeElements = container.querySelectorAll('[class*="dark:"]')
      expect(darkModeElements.length).toBeGreaterThan(0)
    })

    it('includes dark mode classes for connectors', () => {
      const { container } = render(<ProofTree proof={mockProofBasic} />)
      const connectors = container.querySelectorAll('[class*="dark:bg-gray"]')
      expect(connectors.length).toBeGreaterThan(0)
    })
  })

  describe('Visual Feedback', () => {
    it('shows different styling for valid vs invalid', () => {
      const { container: validContainer } = render(
        <ProofTree proof={mockProofBasic} valid={true} />
      )
      const { container: invalidContainer } = render(
        <ProofTree proof={mockProofBasic} valid={false} />
      )

      const validBadge = screen.getAllByText(/proof/i)[0].closest('div')
      const invalidBadge = screen.getAllByText(/proof/i)[1].closest('div')

      expect(validBadge?.className).not.toBe(invalidBadge?.className)
    })

    it('highlights root differently when valid', () => {
      const { rerender, container } = render(<ProofTree proof={mockProofBasic} />)
      const defaultGreen = container.querySelectorAll('.border-green-500').length

      rerender(<ProofTree proof={mockProofBasic} valid={true} />)
      const validGreen = container.querySelectorAll('.border-green-500').length

      // Valid state should have green styling that default doesn't
      expect(validGreen).toBeGreaterThan(defaultGreen)
    })
  })
})
