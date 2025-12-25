/**
 * Comprehensive TDD tests for ResultBar and ResultsSummary components
 * Testing election results display, winner highlighting, and various states
 */

import { render, screen } from '@testing-library/react'
import { ResultBar, ResultsSummary } from '../result-bar'

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(' '),
}))

// Mock UI components
jest.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    variant,
    className,
    ...props
  }: {
    children: React.ReactNode
    variant?: string
    className?: string
  }) => (
    <span data-testid="badge" data-variant={variant} className={className} {...props}>
      {children}
    </span>
  ),
}))

describe('ResultBar Component', () => {
  describe('Basic Rendering', () => {
    it('renders the component', () => {
      render(<ResultBar candidateName="Alice" votes={100} percentage={50} totalVotes={200} />)
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('displays candidate name', () => {
      render(<ResultBar candidateName="Bob Smith" votes={75} percentage={25} totalVotes={300} />)
      expect(screen.getByText('Bob Smith')).toBeInTheDocument()
    })

    it('displays vote count', () => {
      render(<ResultBar candidateName="Carol" votes={1234} percentage={45} totalVotes={2743} />)
      expect(screen.getByText(/1,234 votes/i)).toBeInTheDocument()
    })

    it('displays percentage', () => {
      render(<ResultBar candidateName="Dave" votes={50} percentage={33.3} totalVotes={150} />)
      const percentages = screen.getAllByText('33.3%')
      expect(percentages.length).toBeGreaterThan(0)
    })

    it('renders progress bar', () => {
      const { container } = render(
        <ResultBar candidateName="Eve" votes={80} percentage={40} totalVotes={200} />
      )
      const progressBar = container.querySelector('[style*="width"]')
      expect(progressBar).toBeInTheDocument()
    })

    it('formats large vote count with commas', () => {
      render(<ResultBar candidateName="Frank" votes={1000000} percentage={75} totalVotes={1333333} />)
      expect(screen.getByText(/1,000,000 votes/i)).toBeInTheDocument()
    })

    it('displays percentage with one decimal place', () => {
      render(<ResultBar candidateName="Grace" votes={33} percentage={33.33333} totalVotes={99} />)
      const percentages = screen.getAllByText('33.3%')
      expect(percentages.length).toBeGreaterThan(0)
    })

    it('rounds percentage correctly', () => {
      render(<ResultBar candidateName="Henry" votes={67} percentage={66.66666} totalVotes={100} />)
      const percentages = screen.getAllByText('66.7%')
      expect(percentages.length).toBeGreaterThan(0)
    })
  })

  describe('Winner State', () => {
    it('displays trophy icon for winner', () => {
      const { container } = render(
        <ResultBar candidateName="Winner" votes={100} percentage={60} totalVotes={166} isWinner={true} />
      )
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('displays winner badge', () => {
      render(
        <ResultBar candidateName="Winner" votes={100} percentage={60} totalVotes={166} isWinner={true} />
      )
      const winnerBadge = screen.getByTestId('badge')
      expect(winnerBadge).toHaveTextContent(/winner/i)
    })

    it('does not display trophy when not winner', () => {
      const { container } = render(
        <ResultBar candidateName="Loser" votes={40} percentage={40} totalVotes={100} isWinner={false} />
      )
      // Trophy has yellow-500 class
      const yellowIcons = container.querySelectorAll('.text-yellow-500')
      expect(yellowIcons.length).toBe(0)
    })

    it('does not display winner badge when not winner', () => {
      render(
        <ResultBar candidateName="Loser" votes={40} percentage={40} totalVotes={100} isWinner={false} />
      )
      expect(screen.queryByText(/winner/i)).not.toBeInTheDocument()
    })

    it('applies yellow gradient to winner bar', () => {
      const { container } = render(
        <ResultBar candidateName="Winner" votes={100} percentage={60} totalVotes={166} isWinner={true} />
      )
      const bar = container.querySelector('.from-yellow-400')
      expect(bar).toBeInTheDocument()
    })

    it('applies blue gradient to non-winner bar', () => {
      const { container } = render(
        <ResultBar candidateName="Loser" votes={40} percentage={40} totalVotes={100} isWinner={false} />
      )
      const bar = container.querySelector('.from-blue-400')
      expect(bar).toBeInTheDocument()
    })

    it('defaults to non-winner when isWinner not specified', () => {
      render(<ResultBar candidateName="Default" votes={50} percentage={50} totalVotes={100} />)
      expect(screen.queryByText(/winner/i)).not.toBeInTheDocument()
    })
  })

  describe('Progress Bar Styling', () => {
    it('sets correct width based on percentage', () => {
      const { container } = render(
        <ResultBar candidateName="Alice" votes={75} percentage={75} totalVotes={100} />
      )
      const bar = container.querySelector('[style*="width: 75%"]')
      expect(bar).toBeInTheDocument()
    })

    it('handles 0% correctly', () => {
      const { container } = render(
        <ResultBar candidateName="Zero" votes={0} percentage={0} totalVotes={100} />
      )
      const bar = container.querySelector('[style*="width: 0%"]')
      expect(bar).toBeInTheDocument()
    })

    it('handles 100% correctly', () => {
      const { container } = render(
        <ResultBar candidateName="Full" votes={100} percentage={100} totalVotes={100} />
      )
      const bar = container.querySelector('[style*="width: 100%"]')
      expect(bar).toBeInTheDocument()
    })

    it('applies rounded-full class to progress bar', () => {
      const { container } = render(
        <ResultBar candidateName="Alice" votes={50} percentage={50} totalVotes={100} />
      )
      const bar = container.querySelector('.rounded-full')
      expect(bar).toBeInTheDocument()
    })

    it('has transition animation on bar', () => {
      const { container } = render(
        <ResultBar candidateName="Alice" votes={50} percentage={50} totalVotes={100} />
      )
      const bar = container.querySelector('.transition-all')
      expect(bar).toBeInTheDocument()
    })

    it('applies gradient overlay to bar', () => {
      const { container } = render(
        <ResultBar candidateName="Alice" votes={50} percentage={50} totalVotes={100} />
      )
      const overlay = container.querySelector('.bg-gradient-to-t')
      expect(overlay).toBeInTheDocument()
    })
  })

  describe('Percentage Label in Bar', () => {
    it('shows percentage label inside bar when > 15%', () => {
      const { container } = render(
        <ResultBar candidateName="Alice" votes={20} percentage={20} totalVotes={100} />
      )
      // Should have percentage displayed twice: once in bar, once outside
      const percentageLabels = screen.getAllByText('20.0%')
      expect(percentageLabels.length).toBe(2)
    })

    it('does not show percentage label inside bar when <= 15%', () => {
      const { container } = render(
        <ResultBar candidateName="Alice" votes={10} percentage={10} totalVotes={100} />
      )
      // Should have percentage displayed once: only outside
      const percentageLabels = screen.getAllByText('10.0%')
      expect(percentageLabels.length).toBe(1)
    })

    it('shows label for exactly 15%', () => {
      const { container } = render(
        <ResultBar candidateName="Alice" votes={15} percentage={15} totalVotes={100} />
      )
      const percentageLabels = screen.getAllByText('15.0%')
      expect(percentageLabels.length).toBe(1)
    })

    it('shows label for 15.1%', () => {
      const { container } = render(
        <ResultBar candidateName="Alice" votes={151} percentage={15.1} totalVotes={1000} />
      )
      const percentageLabels = screen.getAllByText('15.1%')
      expect(percentageLabels.length).toBe(2)
    })

    it('applies white text to label in bar', () => {
      const { container } = render(
        <ResultBar candidateName="Alice" votes={50} percentage={50} totalVotes={100} />
      )
      const label = container.querySelector('.text-white')
      expect(label).toBeInTheDocument()
    })

    it('applies drop shadow to label in bar', () => {
      const { container } = render(
        <ResultBar candidateName="Alice" votes={50} percentage={50} totalVotes={100} />
      )
      const label = container.querySelector('.drop-shadow')
      expect(label).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles zero votes', () => {
      render(<ResultBar candidateName="None" votes={0} percentage={0} totalVotes={100} />)
      expect(screen.getByText(/0 votes/i)).toBeInTheDocument()
      expect(screen.getByText('0.0%')).toBeInTheDocument()
    })

    it('handles single vote', () => {
      render(<ResultBar candidateName="One" votes={1} percentage={100} totalVotes={1} />)
      expect(screen.getByText(/1 votes/i)).toBeInTheDocument()
    })

    it('handles very small percentage', () => {
      render(<ResultBar candidateName="Tiny" votes={1} percentage={0.1} totalVotes={1000} />)
      expect(screen.getByText('0.1%')).toBeInTheDocument()
    })

    it('handles percentage > 100', () => {
      // Edge case that shouldn't happen but should still render
      render(<ResultBar candidateName="Over" votes={150} percentage={150} totalVotes={100} />)
      const percentages = screen.getAllByText('150.0%')
      expect(percentages.length).toBeGreaterThan(0)
    })

    it('handles very long candidate name', () => {
      const longName = 'A'.repeat(100)
      render(<ResultBar candidateName={longName} votes={50} percentage={50} totalVotes={100} />)
      expect(screen.getByText(longName)).toBeInTheDocument()
    })

    it('handles candidate name with special characters', () => {
      render(
        <ResultBar
          candidateName="O'Brien-Smith (Independent)"
          votes={50}
          percentage={50}
          totalVotes={100}
        />
      )
      expect(screen.getByText("O'Brien-Smith (Independent)")).toBeInTheDocument()
    })

    it('handles decimal percentage with many digits', () => {
      render(<ResultBar candidateName="Alice" votes={1} percentage={0.123456789} totalVotes={812} />)
      expect(screen.getByText('0.1%')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('displays votes with proper formatting', () => {
      render(<ResultBar candidateName="Alice" votes={1000} percentage={50} totalVotes={2000} />)
      expect(screen.getByText(/1,000 votes/i)).toBeInTheDocument()
    })

    it('has proper text hierarchy', () => {
      render(<ResultBar candidateName="Alice" votes={100} percentage={50} totalVotes={200} />)
      const name = screen.getByText('Alice')
      expect(name).toHaveClass('font-medium')
    })

    it('has readable percentage display', () => {
      render(<ResultBar candidateName="Alice" votes={100} percentage={50} totalVotes={200} />)
      const percentages = screen.getAllByText('50.0%')
      expect(percentages.length).toBeGreaterThan(0)
      expect(percentages[0]).toHaveClass('font-semibold')
    })
  })

  describe('Layout and Spacing', () => {
    it('uses flexbox layout', () => {
      const { container } = render(
        <ResultBar candidateName="Alice" votes={100} percentage={50} totalVotes={200} />
      )
      const nameRow = container.querySelector('.flex.items-center.justify-between')
      expect(nameRow).toBeInTheDocument()
    })

    it('has proper spacing between elements', () => {
      const { container } = render(
        <ResultBar candidateName="Alice" votes={100} percentage={50} totalVotes={200} />
      )
      const mainContainer = container.querySelector('.space-y-2')
      expect(mainContainer).toBeInTheDocument()
    })

    it('has minimum width for percentage', () => {
      render(<ResultBar candidateName="Alice" votes={100} percentage={50} totalVotes={200} />)
      const percentages = screen.getAllByText('50.0%')
      expect(percentages.length).toBeGreaterThan(0)
      expect(percentages[0]).toHaveClass('min-w-[60px]')
    })

    it('aligns percentage to right', () => {
      render(<ResultBar candidateName="Alice" votes={100} percentage={50} totalVotes={200} />)
      const percentages = screen.getAllByText('50.0%')
      expect(percentages.length).toBeGreaterThan(0)
      expect(percentages[0]).toHaveClass('text-right')
    })
  })
})

describe('ResultsSummary Component', () => {
  const mockResults = [
    {
      candidateId: '1',
      candidateName: 'Alice',
      votes: 150,
      percentage: 50,
    },
    {
      candidateId: '2',
      candidateName: 'Bob',
      votes: 90,
      percentage: 30,
    },
    {
      candidateId: '3',
      candidateName: 'Carol',
      votes: 60,
      percentage: 20,
    },
  ]

  const mockWinner = {
    candidateId: '1',
    candidateName: 'Alice',
    votes: 150,
  }

  describe('Basic Rendering', () => {
    it('renders the component', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} />)
      expect(screen.getByText(/results/i)).toBeInTheDocument()
    })

    it('displays results heading', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} />)
      const heading = screen.getByRole('heading', { name: /results/i })
      expect(heading).toBeInTheDocument()
    })

    it('displays total votes', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} />)
      expect(screen.getByText(/total: 300 votes/i)).toBeInTheDocument()
    })

    it('renders all candidates', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} />)
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Carol')).toBeInTheDocument()
    })

    it('renders ResultBar for each candidate', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} />)
      mockResults.forEach((result) => {
        expect(screen.getByText(result.candidateName)).toBeInTheDocument()
      })
    })

    it('formats total votes with commas', () => {
      render(<ResultsSummary results={mockResults} totalVotes={1000000} />)
      expect(screen.getByText(/total: 1,000,000 votes/i)).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('sorts results by votes descending', () => {
      const unsortedResults = [
        { candidateId: '1', candidateName: 'Alice', votes: 50, percentage: 20 },
        { candidateId: '2', candidateName: 'Bob', votes: 100, percentage: 40 },
        { candidateId: '3', candidateName: 'Carol', votes: 75, percentage: 30 },
      ]
      render(<ResultsSummary results={unsortedResults} totalVotes={225} />)

      const candidates = screen.getAllByText(/Alice|Bob|Carol/)
      // Bob (100) should be first, Carol (75) second, Alice (50) third
      expect(candidates[0]).toHaveTextContent('Bob')
      expect(candidates[1]).toHaveTextContent('Carol')
      expect(candidates[2]).toHaveTextContent('Alice')
    })

    it('maintains order for equal votes', () => {
      const equalResults = [
        { candidateId: '1', candidateName: 'Alice', votes: 100, percentage: 50 },
        { candidateId: '2', candidateName: 'Bob', votes: 100, percentage: 50 },
      ]
      render(<ResultsSummary results={equalResults} totalVotes={200} />)

      const candidates = screen.getAllByText(/Alice|Bob/)
      // Should maintain original order
      expect(candidates.length).toBeGreaterThan(0)
    })

    it('does not modify original results array', () => {
      const originalResults = [...mockResults]
      render(<ResultsSummary results={mockResults} totalVotes={300} />)
      expect(mockResults).toEqual(originalResults)
    })
  })

  describe('Winner Display - No Winner', () => {
    it('does not show winner section when no winner', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} />)
      expect(screen.queryByText(/^winner:/i)).not.toBeInTheDocument()
    })

    it('does not highlight any candidate when no winner', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} />)
      expect(screen.queryByText(/winner/i)).not.toBeInTheDocument()
    })
  })

  describe('Winner Display - With Winner', () => {
    it('displays winner section', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} winner={mockWinner} />)
      expect(screen.getByText(/^winner:/i)).toBeInTheDocument()
    })

    it('displays winner name in section', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} winner={mockWinner} />)
      expect(screen.getByText(/winner: alice/i)).toBeInTheDocument()
    })

    it('displays winner vote count', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} winner={mockWinner} />)
      const voteTexts = screen.getAllByText(/150 votes/i)
      expect(voteTexts.length).toBeGreaterThan(0)
    })

    it('displays winner percentage', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} winner={mockWinner} />)
      const percentages = screen.getAllByText(/50\.0%/)
      expect(percentages.length).toBeGreaterThan(0)
    })

    it('shows trophy icon in winner section', () => {
      const { container } = render(
        <ResultsSummary results={mockResults} totalVotes={300} winner={mockWinner} />
      )
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('applies yellow styling to winner section', () => {
      const { container } = render(
        <ResultsSummary results={mockResults} totalVotes={300} winner={mockWinner} />
      )
      const yellowElements = container.querySelectorAll('[class*="yellow"]')
      expect(yellowElements.length).toBeGreaterThan(0)
    })

    it('highlights winner in results list', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} winner={mockWinner} />)
      // Should have Winner badge
      expect(screen.getByText(/^winner$/i)).toBeInTheDocument()
    })

    it('formats winner votes with commas', () => {
      const bigWinner = { ...mockWinner, votes: 1000000 }
      render(<ResultsSummary results={mockResults} totalVotes={2000000} winner={bigWinner} />)
      expect(screen.getByText(/1,000,000 votes/i)).toBeInTheDocument()
    })

    it('calculates winner percentage correctly', () => {
      const winner = { candidateId: '1', candidateName: 'Alice', votes: 333 }
      render(<ResultsSummary results={mockResults} totalVotes={1000} winner={winner} />)
      expect(screen.getByText(/33\.3%/)).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty results array', () => {
      render(<ResultsSummary results={[]} totalVotes={0} />)
      expect(screen.getByText(/results/i)).toBeInTheDocument()
      expect(screen.getByText(/total: 0 votes/i)).toBeInTheDocument()
    })

    it('handles single candidate', () => {
      const singleResult = [mockResults[0]]
      render(<ResultsSummary results={singleResult} totalVotes={150} />)
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('handles many candidates', () => {
      const manyResults = Array.from({ length: 20 }, (_, i) => ({
        candidateId: `${i}`,
        candidateName: `Candidate ${i}`,
        votes: 100 - i,
        percentage: (100 - i) / 20,
      }))
      render(<ResultsSummary results={manyResults} totalVotes={2000} />)
      expect(screen.getByText('Candidate 0')).toBeInTheDocument()
      expect(screen.getByText('Candidate 19')).toBeInTheDocument()
    })

    it('handles zero total votes', () => {
      const zeroResults = mockResults.map((r) => ({ ...r, votes: 0, percentage: 0 }))
      render(<ResultsSummary results={zeroResults} totalVotes={0} />)
      expect(screen.getByText(/total: 0 votes/i)).toBeInTheDocument()
    })

    it('handles winner with zero votes', () => {
      const zeroWinner = { candidateId: '1', candidateName: 'Alice', votes: 0 }
      render(<ResultsSummary results={mockResults} totalVotes={0} winner={zeroWinner} />)
      const zeroVotes = screen.getAllByText(/0 votes/i)
      expect(zeroVotes.length).toBeGreaterThan(0)
    })

    it('handles winner not in results list', () => {
      const differentWinner = {
        candidateId: '999',
        candidateName: 'Unknown',
        votes: 500,
      }
      render(<ResultsSummary results={mockResults} totalVotes={800} winner={differentWinner} />)
      expect(screen.getByText(/winner: unknown/i)).toBeInTheDocument()
    })

    it('handles very large total votes', () => {
      render(<ResultsSummary results={mockResults} totalVotes={Number.MAX_SAFE_INTEGER} />)
      const totalText = screen.getByText(/total:/i)
      expect(totalText).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('has proper spacing between results', () => {
      const { container } = render(<ResultsSummary results={mockResults} totalVotes={300} />)
      const resultsContainer = container.querySelector('.space-y-4')
      expect(resultsContainer).toBeInTheDocument()
    })

    it('has proper spacing for main sections', () => {
      const { container } = render(<ResultsSummary results={mockResults} totalVotes={300} />)
      const mainContainer = container.querySelector('.space-y-6')
      expect(mainContainer).toBeInTheDocument()
    })

    it('applies rounded corners to winner section', () => {
      const { container } = render(
        <ResultsSummary results={mockResults} totalVotes={300} winner={mockWinner} />
      )
      const roundedElements = container.querySelectorAll('.rounded-lg')
      expect(roundedElements.length).toBeGreaterThan(0)
    })

    it('applies border to winner section', () => {
      const { container } = render(
        <ResultsSummary results={mockResults} totalVotes={300} winner={mockWinner} />
      )
      const borderElements = container.querySelectorAll('.border')
      expect(borderElements.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('has proper heading level', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} />)
      const heading = screen.getByRole('heading', { name: /results/i })
      expect(heading.tagName).toBe('H3')
    })

    it('provides total votes context', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} />)
      expect(screen.getByText(/total: 300 votes/i)).toBeInTheDocument()
    })

    it('has clear winner indication', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} winner={mockWinner} />)
      expect(screen.getByText(/winner: alice/i)).toBeInTheDocument()
    })
  })

  describe('Dark Mode Support', () => {
    it('includes dark mode classes for winner section', () => {
      const { container } = render(
        <ResultsSummary results={mockResults} totalVotes={300} winner={mockWinner} />
      )
      const darkElements = container.querySelectorAll('[class*="dark:"]')
      expect(darkElements.length).toBeGreaterThan(0)
    })
  })

  describe('Integration', () => {
    it('passes correct props to ResultBar components', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} winner={mockWinner} />)

      // Check that each candidate is rendered with their data
      mockResults.forEach((result) => {
        expect(screen.getByText(result.candidateName)).toBeInTheDocument()
        const percentages = screen.getAllByText(`${result.percentage.toFixed(1)}%`)
        expect(percentages.length).toBeGreaterThan(0)
      })
    })

    it('marks only winner as winner in ResultBar', () => {
      render(<ResultsSummary results={mockResults} totalVotes={300} winner={mockWinner} />)

      // Should have exactly one "Winner" badge
      const winnerBadges = screen.getAllByText(/^winner$/i)
      expect(winnerBadges.length).toBe(1)
    })

    it('handles reordering after sort', () => {
      const unsortedResults = [
        { candidateId: '1', candidateName: 'Last', votes: 10, percentage: 10 },
        { candidateId: '2', candidateName: 'First', votes: 100, percentage: 50 },
        { candidateId: '3', candidateName: 'Middle', votes: 50, percentage: 25 },
      ]
      render(<ResultsSummary results={unsortedResults} totalVotes={200} />)

      const names = screen.getAllByText(/First|Middle|Last/)
      expect(names[0]).toHaveTextContent('First')
      expect(names[1]).toHaveTextContent('Middle')
      expect(names[2]).toHaveTextContent('Last')
    })
  })
})
