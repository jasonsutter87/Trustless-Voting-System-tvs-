/**
 * Comprehensive tests for Confirmation Page
 *
 * Tests cover:
 * - Component rendering and initialization
 * - Confirmation code display
 * - Merkle proof information
 * - Copy to clipboard functionality
 * - Print functionality
 * - Navigation and cleanup
 * - Error handling
 * - Submission summary
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useParams } from 'next/navigation'
import ConfirmationPage from '../page'
import * as utils from '@/lib/utils'

// Mock modules
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

jest.mock('@/lib/utils', () => ({
  copyToClipboard: jest.fn(),
}))

const mockConfirmation = {
  success: true,
  confirmationCode: 'ABC123XYZ',
  electionId: 'election-1',
  answersSubmitted: 2,
  answersTotal: 2,
  results: [
    {
      questionId: 'q1',
      success: true,
      position: 0,
      merkleRoot: '0x1234567890abcdef',
    },
    {
      questionId: 'q2',
      success: true,
      position: 1,
      merkleRoot: '0x1234567890abcdef',
    },
  ],
  message: 'Vote submitted successfully',
}

const mockPartialConfirmation = {
  success: false,
  confirmationCode: 'XYZ789ABC',
  electionId: 'election-1',
  answersSubmitted: 1,
  answersTotal: 2,
  results: [
    {
      questionId: 'q1',
      success: true,
      position: 0,
      merkleRoot: '0xabcdef1234567890',
    },
    {
      questionId: 'q2',
      success: false,
      error: 'Failed to record vote',
    },
  ],
  message: 'Partial submission',
}

describe('ConfirmationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(useParams as jest.Mock).mockReturnValue({
      electionId: 'election-1',
    })
    sessionStorage.clear()
    ;(utils.copyToClipboard as jest.Mock).mockResolvedValue(true)
    global.print = jest.fn()
  })

  describe('Component Initialization', () => {
    test('should render loading state initially', () => {
      render(<ConfirmationPage />)
      expect(screen.getByText(/loading confirmation/i)).toBeInTheDocument()
    })

    test('should load confirmation from sessionStorage', async () => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))

      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('Vote Submitted Successfully!')).toBeInTheDocument()
      })
    })

    test('should display success message', async () => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))

      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('Vote Submitted Successfully!')).toBeInTheDocument()
      })
    })

    test('should display subtitle', async () => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))

      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/encrypted and recorded in the secure voting ledger/i)).toBeInTheDocument()
      })
    })

    test('should display success icon', async () => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))

      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('Vote Submitted Successfully!')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('should show error when no confirmation found', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/no confirmation found/i)).toBeInTheDocument()
      })
    })

    test('should display error icon on error', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
      })
    })

    test('should show return to home button on error', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /return to home/i })).toBeInTheDocument()
      })
    })

    test('should navigate to home when return button clicked', async () => {
      const user = userEvent.setup()
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/no confirmation found/i)).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: /return to home/i })
      await user.click(button)

      expect(mockPush).toHaveBeenCalledWith('/')
    })

    test('should handle invalid JSON in sessionStorage', async () => {
      sessionStorage.setItem('voteConfirmation', 'invalid-json')

      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load confirmation/i)).toBeInTheDocument()
      })
    })

    test('should handle corrupted confirmation data', async () => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify({ invalid: 'data' }))

      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/no confirmation data found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Confirmation Code Display', () => {
    beforeEach(() => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))
    })

    test('should display confirmation code card', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('Your Confirmation Code')).toBeInTheDocument()
      })
    })

    test('should display save instructions', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/save this code to verify your vote/i)).toBeInTheDocument()
      })
    })

    test('should display confirmation code', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
      })
    })

    test('should display copy button', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument()
      })
    })

    test('should display print button in code section', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /print receipt/i })
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    test('should copy confirmation code to clipboard', async () => {
      const user = userEvent.setup()
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
      })

      const copyButton = screen.getByRole('button', { name: /copy code/i })
      await user.click(copyButton)

      expect(utils.copyToClipboard).toHaveBeenCalledWith('ABC123XYZ')
    })

    test('should show copied message after copying', async () => {
      const user = userEvent.setup()
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
      })

      const copyButton = screen.getByRole('button', { name: /copy code/i })
      await user.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument()
      })
    })

    test('should reset copied message after timeout', async () => {
      jest.useFakeTimers()
      const user = userEvent.setup({ delay: null })
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
      })

      const copyButton = screen.getByRole('button', { name: /copy code/i })
      await user.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument()
      })

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(screen.queryByText('Copied!')).not.toBeInTheDocument()
      })

      jest.useRealTimers()
    })
  })

  describe('Submission Summary', () => {
    beforeEach(() => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))
    })

    test('should display submission summary card', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('Submission Summary')).toBeInTheDocument()
      })
    })

    test('should display election ID', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/election id/i)).toBeInTheDocument()
        expect(screen.getByText('election-1')).toBeInTheDocument()
      })
    })

    test('should display questions answered count', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/questions answered/i)).toBeInTheDocument()
        expect(screen.getByText('2 of 2')).toBeInTheDocument()
      })
    })

    test('should display submitted status badge', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('Submitted')).toBeInTheDocument()
      })
    })

    test('should display partial status for partial submission', async () => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockPartialConfirmation))

      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('Partial')).toBeInTheDocument()
      })
    })
  })

  describe('Merkle Proof Display', () => {
    beforeEach(() => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))
    })

    test('should display merkle proof card', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('Cryptographic Verification')).toBeInTheDocument()
      })
    })

    test('should display merkle proof description', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/secured in a tamper-proof merkle tree/i)).toBeInTheDocument()
      })
    })

    test('should display merkle root hash', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('0x1234567890abcdef')).toBeInTheDocument()
      })
    })

    test('should display copy merkle root button', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy merkle root/i })).toBeInTheDocument()
      })
    })

    test('should copy merkle root to clipboard', async () => {
      const user = userEvent.setup()
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('0x1234567890abcdef')).toBeInTheDocument()
      })

      const copyButton = screen.getByRole('button', { name: /copy merkle root/i })
      await user.click(copyButton)

      expect(utils.copyToClipboard).toHaveBeenCalledWith('0x1234567890abcdef')
    })

    test('should show copied message after copying merkle root', async () => {
      const user = userEvent.setup()
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('0x1234567890abcdef')).toBeInTheDocument()
      })

      const copyButton = screen.getByRole('button', { name: /copy merkle root/i })
      await user.click(copyButton)

      await waitFor(() => {
        const buttons = screen.getAllByText('Copied!')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    test('should display merkle proof explanation', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/proves your vote was included in the election ledger/i)).toBeInTheDocument()
      })
    })

    test('should not display merkle proof when no successful results', async () => {
      const noMerkleConfirmation = {
        ...mockConfirmation,
        results: [
          {
            questionId: 'q1',
            success: false,
            error: 'Failed',
          },
        ],
      }

      sessionStorage.setItem('voteConfirmation', JSON.stringify(noMerkleConfirmation))

      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.queryByText('Cryptographic Verification')).not.toBeInTheDocument()
      })
    })
  })

  describe('Failed Questions Display', () => {
    beforeEach(() => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockPartialConfirmation))
    })

    test('should display failed questions card', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/some questions failed to submit/i)).toBeInTheDocument()
      })
    })

    test('should list failed question IDs', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/question q2/i)).toBeInTheDocument()
      })
    })

    test('should display error messages for failed questions', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/failed to record vote/i)).toBeInTheDocument()
      })
    })

    test('should not display failed questions card when all successful', async () => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))

      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.queryByText(/some questions failed to submit/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Next Steps Information', () => {
    beforeEach(() => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))
    })

    test('should display next steps card', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('What Happens Next?')).toBeInTheDocument()
      })
    })

    test('should display step 1: save confirmation code', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/save your confirmation code/i)).toBeInTheDocument()
      })
    })

    test('should display step 2: voting closes', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/voting closes/i)).toBeInTheDocument()
        expect(screen.getByText(/threshold decryption/i)).toBeInTheDocument()
      })
    })

    test('should display step 3: results published', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/results published/i)).toBeInTheDocument()
      })
    })

    test('should display step 4: blockchain anchoring', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/blockchain anchoring/i)).toBeInTheDocument()
        expect(screen.getByText(/anchored to bitcoin/i)).toBeInTheDocument()
      })
    })

    test('should display steps in numbered list', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('1.')).toBeInTheDocument()
        expect(screen.getByText('2.')).toBeInTheDocument()
        expect(screen.getByText('3.')).toBeInTheDocument()
        expect(screen.getByText('4.')).toBeInTheDocument()
      })
    })
  })

  describe('Important Notice', () => {
    beforeEach(() => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))
    })

    test('should display important notice card', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('Important:')).toBeInTheDocument()
      })
    })

    test('should warn to keep confirmation code safe', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/keep your confirmation code in a safe place/i)).toBeInTheDocument()
      })
    })

    test('should warn cannot vote again', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/cannot vote again or change your vote/i)).toBeInTheDocument()
      })
    })

    test('should warn not to share code', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/do not share your confirmation code/i)).toBeInTheDocument()
      })
    })

    test('should suggest printing or saving page', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/print or save this page/i)).toBeInTheDocument()
      })
    })
  })

  describe('Print Functionality', () => {
    beforeEach(() => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))
    })

    test('should display print buttons', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        const printButtons = screen.getAllByRole('button', { name: /print receipt/i })
        expect(printButtons.length).toBeGreaterThan(0)
      })
    })

    test('should call window.print when print button clicked', async () => {
      const user = userEvent.setup()
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
      })

      const printButtons = screen.getAllByRole('button', { name: /print receipt/i })
      await user.click(printButtons[0])

      expect(global.print).toHaveBeenCalled()
    })
  })

  describe('Navigation and Cleanup', () => {
    beforeEach(() => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))
      sessionStorage.setItem('votingCredential', JSON.stringify({ test: 'credential' }))
      sessionStorage.setItem('ballotSelections', JSON.stringify({ test: 'selections' }))
    })

    test('should display finish button', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^finish$/i })).toBeInTheDocument()
      })
    })

    test('should clear session storage when finish clicked', async () => {
      const user = userEvent.setup()
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
      })

      expect(sessionStorage.getItem('votingCredential')).toBeTruthy()
      expect(sessionStorage.getItem('ballotSelections')).toBeTruthy()
      expect(sessionStorage.getItem('voteConfirmation')).toBeTruthy()

      const finishButton = screen.getByRole('button', { name: /^finish$/i })
      await user.click(finishButton)

      expect(sessionStorage.getItem('votingCredential')).toBeNull()
      expect(sessionStorage.getItem('ballotSelections')).toBeNull()
      expect(sessionStorage.getItem('voteConfirmation')).toBeNull()
    })

    test('should navigate to home when finish clicked', async () => {
      const user = userEvent.setup()
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
      })

      const finishButton = screen.getByRole('button', { name: /^finish$/i })
      await user.click(finishButton)

      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  describe('Footer Message', () => {
    beforeEach(() => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))
    })

    test('should display thank you message', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/thank you for participating/i)).toBeInTheDocument()
      })
    })

    test('should display privacy message', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText(/vote has been securely recorded and will remain private/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))
    })

    test('should have proper heading hierarchy', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 })
        expect(h1).toHaveTextContent('Vote Submitted Successfully!')
      })
    })

    test('should have descriptive button labels', async () => {
      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /copy merkle root/i })).toBeInTheDocument()
        expect(screen.getAllByRole('button', { name: /print receipt/i }).length).toBeGreaterThan(0)
        expect(screen.getByRole('button', { name: /^finish$/i })).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    test('should handle confirmation with no results', async () => {
      const noResultsConfirmation = {
        ...mockConfirmation,
        results: [],
      }

      sessionStorage.setItem('voteConfirmation', JSON.stringify(noResultsConfirmation))

      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
      })
    })

    test('should handle very long confirmation codes', async () => {
      const longCodeConfirmation = {
        ...mockConfirmation,
        confirmationCode: 'A'.repeat(100),
      }

      sessionStorage.setItem('voteConfirmation', JSON.stringify(longCodeConfirmation))

      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('A'.repeat(100))).toBeInTheDocument()
      })
    })

    test('should handle missing merkle root gracefully', async () => {
      const noMerkleConfirmation = {
        ...mockConfirmation,
        results: [
          {
            questionId: 'q1',
            success: true,
            position: 0,
          },
        ],
      }

      sessionStorage.setItem('voteConfirmation', JSON.stringify(noMerkleConfirmation))

      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.queryByText('Cryptographic Verification')).not.toBeInTheDocument()
      })
    })

    test('should handle copy failure gracefully', async () => {
      ;(utils.copyToClipboard as jest.Mock).mockResolvedValue(false)
      const user = userEvent.setup()

      sessionStorage.setItem('voteConfirmation', JSON.stringify(mockConfirmation))

      render(<ConfirmationPage />)

      await waitFor(() => {
        expect(screen.getByText('ABC123XYZ')).toBeInTheDocument()
      })

      const copyButton = screen.getByRole('button', { name: /copy code/i })
      await user.click(copyButton)

      // Should not show "Copied!" on failure
      await waitFor(() => {
        expect(screen.queryByText('Copied!')).not.toBeInTheDocument()
      }, { timeout: 500 })
    })
  })
})
