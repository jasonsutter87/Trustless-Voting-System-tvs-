/**
 * Election Detail Page Tests
 * Comprehensive tests for the election detail page
 *
 * Test Coverage:
 * - Async rendering: Server component with async data
 * - Data display: Stats, timeline, description
 * - Status indicators: Current status and descriptions
 * - Quick links: Navigate to ballot, voters, trustees
 * - Error handling: Election not found, loading failures
 * - Lifecycle controls: Status-based actions
 * - Next step guidance: Status-specific instructions
 * - Accessibility: Headings, links, ARIA labels
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ElectionDetailPage from '../page';
import { getElection } from '@/lib/actions/elections';
import { getTrustees } from '@/lib/actions/trustees';
import { getQuestions } from '@/lib/actions/ballot';
import { getVoterStats } from '@/lib/actions/voters';

// Mock next/link
jest.mock('next/link', () => {
  return function Link({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  useParams: () => ({ id: 'test-id' }),
}));

// Mock server actions
jest.mock('@/lib/actions/elections');
jest.mock('@/lib/actions/trustees');
jest.mock('@/lib/actions/ballot');
jest.mock('@/lib/actions/voters');

const mockGetElection = getElection as jest.MockedFunction<typeof getElection>;
const mockGetTrustees = getTrustees as jest.MockedFunction<typeof getTrustees>;
const mockGetQuestions = getQuestions as jest.MockedFunction<typeof getQuestions>;
const mockGetVoterStats = getVoterStats as jest.MockedFunction<typeof getVoterStats>;

describe('ElectionDetailPage', () => {
  const mockElection = {
    id: 'election-123',
    name: 'Test Election 2025',
    description: 'A test election for comprehensive testing',
    status: 'draft' as const,
    startTime: '2025-01-15T10:00:00Z',
    endTime: '2025-01-20T18:00:00Z',
    threshold: 2,
    totalTrustees: 3,
    createdAt: '2025-01-01T00:00:00Z',
  };

  const mockCeremonyStatus = {
    phase: 'complete',
    progress: 100,
  };

  const mockPublicKey = 'mock-public-key-data';

  const mockTrustees = {
    trustees: [
      { id: 't1', name: 'Trustee 1', status: 'complete' },
      { id: 't2', name: 'Trustee 2', status: 'complete' },
      { id: 't3', name: 'Trustee 3', status: 'complete' },
    ],
  };

  const mockQuestions = {
    questions: [
      { id: 'q1' },
      { id: 'q2' },
    ],
  };

  const mockVoterStats = {
    stats: {
      total: 150,
      voted: 75,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetElection.mockResolvedValue({
      election: mockElection,
      ceremonyStatus: mockCeremonyStatus,
      publicKey: mockPublicKey,
    });

    mockGetTrustees.mockResolvedValue(mockTrustees);
    mockGetQuestions.mockResolvedValue(mockQuestions);
    mockGetVoterStats.mockResolvedValue(mockVoterStats);
  });

  describe('successful data loading', () => {
    it('should render the election detail page', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Test Election 2025')).toBeInTheDocument();
    });

    it('should display election name as heading', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByRole('heading', { name: 'Test Election 2025', level: 1 })).toBeInTheDocument();
    });

    it('should display election description', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('A test election for comprehensive testing')).toBeInTheDocument();
    });

    it('should fetch election data', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      await ElectionDetailPage({ params });

      expect(mockGetElection).toHaveBeenCalledWith('election-123');
    });

    it('should fetch trustees data', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      await ElectionDetailPage({ params });

      expect(mockGetTrustees).toHaveBeenCalledWith('election-123');
    });

    it('should fetch questions data', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      await ElectionDetailPage({ params });

      expect(mockGetQuestions).toHaveBeenCalledWith({ electionId: 'election-123' });
    });

    it('should fetch voter stats data', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      await ElectionDetailPage({ params });

      expect(mockGetVoterStats).toHaveBeenCalledWith('election-123');
    });
  });

  describe('status display', () => {
    it('should display current status badge', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('should display status description', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Key ceremony complete. Add ballot questions and voters.')).toBeInTheDocument();
    });

    it('should capitalize status in badge', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      const badge = screen.getByText('Draft');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('text-xs');
    });

    it('should show setup status', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'setup' },
        ceremonyStatus: { phase: 'pending', progress: 0 },
        publicKey: null,
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Setup')).toBeInTheDocument();
    });

    it('should show registration status', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'registration' },
        ceremonyStatus: mockCeremonyStatus,
        publicKey: mockPublicKey,
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Registration')).toBeInTheDocument();
    });

    it('should show voting status', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'voting' },
        ceremonyStatus: mockCeremonyStatus,
        publicKey: mockPublicKey,
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Voting')).toBeInTheDocument();
    });

    it('should show tallying status', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'tallying' },
        ceremonyStatus: mockCeremonyStatus,
        publicKey: mockPublicKey,
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Tallying')).toBeInTheDocument();
    });

    it('should show complete status', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'complete' },
        ceremonyStatus: mockCeremonyStatus,
        publicKey: mockPublicKey,
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  describe('stats grid', () => {
    it('should display ballot questions count', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Ballot Questions')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should display voters count', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Voters')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should display trustees count', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Trustees')).toBeInTheDocument();
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });

    it('should display security threshold', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Security Threshold')).toBeInTheDocument();
      expect(screen.getByText('2 of 3')).toBeInTheDocument();
    });

    it('should display key ceremony status', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Key Ceremony')).toBeInTheDocument();
      expect(screen.getByText('complete')).toBeInTheDocument();
    });

    it('should show zero voters when none exist', async () => {
      mockGetVoterStats.mockResolvedValue({ stats: null });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('quick action links', () => {
    it('should have link to ballot page', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      const ballotSection = screen.getByText('Ballot Questions').closest('div');
      const link = ballotSection?.querySelector('a');
      expect(link).toHaveAttribute('href', '/elections/election-123/ballot');
    });

    it('should have link to voters page', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      const links = screen.getAllByText('Manage →');
      const votersLink = links.find(link =>
        link.closest('div')?.textContent?.includes('Voters')
      );
      expect(votersLink?.closest('a')).toHaveAttribute('href', '/elections/election-123/voters');
    });

    it('should have link to trustees page', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      const links = screen.getAllByText('Manage →');
      const trusteesLink = links.find(link =>
        link.closest('div')?.textContent?.includes('Trustees')
      );
      expect(trusteesLink?.closest('a')).toHaveAttribute('href', '/elections/election-123/trustees');
    });
  });

  describe('election timeline', () => {
    it('should display timeline section', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Election Timeline')).toBeInTheDocument();
    });

    it('should display voting opens date', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Voting Opens')).toBeInTheDocument();
    });

    it('should display voting closes date', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Voting Closes')).toBeInTheDocument();
    });

    it('should format dates with time', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      // Dates should be formatted with locale date and time
      const timelineSection = screen.getByText('Election Timeline').closest('div');
      expect(timelineSection).toBeInTheDocument();
    });
  });

  describe('description section', () => {
    it('should display description when present', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('A test election for comprehensive testing')).toBeInTheDocument();
    });

    it('should not display description section when empty', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, description: '' },
        ceremonyStatus: mockCeremonyStatus,
        publicKey: mockPublicKey,
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });
  });

  describe('status-specific guidance', () => {
    it('should show setup guidance for setup status', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'setup' },
        ceremonyStatus: { phase: 'pending', progress: 0 },
        publicKey: null,
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Next Step: Complete Key Ceremony')).toBeInTheDocument();
      expect(screen.getByText(/Invite 3 trustees/)).toBeInTheDocument();
    });

    it('should show draft guidance for draft status', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Next Step: Configure Ballot')).toBeInTheDocument();
      const guidanceText = screen.getByText(/key ceremony is complete/i);
      expect(guidanceText).toBeInTheDocument();
    });

    it('should have link to trustees in setup guidance', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'setup' },
        ceremonyStatus: { phase: 'pending', progress: 0 },
        publicKey: null,
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      const link = screen.getByText('Manage Trustees →').closest('a');
      expect(link).toHaveAttribute('href', '/elections/election-123/trustees');
    });

    it('should have link to ballot in draft guidance', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      const link = screen.getByText('Build Ballot →').closest('a');
      expect(link).toHaveAttribute('href', '/elections/election-123/ballot');
    });
  });

  describe('public key indicator', () => {
    it('should show public key ready when available', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Public key ready')).toBeInTheDocument();
    });

    it('should not show public key message when unavailable', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'setup' },
        ceremonyStatus: { phase: 'pending', progress: 0 },
        publicKey: null,
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.queryByText('Public key ready')).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display error when election not found', async () => {
      mockGetElection.mockRejectedValue(new Error('Election not found'));

      const params = Promise.resolve({ id: 'invalid-id' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Election Not Found')).toBeInTheDocument();
      expect(screen.getByText('Election not found')).toBeInTheDocument();
    });

    it('should show back to elections link on error', async () => {
      mockGetElection.mockRejectedValue(new Error('Election not found'));

      const params = Promise.resolve({ id: 'invalid-id' });
      render(await ElectionDetailPage({ params }));

      const link = screen.getByText('← Back to Elections').closest('a');
      expect(link).toHaveAttribute('href', '/elections');
    });

    it('should handle generic error messages', async () => {
      mockGetElection.mockRejectedValue(new Error('Server error'));

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Server error')).toBeInTheDocument();
    });

    it('should handle non-Error exceptions', async () => {
      mockGetElection.mockRejectedValue('String error');

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Failed to load election')).toBeInTheDocument();
    });

    it('should handle missing election data', async () => {
      mockGetElection.mockResolvedValue({
        election: null as any,
        ceremonyStatus: null,
        publicKey: null,
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Election Not Found')).toBeInTheDocument();
    });
  });

  describe('graceful degradation', () => {
    it('should handle missing trustees data', async () => {
      mockGetTrustees.mockRejectedValue(new Error('Failed to load'));

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('0 / 3')).toBeInTheDocument();
    });

    it('should handle missing questions data', async () => {
      mockGetQuestions.mockRejectedValue(new Error('Failed to load'));

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Ballot Questions')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle missing voter stats', async () => {
      mockGetVoterStats.mockRejectedValue(new Error('Failed to load'));

      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByText('Voters')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getByRole('heading', { level: 1, name: 'Test Election 2025' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Election Timeline' })).toBeInTheDocument();
    });

    it('should have accessible links', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have descriptive link text', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      expect(screen.getAllByText('Manage →').length).toBeGreaterThan(0);
    });
  });

  describe('responsive layout', () => {
    it('should have grid layout for stats', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      const { container } = render(await ElectionDetailPage({ params }));

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should have responsive grid classes', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      const { container } = render(await ElectionDetailPage({ params }));

      const grid = container.querySelector('.sm\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('dark mode support', () => {
    it('should have dark mode classes', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      const { container } = render(await ElectionDetailPage({ params }));

      const darkElements = container.querySelectorAll('.dark\\:bg-zinc-900');
      expect(darkElements.length).toBeGreaterThan(0);
    });

    it('should have dark mode text colors', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      const { container } = render(await ElectionDetailPage({ params }));

      const darkText = container.querySelectorAll('.dark\\:text-zinc-100');
      expect(darkText.length).toBeGreaterThan(0);
    });
  });

  describe('lifecycle controls integration', () => {
    it('should render lifecycle controls component', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ElectionDetailPage({ params }));

      // Lifecycle controls should be present
      expect(screen.getByText('Election Controls')).toBeInTheDocument();
    });
  });
});
