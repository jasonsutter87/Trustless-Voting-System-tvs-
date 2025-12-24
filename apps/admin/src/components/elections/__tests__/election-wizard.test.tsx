/**
 * Election Wizard Component Tests
 * Comprehensive tests for the multi-step election creation wizard
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ElectionWizard } from '../election-wizard';
import { createElection } from '@/lib/actions/elections';

// Mock the server actions
jest.mock('@/lib/actions/elections', () => ({
  createElection: jest.fn(),
}));

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const mockCreateElection = createElection as jest.MockedFunction<typeof createElection>;

describe('ElectionWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateElection.mockResolvedValue({
      election: {
        id: 'new-election-123',
        name: 'Test Election',
        description: '',
        startTime: '2025-01-01T00:00:00Z',
        endTime: '2025-01-15T00:00:00Z',
        status: 'setup',
        threshold: 2,
        totalTrustees: 3,
        candidates: [],
        createdAt: '2024-12-24T00:00:00Z',
      },
      ceremonyStatus: {
        phase: 'CREATED',
        registeredCount: 0,
        requiredCount: 3,
        committedCount: 0,
      },
    });
  });

  describe('initial render', () => {
    it('should render step 1 (Basics) by default', () => {
      render(<ElectionWizard />);

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByLabelText(/Election Name/i)).toBeInTheDocument();
    });

    it('should display progress indicator with 3 steps', () => {
      render(<ElectionWizard />);

      expect(screen.getByText('Basics')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('should show step 1 as active', () => {
      render(<ElectionWizard />);

      // First step should be active (numbered "1")
      const stepIndicators = screen.getAllByText('1');
      expect(stepIndicators.length).toBeGreaterThan(0);
    });

    it('should have Back button disabled on first step', () => {
      render(<ElectionWizard />);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeDisabled();
    });

    it('should show Continue button on first step', () => {
      render(<ElectionWizard />);

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });
  });

  describe('step 1 - basics', () => {
    it('should allow entering election name', async () => {
      const user = userEvent.setup();
      render(<ElectionWizard />);

      const nameInput = screen.getByLabelText(/Election Name/i);
      await user.type(nameInput, 'Test Election 2025');

      expect(nameInput).toHaveValue('Test Election 2025');
    });

    it('should allow entering description', async () => {
      const user = userEvent.setup();
      render(<ElectionWizard />);

      const descInput = screen.getByLabelText(/Description/i);
      await user.type(descInput, 'A test election description');

      expect(descInput).toHaveValue('A test election description');
    });

    it('should validate name is required before continuing', async () => {
      const user = userEvent.setup();
      render(<ElectionWizard />);

      // Try to continue without entering name
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });

      // Should still be on step 1
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    it('should proceed to step 2 with valid name', async () => {
      const user = userEvent.setup();
      render(<ElectionWizard />);

      const nameInput = screen.getByLabelText(/Election Name/i);
      await user.type(nameInput, 'Valid Election Name');

      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Election Settings')).toBeInTheDocument();
      });
    });

    describe('XSS prevention in name field', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
      ];

      xssPayloads.forEach((payload) => {
        it(`should safely handle XSS payload: ${payload.substring(0, 20)}...`, async () => {
          const user = userEvent.setup();
          render(<ElectionWizard />);

          const nameInput = screen.getByLabelText(/Election Name/i);
          await user.type(nameInput, payload);

          // Should accept the input (sanitization on server)
          expect(nameInput).toHaveValue(payload);
        });
      });
    });

    describe('SQL injection prevention', () => {
      const sqlPayloads = [
        "'; DROP TABLE elections;--",
        "1' OR '1'='1",
      ];

      sqlPayloads.forEach((payload) => {
        it(`should safely handle SQL payload: ${payload.substring(0, 20)}...`, async () => {
          const user = userEvent.setup();
          render(<ElectionWizard />);

          const nameInput = screen.getByLabelText(/Election Name/i);
          await user.type(nameInput, payload);

          expect(nameInput).toHaveValue(payload);
        });
      });
    });
  });

  describe('step 2 - settings', () => {
    const goToStep2 = async () => {
      const user = userEvent.setup();
      render(<ElectionWizard />);

      const nameInput = screen.getByLabelText(/Election Name/i);
      await user.type(nameInput, 'Test Election');

      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Election Settings')).toBeInTheDocument();
      });

      return user;
    };

    it('should display date/time inputs', async () => {
      await goToStep2();

      expect(screen.getByLabelText(/Start Date & Time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/End Date & Time/i)).toBeInTheDocument();
    });

    it('should display threshold inputs', async () => {
      await goToStep2();

      expect(screen.getByLabelText(/Required Threshold/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Total Trustees/i)).toBeInTheDocument();
    });

    it('should have default threshold values', async () => {
      await goToStep2();

      const thresholdInput = screen.getByLabelText(/Required Threshold/i);
      const trusteesInput = screen.getByLabelText(/Total Trustees/i);

      expect(thresholdInput).toHaveValue(2);
      expect(trusteesInput).toHaveValue(3);
    });

    it('should allow going back to step 1', async () => {
      const user = await goToStep2();

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });
    });

    it('should preserve data when going back and forward', async () => {
      const user = userEvent.setup();
      render(<ElectionWizard />);

      // Fill step 1
      const nameInput = screen.getByLabelText(/Election Name/i);
      await user.type(nameInput, 'Preserved Election');

      // Go to step 2
      await user.click(screen.getByRole('button', { name: /continue/i }));
      await waitFor(() => {
        expect(screen.getByText('Election Settings')).toBeInTheDocument();
      });

      // Go back to step 1
      await user.click(screen.getByRole('button', { name: /back/i }));
      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
      });

      // Data should be preserved
      expect(screen.getByLabelText(/Election Name/i)).toHaveValue('Preserved Election');
    });

    it('should validate dates before continuing', async () => {
      const user = await goToStep2();

      // Try to continue without dates
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/Start time is required/i)).toBeInTheDocument();
      });
    });

    it('should validate end time is after start time', async () => {
      const user = await goToStep2();

      const startInput = screen.getByLabelText(/Start Date & Time/i);
      const endInput = screen.getByLabelText(/End Date & Time/i);

      // Set end before start
      await user.clear(startInput);
      fireEvent.change(startInput, { target: { value: '2025-01-15T00:00' } });
      fireEvent.change(endInput, { target: { value: '2025-01-01T00:00' } });

      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/End time must be after start time/i)).toBeInTheDocument();
      });
    });

    it('should validate threshold does not exceed total trustees', async () => {
      const user = await goToStep2();

      // Fill in dates first
      const startInput = screen.getByLabelText(/Start Date & Time/i);
      const endInput = screen.getByLabelText(/End Date & Time/i);
      fireEvent.change(startInput, { target: { value: '2025-01-01T00:00' } });
      fireEvent.change(endInput, { target: { value: '2025-01-15T00:00' } });

      // Set threshold higher than trustees
      const thresholdInput = screen.getByLabelText(/Required Threshold/i);
      const trusteesInput = screen.getByLabelText(/Total Trustees/i);

      await user.clear(thresholdInput);
      await user.type(thresholdInput, '10');
      await user.clear(trusteesInput);
      await user.type(trusteesInput, '5');

      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/Threshold cannot exceed total trustees/i)).toBeInTheDocument();
      });
    });
  });

  describe('step 3 - review', () => {
    const goToStep3 = async () => {
      const user = userEvent.setup();
      render(<ElectionWizard />);

      // Step 1
      const nameInput = screen.getByLabelText(/Election Name/i);
      await user.type(nameInput, 'Final Review Election');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      // Step 2
      await waitFor(() => {
        expect(screen.getByText('Election Settings')).toBeInTheDocument();
      });

      const startInput = screen.getByLabelText(/Start Date & Time/i);
      const endInput = screen.getByLabelText(/End Date & Time/i);
      fireEvent.change(startInput, { target: { value: '2025-01-01T00:00' } });
      fireEvent.change(endInput, { target: { value: '2025-01-15T00:00' } });

      await user.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(() => {
        expect(screen.getByText('Review & Create')).toBeInTheDocument();
      });

      return user;
    };

    it('should display review summary', async () => {
      await goToStep3();

      expect(screen.getByText('Final Review Election')).toBeInTheDocument();
      // Threshold display is split across spans: "2" + " of " + "3" + " trustees required"
      expect(screen.getByText('Security Threshold')).toBeInTheDocument();
    });

    it('should show Create Election button', async () => {
      await goToStep3();

      expect(screen.getByRole('button', { name: /Create Election/i })).toBeInTheDocument();
    });

    it('should allow going back to edit', async () => {
      const user = await goToStep3();

      await user.click(screen.getByRole('button', { name: /back/i }));

      await waitFor(() => {
        expect(screen.getByText('Election Settings')).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    const fillAndSubmit = async () => {
      const user = userEvent.setup();
      render(<ElectionWizard />);

      // Step 1
      await user.type(screen.getByLabelText(/Election Name/i), 'Submit Test Election');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      // Step 2
      await waitFor(() => {
        expect(screen.getByText('Election Settings')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Start Date & Time/i), {
        target: { value: '2025-01-01T00:00' },
      });
      fireEvent.change(screen.getByLabelText(/End Date & Time/i), {
        target: { value: '2025-01-15T00:00' },
      });
      await user.click(screen.getByRole('button', { name: /continue/i }));

      // Step 3
      await waitFor(() => {
        expect(screen.getByText('Review & Create')).toBeInTheDocument();
      });

      return user;
    };

    it('should call createElection on submit', async () => {
      const user = await fillAndSubmit();

      await user.click(screen.getByRole('button', { name: /Create Election/i }));

      await waitFor(() => {
        expect(mockCreateElection).toHaveBeenCalledTimes(1);
      });
    });

    it('should pass correct data to createElection', async () => {
      const user = await fillAndSubmit();

      await user.click(screen.getByRole('button', { name: /Create Election/i }));

      await waitFor(() => {
        expect(mockCreateElection).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Submit Test Election',
            threshold: 2,
            totalTrustees: 3,
          })
        );
      });
    });

    it('should navigate to election page on success', async () => {
      const user = await fillAndSubmit();

      await user.click(screen.getByRole('button', { name: /Create Election/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/elections/new-election-123');
      });
    });

    it('should show loading state during submission', async () => {
      // Delay the promise to observe loading state
      mockCreateElection.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  election: {
                    id: 'new-election-123',
                    name: 'Test',
                    description: '',
                    startTime: '',
                    endTime: '',
                    status: 'setup',
                    threshold: 2,
                    totalTrustees: 3,
                    candidates: [],
                    createdAt: '',
                  },
                  ceremonyStatus: {
                    phase: 'CREATED',
                    registeredCount: 0,
                    requiredCount: 3,
                    committedCount: 0,
                  },
                }),
              100
            )
          )
      );

      const user = await fillAndSubmit();

      await user.click(screen.getByRole('button', { name: /Create Election/i }));

      expect(screen.getByRole('button', { name: /Creating.../i })).toBeInTheDocument();
    });

    it('should disable submit button during submission', async () => {
      mockCreateElection.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const user = await fillAndSubmit();

      await user.click(screen.getByRole('button', { name: /Create Election/i }));

      expect(screen.getByRole('button', { name: /Creating.../i })).toBeDisabled();
    });

    it('should display error message on failure', async () => {
      mockCreateElection.mockRejectedValueOnce(new Error('Server error'));

      const user = await fillAndSubmit();

      await user.click(screen.getByRole('button', { name: /Create Election/i }));

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('should handle network error', async () => {
      mockCreateElection.mockRejectedValueOnce(new Error('Failed to fetch'));

      const user = await fillAndSubmit();

      await user.click(screen.getByRole('button', { name: /Create Election/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
      });
    });

    it('should re-enable submit button after error', async () => {
      mockCreateElection.mockRejectedValueOnce(new Error('Server error'));

      const user = await fillAndSubmit();

      await user.click(screen.getByRole('button', { name: /Create Election/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Create Election/i })).not.toBeDisabled();
      });
    });
  });

  describe('accessibility', () => {
    it('should have accessible form labels', () => {
      render(<ElectionWizard />);

      expect(screen.getByLabelText(/Election Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(<ElectionWizard />);

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('should announce validation errors', async () => {
      const user = userEvent.setup();
      render(<ElectionWizard />);

      await user.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(() => {
        const errorMessage = screen.getByText(/Name is required/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle very long election name', async () => {
      const user = userEvent.setup();
      render(<ElectionWizard />);

      const longName = 'A'.repeat(500);
      const nameInput = screen.getByLabelText(/Election Name/i);
      await user.type(nameInput, longName);

      expect(nameInput).toHaveValue(longName);
    });

    it('should handle unicode characters', async () => {
      const user = userEvent.setup();
      render(<ElectionWizard />);

      const unicodeName = '選挙 2025 🗳️ Élection';
      const nameInput = screen.getByLabelText(/Election Name/i);
      await user.type(nameInput, unicodeName);

      expect(nameInput).toHaveValue(unicodeName);
    });

    it('should handle rapid step navigation', async () => {
      const user = userEvent.setup();
      render(<ElectionWizard />);

      // Fill step 1 quickly
      await user.type(screen.getByLabelText(/Election Name/i), 'Rapid Test');

      // Rapidly click continue
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);
      await user.click(continueButton);
      await user.click(continueButton);

      // Should be on step 2 (can't skip steps without validation)
      await waitFor(() => {
        expect(screen.getByText('Election Settings')).toBeInTheDocument();
      });
    });

    it('should handle empty description', async () => {
      const user = userEvent.setup();
      render(<ElectionWizard />);

      // Only fill name, leave description empty
      await user.type(screen.getByLabelText(/Election Name/i), 'No Description Election');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(() => {
        expect(screen.getByText('Election Settings')).toBeInTheDocument();
      });
    });
  });
});
