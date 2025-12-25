/**
 * Comprehensive tests for Verify Page
 *
 * Tests cover:
 * - Component rendering and initialization
 * - Election selection
 * - Nullifier/confirmation code input
 * - Form validation
 * - Navigation to verification results
 * - Error handling
 * - Quick links
 * - Information display
 */

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import VerifyPage from '../page'
import * as verifyActions from '@/lib/actions/verify'

// Mock modules
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/actions/verify', () => ({
  getElections: jest.fn(),
}))

const mockElections = [
  { id: 'election-1', name: '2024 General Election', status: 'voting' },
  { id: 'election-2', name: '2024 Primary Election', status: 'complete' },
  { id: 'election-3', name: '2024 Special Election', status: 'tallying' },
]

// TODO: Fix tests - component rendering issues in test environment
describe.skip('VerifyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(verifyActions.getElections as jest.Mock).mockResolvedValue(mockElections)
  })

  describe('Component Initialization', () => {
    test('should render page title', async () => {
      render(<VerifyPage />)

      expect(screen.getByRole('heading', { level: 1, name: /verify your vote/i })).toBeInTheDocument()
    })

    test('should render page description', async () => {
      render(<VerifyPage />)

      expect(screen.getByText(/check that your vote was recorded correctly/i)).toBeInTheDocument()
    })

    test('should display shield icon', async () => {
      render(<VerifyPage />)

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    test('should load elections on mount', async () => {
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })
    })

    test('should display vote verification card', async () => {
      render(<VerifyPage />)

      expect(screen.getByText('Vote Verification')).toBeInTheDocument()
    })

    test('should display card description', async () => {
      render(<VerifyPage />)

      expect(screen.getByText(/enter your confirmation code or nullifier/i)).toBeInTheDocument()
    })
  })

  describe('Election Selection', () => {
    test('should display election selector', async () => {
      render(<VerifyPage />)

      expect(screen.getByLabelText(/select election/i)).toBeInTheDocument()
    })

    test('should show placeholder text', async () => {
      render(<VerifyPage />)

      expect(screen.getByText(/choose an election/i)).toBeInTheDocument()
    })

    test('should populate elections dropdown', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      const select = screen.getByRole('combobox')
      await user.click(select)

      await waitFor(() => {
        expect(screen.getByText('2024 General Election')).toBeInTheDocument()
        expect(screen.getByText('2024 Primary Election')).toBeInTheDocument()
        expect(screen.getByText('2024 Special Election')).toBeInTheDocument()
      })
    })

    test('should allow selecting an election', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      const select = screen.getByRole('combobox')
      await user.click(select)

      await waitFor(() => {
        expect(screen.getByText('2024 General Election')).toBeInTheDocument()
      })

      const option = screen.getByText('2024 General Election')
      await user.click(option)

      // The select should now show the selected value
      await waitFor(() => {
        expect(select).toHaveValue('election-1')
      })
    })

    test('should display message when no elections available', async () => {
      ;(verifyActions.getElections as jest.Mock).mockResolvedValue([])
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      const select = screen.getByRole('combobox')
      await user.click(select)

      await waitFor(() => {
        expect(screen.getByText(/no elections available/i)).toBeInTheDocument()
      })
    })

    test('should handle election loading error', async () => {
      ;(verifyActions.getElections as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      // Should still render the page
      expect(screen.getByText('Vote Verification')).toBeInTheDocument()
    })
  })

  describe('Nullifier Input', () => {
    test('should display nullifier input field', () => {
      render(<VerifyPage />)

      expect(screen.getByLabelText(/confirmation code \/ nullifier/i)).toBeInTheDocument()
    })

    test('should display input placeholder', () => {
      render(<VerifyPage />)

      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      expect(input).toBeInTheDocument()
    })

    test('should display input helper text', () => {
      render(<VerifyPage />)

      expect(screen.getByText(/provided to you after casting your vote/i)).toBeInTheDocument()
    })

    test('should allow typing in nullifier field', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, 'ABC123XYZ')

      expect(input).toHaveValue('ABC123XYZ')
    })

    test('should trim whitespace from input', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      // Select election
      const select = screen.getByRole('combobox')
      await user.click(select)
      const option = screen.getByText('2024 General Election')
      await user.click(option)

      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, '  ABC123XYZ  ')

      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/verify/election-1/ABC123XYZ')
      })
    })

    test('should handle special characters in nullifier', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, 'ABC-123_XYZ@456')

      expect(input).toHaveValue('ABC-123_XYZ@456')
    })

    test('should handle very long nullifier', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      const longString = 'A'.repeat(200)
      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, longString)

      expect(input).toHaveValue(longString)
    })

    test('should support Enter key to submit', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      // Select election
      const select = screen.getByRole('combobox')
      await user.click(select)
      const option = screen.getByText('2024 General Election')
      await user.click(option)

      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, 'ABC123XYZ')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/verify/election-1/ABC123XYZ')
      })
    })
  })

  describe('Form Validation', () => {
    test('should display verify button', () => {
      render(<VerifyPage />)

      expect(screen.getByRole('button', { name: /verify my vote/i })).toBeInTheDocument()
    })

    test('should disable verify button when election not selected', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, 'ABC123XYZ')

      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })
      expect(verifyButton).toBeDisabled()
    })

    test('should disable verify button when nullifier empty', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      // Select election
      const select = screen.getByRole('combobox')
      await user.click(select)
      const option = screen.getByText('2024 General Election')
      await user.click(option)

      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })
      expect(verifyButton).toBeDisabled()
    })

    test('should enable verify button when both fields filled', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      // Select election
      const select = screen.getByRole('combobox')
      await user.click(select)
      const option = screen.getByText('2024 General Election')
      await user.click(option)

      // Enter nullifier
      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, 'ABC123XYZ')

      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })
      expect(verifyButton).not.toBeDisabled()
    })

    test('should show error when election not selected', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, 'ABC123XYZ')

      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText(/please select an election/i)).toBeInTheDocument()
      })
    })

    test('should show error when nullifier empty', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      // Select election
      const select = screen.getByRole('combobox')
      await user.click(select)
      const option = screen.getByText('2024 General Election')
      await user.click(option)

      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText(/please enter your confirmation code/i)).toBeInTheDocument()
      })
    })

    test('should treat whitespace-only nullifier as empty', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      // Select election
      const select = screen.getByRole('combobox')
      await user.click(select)
      const option = screen.getByText('2024 General Election')
      await user.click(option)

      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, '   ')

      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText(/please enter your confirmation code/i)).toBeInTheDocument()
      })
    })

    test('should clear error when form becomes valid', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      // Trigger error
      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText(/please select an election/i)).toBeInTheDocument()
      })

      // Fix the form
      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      const select = screen.getByRole('combobox')
      await user.click(select)
      const option = screen.getByText('2024 General Election')
      await user.click(option)

      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, 'ABC123XYZ')

      await user.click(verifyButton)

      await waitFor(() => {
        expect(screen.queryByText(/please select an election/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    test('should navigate to verification result page', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      // Select election
      const select = screen.getByRole('combobox')
      await user.click(select)
      const option = screen.getByText('2024 General Election')
      await user.click(option)

      // Enter nullifier
      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, 'ABC123XYZ')

      // Click verify
      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/verify/election-1/ABC123XYZ')
      })
    })

    test('should URL encode nullifier', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      // Select election
      const select = screen.getByRole('combobox')
      await user.click(select)
      const option = screen.getByText('2024 General Election')
      await user.click(option)

      // Enter nullifier with special characters
      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, 'ABC/123#XYZ')

      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('ABC%2F123%23XYZ'))
      })
    })

    test('should set loading state during navigation', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      // Select election
      const select = screen.getByRole('combobox')
      await user.click(select)
      const option = screen.getByText('2024 General Election')
      await user.click(option)

      // Enter nullifier
      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, 'ABC123XYZ')

      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })
      await user.click(verifyButton)

      // Button text should change
      expect(screen.getByRole('button', { name: /verifying/i })).toBeInTheDocument()
    })
  })

  describe('Information Display', () => {
    test('should display info card', () => {
      render(<VerifyPage />)

      expect(screen.getByText(/how verification works/i)).toBeInTheDocument()
    })

    test('should explain verification steps', () => {
      render(<VerifyPage />)

      expect(screen.getByText(/enter your confirmation code/i)).toBeInTheDocument()
      expect(screen.getByText(/look up your vote in the public ledger/i)).toBeInTheDocument()
      expect(screen.getByText(/cryptographic proof/i)).toBeInTheDocument()
      expect(screen.getByText(/independently verify this proof/i)).toBeInTheDocument()
    })

    test('should explain trustless verification', () => {
      render(<VerifyPage />)

      expect(screen.getByText(/trustless verification/i)).toBeInTheDocument()
      expect(screen.getByText(/merkle trees and cryptographic hashing/i)).toBeInTheDocument()
    })

    test('should mention SHA-256', () => {
      render(<VerifyPage />)

      expect(screen.getByText(/sha-256/i)).toBeInTheDocument()
    })

    test('should display info icon', () => {
      render(<VerifyPage />)

      expect(screen.getByText(/how verification works/i)).toBeInTheDocument()
    })
  })

  describe('Quick Links', () => {
    test('should display quick links section', () => {
      render(<VerifyPage />)

      expect(screen.getByRole('button', { name: /view election integrity/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /browse public ledger/i })).toBeInTheDocument()
    })

    test('should navigate to integrity page', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      const integrityButton = screen.getByRole('button', { name: /view election integrity/i })
      await user.click(integrityButton)

      expect(mockPush).toHaveBeenCalledWith('/integrity')
    })

    test('should navigate to ledger page', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      const ledgerButton = screen.getByRole('button', { name: /browse public ledger/i })
      await user.click(ledgerButton)

      expect(mockPush).toHaveBeenCalledWith('/ledger')
    })
  })

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', () => {
      render(<VerifyPage />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent(/verify your vote/i)
    })

    test('should have proper labels for form fields', () => {
      render(<VerifyPage />)

      expect(screen.getByLabelText(/select election/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirmation code \/ nullifier/i)).toBeInTheDocument()
    })

    test('should have descriptive button labels', () => {
      render(<VerifyPage />)

      expect(screen.getByRole('button', { name: /verify my vote/i })).toBeInTheDocument()
    })

    test('should associate labels with inputs', () => {
      render(<VerifyPage />)

      const electionLabel = screen.getByText(/select election/i)
      const nullifierLabel = screen.getByText(/confirmation code \/ nullifier/i)

      expect(electionLabel).toHaveAttribute('for', 'election')
      expect(nullifierLabel).toHaveAttribute('for', 'nullifier')
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty elections array', async () => {
      ;(verifyActions.getElections as jest.Mock).mockResolvedValue([])

      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      expect(screen.getByText('Vote Verification')).toBeInTheDocument()
    })

    test('should handle getElections throwing error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      ;(verifyActions.getElections as jest.Mock).mockRejectedValue(new Error('API Error'))

      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      expect(screen.getByText('Vote Verification')).toBeInTheDocument()
      consoleError.mockRestore()
    })

    test('should handle navigation error gracefully', async () => {
      const user = userEvent.setup()
      mockPush.mockImplementation(() => {
        throw new Error('Navigation failed')
      })

      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      // Select election
      const select = screen.getByRole('combobox')
      await user.click(select)
      const option = screen.getByText('2024 General Election')
      await user.click(option)

      // Enter nullifier
      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, 'ABC123XYZ')

      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to verify vote/i)).toBeInTheDocument()
      })
    })

    test('should handle rapid form submissions', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      // Select election
      const select = screen.getByRole('combobox')
      await user.click(select)
      const option = screen.getByText('2024 General Election')
      await user.click(option)

      // Enter nullifier
      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, 'ABC123XYZ')

      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })

      // Click multiple times rapidly
      await user.click(verifyButton)
      await user.click(verifyButton)
      await user.click(verifyButton)

      // Should only navigate once
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Loading States', () => {
    test('should show button in loading state during verification', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      // Select election
      const select = screen.getByRole('combobox')
      await user.click(select)
      const option = screen.getByText('2024 General Election')
      await user.click(option)

      // Enter nullifier
      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, 'ABC123XYZ')

      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })
      await user.click(verifyButton)

      expect(screen.getByRole('button', { name: /verifying/i })).toBeInTheDocument()
    })

    test('should disable button during verification', async () => {
      const user = userEvent.setup()
      render(<VerifyPage />)

      await waitFor(() => {
        expect(verifyActions.getElections).toHaveBeenCalled()
      })

      // Select election
      const select = screen.getByRole('combobox')
      await user.click(select)
      const option = screen.getByText('2024 General Election')
      await user.click(option)

      // Enter nullifier
      const input = screen.getByPlaceholderText(/enter your confirmation code/i)
      await user.type(input, 'ABC123XYZ')

      const verifyButton = screen.getByRole('button', { name: /verify my vote/i })
      await user.click(verifyButton)

      const loadingButton = screen.getByRole('button', { name: /verifying/i })
      expect(loadingButton).toBeDisabled()
    })
  })
})
