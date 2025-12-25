/**
 * Results Page Tests
 * Comprehensive tests for the election results page
 *
 * Test Coverage:
 * - Async rendering: Server component with data fetching
 * - Results display: Integration with ResultsDisplay component
 * - Decryption status: Trustee decryption progress
 * - Status-based rendering: Different views for each status
 * - Error handling: Missing data, failed requests
 * - Access control: Results available only for appropriate statuses
 * - Guidance messages: Status-specific instructions
 * - Accessibility: Headings, links, ARIA
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ResultsPage from '../page';
import { getElection, getElectionResults } from '@/lib/actions/elections';
import { getTrustees } from '@/lib/actions/trustees';

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

const mockGetElection = getElection as jest.MockedFunction<typeof getElection>;
const mockGetElectionResults = getElectionResults as jest.MockedFunction<typeof getElectionResults>;
const mockGetTrustees = getTrustees as jest.MockedFunction<typeof getTrustees>;

describe('ResultsPage', () => {
  const mockElection = {
    id: 'election-123',
    name: 'Test Election 2025',
    description: 'A test election',
    status: 'complete' as const,
    startTime: '2025-01-15T10:00:00Z',
    endTime: '2025-01-20T18:00:00Z',
    threshold: 2,
    totalTrustees: 3,
    createdAt: '2025-01-01T00:00:00Z',
  };

  const mockResults = [
    {
      candidate: { id: 'c1', name: 'Candidate A', position: 1 },
      votes: 150,
    },
    {
      candidate: { id: 'c2', name: 'Candidate B', position: 2 },
      votes: 100,
    },
  ];

  const mockTrustees = {
    trustees: [
      { id: 't1', name: 'Trustee 1', status: 'complete', hasDecrypted: true },
      { id: 't2', name: 'Trustee 2', status: 'complete', hasDecrypted: true },
      { id: 't3', name: 'Trustee 3', status: 'complete', hasDecrypted: false },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetElection.mockResolvedValue({
      election: mockElection,
      ceremonyStatus: { phase: 'complete', progress: 100 },
      publicKey: 'mock-key',
    });

    mockGetElectionResults.mockResolvedValue({ results: mockResults });
    mockGetTrustees.mockResolvedValue(mockTrustees);
  });

  describe('successful rendering with complete status', () => {
    it('should render the results page', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Election Results')).toBeInTheDocument();
    });

    it('should display page heading', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByRole('heading', { name: 'Election Results', level: 2 })).toBeInTheDocument();
    });

    it('should display complete status description', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Final certified results for this election.')).toBeInTheDocument();
    });

    it('should fetch election data', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      await ResultsPage({ params });

      expect(mockGetElection).toHaveBeenCalledWith('election-123');
    });

    it('should fetch trustees data', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      await ResultsPage({ params });

      expect(mockGetTrustees).toHaveBeenCalledWith('election-123');
    });

    it('should fetch results data for complete status', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      await ResultsPage({ params });

      expect(mockGetElectionResults).toHaveBeenCalledWith('election-123');
    });
  });

  describe('tallying status rendering', () => {
    beforeEach(() => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'tallying' },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });
    });

    it('should display tallying description', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Collect trustee decryption shares to reveal results.')).toBeInTheDocument();
    });

    it('should show decryption status component', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Decryption Ceremony')).toBeInTheDocument();
    });

    it('should fetch results data for tallying status', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      await ResultsPage({ params });

      expect(mockGetElectionResults).toHaveBeenCalledWith('election-123');
    });

    it('should show awaiting message when threshold not met', async () => {
      mockGetTrustees.mockResolvedValue({
        trustees: [
          { id: 't1', name: 'Trustee 1', status: 'complete', hasDecrypted: true },
          { id: 't2', name: 'Trustee 2', status: 'complete', hasDecrypted: false },
          { id: 't3', name: 'Trustee 3', status: 'complete', hasDecrypted: false },
        ],
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Awaiting Decryption Shares')).toBeInTheDocument();
      expect(screen.getByText(/Need 1 more trustee/)).toBeInTheDocument();
    });

    it('should pluralize trustees correctly', async () => {
      mockGetTrustees.mockResolvedValue({
        trustees: [
          { id: 't1', name: 'Trustee 1', status: 'complete', hasDecrypted: false },
          { id: 't2', name: 'Trustee 2', status: 'complete', hasDecrypted: false },
          { id: 't3', name: 'Trustee 3', status: 'complete', hasDecrypted: false },
        ],
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText(/Need 2 more trustees/)).toBeInTheDocument();
    });

    it('should not show results when threshold not met', async () => {
      mockGetTrustees.mockResolvedValue({
        trustees: [
          { id: 't1', name: 'Trustee 1', status: 'complete', hasDecrypted: true },
          { id: 't2', name: 'Trustee 2', status: 'complete', hasDecrypted: false },
          { id: 't3', name: 'Trustee 3', status: 'complete', hasDecrypted: false },
        ],
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.queryByText('Vote Tallies')).not.toBeInTheDocument();
    });
  });

  describe('results not available states', () => {
    it('should show not available message for draft status', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'draft' },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Results Not Available Yet')).toBeInTheDocument();
    });

    it('should show not available message for registration status', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'registration' },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Results Not Available Yet')).toBeInTheDocument();
    });

    it('should show not available message for voting status', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'voting' },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Results Not Available Yet')).toBeInTheDocument();
    });

    it('should show current status in not available message', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'voting' },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText(/Current status:/)).toBeInTheDocument();
      const statusElements = screen.getAllByText(/voting/i);
      expect(statusElements.length).toBeGreaterThan(0);
    });

    it('should show status information', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'draft' },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText(/Current status:/)).toBeInTheDocument();
    });

    it('should not fetch results for non-eligible statuses', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'draft' },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });

      const params = Promise.resolve({ id: 'election-123' });
      await ResultsPage({ params });

      expect(mockGetElectionResults).not.toHaveBeenCalled();
    });
  });

  describe('certified results banner', () => {
    it('should show certified banner for complete status', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Results Certified')).toBeInTheDocument();
    });

    it('should show Bitcoin anchor message', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText(/anchored to Bitcoin/)).toBeInTheDocument();
    });

    it('should show tamper-proof verification message', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText(/permanent, tamper-proof verification/)).toBeInTheDocument();
    });

    it('should not show certified banner for tallying status', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'tallying' },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.queryByText('Results Certified')).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display error when election fetch fails', async () => {
      mockGetElection.mockRejectedValue(new Error('Election not found'));

      const params = Promise.resolve({ id: 'invalid-id' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Error Loading Results')).toBeInTheDocument();
      expect(screen.getByText('Election not found')).toBeInTheDocument();
    });

    it('should show back to elections link on error', async () => {
      mockGetElection.mockRejectedValue(new Error('Election not found'));

      const params = Promise.resolve({ id: 'invalid-id' });
      render(await ResultsPage({ params }));

      const link = screen.getByText(/Back to Elections/i).closest('a');
      expect(link).toHaveAttribute('href', '/elections');
    });

    it('should handle generic error messages', async () => {
      mockGetElection.mockRejectedValue(new Error('Server error'));

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Server error')).toBeInTheDocument();
    });

    it('should handle non-Error exceptions', async () => {
      mockGetElection.mockRejectedValue('String error');

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Failed to load election')).toBeInTheDocument();
    });

    it('should handle missing election data', async () => {
      mockGetElection.mockResolvedValue({
        election: null as any,
        ceremonyStatus: null,
        publicKey: null,
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Error Loading Results')).toBeInTheDocument();
    });

    it('should handle results fetch failure during tallying', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'tallying' },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });
      mockGetElectionResults.mockRejectedValue(new Error('Results not ready'));

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      // Should still render page without crashing
      expect(screen.getByText('Election Results')).toBeInTheDocument();
    });
  });

  describe('results display integration', () => {
    it('should render results display component when data available', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Vote Tallies')).toBeInTheDocument();
    });

    it('should pass election to results display', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Vote Tallies')).toBeInTheDocument();
    });

    it('should mark results as certified for complete status', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Winner')).toBeInTheDocument();
    });

    it('should not mark results as certified for tallying status', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'tallying' },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.queryByText('Winner')).not.toBeInTheDocument();
    });
  });

  describe('decryption progress calculation', () => {
    it('should calculate decryption progress correctly', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'tallying' },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      // 2 of 2 required (threshold)
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    it('should show threshold reached message', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'tallying' },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText(/Threshold reached/)).toBeInTheDocument();
    });

    it('should show shares needed message', async () => {
      mockGetTrustees.mockResolvedValue({
        trustees: [
          { id: 't1', name: 'Trustee 1', status: 'complete', hasDecrypted: true },
          { id: 't2', name: 'Trustee 2', status: 'complete', hasDecrypted: false },
          { id: 't3', name: 'Trustee 3', status: 'complete', hasDecrypted: false },
        ],
      });
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'tallying' },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText(/1 more share needed/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByRole('heading', { level: 2, name: 'Election Results' })).toBeInTheDocument();
    });

    it('should have accessible error messages', async () => {
      mockGetElection.mockRejectedValue(new Error('Election not found'));

      const params = Promise.resolve({ id: 'invalid-id' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Error Loading Results')).toBeInTheDocument();
    });

    it('should have accessible links', async () => {
      mockGetElection.mockRejectedValue(new Error('Not found'));

      const params = Promise.resolve({ id: 'invalid-id' });
      render(await ResultsPage({ params }));

      const link = screen.getByRole('link', { name: /back to elections/i });
      expect(link).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    it('should have consistent spacing', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      const { container } = render(await ResultsPage({ params }));

      const spaceContainer = container.querySelector('.space-y-6');
      expect(spaceContainer).toBeInTheDocument();
    });
  });

  describe('dark mode support', () => {
    it('should have dark mode classes for cards', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      const { container } = render(await ResultsPage({ params }));

      const darkElements = container.querySelectorAll('.dark\\:bg-green-950');
      expect(darkElements.length).toBeGreaterThan(0);
    });

    it('should have dark mode text colors', async () => {
      const params = Promise.resolve({ id: 'election-123' });
      const { container } = render(await ResultsPage({ params }));

      const darkText = container.querySelectorAll('.dark\\:text-zinc-100');
      expect(darkText.length).toBeGreaterThan(0);
    });

    it('should have dark mode error styling', async () => {
      mockGetElection.mockRejectedValue(new Error('Not found'));

      const params = Promise.resolve({ id: 'invalid-id' });
      const { container } = render(await ResultsPage({ params }));

      const errorCard = container.querySelector('.dark\\:bg-red-950');
      expect(errorCard).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty results array', async () => {
      mockGetElectionResults.mockResolvedValue({ results: [] });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      // Should still show page structure
      expect(screen.getByText('Election Results')).toBeInTheDocument();
    });

    it('should handle zero trustees', async () => {
      mockGetTrustees.mockResolvedValue({ trustees: [] });

      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'tallying' },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Decryption Ceremony')).toBeInTheDocument();
    });

    it('should handle threshold of zero', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'complete', threshold: 0 },
        ceremonyStatus: { phase: 'complete', progress: 100 },
        publicKey: 'mock-key',
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Vote Tallies')).toBeInTheDocument();
    });
  });

  describe('status flow', () => {
    it('should show setup status as not available', async () => {
      mockGetElection.mockResolvedValue({
        election: { ...mockElection, status: 'setup' },
        ceremonyStatus: { phase: 'pending', progress: 0 },
        publicKey: null,
      });

      const params = Promise.resolve({ id: 'election-123' });
      render(await ResultsPage({ params }));

      expect(screen.getByText('Results Not Available Yet')).toBeInTheDocument();
    });

    it('should handle all status types correctly', async () => {
      const statuses = ['setup', 'draft', 'registration', 'voting', 'tallying', 'complete'] as const;

      for (const status of statuses) {
        jest.clearAllMocks();

        mockGetElection.mockResolvedValue({
          election: { ...mockElection, status },
          ceremonyStatus: { phase: 'complete', progress: 100 },
          publicKey: 'mock-key',
        });

        const params = Promise.resolve({ id: 'election-123' });
        render(await ResultsPage({ params }));

        if (status === 'tallying' || status === 'complete') {
          expect(mockGetElectionResults).toHaveBeenCalled();
        } else {
          expect(mockGetElectionResults).not.toHaveBeenCalled();
        }
      }
    });
  });
});
