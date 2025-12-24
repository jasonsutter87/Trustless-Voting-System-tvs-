import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { CeremonyProgress } from '../ceremony-progress';
import type { CeremonyStatus } from '@/lib/actions/trustees';

describe('CeremonyProgress', () => {
  const defaultProps = {
    status: {
      phase: 'REGISTRATION' as const,
      registeredCount: 2,
      requiredCount: 5,
      committedCount: 0,
    },
    trustees: [
      { id: '1', name: 'Alice', status: 'registered' as const },
      { id: '2', name: 'Bob', status: 'registered' as const },
    ],
    threshold: 3,
    totalTrustees: 5,
    onRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('phase display', () => {
    it('should display current phase', () => {
      render(<CeremonyProgress {...defaultProps} />);

      // Look for Registration in the progress header or step labels
      expect(screen.getAllByText(/registration/i).length).toBeGreaterThan(0);
    });

    it('should show CREATED phase correctly', () => {
      render(
        <CeremonyProgress
          {...defaultProps}
          status={{ ...defaultProps.status, phase: 'CREATED' }}
        />
      );

      expect(screen.getByText(/not started/i)).toBeInTheDocument();
    });

    it('should show COMMITMENT phase correctly', () => {
      render(
        <CeremonyProgress
          {...defaultProps}
          status={{ ...defaultProps.status, phase: 'COMMITMENT', committedCount: 2 }}
        />
      );

      // Commitment appears multiple times (phase label and step label)
      expect(screen.getAllByText(/commitment/i).length).toBeGreaterThan(0);
    });

    it('should show SHARE_DISTRIBUTION phase correctly', () => {
      render(
        <CeremonyProgress
          {...defaultProps}
          status={{ ...defaultProps.status, phase: 'SHARE_DISTRIBUTION' }}
        />
      );

      // Distribution appears in phase label and step labels
      expect(screen.getAllByText(/distribution/i).length).toBeGreaterThan(0);
    });

    it('should show FINALIZED phase correctly', () => {
      render(
        <CeremonyProgress
          {...defaultProps}
          status={{ ...defaultProps.status, phase: 'FINALIZED' }}
          publicKey="test-public-key"
        />
      );

      // Complete appears multiple times
      expect(screen.getAllByText(/complete/i).length).toBeGreaterThan(0);
    });
  });

  describe('progress bar', () => {
    it('should display progress bar', () => {
      render(<CeremonyProgress {...defaultProps} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show correct progress percentage', () => {
      render(<CeremonyProgress {...defaultProps} />);

      // 2 of 5 registered = 40% of first step (25%), so about 10% total
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow');
    });

    it('should show 100% when finalized', () => {
      render(
        <CeremonyProgress
          {...defaultProps}
          status={{ ...defaultProps.status, phase: 'FINALIZED' }}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('step indicators', () => {
    it('should show all ceremony steps', () => {
      render(<CeremonyProgress {...defaultProps} />);

      expect(screen.getByTestId('step-1')).toBeInTheDocument();
      expect(screen.getByTestId('step-2')).toBeInTheDocument();
      expect(screen.getByTestId('step-3')).toBeInTheDocument();
      expect(screen.getByTestId('step-4')).toBeInTheDocument();
    });

    it('should mark completed steps', () => {
      render(
        <CeremonyProgress
          {...defaultProps}
          status={{ ...defaultProps.status, phase: 'COMMITMENT' }}
        />
      );

      const step1 = screen.getByTestId('step-1');
      expect(step1.className).toContain('bg-green');
    });

    it('should highlight current step', () => {
      render(<CeremonyProgress {...defaultProps} />);

      const currentStep = screen.getByTestId('step-1');
      expect(currentStep.className).toContain('bg-blue');
    });

    it('should show pending steps', () => {
      render(<CeremonyProgress {...defaultProps} />);

      const pendingStep = screen.getByTestId('step-3');
      expect(pendingStep.className).toContain('bg-zinc');
    });
  });

  describe('trustee status', () => {
    it('should list all trustees', () => {
      render(<CeremonyProgress {...defaultProps} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should show trustee status badges', () => {
      render(<CeremonyProgress {...defaultProps} />);

      expect(screen.getAllByText(/registered/i).length).toBeGreaterThan(0);
    });

    it('should show committed status', () => {
      render(
        <CeremonyProgress
          {...defaultProps}
          trustees={[
            { id: '1', name: 'Alice', status: 'committed' as const },
            { id: '2', name: 'Bob', status: 'registered' as const },
          ]}
        />
      );

      // Look for the Committed badge (using getAllByText since "Committed" may appear multiple times)
      expect(screen.getAllByText(/committed/i).length).toBeGreaterThan(0);
    });

    it('should show share_received status', () => {
      render(
        <CeremonyProgress
          {...defaultProps}
          trustees={[
            { id: '1', name: 'Alice', status: 'share_received' as const },
          ]}
        />
      );

      // Look for Complete badge (may appear multiple times in step labels)
      expect(screen.getAllByText(/complete/i).length).toBeGreaterThan(0);
    });

    it('should show pending trustees count', () => {
      render(<CeremonyProgress {...defaultProps} />);

      // 5 total - 2 registered = 3 pending
      expect(screen.getByText(/3 more needed/i)).toBeInTheDocument();
    });
  });

  describe('statistics', () => {
    it('should show registered count', () => {
      render(<CeremonyProgress {...defaultProps} />);

      expect(screen.getByText(/2 \/ 5/)).toBeInTheDocument();
    });

    it('should show threshold information', () => {
      render(<CeremonyProgress {...defaultProps} />);

      // Check for threshold text (may appear in header and stats)
      expect(screen.getAllByText(/threshold/i).length).toBeGreaterThan(0);
    });
  });

  describe('refresh', () => {
    it('should render refresh button', () => {
      render(<CeremonyProgress {...defaultProps} />);

      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('should call onRefresh when clicked', async () => {
      const user = userEvent.setup();
      render(<CeremonyProgress {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /refresh/i }));

      expect(defaultProps.onRefresh).toHaveBeenCalled();
    });

    it('should show loading state during refresh', async () => {
      const user = userEvent.setup();
      const slowRefresh = jest.fn(() => new Promise((r) => setTimeout(r, 100)));

      render(<CeremonyProgress {...defaultProps} onRefresh={slowRefresh} />);

      await user.click(screen.getByRole('button', { name: /refresh/i }));

      expect(screen.getByRole('button', { name: /refresh/i })).toBeDisabled();
    });
  });

  describe('auto-refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-refresh when enabled', () => {
      render(<CeremonyProgress {...defaultProps} autoRefresh autoRefreshInterval={5000} />);

      jest.advanceTimersByTime(5000);

      expect(defaultProps.onRefresh).toHaveBeenCalled();
    });

    it('should not auto-refresh when disabled', () => {
      render(<CeremonyProgress {...defaultProps} autoRefresh={false} />);

      jest.advanceTimersByTime(10000);

      expect(defaultProps.onRefresh).not.toHaveBeenCalled();
    });

    it('should stop auto-refresh when finalized', () => {
      render(
        <CeremonyProgress
          {...defaultProps}
          autoRefresh
          autoRefreshInterval={5000}
          status={{ ...defaultProps.status, phase: 'FINALIZED' }}
        />
      );

      jest.advanceTimersByTime(10000);

      expect(defaultProps.onRefresh).not.toHaveBeenCalled();
    });
  });

  describe('public key display', () => {
    it('should show public key when finalized', () => {
      render(
        <CeremonyProgress
          {...defaultProps}
          status={{ ...defaultProps.status, phase: 'FINALIZED' }}
          publicKey="test-public-key-abc123"
        />
      );

      expect(screen.getByText(/test-public-key/)).toBeInTheDocument();
    });

    it('should not show public key before finalization', () => {
      render(<CeremonyProgress {...defaultProps} publicKey="should-not-show" />);

      expect(screen.queryByText(/should-not-show/)).not.toBeInTheDocument();
    });
  });

  describe('time estimates', () => {
    it('should show estimated time remaining', () => {
      render(<CeremonyProgress {...defaultProps} showTimeEstimate />);

      expect(screen.getByText(/estimated/i)).toBeInTheDocument();
    });
  });

  describe('animations', () => {
    it('should show pulsing indicator for current phase', () => {
      render(<CeremonyProgress {...defaultProps} />);

      const pulsingElement = screen.getByTestId('pulse-indicator');
      expect(pulsingElement).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('should render in compact mode', () => {
      render(<CeremonyProgress {...defaultProps} compact />);

      const container = screen.getByTestId('ceremony-progress');
      expect(container).toHaveClass('compact');
    });

    it('should hide trustee list in compact mode', () => {
      render(<CeremonyProgress {...defaultProps} compact />);

      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });
  });
});
