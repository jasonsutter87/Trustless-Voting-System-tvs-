/**
 * Comprehensive tests for Review Page
 *
 * Tests cover:
 * - Component rendering and initialization
 * - Loading review data
 * - Displaying selections
 * - Encryption process
 * - Vote submission
 * - Error handling
 * - Navigation
 * - Security notices
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useParams } from 'next/navigation'
import ReviewPage from '../page'
import * as votingActions from '@/lib/actions/voting'
import * as encryption from '@/lib/encryption'

// Mock modules
const mockPush = jest.fn()
const mockBack = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

jest.mock('@/lib/actions/voting')
jest.mock('@/lib/encryption')

const mockElection: votingActions.Election = {
  id: 'election-1',
  name: '2024 General Election',
  description: 'National and local elections',
  startTime: '2024-11-01T00:00:00Z',
  endTime: '2024-11-05T23:59:59Z',
  status: 'voting',
  threshold: 3,
  totalTrustees: 5,
  publicKey: 'test-public-key',
}

const mockBallot: votingActions.BallotResponse = {
  electionId: 'election-1',
  electionName: '2024 General Election',
  voter: {
    jurisdictionId: 'US',
    jurisdictionName: 'United States',
    jurisdictionCode: 'US',
  },
  jurisdictionChain: [{ id: 'US', name: 'United States', code: 'US', level: 0 }],
  sections: [
    {
      jurisdiction: {
        id: 'US',
        name: 'United States',
        type: 'federal',
        code: 'US',
        level: 0,
      },
      questions: [
        {
          id: 'q1',
          electionId: 'election-1',
          jurisdictionId: 'US',
          title: 'President',
          description: 'Vote for President',
          questionType: 'single_choice',
          maxSelections: 1,
          allowWriteIn: false,
          displayOrder: 0,
          candidates: [
            { id: 'c1', name: 'Alice Johnson', party: 'Democratic', description: null, position: 0 },
            { id: 'c2', name: 'Bob Smith', party: 'Republican', description: null, position: 1 },
          ],
        },
        {
          id: 'q2',
          electionId: 'election-1',
          jurisdictionId: 'US',
          title: 'City Council',
          description: 'Vote for council members',
          questionType: 'multi_choice',
          maxSelections: 3,
          allowWriteIn: false,
          displayOrder: 1,
          candidates: [
            { id: 'c3', name: 'Carol Davis', party: null, description: null, position: 0 },
            { id: 'c4', name: 'David Wilson', party: null, description: null, position: 1 },
          ],
        },
      ],
    },
  ],
  totalQuestions: 2,
}

const mockCredential: votingActions.Credential = {
  electionId: 'election-1',
  nullifier: 'test-nullifier',
  message: 'test-message',
  signature: 'test-signature',
}

const mockSelections = {
  q1: 'c1',
  q2: ['c3', 'c4'],
}

const mockSubmissionResult: votingActions.VoteSubmissionResult = {
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
      merkleRoot: 'test-merkle-root-1',
    },
    {
      questionId: 'q2',
      success: true,
      position: 1,
      merkleRoot: 'test-merkle-root-2',
    },
  ],
  message: 'Vote submitted successfully',
}

describe('ReviewPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    })
    ;(useParams as jest.Mock).mockReturnValue({
      electionId: 'election-1',
    })
    sessionStorage.clear()
  })

  describe('Component Initialization', () => {
    test('should render loading state initially', () => {
      ;(votingActions.fetchElection as jest.Mock).mockImplementation(() => new Promise(() => {}))
      ;(votingActions.fetchBallot as jest.Mock).mockImplementation(() => new Promise(() => {}))

      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      render(<ReviewPage />)

      expect(screen.getByText(/loading review/i)).toBeInTheDocument()
    })

    test('should load review data on mount', async () => {
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: true,
        election: mockElection,
      })
      ;(votingActions.fetchBallot as jest.Mock).mockResolvedValue({
        success: true,
        ballot: mockBallot,
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })
    })

    test('should display page title and description', async () => {
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: true,
        election: mockElection,
      })
      ;(votingActions.fetchBallot as jest.Mock).mockResolvedValue({
        success: true,
        ballot: mockBallot,
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
        expect(screen.getByText(/please review your selections carefully/i)).toBeInTheDocument()
      })
    })

    test('should load credential from sessionStorage', async () => {
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: true,
        election: mockElection,
      })
      ;(votingActions.fetchBallot as jest.Mock).mockResolvedValue({
        success: true,
        ballot: mockBallot,
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })
    })

    test('should load selections from sessionStorage', async () => {
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: true,
        election: mockElection,
      })
      ;(votingActions.fetchBallot as jest.Mock).mockResolvedValue({
        success: true,
        ballot: mockBallot,
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson (Democratic)')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('should show error when credential missing', async () => {
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/missing voting data/i)).toBeInTheDocument()
      })
    })

    test('should show error when selections missing', async () => {
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/missing voting data/i)).toBeInTheDocument()
      })
    })

    test('should show error when election fetch fails', async () => {
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Election not found',
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/election not found/i)).toBeInTheDocument()
      })
    })

    test('should show error when ballot fetch fails', async () => {
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: true,
        election: mockElection,
      })
      ;(votingActions.fetchBallot as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Ballot not available',
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/ballot not available/i)).toBeInTheDocument()
      })
    })

    test('should display return to home button on error', async () => {
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      render(<ReviewPage />)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /return to home/i })
        expect(button).toBeInTheDocument()
      })
    })

    test('should navigate to home when return button clicked', async () => {
      const user = userEvent.setup()
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/missing voting data/i)).toBeInTheDocument()
      })

      const button = screen.getByRole('button', { name: /return to home/i })
      await user.click(button)

      expect(mockPush).toHaveBeenCalledWith('/')
    })

    test('should handle network errors', async () => {
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      ;(votingActions.fetchElection as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    test('should handle invalid JSON in sessionStorage', async () => {
      sessionStorage.setItem('votingCredential', 'invalid-json')
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/missing voting data/i)).toBeInTheDocument()
      })
    })
  })

  describe('Selection Display', () => {
    beforeEach(() => {
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: true,
        election: mockElection,
      })
      ;(votingActions.fetchBallot as jest.Mock).mockResolvedValue({
        success: true,
        ballot: mockBallot,
      })
    })

    test('should display selection summary card', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Your Selections')).toBeInTheDocument()
      })
    })

    test('should display question count', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/2 question\(s\) answered/i)).toBeInTheDocument()
      })
    })

    test('should display all question titles', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('President')).toBeInTheDocument()
        expect(screen.getByText('City Council')).toBeInTheDocument()
      })
    })

    test('should display jurisdiction names', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        const jurisdictions = screen.getAllByText('United States')
        expect(jurisdictions.length).toBeGreaterThan(0)
      })
    })

    test('should display single choice selection', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson (Democratic)')).toBeInTheDocument()
      })
    })

    test('should display multi choice selections', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Carol Davis')).toBeInTheDocument()
        expect(screen.getByText('David Wilson')).toBeInTheDocument()
      })
    })

    test('should display selections in badges', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        const badges = screen.getAllByRole('status', { hidden: true })
        expect(badges.length).toBeGreaterThan(0)
      })
    })

    test('should handle selections without party affiliation', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Carol Davis')).toBeInTheDocument()
        expect(screen.queryByText('(null)')).not.toBeInTheDocument()
      })
    })
  })

  describe('Security Notice', () => {
    beforeEach(() => {
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: true,
        election: mockElection,
      })
      ;(votingActions.fetchBallot as jest.Mock).mockResolvedValue({
        success: true,
        ballot: mockBallot,
      })
    })

    test('should display security notice', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/before you submit/i)).toBeInTheDocument()
      })
    })

    test('should mention encryption', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/votes will be encrypted/i)).toBeInTheDocument()
      })
    })

    test('should mention vote immutability', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/cannot change your vote/i)).toBeInTheDocument()
      })
    })

    test('should mention confirmation code', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/confirmation code to verify/i)).toBeInTheDocument()
      })
    })

    test('should mention anonymity', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/vote is anonymous/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    beforeEach(() => {
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: true,
        election: mockElection,
      })
      ;(votingActions.fetchBallot as jest.Mock).mockResolvedValue({
        success: true,
        ballot: mockBallot,
      })
    })

    test('should display go back button', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /go back to edit/i })).toBeInTheDocument()
      })
    })

    test('should navigate back when go back button clicked', async () => {
      const user = userEvent.setup()
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      const backButton = screen.getByRole('button', { name: /go back to edit/i })
      await user.click(backButton)

      expect(mockBack).toHaveBeenCalled()
    })

    test('should disable go back button during submission', async () => {
      const user = userEvent.setup()
      ;(encryption.encryptBallot as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit my ballot/i })
      await user.click(submitButton)

      const backButton = screen.getByRole('button', { name: /go back to edit/i })
      expect(backButton).toBeDisabled()
    })
  })

  describe('Vote Submission', () => {
    beforeEach(() => {
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: true,
        election: mockElection,
      })
      ;(votingActions.fetchBallot as jest.Mock).mockResolvedValue({
        success: true,
        ballot: mockBallot,
      })
    })

    test('should display submit button', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit my ballot/i })).toBeInTheDocument()
      })
    })

    test('should encrypt ballot before submission', async () => {
      const user = userEvent.setup()
      const mockEncryptedAnswers = [
        {
          questionId: 'q1',
          encryptedVote: 'encrypted-1',
          commitment: 'commitment-1',
          zkProof: 'proof-1',
        },
        {
          questionId: 'q2',
          encryptedVote: 'encrypted-2',
          commitment: 'commitment-2',
          zkProof: 'proof-2',
        },
      ]

      ;(encryption.encryptBallot as jest.Mock).mockResolvedValue(mockEncryptedAnswers)
      ;(votingActions.submitVote as jest.Mock).mockResolvedValue({
        success: true,
        result: mockSubmissionResult,
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit my ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(encryption.encryptBallot).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ questionId: 'q1', selection: 'c1' }),
            expect.objectContaining({ questionId: 'q2', selection: ['c3', 'c4'] }),
          ]),
          'test-public-key'
        )
      })
    })

    test('should show encryption status', async () => {
      const user = userEvent.setup()
      ;(encryption.encryptBallot as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      )

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit my ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/encrypting your votes/i)).toBeInTheDocument()
      })
    })

    test('should show submission status', async () => {
      const user = userEvent.setup()
      ;(encryption.encryptBallot as jest.Mock).mockResolvedValue([])
      ;(votingActions.submitVote as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, result: mockSubmissionResult }), 100))
      )

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit my ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/submitting your ballot/i)).toBeInTheDocument()
      })
    })

    test('should call submitVote with correct parameters', async () => {
      const user = userEvent.setup()
      const mockEncryptedAnswers = [
        {
          questionId: 'q1',
          encryptedVote: 'encrypted-1',
          commitment: 'commitment-1',
          zkProof: 'proof-1',
        },
      ]

      ;(encryption.encryptBallot as jest.Mock).mockResolvedValue(mockEncryptedAnswers)
      ;(votingActions.submitVote as jest.Mock).mockResolvedValue({
        success: true,
        result: mockSubmissionResult,
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit my ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(votingActions.submitVote).toHaveBeenCalledWith({
          electionId: 'election-1',
          credential: mockCredential,
          answers: mockEncryptedAnswers,
        })
      })
    })

    test('should navigate to confirmation page on success', async () => {
      const user = userEvent.setup()
      ;(encryption.encryptBallot as jest.Mock).mockResolvedValue([])
      ;(votingActions.submitVote as jest.Mock).mockResolvedValue({
        success: true,
        result: mockSubmissionResult,
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit my ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/vote/election-1/confirm')
      })
    })

    test('should save confirmation to sessionStorage', async () => {
      const user = userEvent.setup()
      ;(encryption.encryptBallot as jest.Mock).mockResolvedValue([])
      ;(votingActions.submitVote as jest.Mock).mockResolvedValue({
        success: true,
        result: mockSubmissionResult,
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit my ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        const saved = sessionStorage.getItem('voteConfirmation')
        expect(saved).toBeTruthy()
        expect(JSON.parse(saved!)).toEqual(mockSubmissionResult)
      })
    })

    test('should clear ballot selections after submission', async () => {
      const user = userEvent.setup()
      ;(encryption.encryptBallot as jest.Mock).mockResolvedValue([])
      ;(votingActions.submitVote as jest.Mock).mockResolvedValue({
        success: true,
        result: mockSubmissionResult,
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      expect(sessionStorage.getItem('ballotSelections')).toBeTruthy()

      const submitButton = screen.getByRole('button', { name: /submit my ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(sessionStorage.getItem('ballotSelections')).toBeNull()
      })
    })

    test('should show error when submission fails', async () => {
      const user = userEvent.setup()
      ;(encryption.encryptBallot as jest.Mock).mockResolvedValue([])
      ;(votingActions.submitVote as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Submission failed',
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit my ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/submission failed/i)).toBeInTheDocument()
      })
    })

    test('should show error when encryption fails', async () => {
      const user = userEvent.setup()
      ;(encryption.encryptBallot as jest.Mock).mockRejectedValue(
        new Error('Encryption failed')
      )

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit my ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/encryption failed/i)).toBeInTheDocument()
      })
    })

    test('should disable submit button during submission', async () => {
      const user = userEvent.setup()
      ;(encryption.encryptBallot as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit my ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })

    test('should change button text during submission', async () => {
      const user = userEvent.setup()
      ;(encryption.encryptBallot as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit my ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument()
      })
    })

    test('should handle empty public key', async () => {
      const user = userEvent.setup()
      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: true,
        election: { ...mockElection, publicKey: undefined },
      })
      ;(encryption.encryptBallot as jest.Mock).mockResolvedValue([])
      ;(votingActions.submitVote as jest.Mock).mockResolvedValue({
        success: true,
        result: mockSubmissionResult,
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit my ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(encryption.encryptBallot).toHaveBeenCalledWith(
          expect.anything(),
          'default-public-key'
        )
      })
    })
  })

  describe('Edge Cases', () => {
    test('should handle single selection', async () => {
      const singleSelection = { q1: 'c1' }
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(singleSelection))

      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: true,
        election: mockElection,
      })
      ;(votingActions.fetchBallot as jest.Mock).mockResolvedValue({
        success: true,
        ballot: mockBallot,
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/1 question\(s\) answered/i)).toBeInTheDocument()
      })
    })

    test('should handle empty selections', async () => {
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify({}))

      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: true,
        election: mockElection,
      })
      ;(votingActions.fetchBallot as jest.Mock).mockResolvedValue({
        success: true,
        ballot: mockBallot,
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(/0 question\(s\) answered/i)).toBeInTheDocument()
      })
    })

    test('should handle very long candidate names in review', async () => {
      const longNameSelections = { q1: 'c1' }
      const longNameBallot = {
        ...mockBallot,
        sections: [{
          ...mockBallot.sections[0],
          questions: [{
            ...mockBallot.sections[0].questions[0],
            candidates: [{
              id: 'c1',
              name: 'A'.repeat(100),
              party: 'Test Party',
              description: null,
              position: 0,
            }],
          }],
        }],
      }

      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(longNameSelections))

      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: true,
        election: mockElection,
      })
      ;(votingActions.fetchBallot as jest.Mock).mockResolvedValue({
        success: true,
        ballot: longNameBallot,
      })

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText(`${'A'.repeat(100)} (Test Party)`)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      sessionStorage.setItem('votingCredential', JSON.stringify(mockCredential))
      sessionStorage.setItem('ballotSelections', JSON.stringify(mockSelections))

      ;(votingActions.fetchElection as jest.Mock).mockResolvedValue({
        success: true,
        election: mockElection,
      })
      ;(votingActions.fetchBallot as jest.Mock).mockResolvedValue({
        success: true,
        ballot: mockBallot,
      })
    })

    test('should have proper heading hierarchy', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 })
        expect(h1).toHaveTextContent('Review Your Ballot')
      })
    })

    test('should have descriptive button labels', async () => {
      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /go back to edit/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /submit my ballot/i })).toBeInTheDocument()
      })
    })

    test('should have accessible status messages', async () => {
      const user = userEvent.setup()
      ;(encryption.encryptBallot as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<ReviewPage />)

      await waitFor(() => {
        expect(screen.getByText('Review Your Ballot')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /submit my ballot/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/encrypting your votes/i)).toBeInTheDocument()
      })
    })
  })
})
