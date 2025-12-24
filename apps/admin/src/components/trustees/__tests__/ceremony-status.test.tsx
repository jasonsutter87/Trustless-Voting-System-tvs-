/**
 * CeremonyStatus Component Tests
 * Tests for displaying key ceremony progress
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CeremonyStatus } from '../ceremony-status';
import type { CeremonyStatus as CeremonyStatusType } from '@/lib/actions/elections';

describe('CeremonyStatus', () => {
  describe('phase display', () => {
    const phases: Array<{
      phase: CeremonyStatusType['phase'];
      label: string;
      description: string;
    }> = [
      { phase: 'CREATED', label: 'Not Started', description: 'Waiting for trustees' },
      { phase: 'REGISTRATION', label: 'Registration', description: 'Trustees are joining' },
      { phase: 'COMMITMENT', label: 'Commitment', description: 'submitting their key shares' },
      { phase: 'SHARE_DISTRIBUTION', label: 'Distribution', description: 'being distributed' },
      { phase: 'FINALIZED', label: 'Complete', description: 'successfully completed' },
    ];

    phases.forEach(({ phase, label, description }) => {
      it(`should display ${label} for ${phase} phase`, () => {
        render(
          <CeremonyStatus
            status={{
              phase,
              registeredCount: 0,
              requiredCount: 5,
              committedCount: 0,
            }}
          />
        );

        // Labels may appear multiple times (badge + steps)
        const labels = screen.getAllByText(label);
        expect(labels.length).toBeGreaterThan(0);
        expect(screen.getByText(new RegExp(description, 'i'))).toBeInTheDocument();
      });
    });
  });

  describe('progress steps', () => {
    it('should display all 4 steps', () => {
      render(
        <CeremonyStatus
          status={{
            phase: 'REGISTRATION',
            registeredCount: 0,
            requiredCount: 5,
            committedCount: 0,
          }}
        />
      );

      // Steps appear in the progress indicator
      expect(screen.getAllByText('Registration').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Commitment').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Distribution').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Complete').length).toBeGreaterThan(0);
    });

    it('should show step numbers', () => {
      render(
        <CeremonyStatus
          status={{
            phase: 'CREATED',
            registeredCount: 0,
            requiredCount: 5,
            committedCount: 0,
          }}
        />
      );

      // When in CREATED phase (step 0), all steps show numbers
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('statistics', () => {
    it('should display registered count', () => {
      render(
        <CeremonyStatus
          status={{
            phase: 'REGISTRATION',
            registeredCount: 3,
            requiredCount: 5,
            committedCount: 0,
          }}
        />
      );

      expect(screen.getByText('3 / 5')).toBeInTheDocument();
      expect(screen.getByText('Registered')).toBeInTheDocument();
    });

    it('should display committed count', () => {
      render(
        <CeremonyStatus
          status={{
            phase: 'COMMITMENT',
            registeredCount: 5,
            requiredCount: 5,
            committedCount: 2,
          }}
        />
      );

      expect(screen.getByText('2 / 5')).toBeInTheDocument();
      expect(screen.getByText('Committed')).toBeInTheDocument();
    });

    it('should display phase name in stats', () => {
      render(
        <CeremonyStatus
          status={{
            phase: 'COMMITMENT',
            registeredCount: 5,
            requiredCount: 5,
            committedCount: 2,
          }}
        />
      );

      expect(screen.getByText('Phase')).toBeInTheDocument();
    });
  });

  describe('public key display', () => {
    it('should display public key when provided', () => {
      render(
        <CeremonyStatus
          status={{
            phase: 'FINALIZED',
            registeredCount: 5,
            requiredCount: 5,
            committedCount: 5,
          }}
          publicKey="pk-abc123def456ghi789jkl012mno345pqr678stu901vwx234yza567bcd890efg123hij456klm789nop012qrs345tuv678wxy901zab234"
        />
      );

      expect(screen.getByText('Election Public Key Generated')).toBeInTheDocument();
      // Key is truncated to 100 chars + "..."
      expect(screen.getByText(/pk-abc123def456/)).toBeInTheDocument();
    });

    it('should not display public key section when not provided', () => {
      render(
        <CeremonyStatus
          status={{
            phase: 'REGISTRATION',
            registeredCount: 3,
            requiredCount: 5,
            committedCount: 0,
          }}
        />
      );

      expect(screen.queryByText('Election Public Key Generated')).not.toBeInTheDocument();
    });
  });

  describe('undefined status', () => {
    it('should handle undefined status gracefully', () => {
      render(<CeremonyStatus status={undefined} />);

      expect(screen.getByText('Not Started')).toBeInTheDocument();
    });

    it('should show waiting message when status undefined', () => {
      render(<CeremonyStatus status={undefined} />);

      expect(screen.getByText(/Waiting for trustees to be invited/i)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle zero counts', () => {
      render(
        <CeremonyStatus
          status={{
            phase: 'CREATED',
            registeredCount: 0,
            requiredCount: 5,
            committedCount: 0,
          }}
        />
      );

      // Multiple "0 / 5" appear for registered and committed
      const counts = screen.getAllByText('0 / 5');
      expect(counts.length).toBeGreaterThan(0);
    });

    it('should handle high counts', () => {
      render(
        <CeremonyStatus
          status={{
            phase: 'REGISTRATION',
            registeredCount: 100,
            requiredCount: 100,
            committedCount: 50,
          }}
        />
      );

      expect(screen.getByText('100 / 100')).toBeInTheDocument();
      expect(screen.getByText('50 / 100')).toBeInTheDocument();
    });

    it('should handle very long public key', () => {
      const longKey = 'pk-' + 'a'.repeat(500);
      render(
        <CeremonyStatus
          status={{
            phase: 'FINALIZED',
            registeredCount: 5,
            requiredCount: 5,
            committedCount: 5,
          }}
          publicKey={longKey}
        />
      );

      // Should be truncated
      expect(screen.getByText(/pk-aaa.*\.\.\./)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have heading for ceremony status', () => {
      render(
        <CeremonyStatus
          status={{
            phase: 'REGISTRATION',
            registeredCount: 3,
            requiredCount: 5,
            committedCount: 0,
          }}
        />
      );

      expect(screen.getByText('Key Ceremony Status')).toBeInTheDocument();
    });
  });
});
