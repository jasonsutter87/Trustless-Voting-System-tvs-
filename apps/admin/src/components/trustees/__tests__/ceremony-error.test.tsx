import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { CeremonyError } from '../ceremony-error';

describe('CeremonyError', () => {
  const defaultProps = {
    error: {
      type: 'timeout' as const,
      message: 'The ceremony has timed out',
      trusteeId: 'trustee-1',
      trusteeName: 'Alice',
    },
    onRetry: jest.fn(),
    onCancel: jest.fn(),
    onContactSupport: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('error display', () => {
    it('should render error title', () => {
      render(<CeremonyError {...defaultProps} />);

      expect(screen.getByText(/ceremony error/i)).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(<CeremonyError {...defaultProps} />);

      expect(screen.getByText(/the ceremony has timed out/i)).toBeInTheDocument();
    });

    it('should display affected trustee name', () => {
      render(<CeremonyError {...defaultProps} />);

      expect(screen.getByText(/alice/i)).toBeInTheDocument();
    });
  });

  describe('error types', () => {
    it('should show timeout-specific message', () => {
      render(<CeremonyError {...defaultProps} />);

      expect(screen.getByText(/timeout/i)).toBeInTheDocument();
    });

    it('should show network error message', () => {
      render(
        <CeremonyError
          {...defaultProps}
          error={{
            type: 'network',
            message: 'Network connection lost',
          }}
        />
      );

      expect(screen.getByText(/network connection lost/i)).toBeInTheDocument();
    });

    it('should show validation error message', () => {
      render(
        <CeremonyError
          {...defaultProps}
          error={{
            type: 'validation',
            message: 'Invalid commitment format',
            field: 'commitmentHash',
          }}
        />
      );

      expect(screen.getByText(/invalid commitment format/i)).toBeInTheDocument();
    });

    it('should show trustee_offline error', () => {
      render(
        <CeremonyError
          {...defaultProps}
          error={{
            type: 'trustee_offline',
            message: 'Trustee Bob is not responding',
            trusteeId: 'trustee-2',
            trusteeName: 'Bob',
          }}
        />
      );

      expect(screen.getByText(/bob is not responding/i)).toBeInTheDocument();
    });

    it('should show commitment_mismatch error', () => {
      render(
        <CeremonyError
          {...defaultProps}
          error={{
            type: 'commitment_mismatch',
            message: 'Commitment verification failed',
            trusteeId: 'trustee-3',
            trusteeName: 'Charlie',
          }}
        />
      );

      expect(screen.getByText(/commitment verification failed/i)).toBeInTheDocument();
    });

    it('should show generic error for unknown types', () => {
      render(
        <CeremonyError
          {...defaultProps}
          error={{
            type: 'unknown' as any,
            message: 'Something went wrong',
          }}
        />
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('should render retry button', () => {
      render(<CeremonyError {...defaultProps} />);

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      render(<CeremonyError {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /retry/i }));

      expect(defaultProps.onRetry).toHaveBeenCalled();
    });

    it('should render cancel button', () => {
      render(<CeremonyError {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CeremonyError {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('should render contact support button for critical errors', () => {
      render(
        <CeremonyError
          {...defaultProps}
          error={{
            type: 'commitment_mismatch',
            message: 'Critical: Commitment verification failed',
            trusteeId: 'trustee-3',
            trusteeName: 'Charlie',
          }}
        />
      );

      expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument();
    });

    it('should call onContactSupport when clicked', async () => {
      const user = userEvent.setup();
      render(
        <CeremonyError
          {...defaultProps}
          error={{
            type: 'commitment_mismatch',
            message: 'Critical error',
            trusteeId: 'trustee-3',
            trusteeName: 'Charlie',
          }}
        />
      );

      await user.click(screen.getByRole('button', { name: /contact support/i }));

      expect(defaultProps.onContactSupport).toHaveBeenCalled();
    });
  });

  describe('recovery suggestions', () => {
    it('should show recovery steps for timeout', () => {
      render(<CeremonyError {...defaultProps} />);

      expect(screen.getByText(/wait a few moments/i)).toBeInTheDocument();
    });

    it('should show recovery steps for network errors', () => {
      render(
        <CeremonyError
          {...defaultProps}
          error={{
            type: 'network',
            message: 'Connection lost',
          }}
        />
      );

      expect(screen.getByText(/check your internet/i)).toBeInTheDocument();
    });

    it('should show recovery steps for trustee offline', () => {
      render(
        <CeremonyError
          {...defaultProps}
          error={{
            type: 'trustee_offline',
            message: 'Trustee is offline',
            trusteeId: 'trustee-2',
            trusteeName: 'Bob',
          }}
        />
      );

      expect(screen.getByText(/contact the trustee/i)).toBeInTheDocument();
    });
  });

  describe('error details', () => {
    it('should show expand button for technical details', () => {
      const errorWithDetails = {
        ...defaultProps.error,
        technicalDetails: 'Stack trace: Error at line 42',
      };

      render(<CeremonyError {...defaultProps} error={errorWithDetails} />);

      expect(screen.getByRole('button', { name: /show details/i })).toBeInTheDocument();
    });

    it('should expand technical details when clicked', async () => {
      const user = userEvent.setup();
      const errorWithDetails = {
        ...defaultProps.error,
        technicalDetails: 'Stack trace: Error at line 42',
      };

      render(<CeremonyError {...defaultProps} error={errorWithDetails} />);

      await user.click(screen.getByRole('button', { name: /show details/i }));

      expect(screen.getByText(/stack trace/i)).toBeInTheDocument();
    });

    it('should show timestamp if provided', () => {
      const errorWithTimestamp = {
        ...defaultProps.error,
        timestamp: '2025-12-24T12:00:00Z',
      };

      render(<CeremonyError {...defaultProps} error={errorWithTimestamp} />);

      // The timestamp is formatted with toLocaleTimeString, so check for "at" text
      expect(screen.getByText(/at \d/)).toBeInTheDocument();
    });
  });

  describe('retry state', () => {
    it('should show retry count', () => {
      render(<CeremonyError {...defaultProps} retryCount={2} maxRetries={3} />);

      expect(screen.getByText(/attempt 2 of 3/i)).toBeInTheDocument();
    });

    it('should disable retry when max retries reached', () => {
      render(<CeremonyError {...defaultProps} retryCount={3} maxRetries={3} />);

      expect(screen.getByRole('button', { name: /retry/i })).toBeDisabled();
    });

    it('should show max retries message when exhausted', () => {
      render(<CeremonyError {...defaultProps} retryCount={3} maxRetries={3} />);

      expect(screen.getByText(/max retries reached/i)).toBeInTheDocument();
    });
  });

  describe('dismissal', () => {
    it('should render close button', () => {
      render(<CeremonyError {...defaultProps} />);

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should call onCancel when close is clicked', async () => {
      const user = userEvent.setup();
      render(<CeremonyError {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /close/i }));

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('severity levels', () => {
    it('should show warning style for recoverable errors', () => {
      render(
        <CeremonyError
          {...defaultProps}
          error={{
            type: 'timeout',
            message: 'Timeout',
            severity: 'warning',
          }}
        />
      );

      const container = screen.getByTestId('ceremony-error');
      expect(container).toHaveClass('border-amber-200');
    });

    it('should show error style for critical errors', () => {
      render(
        <CeremonyError
          {...defaultProps}
          error={{
            type: 'commitment_mismatch',
            message: 'Critical error',
            severity: 'critical',
          }}
        />
      );

      const container = screen.getByTestId('ceremony-error');
      expect(container).toHaveClass('border-red-200');
    });
  });
});
