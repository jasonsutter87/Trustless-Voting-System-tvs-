import { render, screen } from '@/__tests__/utils/test-utils';
import { VoterStatsCard } from '../voter-stats';
import type { VoterStats } from '@/lib/actions/voters';

const mockStats: VoterStats = {
  total: 1000,
  registered: 1000,
  credentialsGenerated: 750,
  credentialsSent: 500,
  voted: 300,
  byJurisdiction: {
    'District 1': { total: 400, voted: 150 },
    'District 2': { total: 350, voted: 100 },
    'District 3': { total: 250, voted: 50 },
  },
};

describe('VoterStatsCard', () => {
  describe('loading state', () => {
    it('should render loading skeleton', () => {
      const { container } = render(<VoterStatsCard stats={null} isLoading />);

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('stats display', () => {
    it('should render total voters count', () => {
      render(<VoterStatsCard stats={mockStats} />);

      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getAllByText('Total Voters')[0]).toBeInTheDocument();
    });

    it('should render credentials generated count', () => {
      render(<VoterStatsCard stats={mockStats} />);

      // 750 appears in both stat card and progress section
      expect(screen.getAllByText('750')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Credentials Generated')[0]).toBeInTheDocument();
    });

    it('should render credentials sent count', () => {
      render(<VoterStatsCard stats={mockStats} />);

      // 500 appears in both stat card and progress section
      expect(screen.getAllByText('500')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Credentials Sent')[0]).toBeInTheDocument();
    });

    it('should render voted count', () => {
      render(<VoterStatsCard stats={mockStats} />);

      // 300 appears in both stat card and progress section
      expect(screen.getAllByText('300')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Voted')[0]).toBeInTheDocument();
    });
  });

  describe('progress section', () => {
    it('should render voter progress section', () => {
      render(<VoterStatsCard stats={mockStats} />);

      expect(screen.getByRole('heading', { name: /voter progress/i })).toBeInTheDocument();
    });

    it('should show percentages for progress bars', () => {
      render(<VoterStatsCard stats={mockStats} />);

      // 750/1000 = 75%, 500/1000 = 50%, 300/1000 = 30%
      expect(screen.getByText('(75%)')).toBeInTheDocument();
      expect(screen.getByText('(50%)')).toBeInTheDocument();
      expect(screen.getByText('(30%)')).toBeInTheDocument();
    });
  });

  describe('jurisdiction breakdown', () => {
    it('should render jurisdiction breakdown section', () => {
      render(<VoterStatsCard stats={mockStats} />);

      expect(screen.getByRole('heading', { name: /by jurisdiction/i })).toBeInTheDocument();
    });

    it('should display all jurisdictions', () => {
      render(<VoterStatsCard stats={mockStats} />);

      expect(screen.getByText('District 1')).toBeInTheDocument();
      expect(screen.getByText('District 2')).toBeInTheDocument();
      expect(screen.getByText('District 3')).toBeInTheDocument();
    });

    it('should show voter totals per jurisdiction', () => {
      render(<VoterStatsCard stats={mockStats} />);

      expect(screen.getByText('400')).toBeInTheDocument();
      expect(screen.getByText('350')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
    });

    it('should show voted counts per jurisdiction', () => {
      render(<VoterStatsCard stats={mockStats} />);

      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('should calculate and display turnout percentages', () => {
      render(<VoterStatsCard stats={mockStats} />);

      // 150/400 = 38%, 100/350 = 29%, 50/250 = 20%
      expect(screen.getByText('38%')).toBeInTheDocument();
      expect(screen.getByText('29%')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('should render nothing when stats is null and not loading', () => {
      const { container } = render(<VoterStatsCard stats={null} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render jurisdiction section when no jurisdictions', () => {
      const statsWithoutJurisdictions: VoterStats = {
        ...mockStats,
        byJurisdiction: {},
      };

      render(<VoterStatsCard stats={statsWithoutJurisdictions} />);

      expect(screen.queryByRole('heading', { name: /by jurisdiction/i })).not.toBeInTheDocument();
    });
  });
});
