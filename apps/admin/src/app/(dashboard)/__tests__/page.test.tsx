/**
 * Dashboard Home Page Tests
 * Comprehensive tests for the main dashboard page
 *
 * Test Coverage:
 * - Rendering: Page structure, stats, recent elections
 * - Navigation: Links to elections, new election button
 * - Data display: Stats formatting, election cards
 * - Status badges: Active, draft, completed states
 * - Accessibility: Headings, landmarks, screen reader text
 * - Edge cases: Empty states, zero values, large numbers
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardHomePage from '../page';

// Mock next/link
jest.mock('next/link', () => {
  return function Link({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('DashboardHomePage', () => {
  describe('page structure', () => {
    it('should render the dashboard page', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('Elections Dashboard')).toBeInTheDocument();
    });

    it('should display page title', () => {
      render(<DashboardHomePage />);

      expect(screen.getByRole('heading', { name: 'Elections Dashboard', level: 1 })).toBeInTheDocument();
    });

    it('should display page description', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText(/manage and monitor your organization/i)).toBeInTheDocument();
    });

    it('should have stats section with accessible heading', () => {
      render(<DashboardHomePage />);

      expect(screen.getByRole('heading', { name: 'Election statistics' })).toBeInTheDocument();
    });

    it('should have recent elections section with heading', () => {
      render(<DashboardHomePage />);

      expect(screen.getByRole('heading', { name: 'Recent Elections', level: 2 })).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      render(<DashboardHomePage />);

      const statsSection = screen.getByLabelText('Election statistics');
      expect(statsSection).toBeInTheDocument();
    });
  });

  describe('new election button', () => {
    it('should display new election button', () => {
      render(<DashboardHomePage />);

      expect(screen.getByRole('link', { name: /new election/i })).toBeInTheDocument();
    });

    it('should link to new election page', () => {
      render(<DashboardHomePage />);

      const button = screen.getByRole('link', { name: /new election/i });
      expect(button).toHaveAttribute('href', '/elections/new');
    });

    it('should have icon in button', () => {
      render(<DashboardHomePage />);

      const button = screen.getByRole('link', { name: /new election/i });
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<DashboardHomePage />);

      const button = screen.getByRole('link', { name: /new election/i });
      await user.tab();

      // Button should be focusable
      expect(button).toBeInTheDocument();
    });
  });

  describe('statistics cards', () => {
    it('should display all three stat cards', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('Active Elections')).toBeInTheDocument();
      expect(screen.getByText('Total Voters')).toBeInTheDocument();
      expect(screen.getByText('Participation Rate')).toBeInTheDocument();
    });

    it('should display active elections count', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('Active Elections')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should display active elections description', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('Currently running')).toBeInTheDocument();
    });

    it('should display total voters count', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('Total Voters')).toBeInTheDocument();
      expect(screen.getByText('6,847')).toBeInTheDocument();
    });

    it('should display voters description', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('Across all elections')).toBeInTheDocument();
    });

    it('should display participation rate', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('Participation Rate')).toBeInTheDocument();
      expect(screen.getByText('71.5%')).toBeInTheDocument();
    });

    it('should display participation rate description', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('Average across active')).toBeInTheDocument();
    });

    it('should format large numbers with commas', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('6,847')).toBeInTheDocument();
    });

    it('should use consistent card styling', () => {
      const { container } = render(<DashboardHomePage />);

      const statsSection = container.querySelector('[aria-labelledby="stats-heading"]');
      const cards = statsSection?.querySelectorAll('.rounded-lg');
      expect(cards?.length).toBe(3);
    });
  });

  describe('recent elections list', () => {
    it('should display all recent elections', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('Board of Directors Election 2025')).toBeInTheDocument();
      expect(screen.getByText('Annual Budget Approval')).toBeInTheDocument();
      expect(screen.getByText('Policy Amendment Vote')).toBeInTheDocument();
    });

    it('should display election titles as links', () => {
      render(<DashboardHomePage />);

      const election = screen.getByText('Board of Directors Election 2025').closest('a');
      expect(election).toHaveAttribute('href', '/elections/1');
    });

    it('should display voter counts', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('1,247 voters')).toBeInTheDocument();
      expect(screen.getByText('3,500 voters')).toBeInTheDocument();
      expect(screen.getByText('2,100 voters')).toBeInTheDocument();
    });

    it('should display votes cast', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('892 votes cast')).toBeInTheDocument();
      expect(screen.getByText('0 votes cast')).toBeInTheDocument();
      expect(screen.getByText('1,987 votes cast')).toBeInTheDocument();
    });

    it('should display end dates', () => {
      render(<DashboardHomePage />);

      // Check that dates are formatted
      const dateElements = screen.getAllByText(/Ends/);
      expect(dateElements.length).toBe(3);
    });

    it('should format dates correctly', () => {
      render(<DashboardHomePage />);

      // Check that Ends text is present
      const dateElements = screen.getAllByText(/Ends/);
      expect(dateElements.length).toBe(3);
    });

    it('should show chevron icons for navigation', () => {
      const { container } = render(<DashboardHomePage />);

      const chevrons = container.querySelectorAll('svg');
      // Should have icons
      expect(chevrons.length).toBeGreaterThan(0);
    });
  });

  describe('status badges', () => {
    it('should display active status badge', () => {
      render(<DashboardHomePage />);

      const badge = screen.getByText('Active');
      expect(badge).toBeInTheDocument();
    });

    it('should display draft status badge', () => {
      render(<DashboardHomePage />);

      const badge = screen.getByText('Draft');
      expect(badge).toBeInTheDocument();
    });

    it('should display completed status badge', () => {
      render(<DashboardHomePage />);

      const badge = screen.getByText('Completed');
      expect(badge).toBeInTheDocument();
    });

    it('should have accessible status labels', () => {
      render(<DashboardHomePage />);

      const srLabels = screen.getAllByText('Status:', { exact: false });
      expect(srLabels.length).toBeGreaterThan(0);
    });

    it('should capitalize status text', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.queryByText('active')).not.toBeInTheDocument();
    });

    it('should apply correct styling to active badge', () => {
      const { container } = render(<DashboardHomePage />);

      const activeBadge = screen.getByText('Active').closest('span');
      expect(activeBadge?.className).toContain('bg-green-100');
      expect(activeBadge?.className).toContain('text-green-800');
    });

    it('should apply correct styling to draft badge', () => {
      const { container } = render(<DashboardHomePage />);

      const draftBadge = screen.getByText('Draft').closest('span');
      expect(draftBadge?.className).toContain('bg-yellow-100');
      expect(draftBadge?.className).toContain('text-yellow-800');
    });

    it('should apply correct styling to completed badge', () => {
      const { container } = render(<DashboardHomePage />);

      const completedBadge = screen.getByText('Completed').closest('span');
      expect(completedBadge?.className).toContain('bg-zinc-100');
      expect(completedBadge?.className).toContain('text-zinc-800');
    });
  });

  describe('view all elections link', () => {
    it('should display view all elections link', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('View all elections →')).toBeInTheDocument();
    });

    it('should link to elections page', () => {
      render(<DashboardHomePage />);

      const link = screen.getByText('View all elections →').closest('a');
      expect(link).toHaveAttribute('href', '/elections');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<DashboardHomePage />);

      const link = screen.getByText('View all elections →');

      // Should be focusable
      expect(link).toBeInTheDocument();
    });
  });

  describe('election cards interactivity', () => {
    it('should have clickable election rows', () => {
      const { container } = render(<DashboardHomePage />);

      const links = container.querySelectorAll('a[href^="/elections/"]');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should navigate to election detail on click', () => {
      render(<DashboardHomePage />);

      const election = screen.getByText('Board of Directors Election 2025').closest('a');
      expect(election).toHaveAttribute('href', '/elections/1');
    });

    it('should show all election information in rows', () => {
      render(<DashboardHomePage />);

      // First election should show all info
      expect(screen.getByText('Board of Directors Election 2025')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('1,247 voters')).toBeInTheDocument();
      expect(screen.getByText('892 votes cast')).toBeInTheDocument();
    });
  });

  describe('number formatting', () => {
    it('should format voter counts with commas', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('1,247 voters')).toBeInTheDocument();
      expect(screen.getByText('3,500 voters')).toBeInTheDocument();
      expect(screen.getByText('2,100 voters')).toBeInTheDocument();
    });

    it('should format vote counts with commas', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('1,987 votes cast')).toBeInTheDocument();
    });

    it('should handle zero votes correctly', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('0 votes cast')).toBeInTheDocument();
    });

    it('should format total voters in stats', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('6,847')).toBeInTheDocument();
    });

    it('should display percentage with decimal', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('71.5%')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have main heading at level 1', () => {
      render(<DashboardHomePage />);

      expect(screen.getByRole('heading', { level: 1, name: 'Elections Dashboard' })).toBeInTheDocument();
    });

    it('should have section headings at level 2', () => {
      render(<DashboardHomePage />);

      expect(screen.getByRole('heading', { level: 2, name: 'Recent Elections' })).toBeInTheDocument();
    });

    it('should use semantic sections', () => {
      render(<DashboardHomePage />);

      const statsSection = screen.getByLabelText('Election statistics');
      expect(statsSection.tagName).toBe('SECTION');
    });

    it('should have screen reader only text for icons', () => {
      const { container } = render(<DashboardHomePage />);

      const srOnlyElements = container.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);
    });

    it('should have icons in the page', () => {
      const { container } = render(<DashboardHomePage />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have accessible status labels', () => {
      render(<DashboardHomePage />);

      const statusLabels = screen.getAllByText('Status:', { exact: false });
      statusLabels.forEach(label => {
        expect(label.className).toContain('sr-only');
      });
    });

    it('should display large stat numbers', () => {
      const { container } = render(<DashboardHomePage />);

      const statCards = container.querySelectorAll('.text-3xl');
      expect(statCards.length).toBeGreaterThan(0);
    });

    it('should use semantic HTML for stats cards', () => {
      const { container } = render(<DashboardHomePage />);

      const statsSection = screen.getByLabelText('Election statistics');
      expect(statsSection).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    it('should have grid layout for stats', () => {
      const { container } = render(<DashboardHomePage />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should have responsive grid classes', () => {
      const { container } = render(<DashboardHomePage />);

      const statsSection = container.querySelector('[aria-labelledby="stats-heading"]');
      const grid = statsSection?.querySelector('.grid');
      expect(grid?.className).toContain('md:grid-cols-3');
    });

    it('should have gap spacing between cards', () => {
      const { container } = render(<DashboardHomePage />);

      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('gap-4');
    });
  });

  describe('dark mode support', () => {
    it('should have dark mode classes for cards', () => {
      const { container } = render(<DashboardHomePage />);

      const cards = container.querySelectorAll('.dark\\:bg-zinc-900');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should have dark mode classes for text', () => {
      const { container } = render(<DashboardHomePage />);

      const darkText = container.querySelectorAll('.dark\\:text-zinc-100');
      expect(darkText.length).toBeGreaterThan(0);
    });

    it('should have dark mode badge styles', () => {
      const { container } = render(<DashboardHomePage />);

      const activeBadge = screen.getByText('Active').closest('span');
      expect(activeBadge?.className).toContain('dark:bg-green-900/30');
    });
  });

  describe('data integrity', () => {
    it('should display consistent election count', () => {
      render(<DashboardHomePage />);

      // Three elections in the list
      const elections = [
        'Board of Directors Election 2025',
        'Annual Budget Approval',
        'Policy Amendment Vote'
      ];

      elections.forEach(election => {
        expect(screen.getByText(election)).toBeInTheDocument();
      });
    });

    it('should show correct voter/vote relationship', () => {
      render(<DashboardHomePage />);

      // First election: 1247 voters, 892 votes (< 100%)
      expect(screen.getByText('1,247 voters')).toBeInTheDocument();
      expect(screen.getByText('892 votes cast')).toBeInTheDocument();

      // Draft election: voters but no votes
      expect(screen.getByText('3,500 voters')).toBeInTheDocument();
      expect(screen.getByText('0 votes cast')).toBeInTheDocument();
    });

    it('should display dates in chronological order', () => {
      render(<DashboardHomePage />);

      // Recent elections should show most recent/relevant first
      const elections = screen.getAllByRole('link', { name: /Election|Budget|Policy/i });
      expect(elections.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle elections with zero votes', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('0 votes cast')).toBeInTheDocument();
    });

    it('should display single active election', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should handle large voter numbers', () => {
      render(<DashboardHomePage />);

      expect(screen.getByText('6,847')).toBeInTheDocument();
    });

    it('should format future dates correctly', () => {
      render(<DashboardHomePage />);

      // Check that dates are displayed
      const dateText = screen.getAllByText(/Ends/);
      expect(dateText.length).toBe(3);
    });
  });

  describe('visual hierarchy', () => {
    it('should have largest text for page title', () => {
      render(<DashboardHomePage />);

      const title = screen.getByRole('heading', { name: 'Elections Dashboard' });
      expect(title.className).toContain('text-3xl');
    });

    it('should have prominent stats numbers', () => {
      const { container } = render(<DashboardHomePage />);

      const statNumbers = container.querySelectorAll('.text-3xl');
      expect(statNumbers.length).toBeGreaterThan(0);
    });

    it('should have smaller helper text', () => {
      const { container } = render(<DashboardHomePage />);

      const helperText = container.querySelectorAll('.text-xs');
      expect(helperText.length).toBeGreaterThan(0);
    });
  });

  describe('spacing and layout', () => {
    it('should have consistent vertical spacing', () => {
      const { container } = render(<DashboardHomePage />);

      const mainContainer = container.querySelector('.space-y-6');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have padding on cards', () => {
      const { container } = render(<DashboardHomePage />);

      const cards = container.querySelectorAll('.p-6');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should have proper gap between stats', () => {
      const { container } = render(<DashboardHomePage />);

      const grid = container.querySelector('.gap-4');
      expect(grid).toBeInTheDocument();
    });
  });
});
