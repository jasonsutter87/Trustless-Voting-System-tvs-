import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { CommitmentForm } from '../commitment-form';

// Mock the submitCommitment action
jest.mock('@/lib/actions/trustees', () => ({
  submitCommitment: jest.fn(),
}));

import { submitCommitment } from '@/lib/actions/trustees';

const mockSubmitCommitment = submitCommitment as jest.MockedFunction<
  typeof submitCommitment
>;

describe('CommitmentForm', () => {
  const defaultProps = {
    electionId: 'test-election-id',
    trusteeId: 'test-trustee-id',
    trusteeName: 'Alice',
    onSuccess: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitCommitment.mockResolvedValue({
      status: 'awaiting_commitments',
      ceremonyStatus: {
        phase: 'COMMITMENT',
        registeredCount: 5,
        requiredCount: 5,
        committedCount: 1,
      },
    });
  });

  describe('initial state', () => {
    it('should render the form with trustee name', () => {
      render(<CommitmentForm {...defaultProps} />);

      expect(screen.getByText(/alice/i)).toBeInTheDocument();
    });

    it('should render commitment hash input', () => {
      render(<CommitmentForm {...defaultProps} />);

      expect(screen.getByLabelText(/commitment hash/i)).toBeInTheDocument();
    });

    it('should render feldman commitments section', () => {
      render(<CommitmentForm {...defaultProps} />);

      expect(screen.getByText(/feldman commitments/i)).toBeInTheDocument();
    });

    it('should render submit button initially disabled', () => {
      render(<CommitmentForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /submit commitment/i })).toBeDisabled();
    });
  });

  describe('form validation', () => {
    it('should show error for empty commitment hash', async () => {
      const user = userEvent.setup();
      render(<CommitmentForm {...defaultProps} />);

      const hashInput = screen.getByLabelText(/commitment hash/i);
      await user.click(hashInput);
      await user.tab(); // trigger blur

      await waitFor(() => {
        expect(screen.getByText(/commitment hash is required/i)).toBeInTheDocument();
      });
    });

    it('should validate commitment hash format', async () => {
      const user = userEvent.setup();
      render(<CommitmentForm {...defaultProps} />);

      const hashInput = screen.getByLabelText(/commitment hash/i);
      await user.type(hashInput, 'invalid-hash');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid hash format/i)).toBeInTheDocument();
      });
    });

    it('should accept valid hex commitment hash', async () => {
      const user = userEvent.setup();
      render(<CommitmentForm {...defaultProps} />);

      const validHash = 'a'.repeat(64); // 64 hex characters
      const hashInput = screen.getByLabelText(/commitment hash/i);
      await user.type(hashInput, validHash);
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/invalid hash format/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('feldman commitments', () => {
    it('should show add commitment button', () => {
      render(<CommitmentForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /add commitment point/i })).toBeInTheDocument();
    });

    it('should add a new commitment point when clicked', async () => {
      const user = userEvent.setup();
      render(<CommitmentForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add commitment point/i }));

      expect(screen.getByLabelText(/x coordinate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/y coordinate/i)).toBeInTheDocument();
    });

    it('should allow removing a commitment point', async () => {
      const user = userEvent.setup();
      render(<CommitmentForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add commitment point/i }));
      await user.click(screen.getByRole('button', { name: /remove/i }));

      expect(screen.queryByLabelText(/x coordinate/i)).not.toBeInTheDocument();
    });

    it('should validate commitment point coordinates', async () => {
      const user = userEvent.setup();
      render(<CommitmentForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add commitment point/i }));

      const xInput = screen.getByLabelText(/x coordinate/i);
      await user.type(xInput, 'not-a-number');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid coordinate/i)).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('should enable submit when form is valid', async () => {
      const user = userEvent.setup();
      render(<CommitmentForm {...defaultProps} />);

      const validHash = 'a'.repeat(64);
      await user.type(screen.getByLabelText(/commitment hash/i), validHash);

      await user.click(screen.getByRole('button', { name: /add commitment point/i }));
      await user.type(screen.getByLabelText(/x coordinate/i), '12345678901234567890');
      await user.type(screen.getByLabelText(/y coordinate/i), '98765432109876543210');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit commitment/i })).not.toBeDisabled();
      });
    });

    it('should call submitCommitment on form submission', async () => {
      const user = userEvent.setup();
      render(<CommitmentForm {...defaultProps} />);

      const validHash = 'a'.repeat(64);
      await user.type(screen.getByLabelText(/commitment hash/i), validHash);

      await user.click(screen.getByRole('button', { name: /add commitment point/i }));
      await user.type(screen.getByLabelText(/x coordinate/i), '12345678901234567890');
      await user.type(screen.getByLabelText(/y coordinate/i), '98765432109876543210');

      await user.click(screen.getByRole('button', { name: /submit commitment/i }));

      await waitFor(() => {
        expect(mockSubmitCommitment).toHaveBeenCalledWith(
          'test-election-id',
          'test-trustee-id',
          {
            commitmentHash: validHash,
            feldmanCommitments: [{ x: '12345678901234567890', y: '98765432109876543210' }],
          }
        );
      });
    });

    it('should disable button during submission', async () => {
      const user = userEvent.setup();
      // Create a promise that will be pending for a while
      mockSubmitCommitment.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          status: 'awaiting_commitments',
          ceremonyStatus: { phase: 'COMMITMENT', registeredCount: 5, requiredCount: 5, committedCount: 1 },
        }), 500))
      );

      render(<CommitmentForm {...defaultProps} />);

      const validHash = 'a'.repeat(64);
      await user.type(screen.getByLabelText(/commitment hash/i), validHash);
      await user.click(screen.getByRole('button', { name: /add commitment point/i }));
      await user.type(screen.getByLabelText(/x coordinate/i), '12345678901234567890');
      await user.type(screen.getByLabelText(/y coordinate/i), '98765432109876543210');

      // Wait for the button to become enabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit commitment/i })).not.toBeDisabled();
      });

      // Click submit - the button should become disabled during submission
      await user.click(screen.getByRole('button', { name: /submit commitment/i }));

      // Check that the button is disabled during loading (contains "Submitting")
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const submitBtn = buttons.find(btn => btn.textContent?.toLowerCase().includes('submit'));
        expect(submitBtn).toBeDisabled();
      });
    });

    it('should call onSuccess on successful submission', async () => {
      const user = userEvent.setup();
      render(<CommitmentForm {...defaultProps} />);

      const validHash = 'a'.repeat(64);
      await user.type(screen.getByLabelText(/commitment hash/i), validHash);
      await user.click(screen.getByRole('button', { name: /add commitment point/i }));
      await user.type(screen.getByLabelText(/x coordinate/i), '12345678901234567890');
      await user.type(screen.getByLabelText(/y coordinate/i), '98765432109876543210');

      await user.click(screen.getByRole('button', { name: /submit commitment/i }));

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('error handling', () => {
    it('should show error message on submission failure', async () => {
      const user = userEvent.setup();
      mockSubmitCommitment.mockRejectedValue(new Error('Network error'));

      render(<CommitmentForm {...defaultProps} />);

      const validHash = 'a'.repeat(64);
      await user.type(screen.getByLabelText(/commitment hash/i), validHash);
      await user.click(screen.getByRole('button', { name: /add commitment point/i }));
      await user.type(screen.getByLabelText(/x coordinate/i), '12345678901234567890');
      await user.type(screen.getByLabelText(/y coordinate/i), '98765432109876543210');

      await user.click(screen.getByRole('button', { name: /submit commitment/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should call onError on submission failure', async () => {
      const user = userEvent.setup();
      mockSubmitCommitment.mockRejectedValue(new Error('Network error'));

      render(<CommitmentForm {...defaultProps} />);

      const validHash = 'a'.repeat(64);
      await user.type(screen.getByLabelText(/commitment hash/i), validHash);
      await user.click(screen.getByRole('button', { name: /add commitment point/i }));
      await user.type(screen.getByLabelText(/x coordinate/i), '12345678901234567890');
      await user.type(screen.getByLabelText(/y coordinate/i), '98765432109876543210');

      await user.click(screen.getByRole('button', { name: /submit commitment/i }));

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      mockSubmitCommitment
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({
          status: 'awaiting_commitments',
          ceremonyStatus: {
            phase: 'COMMITMENT',
            registeredCount: 5,
            requiredCount: 5,
            committedCount: 2,
          },
        });

      render(<CommitmentForm {...defaultProps} />);

      const validHash = 'a'.repeat(64);
      await user.type(screen.getByLabelText(/commitment hash/i), validHash);
      await user.click(screen.getByRole('button', { name: /add commitment point/i }));
      await user.type(screen.getByLabelText(/x coordinate/i), '12345678901234567890');
      await user.type(screen.getByLabelText(/y coordinate/i), '98765432109876543210');

      await user.click(screen.getByRole('button', { name: /submit commitment/i }));

      await waitFor(() => {
        expect(screen.getByText(/first attempt failed/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /submit commitment/i }));

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('ceremony finalization', () => {
    it('should show success message when ceremony is finalized', async () => {
      const user = userEvent.setup();
      mockSubmitCommitment.mockResolvedValue({
        status: 'finalized',
        publicKey: 'test-public-key-123',
        threshold: 3,
        totalParticipants: 5,
        completedAt: new Date().toISOString(),
      });

      render(<CommitmentForm {...defaultProps} />);

      const validHash = 'a'.repeat(64);
      await user.type(screen.getByLabelText(/commitment hash/i), validHash);
      await user.click(screen.getByRole('button', { name: /add commitment point/i }));
      await user.type(screen.getByLabelText(/x coordinate/i), '12345678901234567890');
      await user.type(screen.getByLabelText(/y coordinate/i), '98765432109876543210');

      await user.click(screen.getByRole('button', { name: /submit commitment/i }));

      await waitFor(() => {
        expect(screen.getByText(/ceremony complete/i)).toBeInTheDocument();
      });
    });

    it('should display public key when ceremony is finalized', async () => {
      const user = userEvent.setup();
      mockSubmitCommitment.mockResolvedValue({
        status: 'finalized',
        publicKey: 'test-public-key-123',
        threshold: 3,
        totalParticipants: 5,
        completedAt: new Date().toISOString(),
      });

      render(<CommitmentForm {...defaultProps} />);

      const validHash = 'a'.repeat(64);
      await user.type(screen.getByLabelText(/commitment hash/i), validHash);
      await user.click(screen.getByRole('button', { name: /add commitment point/i }));
      await user.type(screen.getByLabelText(/x coordinate/i), '12345678901234567890');
      await user.type(screen.getByLabelText(/y coordinate/i), '98765432109876543210');

      await user.click(screen.getByRole('button', { name: /submit commitment/i }));

      await waitFor(() => {
        expect(screen.getByText(/test-public-key-123/)).toBeInTheDocument();
      });
    });
  });

  describe('instructions', () => {
    it('should show instructions for generating commitment', () => {
      render(<CommitmentForm {...defaultProps} />);

      expect(screen.getByText(/how to generate/i)).toBeInTheDocument();
    });

    it('should expand/collapse instructions', async () => {
      const user = userEvent.setup();
      render(<CommitmentForm {...defaultProps} />);

      const instructionsButton = screen.getByRole('button', { name: /how to generate/i });
      await user.click(instructionsButton);

      expect(screen.getByText(/use your private key/i)).toBeInTheDocument();
    });
  });
});
