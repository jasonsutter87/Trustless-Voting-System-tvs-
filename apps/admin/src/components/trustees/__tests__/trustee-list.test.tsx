/**
 * TrusteeList Component Tests
 * Tests for displaying and managing trustee list
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrusteeList } from '../trustee-list';
import type { Trustee } from '@/lib/actions/trustees';

// Mock the InviteTrustee component to avoid dialog complexity
jest.mock('../invite-trustee', () => ({
  InviteTrustee: ({ open }: { open: boolean }) =>
    open ? <div data-testid="invite-dialog">Invite Dialog</div> : null,
}));

// Mock router
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('TrusteeList', () => {
  const createMockTrustee = (overrides: Partial<Trustee> = {}): Trustee => ({
    id: 'trustee-123',
    electionId: 'election-456',
    name: 'Test Trustee',
    publicKey: 'pk-abc123',
    status: 'registered',
    shareIndex: 1,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('empty state', () => {
    it('should show empty state when no trustees', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={[]}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByText('No Trustees Yet')).toBeInTheDocument();
    });

    it('should show required count in empty state', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={[]}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByText(/Add 5 trustees/i)).toBeInTheDocument();
    });

    it('should show Add First Trustee button when canInvite is true', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={[]}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByRole('button', { name: /Add First Trustee/i })).toBeInTheDocument();
    });

    it('should not show Add First Trustee button when canInvite is false', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={[]}
          totalRequired={5}
          canInvite={false}
        />
      );

      expect(screen.queryByRole('button', { name: /Add First Trustee/i })).not.toBeInTheDocument();
    });

    it('should open invite dialog when Add First Trustee clicked', async () => {
      const user = userEvent.setup();
      render(
        <TrusteeList
          electionId="election-123"
          trustees={[]}
          totalRequired={5}
          canInvite={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Add First Trustee/i }));

      expect(screen.getByTestId('invite-dialog')).toBeInTheDocument();
    });
  });

  describe('with trustees', () => {
    const mockTrustees: Trustee[] = [
      createMockTrustee({ id: 't1', name: 'Trustee One', status: 'registered', shareIndex: 1 }),
      createMockTrustee({ id: 't2', name: 'Trustee Two', status: 'committed', shareIndex: 2 }),
      createMockTrustee({ id: 't3', name: 'Trustee Three', status: 'share_received', shareIndex: 3 }),
    ];

    it('should display trustee count', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={mockTrustees}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByText(/3 of 5 trustees registered/i)).toBeInTheDocument();
    });

    it('should display remaining spots needed', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={mockTrustees}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByText(/2 more needed/i)).toBeInTheDocument();
    });

    it('should display all trustee names', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={mockTrustees}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByText('Trustee One')).toBeInTheDocument();
      expect(screen.getByText('Trustee Two')).toBeInTheDocument();
      expect(screen.getByText('Trustee Three')).toBeInTheDocument();
    });

    it('should display trustee numbers', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={mockTrustees}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display share indices', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={mockTrustees}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByText(/Share index: 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Share index: 2/i)).toBeInTheDocument();
      expect(screen.getByText(/Share index: 3/i)).toBeInTheDocument();
    });

    it('should show Pending for trustees without shareIndex', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={[createMockTrustee({ shareIndex: undefined })]}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByText(/Share index: Pending/i)).toBeInTheDocument();
    });
  });

  describe('status badges', () => {
    it('should display Registered status', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={[createMockTrustee({ status: 'registered' })]}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByText('Registered')).toBeInTheDocument();
    });

    it('should display Committed status', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={[createMockTrustee({ status: 'committed' })]}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByText('Committed')).toBeInTheDocument();
    });

    it('should display Complete status for share_received', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={[createMockTrustee({ status: 'share_received' })]}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  describe('Add Trustee button', () => {
    it('should show Add Trustee button when spots remaining and canInvite', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={[createMockTrustee()]}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByRole('button', { name: /Add Trustee/i })).toBeInTheDocument();
    });

    it('should not show Add Trustee when all spots filled', () => {
      const fullTrustees = Array.from({ length: 5 }, (_, i) =>
        createMockTrustee({ id: `t${i}`, name: `Trustee ${i + 1}` })
      );

      render(
        <TrusteeList
          electionId="election-123"
          trustees={fullTrustees}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Add Trustee/i })).not.toBeInTheDocument();
    });

    it('should not show Add Trustee when canInvite is false', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={[createMockTrustee()]}
          totalRequired={5}
          canInvite={false}
        />
      );

      expect(screen.queryByRole('button', { name: /Add Trustee/i })).not.toBeInTheDocument();
    });

    it('should open invite dialog when Add Trustee clicked', async () => {
      const user = userEvent.setup();
      render(
        <TrusteeList
          electionId="election-123"
          trustees={[createMockTrustee()]}
          totalRequired={5}
          canInvite={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Add Trustee/i }));

      expect(screen.getByTestId('invite-dialog')).toBeInTheDocument();
    });
  });

  describe('XSS handling', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
    ];

    xssPayloads.forEach((payload) => {
      it(`should safely render XSS in trustee name: ${payload.substring(0, 20)}...`, () => {
        render(
          <TrusteeList
            electionId="election-123"
            trustees={[createMockTrustee({ name: payload })]}
            totalRequired={5}
            canInvite={true}
          />
        );

        expect(screen.getByText(payload)).toBeInTheDocument();
      });
    });
  });

  describe('unicode handling', () => {
    it('should render unicode trustee names', () => {
      render(
        <TrusteeList
          electionId="election-123"
          trustees={[
            createMockTrustee({ id: 't1', name: '田中太郎' }),
            createMockTrustee({ id: 't2', name: 'Müller' }),
            createMockTrustee({ id: 't3', name: 'محمد' }),
          ]}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByText('田中太郎')).toBeInTheDocument();
      expect(screen.getByText('Müller')).toBeInTheDocument();
      expect(screen.getByText('محمد')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle very long trustee names', () => {
      const longName = 'A'.repeat(200);
      render(
        <TrusteeList
          electionId="election-123"
          trustees={[createMockTrustee({ name: longName })]}
          totalRequired={5}
          canInvite={true}
        />
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle many trustees', () => {
      const manyTrustees = Array.from({ length: 20 }, (_, i) =>
        createMockTrustee({ id: `t${i}`, name: `Trustee ${i + 1}` })
      );

      render(
        <TrusteeList
          electionId="election-123"
          trustees={manyTrustees}
          totalRequired={20}
          canInvite={true}
        />
      );

      expect(screen.getByText('20 of 20 trustees registered')).toBeInTheDocument();
      expect(screen.getByText('Trustee 1')).toBeInTheDocument();
      expect(screen.getByText('Trustee 20')).toBeInTheDocument();
    });
  });
});
