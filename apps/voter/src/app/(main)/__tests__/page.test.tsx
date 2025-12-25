/**
 * Comprehensive tests for Home Page (Credential Entry)
 *
 * Tests cover:
 * - Component rendering and initialization
 * - Credential input and validation
 * - Form submission and error handling
 * - Navigation to ballot page
 * - sessionStorage interactions
 * - Loading states
 * - Security features display
 * - Quick links
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import HomePage from '../page'
import * as votingActions from '@/lib/actions/voting'

// Mock modules
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/actions/voting', () => ({
  validateCredential: jest.fn(),
}))

const validCredential = {
  electionId: 'election-123',
  nullifier: 'nullifier-abc',
  message: 'message-xyz',
  signature: 'signature-def',
}

const validCredentialString = JSON.stringify(validCredential)

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  describe('Component Initialization', () => {
    test('should render page title', () => {
      render(<HomePage />)

      expect(screen.getByRole('heading', { level: 1, name: /cast your vote/i })).toBeInTheDocument()
    })

    test('should render page description', () => {
      render(<HomePage />)

      expect(screen.getByText(/secure, private, and verifiable voting/i)).toBeInTheDocument()
    })

    test('should display shield icon', () => {
      render(<HomePage />)

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    test('should render credential entry card', () => {
      render(<HomePage />)

      expect(screen.getByText(/enter your voting credential/i)).toBeInTheDocument()
    })

    test('should display card description', () => {
      render(<HomePage />)

      expect(screen.getByText(/paste the credential you received via email/i)).toBeInTheDocument()
    })

    test('should render credential input field', () => {
      render(<HomePage />)

      expect(screen.getByLabelText(/voting credential/i)).toBeInTheDocument()
    })

    test('should display placeholder text', () => {
      render(<HomePage />)

      const textarea = screen.getByPlaceholderText(/electionId/i)
      expect(textarea).toBeInTheDocument()
    })

    test('should display helper text', () => {
      render(<HomePage />)

      expect(screen.getByText(/your credential is a json string/i)).toBeInTheDocument()
    })
  })

  describe('Credential Input', () => {
    test('should allow typing in credential field', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.type(textarea, validCredentialString)

      expect(textarea).toHaveValue(validCredentialString)
    })

    test('should handle multiline input', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      const multilineCredential = `{
  "electionId": "election-123",
  "nullifier": "nullifier-abc",
  "message": "message-xyz",
  "signature": "signature-def"
}`

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.type(textarea, multilineCredential)

      expect(textarea).toHaveValue(multilineCredential)
    })

    test('should handle paste action', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.click(textarea)
      await user.paste(validCredentialString)

      expect(textarea).toHaveValue(validCredentialString)
    })

    test('should allow clearing the input', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.type(textarea, validCredentialString)
      await user.clear(textarea)

      expect(textarea).toHaveValue('')
    })

    test('should handle very long credential strings', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      const longCredential = JSON.stringify({
        ...validCredential,
        signature: 'a'.repeat(1000),
      })

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.type(textarea, longCredential)

      expect(textarea).toHaveValue(longCredential)
    })

    test('should handle special characters in credential', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      const specialCredential = JSON.stringify({
        ...validCredential,
        message: 'test@example.com!#$%^&*()',
      })

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(specialCredential)

      expect(textarea).toHaveValue(specialCredential)
    })
  })

  describe('Form Validation', () => {
    test('should display submit button', () => {
      render(<HomePage />)

      expect(screen.getByRole('button', { name: /continue to ballot/i })).toBeInTheDocument()
    })

    test('should disable submit button when credential is empty', () => {
      render(<HomePage />)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      expect(submitButton).toBeDisabled()
    })

    test('should disable submit button when credential is only whitespace', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.type(textarea, '   ')

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      expect(submitButton).toBeDisabled()
    })

    test('should enable submit button when credential is entered', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.type(textarea, validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      expect(submitButton).not.toBeDisabled()
    })

    test('should show error for empty credential submission', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      const form = screen.getByRole('textbox', { name: /voting credential/i }).closest('form')
      if (form) {
        const event = new Event('submit', { bubbles: true, cancelable: true })
        form.dispatchEvent(event)
      }

      await waitFor(() => {
        expect(screen.getByText(/please enter your voting credential/i)).toBeInTheDocument()
      })
    })

    test('should show error for invalid JSON format', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Invalid JSON format',
      })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.type(textarea, 'not valid json')

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/invalid json format/i)).toBeInTheDocument()
      })
    })

    test('should show error for missing required fields', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Missing required field: electionId',
      })

      render(<HomePage />)

      const incompleteCredential = JSON.stringify({
        nullifier: 'test',
        message: 'test',
      })

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(incompleteCredential)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/missing required field/i)).toBeInTheDocument()
      })
    })

    test('should show generic error message when validation fails without error message', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: false,
      })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.type(textarea, validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid credential format/i)).toBeInTheDocument()
      })
    })

    test('should clear error when correcting input', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock)
        .mockResolvedValueOnce({
          valid: false,
          error: 'Invalid format',
        })
        .mockResolvedValueOnce({
          valid: true,
          credential: validCredential,
        })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })

      // First submission - fail
      await user.type(textarea, 'invalid')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid format/i)).toBeInTheDocument()
      })

      // Fix the input
      await user.clear(textarea)
      await user.paste(validCredentialString)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/invalid format/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    test('should validate credential on submission', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: true,
        credential: validCredential,
      })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(votingActions.validateCredential).toHaveBeenCalledWith(validCredentialString)
      })
    })

    test('should trim whitespace before validation', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: true,
        credential: validCredential,
      })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.type(textarea, `  ${validCredentialString}  `)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(votingActions.validateCredential).toHaveBeenCalledWith(validCredentialString)
      })
    })

    test('should store credential in sessionStorage on success', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: true,
        credential: validCredential,
      })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(sessionStorage.getItem('votingCredential')).toBe(validCredentialString)
      })
    })

    test('should navigate to ballot page on success', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: true,
        credential: validCredential,
      })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/vote/election-123')
      })
    })

    test('should handle validation errors gracefully', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    test('should handle generic errors', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockRejectedValue('Unknown error')

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to validate credential/i)).toBeInTheDocument()
      })
    })

    test('should not navigate if credential is missing after validation', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: true,
        // Missing credential field
      })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid credential format/i)).toBeInTheDocument()
      })

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    test('should show loading state during validation', async () => {
      const user = userEvent.setup()
      let resolveValidation: any
      ;(votingActions.validateCredential as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveValidation = resolve
          })
      )

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      expect(screen.getByRole('button', { name: /validating/i })).toBeInTheDocument()

      // Cleanup
      resolveValidation({ valid: true, credential: validCredential })
    })

    test('should disable submit button during validation', async () => {
      const user = userEvent.setup()
      let resolveValidation: any
      ;(votingActions.validateCredential as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveValidation = resolve
          })
      )

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      const loadingButton = screen.getByRole('button', { name: /validating/i })
      expect(loadingButton).toBeDisabled()

      // Cleanup
      resolveValidation({ valid: true, credential: validCredential })
    })

    test('should display loading spinner during validation', async () => {
      const user = userEvent.setup()
      let resolveValidation: any
      ;(votingActions.validateCredential as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveValidation = resolve
          })
      )

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      // Check for loading text
      expect(screen.getByText(/validating/i)).toBeInTheDocument()

      // Cleanup
      resolveValidation({ valid: true, credential: validCredential })
    })

    test('should restore button state after validation completes', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Invalid',
      })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue to ballot/i })).toBeInTheDocument()
      })
    })
  })

  describe('Security Features Display', () => {
    test('should display security features section', () => {
      render(<HomePage />)

      expect(screen.getByText(/security & privacy guarantees/i)).toBeInTheDocument()
    })

    test('should list all security features', () => {
      render(<HomePage />)

      expect(screen.getByText(/vote encrypted in your browser/i)).toBeInTheDocument()
      expect(screen.getByText(/one vote per credential/i)).toBeInTheDocument()
      expect(screen.getByText(/vote cannot be linked to you/i)).toBeInTheDocument()
      expect(screen.getByText(/tamper-proof vote ledger/i)).toBeInTheDocument()
      expect(screen.getByText(/verify your vote anytime/i)).toBeInTheDocument()
      expect(screen.getByText(/bitcoin-anchored proofs/i)).toBeInTheDocument()
    })

    test('should display security icon', () => {
      render(<HomePage />)

      expect(screen.getByText(/security & privacy guarantees/i)).toBeInTheDocument()
    })
  })

  describe('Quick Links', () => {
    test('should display verify vote link', () => {
      render(<HomePage />)

      expect(screen.getByRole('link', { name: /verify your vote/i })).toBeInTheDocument()
    })

    test('should display view results link', () => {
      render(<HomePage />)

      expect(screen.getByRole('link', { name: /view results/i })).toBeInTheDocument()
    })

    test('should link to verify page', () => {
      render(<HomePage />)

      const verifyLink = screen.getByRole('link', { name: /verify your vote/i })
      expect(verifyLink).toHaveAttribute('href', '/verify')
    })

    test('should link to results page', () => {
      render(<HomePage />)

      const resultsLink = screen.getByRole('link', { name: /view results/i })
      expect(resultsLink).toHaveAttribute('href', '/results')
    })

    test('should display link descriptions', () => {
      render(<HomePage />)

      expect(screen.getByText(/check that your vote was recorded/i)).toBeInTheDocument()
      expect(screen.getByText(/see election results when available/i)).toBeInTheDocument()
    })
  })

  describe('Error Display', () => {
    test('should display error with alert role', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Test error',
      })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
        expect(alert).toHaveTextContent('Test error')
      })
    })

    test('should display error icon', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Test error',
      })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    test('should use error styling', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Test error',
      })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveClass('bg-red-50', 'text-red-800')
      })
    })
  })

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', () => {
      render(<HomePage />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent(/cast your vote/i)
    })

    test('should have label for textarea', () => {
      render(<HomePage />)

      expect(screen.getByLabelText(/voting credential/i)).toBeInTheDocument()
    })

    test('should have aria-describedby for helper text', () => {
      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      expect(textarea).toHaveAttribute('aria-describedby', 'credential-help')
    })

    test('should mark textarea as required', () => {
      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      expect(textarea).toBeRequired()
    })

    test('should have descriptive button text', () => {
      render(<HomePage />)

      expect(screen.getByRole('button', { name: /continue to ballot/i })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('should handle rapid form submissions', async () => {
      const user = userEvent.setup()
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: true,
        credential: validCredential,
      })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(validCredentialString)

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })

      // Click multiple times rapidly
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)

      await waitFor(() => {
        // Should only validate once or navigate once
        expect(votingActions.validateCredential).toHaveBeenCalled()
      })
    })

    test('should handle credentials with escaped characters', async () => {
      const user = userEvent.setup()
      const escapedCredential = {
        ...validCredential,
        message: 'Line 1\nLine 2\tTabbed',
      }
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: true,
        credential: escapedCredential,
      })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(JSON.stringify(escapedCredential))

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(votingActions.validateCredential).toHaveBeenCalled()
      })
    })

    test('should handle Unicode characters in credential', async () => {
      const user = userEvent.setup()
      const unicodeCredential = {
        ...validCredential,
        message: '你好世界 🌍',
      }
      ;(votingActions.validateCredential as jest.Mock).mockResolvedValue({
        valid: true,
        credential: unicodeCredential,
      })

      render(<HomePage />)

      const textarea = screen.getByLabelText(/voting credential/i)
      await user.paste(JSON.stringify(unicodeCredential))

      const submitButton = screen.getByRole('button', { name: /continue to ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(votingActions.validateCredential).toHaveBeenCalled()
      })
    })
  })
})
