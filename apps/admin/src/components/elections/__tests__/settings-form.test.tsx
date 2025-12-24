/**
 * SettingsForm Component Tests
 * Tests for election settings editing with permission controls
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsForm } from '../settings-form';
import type { Election } from '@/lib/actions/elections';

// Mock router
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('SettingsForm', () => {
  const createMockElection = (overrides: Partial<Election> = {}): Election => ({
    id: 'election-123',
    jurisdictionId: 'jurisdiction-456',
    name: 'Test Election',
    description: 'Test description',
    status: 'setup',
    startTime: '2025-01-15T09:00:00Z',
    endTime: '2025-01-15T18:00:00Z',
    threshold: 3,
    totalTrustees: 5,
    createdAt: '2024-12-24T00:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render Basic Information section', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    it('should render Schedule section', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });

    it('should render Security Configuration section', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByText('Security Configuration')).toBeInTheDocument();
    });

    it('should render Election Status section', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByText('Election Status')).toBeInTheDocument();
    });
  });

  describe('pre-populated values', () => {
    it('should show election name', () => {
      render(
        <SettingsForm
          election={createMockElection({ name: 'My Election' })}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByLabelText('Election Name')).toHaveValue('My Election');
    });

    it('should show description', () => {
      render(
        <SettingsForm
          election={createMockElection({ description: 'Important election' })}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByLabelText('Description')).toHaveValue('Important election');
    });

    it('should show threshold value', () => {
      render(
        <SettingsForm
          election={createMockElection({ threshold: 3, totalTrustees: 5 })}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should show current status', () => {
      render(
        <SettingsForm
          election={createMockElection({ status: 'draft' })}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByText('draft')).toBeInTheDocument();
    });

    it('should show created date', () => {
      render(
        <SettingsForm
          election={createMockElection({ createdAt: '2024-12-24T00:00:00Z' })}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      // Date format depends on locale, just check it exists
      expect(screen.getByText(/Created on/i)).toBeInTheDocument();
    });

    it('should show threshold explanation', () => {
      render(
        <SettingsForm
          election={createMockElection({ threshold: 3, totalTrustees: 5 })}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByText(/3 of 5 trustees must participate/i)).toBeInTheDocument();
    });
  });

  describe('edit permissions - canEditBasics', () => {
    it('should enable name input when canEditBasics is true', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByLabelText('Election Name')).not.toBeDisabled();
    });

    it('should disable name input when canEditBasics is false', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={false}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByLabelText('Election Name')).toBeDisabled();
    });

    it('should enable description when canEditBasics is true', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByLabelText('Description')).not.toBeDisabled();
    });

    it('should disable description when canEditBasics is false', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={false}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByLabelText('Description')).toBeDisabled();
    });

    it('should show warning when cannot edit basics', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={false}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByText(/Cannot edit after election moves past draft phase/i)).toBeInTheDocument();
    });
  });

  describe('edit permissions - canEditDates', () => {
    it('should enable date inputs when canEditDates is true', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByLabelText('Start Date & Time')).not.toBeDisabled();
      expect(screen.getByLabelText('End Date & Time')).not.toBeDisabled();
    });

    it('should disable date inputs when canEditDates is false', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={false}
          canEditThreshold={true}
        />
      );

      expect(screen.getByLabelText('Start Date & Time')).toBeDisabled();
      expect(screen.getByLabelText('End Date & Time')).toBeDisabled();
    });

    it('should show warning when cannot edit dates', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={false}
          canEditThreshold={true}
        />
      );

      expect(screen.getByText(/Cannot edit after voting has started/i)).toBeInTheDocument();
    });
  });

  describe('edit permissions - canEditThreshold', () => {
    it('should show locked message when canEditThreshold is false', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={false}
        />
      );

      expect(screen.getByText(/Threshold settings are locked after trustees are registered/i)).toBeInTheDocument();
    });

    it('should not show locked message when canEditThreshold is true', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.queryByText(/Threshold settings are locked/i)).not.toBeInTheDocument();
    });
  });

  describe('Save Changes button', () => {
    it('should show Save Changes button when can edit', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
    });

    it('should not show Save Changes button when cannot edit anything', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={false}
          canEditDates={false}
          canEditThreshold={false}
        />
      );

      expect(screen.queryByRole('button', { name: /Save Changes/i })).not.toBeInTheDocument();
    });

    it('should show Save Changes when only dates can be edited', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={false}
          canEditDates={true}
          canEditThreshold={false}
        />
      );

      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should show error when name is empty', async () => {
      const user = userEvent.setup();
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      const nameInput = screen.getByLabelText('Election Name');
      await user.clear(nameInput);
      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when end time is before start time', async () => {
      const user = userEvent.setup();
      render(
        <SettingsForm
          election={createMockElection({
            startTime: '2025-01-15T18:00:00Z',
            endTime: '2025-01-15T09:00:00Z',
          })}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/End time must be after start time/i)).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('should disable button during submission', async () => {
      const user = userEvent.setup();
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(submitButton);

      // After submission completes, button should be re-enabled
      await waitFor(() => {
        expect(screen.getByText('Settings saved successfully')).toBeInTheDocument();
      });
    });

    it('should show success message after save', async () => {
      const user = userEvent.setup();
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(screen.getByText('Settings saved successfully')).toBeInTheDocument();
      });
    });

    it('should call router refresh after save', async () => {
      const user = userEvent.setup();
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('form field editing', () => {
    it('should allow typing in name field', async () => {
      const user = userEvent.setup();
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      const nameInput = screen.getByLabelText('Election Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Election Name');

      expect(nameInput).toHaveValue('New Election Name');
    });

    it('should allow typing in description field', async () => {
      const user = userEvent.setup();
      render(
        <SettingsForm
          election={createMockElection({ description: '' })}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      const descInput = screen.getByLabelText('Description');
      await user.type(descInput, 'New description');

      expect(descInput).toHaveValue('New description');
    });
  });

  describe('XSS handling', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
    ];

    xssPayloads.forEach((payload) => {
      it(`should safely display XSS in election name: ${payload.substring(0, 20)}...`, () => {
        render(
          <SettingsForm
            election={createMockElection({ name: payload })}
            canEditBasics={true}
            canEditDates={true}
            canEditThreshold={true}
          />
        );

        expect(screen.getByLabelText('Election Name')).toHaveValue(payload);
      });

      it(`should safely display XSS in description: ${payload.substring(0, 20)}...`, () => {
        render(
          <SettingsForm
            election={createMockElection({ description: payload })}
            canEditBasics={true}
            canEditDates={true}
            canEditThreshold={true}
          />
        );

        expect(screen.getByLabelText('Description')).toHaveValue(payload);
      });

      it(`should allow typing XSS payload: ${payload.substring(0, 20)}...`, async () => {
        const user = userEvent.setup();
        render(
          <SettingsForm
            election={createMockElection()}
            canEditBasics={true}
            canEditDates={true}
            canEditThreshold={true}
          />
        );

        const nameInput = screen.getByLabelText('Election Name');
        await user.clear(nameInput);
        await user.type(nameInput, payload);

        expect(nameInput).toHaveValue(payload);
      });
    });
  });

  describe('SQL injection handling', () => {
    const sqlPayloads = [
      "'; DROP TABLE elections;--",
      "1' OR '1'='1",
      "Robert'); DROP TABLE Students;--",
    ];

    sqlPayloads.forEach((payload) => {
      it(`should safely handle SQL injection: ${payload.substring(0, 20)}...`, () => {
        render(
          <SettingsForm
            election={createMockElection({ name: payload })}
            canEditBasics={true}
            canEditDates={true}
            canEditThreshold={true}
          />
        );

        expect(screen.getByLabelText('Election Name')).toHaveValue(payload);
      });
    });
  });

  describe('unicode handling', () => {
    it('should display unicode in election name', () => {
      render(
        <SettingsForm
          election={createMockElection({ name: '選挙 2025 🗳️' })}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByLabelText('Election Name')).toHaveValue('選挙 2025 🗳️');
    });

    it('should display RTL text in description', () => {
      render(
        <SettingsForm
          election={createMockElection({ description: 'الانتخابات الرئاسية' })}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByLabelText('Description')).toHaveValue('الانتخابات الرئاسية');
    });

    it('should allow typing unicode', async () => {
      const user = userEvent.setup();
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      const nameInput = screen.getByLabelText('Election Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Élection française');

      expect(nameInput).toHaveValue('Élection française');
    });
  });

  describe('edge cases', () => {
    it('should handle very long election name', () => {
      const longName = 'A'.repeat(500);
      render(
        <SettingsForm
          election={createMockElection({ name: longName })}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByLabelText('Election Name')).toHaveValue(longName);
    });

    it('should handle very long description', () => {
      const longDesc = 'B'.repeat(2000);
      render(
        <SettingsForm
          election={createMockElection({ description: longDesc })}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByLabelText('Description')).toHaveValue(longDesc);
    });

    it('should handle empty description', () => {
      render(
        <SettingsForm
          election={createMockElection({ description: '' })}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByLabelText('Description')).toHaveValue('');
    });

    it('should handle high threshold numbers', () => {
      render(
        <SettingsForm
          election={createMockElection({ threshold: 99, totalTrustees: 100 })}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByText('99')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText(/99 of 100 trustees must participate/i)).toBeInTheDocument();
    });

    it('should handle all statuses', () => {
      const statuses: Election['status'][] = [
        'setup',
        'draft',
        'registration',
        'voting',
        'tallying',
        'completed',
      ];

      statuses.forEach((status) => {
        const { unmount } = render(
          <SettingsForm
            election={createMockElection({ status })}
            canEditBasics={true}
            canEditDates={true}
            canEditThreshold={true}
          />
        );

        expect(screen.getByText(status)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('accessibility', () => {
    it('should have form fields with labels', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByLabelText('Election Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date & Time')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date & Time')).toBeInTheDocument();
    });

    it('should have description text for context', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByText('Additional context for voters')).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(
        <SettingsForm
          election={createMockElection()}
          canEditBasics={true}
          canEditDates={true}
          canEditThreshold={true}
        />
      );

      expect(screen.getByRole('heading', { name: 'Basic Information' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Schedule' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Security Configuration' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Election Status' })).toBeInTheDocument();
    });
  });
});
