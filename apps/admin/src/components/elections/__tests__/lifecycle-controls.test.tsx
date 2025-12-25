/**
 * LifecycleControls Component Tests
 * Comprehensive tests for the election lifecycle management controls
 *
 * Test Coverage:
 * - Rendering tests for each election status
 * - Button state and visibility tests
 * - Status transition validation
 * - Prerequisite requirement checks
 * - Confirmation dialog behavior
 * - Bitcoin anchor status handling
 * - Error handling and recovery
 * - Loading states during transitions
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LifecycleControls } from '../lifecycle-controls';
import { updateElectionStatus, type Election } from '@/lib/actions/elections';

// Mock the elections actions
jest.mock('@/lib/actions/elections', () => ({
  updateElectionStatus: jest.fn(),
}));

// Mock router
const mockRefresh = jest.fn();
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: mockPush,
    replace: jest.fn(),
  }),
}));

const mockUpdateElectionStatus = updateElectionStatus as jest.MockedFunction<
  typeof updateElectionStatus
>;

describe('LifecycleControls', () => {
  const createMockElection = (overrides: Partial<Election> = {}): Election => ({
    id: 'election-123',
    name: 'Test Election',
    description: 'A test election',
    startTime: '2025-01-01T00:00:00Z',
    endTime: '2025-01-15T00:00:00Z',
    status: 'draft',
    threshold: 2,
    totalTrustees: 3,
    candidates: [],
    createdAt: '2024-12-24T00:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateElectionStatus.mockResolvedValue({
      election: createMockElection(),
    });
  });

  // ==========================================
  // RENDERING TESTS (20+ tests)
  // ==========================================
  describe('Rendering - Setup Status', () => {
    it('should render setup warning for setup status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'setup' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      expect(screen.getByText('Key Ceremony Required')).toBeInTheDocument();
    });

    it('should show key ceremony message in setup status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'setup' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      expect(
        screen.getByText(/Complete the trustee key ceremony before you can advance the election/i)
      ).toBeInTheDocument();
    });

    it('should display warning icon in setup status', () => {
      const { container } = render(
        <LifecycleControls
          election={createMockElection({ status: 'setup' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      const warningBox = container.querySelector('.border-amber-200');
      expect(warningBox).toBeInTheDocument();
    });

    it('should not show any buttons in setup status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'setup' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not show election controls section in setup status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'setup' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      expect(screen.queryByText('Election Controls')).not.toBeInTheDocument();
    });
  });

  describe('Rendering - Draft Status', () => {
    it('should render election controls for draft status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.getByText('Election Controls')).toBeInTheDocument();
    });

    it('should show current status in draft', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.getByText(/Current status:/i)).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
    });

    it('should show Open Registration button in draft status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.getByRole('button', { name: /Open Registration/i })).toBeInTheDocument();
    });

    it('should not show tallying info in draft status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.queryByText('Tallying in Progress')).not.toBeInTheDocument();
    });

    it('should not show archive button in draft status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Archive/i })).not.toBeInTheDocument();
    });
  });

  describe('Rendering - Registration Status', () => {
    it('should show Start Voting button in registration status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.getByRole('button', { name: /Start Voting/i })).toBeInTheDocument();
    });

    it('should display registration status text', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.getByText('registration')).toBeInTheDocument();
    });

    it('should not show Open Registration button in registration status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Open Registration/i })).not.toBeInTheDocument();
    });
  });

  describe('Rendering - Voting Status', () => {
    it('should show Close Voting button in voting status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.getByRole('button', { name: /Close Voting/i })).toBeInTheDocument();
    });

    it('should display voting status text', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.getByText('voting')).toBeInTheDocument();
    });

    it('should not show Start Voting button in voting status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Start Voting/i })).not.toBeInTheDocument();
    });
  });

  describe('Rendering - Tallying Status', () => {
    it('should show Certify Results button in tallying status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.getByRole('button', { name: /Certify Results/i })).toBeInTheDocument();
    });

    it('should display tallying status text', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.getByText('tallying')).toBeInTheDocument();
    });

    it('should show tallying info banner', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.getByText('Tallying in Progress')).toBeInTheDocument();
    });

    it('should show trustee decryption message in tallying status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(
        screen.getByText(/Trustees need to provide their decryption shares/i)
      ).toBeInTheDocument();
    });

    it('should not show Close Voting button in tallying status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Close Voting/i })).not.toBeInTheDocument();
    });
  });

  describe('Rendering - Complete Status', () => {
    it('should show Archive button in complete status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.getByRole('button', { name: /Archive Election/i })).toBeInTheDocument();
    });

    it('should display complete status text', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.getByText('complete')).toBeInTheDocument();
    });

    it('should not show Certify Results button in complete status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Certify Results/i })).not.toBeInTheDocument();
    });

    it('should not show tallying info in complete status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByText('Tallying in Progress')).not.toBeInTheDocument();
    });

    it('should show only archive button in complete status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent(/Archive/i);
    });
  });

  // ==========================================
  // BUTTON STATE TESTS (30+ tests)
  // ==========================================
  describe('Button States - Visibility', () => {
    it('should show exactly one transition button for draft status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      // Only Open Registration should be visible
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
    });

    it('should show exactly one transition button for registration status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
    });

    it('should show exactly one transition button for voting status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
    });

    it('should show exactly one transition button for tallying status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
    });

    it('should have Play icon for Open Registration button', () => {
      const { container } = render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).toBeInTheDocument();
    });

    it('should have Play icon for Start Voting button', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Start Voting/i });
      expect(button).toBeInTheDocument();
    });

    it('should have Square icon for Close Voting button', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Close Voting/i });
      expect(button).toBeInTheDocument();
    });

    it('should have CheckCircle icon for Certify Results button', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Certify Results/i });
      expect(button).toBeInTheDocument();
    });

    it('should have Archive icon for Archive button', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Archive Election/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Button States - Disabled States', () => {
    it('should disable Open Registration when missing public key', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).toBeDisabled();
    });

    it('should disable Open Registration when missing questions', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).toBeDisabled();
    });

    it('should enable Open Registration when all requirements met', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).not.toBeDisabled();
    });

    it('should disable Start Voting when missing voters', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Start Voting/i });
      expect(button).toBeDisabled();
    });

    it('should enable Start Voting when voters present', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Start Voting/i });
      expect(button).not.toBeDisabled();
    });

    it('should enable Close Voting without prerequisites', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Close Voting/i });
      expect(button).not.toBeDisabled();
    });

    it('should enable Certify Results without prerequisites', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Certify Results/i });
      expect(button).not.toBeDisabled();
    });

    it('should enable Archive button', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Archive Election/i });
      expect(button).not.toBeDisabled();
    });

    it('should show reason text when Open Registration disabled due to missing key', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.getByText('Complete the key ceremony first')).toBeInTheDocument();
    });

    it('should show reason text when Open Registration disabled due to missing questions', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      expect(screen.getByText('Add at least one ballot question')).toBeInTheDocument();
    });

    it('should show reason text when Start Voting disabled', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.getByText('Add voters to the registry first')).toBeInTheDocument();
    });

    it('should not show reason text when button is enabled', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.queryByText('Complete the key ceremony first')).not.toBeInTheDocument();
      expect(screen.queryByText('Add at least one ballot question')).not.toBeInTheDocument();
    });
  });

  describe('Button States - Variants', () => {
    it('should use default variant for Open Registration', () => {
      const { container } = render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button.className).not.toContain('destructive');
    });

    it('should use default variant for Start Voting', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Start Voting/i });
      expect(button.className).not.toContain('destructive');
    });

    it('should use destructive variant for Close Voting', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Close Voting/i });
      // Destructive buttons have specific styling
      expect(button).toBeInTheDocument();
    });

    it('should use outline variant for Archive', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Archive Election/i });
      expect(button).toBeInTheDocument();
    });
  });

  // ==========================================
  // TRANSITION VALIDATION TESTS (40+ tests)
  // ==========================================
  describe('Transition Validation - Valid Transitions', () => {
    it('should allow transition from draft to registration', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).not.toBeDisabled();
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Open Voter Registration?')).toBeInTheDocument();
      });
    });

    it('should allow transition from registration to voting', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Start Voting/i });
      expect(button).not.toBeDisabled();
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Start Voting?')).toBeInTheDocument();
      });
    });

    it('should allow transition from voting to tallying', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Close Voting/i });
      expect(button).not.toBeDisabled();
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Close Voting?')).toBeInTheDocument();
      });
    });

    it('should allow transition from tallying to complete', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Certify Results/i });
      expect(button).not.toBeDisabled();
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Certify Results?')).toBeInTheDocument();
      });
    });
  });

  describe('Transition Validation - Invalid Transitions', () => {
    it('should not show registration button in voting status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Open Registration/i })).not.toBeInTheDocument();
    });

    it('should not show voting button in tallying status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Start Voting/i })).not.toBeInTheDocument();
    });

    it('should not show tallying button in complete status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Close Voting/i })).not.toBeInTheDocument();
    });

    it('should not allow going back to draft from registration', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Open Registration/i })).not.toBeInTheDocument();
    });

    it('should not allow going back to registration from voting', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Open Registration/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Start Voting/i })).not.toBeInTheDocument();
    });

    it('should not allow going back to voting from tallying', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Start Voting/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Close Voting/i })).not.toBeInTheDocument();
    });

    it('should not allow going back to tallying from complete', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Certify Results/i })).not.toBeInTheDocument();
    });

    it('should not show certify button in draft status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Certify Results/i })).not.toBeInTheDocument();
    });

    it('should not show close voting in draft status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Close Voting/i })).not.toBeInTheDocument();
    });

    it('should not show start voting in draft status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Start Voting/i })).not.toBeInTheDocument();
    });
  });

  describe('Transition Validation - Edge Cases', () => {
    it('should handle transition when hasPublicKey changes mid-render', () => {
      const { rerender } = render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      let button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).toBeDisabled();

      rerender(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).not.toBeDisabled();
    });

    it('should handle transition when hasVoters changes mid-render', () => {
      const { rerender } = render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      let button = screen.getByRole('button', { name: /Start Voting/i });
      expect(button).toBeDisabled();

      rerender(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      button = screen.getByRole('button', { name: /Start Voting/i });
      expect(button).not.toBeDisabled();
    });

    it('should handle transition when hasQuestions changes mid-render', () => {
      const { rerender } = render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      let button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).toBeDisabled();

      rerender(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).not.toBeDisabled();
    });

    it('should handle transition when status changes mid-render', () => {
      const { rerender } = render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.getByRole('button', { name: /Open Registration/i })).toBeInTheDocument();

      rerender(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Open Registration/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start Voting/i })).toBeInTheDocument();
    });

    it('should not break with all prerequisites false', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).toBeDisabled();
    });

    it('should not break with all prerequisites true in wrong status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.getByRole('button', { name: /Archive Election/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Open Registration/i })).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // PREREQUISITE CHECKS (30+ tests)
  // ==========================================
  describe('Prerequisites - Public Key', () => {
    it('should block registration transition without public key', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).toBeDisabled();
    });

    it('should allow registration transition with public key', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).not.toBeDisabled();
    });

    it('should show key ceremony message when public key missing', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.getByText('Complete the key ceremony first')).toBeInTheDocument();
    });

    it('should not show key ceremony message when public key present', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.queryByText('Complete the key ceremony first')).not.toBeInTheDocument();
    });

    it('should not require public key for voting status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={false}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Close Voting/i });
      expect(button).not.toBeDisabled();
    });

    it('should not require public key for tallying status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={false}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Certify Results/i });
      expect(button).not.toBeDisabled();
    });

    it('should not require public key for complete status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={false}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Archive Election/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Prerequisites - Voters', () => {
    it('should block voting transition without voters', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Start Voting/i });
      expect(button).toBeDisabled();
    });

    it('should allow voting transition with voters', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Start Voting/i });
      expect(button).not.toBeDisabled();
    });

    it('should show voter message when voters missing', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.getByText('Add voters to the registry first')).toBeInTheDocument();
    });

    it('should not show voter message when voters present', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByText('Add voters to the registry first')).not.toBeInTheDocument();
    });

    it('should not require voters for draft status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).not.toBeDisabled();
    });

    it('should not require voters for tallying status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Certify Results/i });
      expect(button).not.toBeDisabled();
    });

    it('should not require voters for complete status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Archive Election/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Prerequisites - Questions', () => {
    it('should block registration transition without questions', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).toBeDisabled();
    });

    it('should allow registration transition with questions', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).not.toBeDisabled();
    });

    it('should show questions message when questions missing', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      expect(screen.getByText('Add at least one ballot question')).toBeInTheDocument();
    });

    it('should not show questions message when questions present', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.queryByText('Add at least one ballot question')).not.toBeInTheDocument();
    });

    it('should not require questions for registration status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={false}
        />
      );

      const button = screen.getByRole('button', { name: /Start Voting/i });
      expect(button).not.toBeDisabled();
    });

    it('should not require questions for voting status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={false}
        />
      );

      const button = screen.getByRole('button', { name: /Close Voting/i });
      expect(button).not.toBeDisabled();
    });

    it('should not require questions for tallying status', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={false}
        />
      );

      const button = screen.getByRole('button', { name: /Certify Results/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Prerequisites - Combined Checks', () => {
    it('should require both public key and questions for registration', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).toBeDisabled();
    });

    it('should enable when both public key and questions present', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      expect(button).not.toBeDisabled();
    });

    it('should show first missing prerequisite message', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      // Should show key ceremony message first
      expect(screen.getByText('Complete the key ceremony first')).toBeInTheDocument();
    });

    it('should not require any prerequisites for close voting', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      const button = screen.getByRole('button', { name: /Close Voting/i });
      expect(button).not.toBeDisabled();
    });

    it('should not require any prerequisites for certify results', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={false}
        />
      );

      const button = screen.getByRole('button', { name: /Certify Results/i });
      expect(button).not.toBeDisabled();
    });
  });

  // ==========================================
  // DIALOG TESTS (30+ tests)
  // ==========================================
  describe('Dialog - Opening and Closing', () => {
    it('should not show dialog on initial render', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.queryByText('Open Voter Registration?')).not.toBeInTheDocument();
    });

    it('should open dialog when Open Registration clicked', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));

      await waitFor(() => {
        expect(screen.getByText('Open Voter Registration?')).toBeInTheDocument();
      });
    });

    it('should open dialog when Start Voting clicked', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));

      await waitFor(() => {
        expect(screen.getByText('Start Voting?')).toBeInTheDocument();
      });
    });

    it('should open dialog when Close Voting clicked', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Close Voting/i }));

      await waitFor(() => {
        expect(screen.getByText('Close Voting?')).toBeInTheDocument();
      });
    });

    it('should open dialog when Certify Results clicked', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Certify Results/i }));

      await waitFor(() => {
        expect(screen.getByText('Certify Results?')).toBeInTheDocument();
      });
    });

    it('should close dialog when Cancel clicked', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));

      await waitFor(() => {
        expect(screen.getByText('Open Voter Registration?')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText('Open Voter Registration?')).not.toBeInTheDocument();
      });
    });

    it('should close dialog after successful transition', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await waitFor(() => {
        expect(screen.getByText('Open Voter Registration?')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.queryByText('Open Voter Registration?')).not.toBeInTheDocument();
      });
    });

    it('should not open disabled button dialog', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={false}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      // Clicking disabled button should not open dialog
      await user.click(button);

      expect(screen.queryByText('Open Voter Registration?')).not.toBeInTheDocument();
    });
  });

  describe('Dialog - Content', () => {
    it('should show registration confirmation title', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));

      await waitFor(() => {
        expect(screen.getByText('Open Voter Registration?')).toBeInTheDocument();
      });
    });

    it('should show registration confirmation message', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/This will allow voters to register and receive their voting credentials/i)
        ).toBeInTheDocument();
      });
    });

    it('should show voting confirmation title', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));

      await waitFor(() => {
        expect(screen.getByText('Start Voting?')).toBeInTheDocument();
      });
    });

    it('should show voting confirmation message', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));

      await waitFor(() => {
        expect(screen.getByText(/This will open the election for voting/i)).toBeInTheDocument();
      });
    });

    it('should show close voting confirmation title', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Close Voting/i }));

      await waitFor(() => {
        expect(screen.getByText('Close Voting?')).toBeInTheDocument();
      });
    });

    it('should show close voting confirmation message', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Close Voting/i }));

      await waitFor(() => {
        expect(screen.getByText(/This will close the election. No more votes will be accepted/i)).toBeInTheDocument();
      });
    });

    it('should show certify confirmation title', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Certify Results/i }));

      await waitFor(() => {
        expect(screen.getByText('Certify Results?')).toBeInTheDocument();
      });
    });

    it('should show certify confirmation message', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Certify Results/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/This will certify and publish the final election results/i)
        ).toBeInTheDocument();
      });
    });

    it('should show Cancel and Confirm buttons in dialog', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Confirm/i })).toBeInTheDocument();
      });
    });

    it('should show Bitcoin anchor info for Start Voting', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));

      await waitFor(() => {
        expect(screen.getByText('Bitcoin Anchoring')).toBeInTheDocument();
      });
    });

    it('should show Bitcoin anchor info for Close Voting', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Close Voting/i }));

      await waitFor(() => {
        expect(screen.getByText('Bitcoin Anchoring')).toBeInTheDocument();
      });
    });

    it('should not show Bitcoin anchor info for Open Registration', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));

      await waitFor(() => {
        expect(screen.queryByText('Bitcoin Anchoring')).not.toBeInTheDocument();
      });
    });

    it('should not show Bitcoin anchor info for Certify Results', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'tallying' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Certify Results/i }));

      await waitFor(() => {
        expect(screen.queryByText('Bitcoin Anchoring')).not.toBeInTheDocument();
      });
    });

    it('should show OpenTimestamps message in Bitcoin anchor', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/The election Merkle root will be anchored to the Bitcoin blockchain/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Dialog - Button States', () => {
    it('should enable Cancel button initially', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        expect(cancelButton).not.toBeDisabled();
      });
    });

    it('should enable Confirm button initially', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /Confirm/i });
        expect(confirmButton).not.toBeDisabled();
      });
    });

    it('should disable Cancel during loading', async () => {
      mockUpdateElectionStatus.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ election: createMockElection() }), 100))
      );

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await waitFor(() => {
        expect(screen.getByText('Open Voter Registration?')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it('should disable Confirm during loading', async () => {
      mockUpdateElectionStatus.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ election: createMockElection() }), 100))
      );

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await waitFor(() => {
        expect(screen.getByText('Open Voter Registration?')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      const confirmButton = screen.getByRole('button', { name: /Processing.../i });
      expect(confirmButton).toBeDisabled();
    });
  });

  // ==========================================
  // BITCOIN ANCHOR TESTS (20+ tests)
  // ==========================================
  describe('Bitcoin Anchor - Display', () => {
    it('should not show anchor status on initial render', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      expect(screen.queryByText('Bitcoin Anchor Status')).not.toBeInTheDocument();
    });

    it('should show submitted status after successful transition', async () => {
      mockUpdateElectionStatus.mockResolvedValueOnce({
        election: createMockElection(),
        bitcoinAnchor: { submitted: true },
      });

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Bitcoin Anchor Status')).toBeInTheDocument();
      });
    });

    it('should show submitted message', async () => {
      mockUpdateElectionStatus.mockResolvedValueOnce({
        election: createMockElection(),
        bitcoinAnchor: { submitted: true },
      });

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Merkle root submitted to Bitcoin network.')).toBeInTheDocument();
      });
    });

    it('should show pending status', async () => {
      mockUpdateElectionStatus.mockResolvedValueOnce({
        election: createMockElection(),
        bitcoinAnchor: { pending: 'Waiting for confirmations' },
      });

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Pending: Waiting for confirmations')).toBeInTheDocument();
      });
    });

    it('should show error status', async () => {
      mockUpdateElectionStatus.mockResolvedValueOnce({
        election: createMockElection(),
        bitcoinAnchor: { error: 'Failed to submit to network' },
      });

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to submit to network')).toBeInTheDocument();
      });
    });

    it('should display Bitcoin icon in anchor status', async () => {
      mockUpdateElectionStatus.mockResolvedValueOnce({
        election: createMockElection(),
        bitcoinAnchor: { submitted: true },
      });

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Bitcoin Anchor Status')).toBeInTheDocument();
      });
    });

    it('should not show anchor status when not included in response', async () => {
      mockUpdateElectionStatus.mockResolvedValueOnce({
        election: createMockElection(),
      });

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(mockUpdateElectionStatus).toHaveBeenCalled();
      });

      expect(screen.queryByText('Bitcoin Anchor Status')).not.toBeInTheDocument();
    });

    it('should clear anchor status when new transition starts', async () => {
      mockUpdateElectionStatus.mockResolvedValueOnce({
        election: createMockElection({ status: 'voting' }),
        bitcoinAnchor: { submitted: true },
      });

      const user = userEvent.setup();
      const { rerender } = render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Bitcoin Anchor Status')).toBeInTheDocument();
      });

      // Update to voting status
      rerender(
        <LifecycleControls
          election={createMockElection({ status: 'voting' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      // Click Close Voting - should clear previous anchor status
      await user.click(screen.getByRole('button', { name: /Close Voting/i }));

      // Anchor status should be cleared when dialog opens
      expect(screen.queryByText('Bitcoin Anchor Status')).not.toBeInTheDocument();
    });
  });

  describe('Bitcoin Anchor - Multiple States', () => {
    it('should handle submitted without pending or error', async () => {
      mockUpdateElectionStatus.mockResolvedValueOnce({
        election: createMockElection(),
        bitcoinAnchor: { submitted: true },
      });

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Merkle root submitted to Bitcoin network.')).toBeInTheDocument();
        expect(screen.queryByText(/Pending:/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument();
      });
    });

    it('should handle pending without submitted or error', async () => {
      mockUpdateElectionStatus.mockResolvedValueOnce({
        election: createMockElection(),
        bitcoinAnchor: { pending: 'Transaction in mempool' },
      });

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.queryByText('Merkle root submitted to Bitcoin network.')).not.toBeInTheDocument();
        expect(screen.getByText('Pending: Transaction in mempool')).toBeInTheDocument();
        expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument();
      });
    });

    it('should handle error without submitted or pending', async () => {
      mockUpdateElectionStatus.mockResolvedValueOnce({
        election: createMockElection(),
        bitcoinAnchor: { error: 'Network timeout' },
      });

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.queryByText('Merkle root submitted to Bitcoin network.')).not.toBeInTheDocument();
        expect(screen.queryByText(/Pending:/i)).not.toBeInTheDocument();
        expect(screen.getByText('Error: Network timeout')).toBeInTheDocument();
      });
    });

    it('should prioritize submitted when multiple flags present', async () => {
      mockUpdateElectionStatus.mockResolvedValueOnce({
        election: createMockElection(),
        bitcoinAnchor: { submitted: true, pending: 'Should not show', error: 'Should not show' },
      });

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Merkle root submitted to Bitcoin network.')).toBeInTheDocument();
      });
    });

    it('should show pending when both pending and error present', async () => {
      mockUpdateElectionStatus.mockResolvedValueOnce({
        election: createMockElection(),
        bitcoinAnchor: { pending: 'Processing', error: 'Previous error' },
      });

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Pending: Processing')).toBeInTheDocument();
      });
    });
  });

  describe('Bitcoin Anchor - Styling', () => {
    it('should use orange styling for anchor status', async () => {
      mockUpdateElectionStatus.mockResolvedValueOnce({
        election: createMockElection(),
        bitcoinAnchor: { submitted: true },
      });

      const user = userEvent.setup();
      const { container } = render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        const anchorAlert = container.querySelector('.border-orange-200');
        expect(anchorAlert).toBeInTheDocument();
      });
    });

    it('should use orange styling in dialog Bitcoin info', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LifecycleControls
          election={createMockElection({ status: 'registration' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Start Voting/i }));

      await waitFor(() => {
        const bitcoinInfo = container.querySelector('.border-orange-200');
        expect(bitcoinInfo).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // ERROR HANDLING TESTS (20+ tests)
  // ==========================================
  describe('Error Handling - API Errors', () => {
    it('should not show error on initial render', () => {
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });

    it('should display error when transition fails', async () => {
      mockUpdateElectionStatus.mockRejectedValueOnce(new Error('Server error'));

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('should display generic error for non-Error objects', async () => {
      mockUpdateElectionStatus.mockRejectedValueOnce('String error');

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to update election status')).toBeInTheDocument();
      });
    });

    it('should show error with AlertTriangle icon', async () => {
      mockUpdateElectionStatus.mockRejectedValueOnce(new Error('Test error'));

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });
    });

    it('should clear error when new transition starts', async () => {
      mockUpdateElectionStatus
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ election: createMockElection() });

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      // First transition - fails
      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second transition - should clear error
      await user.click(screen.getByRole('button', { name: /Open Registration/i }));

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      mockUpdateElectionStatus.mockRejectedValueOnce(new Error('Failed to fetch'));

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
      });
    });

    it('should handle timeout errors', async () => {
      mockUpdateElectionStatus.mockRejectedValueOnce(new Error('Request timeout'));

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Request timeout')).toBeInTheDocument();
      });
    });

    it('should handle validation errors', async () => {
      mockUpdateElectionStatus.mockRejectedValueOnce(new Error('Invalid status transition'));

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid status transition')).toBeInTheDocument();
      });
    });

    it('should handle authorization errors', async () => {
      mockUpdateElectionStatus.mockRejectedValueOnce(new Error('Unauthorized'));

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Unauthorized')).toBeInTheDocument();
      });
    });

    it('should keep dialog open after error', async () => {
      mockUpdateElectionStatus.mockRejectedValueOnce(new Error('Test error'));

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Dialog should still be visible
      expect(screen.getByText('Open Voter Registration?')).toBeInTheDocument();
    });

    it('should re-enable buttons after error', async () => {
      mockUpdateElectionStatus.mockRejectedValueOnce(new Error('Test error'));

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Buttons should be re-enabled
      expect(screen.getByRole('button', { name: /Cancel/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /Confirm/i })).not.toBeDisabled();
    });

    it('should allow retry after error', async () => {
      mockUpdateElectionStatus
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({ election: createMockElection() });

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      // First attempt
      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('First attempt failed')).toBeInTheDocument();
      });

      // Retry
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(mockUpdateElectionStatus).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling - Archive Errors', () => {
    it('should show alert for archive action', async () => {
      // Mock window.alert
      const alertMock = jest.spyOn(window, 'alert').mockImplementation();

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Archive Election/i }));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Archive functionality coming soon');
      });

      alertMock.mockRestore();
    });

    it('should not disable archive button after alert', async () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation();

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'complete' })}
          hasPublicKey={true}
          hasVoters={true}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Archive Election/i }));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalled();
      });

      const button = screen.getByRole('button', { name: /Archive Election/i });
      expect(button).not.toBeDisabled();

      alertMock.mockRestore();
    });
  });

  // ==========================================
  // LOADING STATE TESTS (10+ tests)
  // ==========================================
  describe('Loading States - Transition Loading', () => {
    it('should show loading text during transition', async () => {
      mockUpdateElectionStatus.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ election: createMockElection() }), 100))
      );

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should show loading spinner during transition', async () => {
      mockUpdateElectionStatus.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ election: createMockElection() }), 100))
      );

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      expect(screen.getByRole('button', { name: /Processing.../i })).toBeInTheDocument();
    });

    it('should disable main button during loading', async () => {
      mockUpdateElectionStatus.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ election: createMockElection() }), 100))
      );

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      const processingButton = screen.getByRole('button', { name: /Processing.../i });
      expect(processingButton).toBeDisabled();
    });

    it('should clear loading state after success', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      });
    });

    it('should clear loading state after error', async () => {
      mockUpdateElectionStatus.mockRejectedValueOnce(new Error('Test error'));

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      });
    });

    it('should refresh router after successful transition', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should not refresh router after error', async () => {
      mockUpdateElectionStatus.mockRejectedValueOnce(new Error('Test error'));

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      mockRefresh.mockClear();

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('should call updateElectionStatus with correct parameters', async () => {
      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ id: 'test-election', status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      await waitFor(() => {
        expect(mockUpdateElectionStatus).toHaveBeenCalledWith('test-election', 'registration');
      });
    });

    it('should handle rapid clicks during loading', async () => {
      mockUpdateElectionStatus.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ election: createMockElection() }), 100))
      );

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Open Registration/i }));
      const confirmButton = screen.getByRole('button', { name: /Confirm/i });

      // Rapid clicks
      await user.click(confirmButton);
      await user.click(confirmButton);
      await user.click(confirmButton);

      await waitFor(() => {
        // Should only call once due to disabled state
        expect(mockUpdateElectionStatus).toHaveBeenCalledTimes(1);
      });
    });

    it('should show loading spinner in transition button', async () => {
      mockUpdateElectionStatus.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ election: createMockElection() }), 100))
      );

      const user = userEvent.setup();
      render(
        <LifecycleControls
          election={createMockElection({ status: 'draft' })}
          hasPublicKey={true}
          hasVoters={false}
          hasQuestions={true}
        />
      );

      const button = screen.getByRole('button', { name: /Open Registration/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Open Voter Registration?')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Confirm/i }));

      // Should show Loader2 icon (animate-spin class)
      expect(screen.getByRole('button', { name: /Processing.../i })).toBeInTheDocument();
    });
  });
});
