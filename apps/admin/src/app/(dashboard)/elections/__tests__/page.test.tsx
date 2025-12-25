/**
 * Elections List Page Tests
 * Comprehensive tests for the elections listing page
 *
 * Test Coverage:
 * - Rendering: Page structure, table, headers
 * - Data display: Election data, status badges, dates
 * - Navigation: Links to elections, new election button
 * - Search and filter UI elements
 * - Number formatting: Voters, votes, percentages
 * - Accessibility: Table structure, labels, ARIA
 * - Status indicators: Colors and labels for each status
 * - Edge cases: Empty states, zero values
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ElectionsPage from '../page';

// Mock next/link
jest.mock('next/link', () => {
  return function Link({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('ElectionsPage', () => {
  describe('page structure', () => {
    it('should render the elections page', () => {
      render(<ElectionsPage />);

      expect(screen.getByText('Elections')).toBeInTheDocument();
    });

    it('should display page title', () => {
      render(<ElectionsPage />);

      expect(screen.getByRole('heading', { name: 'Elections', level: 1 })).toBeInTheDocument();
    });

    it('should display page description', () => {
      render(<ElectionsPage />);

      expect(screen.getByText(/manage all your organization/i)).toBeInTheDocument();
    });

    it('should have elections table', () => {
      render(<ElectionsPage />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should have accessible table caption', () => {
      render(<ElectionsPage />);

      const table = screen.getByRole('table');
      expect(table).toHaveAccessibleName('List of all elections');
    });
  });

  describe('new election button', () => {
    it('should display new election button', () => {
      render(<ElectionsPage />);

      expect(screen.getByRole('link', { name: /new election/i })).toBeInTheDocument();
    });

    it('should link to new election page', () => {
      render(<ElectionsPage />);

      const button = screen.getByRole('link', { name: /new election/i });
      expect(button).toHaveAttribute('href', '/elections/new');
    });

    it('should have icon in button', () => {
      render(<ElectionsPage />);

      const button = screen.getByRole('link', { name: /new election/i });
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<ElectionsPage />);

      const button = screen.getByRole('link', { name: /new election/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('search and filter controls', () => {
    it('should display search input', () => {
      render(<ElectionsPage />);

      expect(screen.getByLabelText('Search elections')).toBeInTheDocument();
    });

    it('should have search placeholder text', () => {
      render(<ElectionsPage />);

      const searchInput = screen.getByPlaceholderText('Search elections...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should have accessible search label', () => {
      render(<ElectionsPage />);

      expect(screen.getByLabelText('Search elections')).toBeInTheDocument();
    });

    it('should display filter button', () => {
      render(<ElectionsPage />);

      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    });

    it('should have search icon', () => {
      const { container } = render(<ElectionsPage />);

      const searchIcon = container.querySelector('svg');
      expect(searchIcon).toBeInTheDocument();
    });

    it('should have filter icon', () => {
      render(<ElectionsPage />);

      const filterButton = screen.getByRole('button', { name: /filter/i });
      const icon = filterButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('table headers', () => {
    it('should display all table headers', () => {
      render(<ElectionsPage />);

      expect(screen.getByRole('columnheader', { name: /election/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /voters/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /votes cast/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /period/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
    });

    it('should have uppercase column headers', () => {
      render(<ElectionsPage />);

      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header.className).toContain('uppercase');
      });
    });

    it('should align actions header to the right', () => {
      render(<ElectionsPage />);

      const actionsHeader = screen.getByRole('columnheader', { name: /actions/i });
      expect(actionsHeader.className).toContain('text-right');
    });
  });

  describe('elections data display', () => {
    it('should display all elections', () => {
      render(<ElectionsPage />);

      expect(screen.getByText('Board of Directors Election 2025')).toBeInTheDocument();
      expect(screen.getByText('Annual Budget Approval')).toBeInTheDocument();
      expect(screen.getByText('Policy Amendment Vote')).toBeInTheDocument();
      expect(screen.getByText('Committee Member Selection')).toBeInTheDocument();
    });

    it('should display created dates', () => {
      render(<ElectionsPage />);

      const createdTexts = screen.getAllByText(/Created/);
      expect(createdTexts.length).toBe(4);
    });

    it('should display voter counts', () => {
      render(<ElectionsPage />);

      expect(screen.getByText('1,247')).toBeInTheDocument();
      expect(screen.getByText('3,500')).toBeInTheDocument();
      expect(screen.getByText('2,100')).toBeInTheDocument();
      expect(screen.getByText('850')).toBeInTheDocument();
    });

    it('should display vote counts', () => {
      render(<ElectionsPage />);

      expect(screen.getByText('892')).toBeInTheDocument();
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
      expect(screen.getByText('1,987')).toBeInTheDocument();
    });

    it('should display participation percentages', () => {
      render(<ElectionsPage />);

      expect(screen.getByText('71.5% turnout')).toBeInTheDocument();
      expect(screen.getAllByText('0.0% turnout').length).toBe(2);
      expect(screen.getByText('94.6% turnout')).toBeInTheDocument();
    });

    it('should calculate participation rate correctly', () => {
      render(<ElectionsPage />);

      // 892/1247 = ~71.5%
      expect(screen.getByText('71.5% turnout')).toBeInTheDocument();

      // 1987/2100 = ~94.6%
      expect(screen.getByText('94.6% turnout')).toBeInTheDocument();
    });

    it('should handle zero votes participation', () => {
      render(<ElectionsPage />);

      const zeroTurnout = screen.getAllByText('0.0% turnout');
      expect(zeroTurnout.length).toBe(2);
    });
  });

  describe('date display', () => {
    it('should display start dates', () => {
      const { container } = render(<ElectionsPage />);

      const periodCells = container.querySelectorAll('td:nth-child(5)');
      expect(periodCells.length).toBe(4);
    });

    it('should display end dates', () => {
      render(<ElectionsPage />);

      const toTexts = screen.getAllByText(/to/);
      expect(toTexts.length).toBeGreaterThan(0);
    });

    it('should show date ranges in period column', () => {
      const { container } = render(<ElectionsPage />);

      const periodCells = container.querySelectorAll('td:nth-child(5)');
      expect(periodCells.length).toBe(4);
    });
  });

  describe('status badges', () => {
    it('should display all status types', () => {
      render(<ElectionsPage />);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
    });

    it('should have accessible status labels', () => {
      render(<ElectionsPage />);

      const statusLabels = screen.getAllByText('Status:', { exact: false });
      statusLabels.forEach(label => {
        expect(label.className).toContain('sr-only');
      });
    });

    it('should apply correct styling to active badge', () => {
      render(<ElectionsPage />);

      const badge = screen.getByText('Active').closest('span');
      expect(badge?.className).toContain('bg-green-100');
      expect(badge?.className).toContain('text-green-800');
    });

    it('should apply correct styling to draft badge', () => {
      render(<ElectionsPage />);

      const badge = screen.getByText('Draft').closest('span');
      expect(badge?.className).toContain('bg-yellow-100');
      expect(badge?.className).toContain('text-yellow-800');
    });

    it('should apply correct styling to completed badge', () => {
      render(<ElectionsPage />);

      const badge = screen.getByText('Completed').closest('span');
      expect(badge?.className).toContain('bg-zinc-100');
      expect(badge?.className).toContain('text-zinc-800');
    });

    it('should apply correct styling to scheduled badge', () => {
      render(<ElectionsPage />);

      const badge = screen.getByText('Scheduled').closest('span');
      expect(badge?.className).toContain('bg-blue-100');
      expect(badge?.className).toContain('text-blue-800');
    });

    it('should capitalize status text', () => {
      render(<ElectionsPage />);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.queryByText('active')).not.toBeInTheDocument();
    });
  });

  describe('view election links', () => {
    it('should have view links for all elections', () => {
      render(<ElectionsPage />);

      const viewLinks = screen.getAllByText(/View/);
      expect(viewLinks.length).toBe(4);
    });

    it('should link to correct election detail pages', () => {
      const { container } = render(<ElectionsPage />);

      const links = container.querySelectorAll('a[href="/elections/1"], a[href="/elections/2"], a[href="/elections/3"], a[href="/elections/4"]');
      expect(links.length).toBe(4);
    });

    it('should align view links to the right', () => {
      const { container } = render(<ElectionsPage />);

      const actionCells = container.querySelectorAll('td:last-child');
      actionCells.forEach(cell => {
        expect(cell.className).toContain('text-right');
      });
    });
  });

  describe('table row interactivity', () => {
    it('should have hover state on rows', () => {
      const { container } = render(<ElectionsPage />);

      const rows = container.querySelectorAll('tbody tr');
      rows.forEach(row => {
        expect(row.className).toContain('hover:');
      });
    });

    it('should display 4 election rows', () => {
      const { container } = render(<ElectionsPage />);

      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(4);
    });
  });

  describe('number formatting', () => {
    it('should format voter counts with commas', () => {
      render(<ElectionsPage />);

      expect(screen.getByText('1,247')).toBeInTheDocument();
      expect(screen.getByText('3,500')).toBeInTheDocument();
      expect(screen.getByText('2,100')).toBeInTheDocument();
    });

    it('should format vote counts with commas', () => {
      render(<ElectionsPage />);

      expect(screen.getByText('1,987')).toBeInTheDocument();
    });

    it('should display percentages with one decimal', () => {
      render(<ElectionsPage />);

      expect(screen.getByText('71.5% turnout')).toBeInTheDocument();
      expect(screen.getByText('94.6% turnout')).toBeInTheDocument();
      const zeroTurnout = screen.getAllByText('0.0% turnout');
      expect(zeroTurnout.length).toBe(2);
    });

    it('should handle numbers under 1000 without commas', () => {
      render(<ElectionsPage />);

      expect(screen.getByText('892')).toBeInTheDocument();
      expect(screen.getByText('850')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper table structure', () => {
      render(<ElectionsPage />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBe(6);
    });

    it('should have accessible table caption', () => {
      render(<ElectionsPage />);

      const caption = screen.getByText('List of all elections');
      expect(caption.className).toContain('sr-only');
    });

    it('should have screen reader text for status', () => {
      render(<ElectionsPage />);

      const statusLabels = screen.getAllByText('Status:', { exact: false });
      expect(statusLabels.length).toBe(4);
    });

    it('should have accessible search input', () => {
      render(<ElectionsPage />);

      const searchInput = screen.getByLabelText('Search elections');
      expect(searchInput).toHaveAttribute('type', 'search');
    });

    it('should have accessible filter button', () => {
      render(<ElectionsPage />);

      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    });

    it('should have icons in the page', () => {
      const { container } = render(<ElectionsPage />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have proper heading hierarchy', () => {
      render(<ElectionsPage />);

      expect(screen.getByRole('heading', { level: 1, name: 'Elections' })).toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    it('should have scrollable table container', () => {
      const { container } = render(<ElectionsPage />);

      const tableContainer = container.querySelector('.overflow-x-auto');
      expect(tableContainer).toBeInTheDocument();
    });

    it('should have proper spacing between sections', () => {
      const { container } = render(<ElectionsPage />);

      const mainContainer = container.querySelector('.space-y-6');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('dark mode support', () => {
    it('should have dark mode classes for table', () => {
      const { container } = render(<ElectionsPage />);

      const table = container.querySelector('.dark\\:bg-zinc-900');
      expect(table).toBeInTheDocument();
    });

    it('should have dark mode badge styles', () => {
      render(<ElectionsPage />);

      const activeBadge = screen.getByText('Active').closest('span');
      expect(activeBadge?.className).toContain('dark:bg-green-900/30');
      expect(activeBadge?.className).toContain('dark:text-green-400');
    });

    it('should have dark mode text colors', () => {
      const { container } = render(<ElectionsPage />);

      const darkText = container.querySelectorAll('.dark\\:text-zinc-100');
      expect(darkText.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle elections with zero votes', () => {
      render(<ElectionsPage />);

      const zeroVotes = screen.getAllByText('0');
      expect(zeroVotes.length).toBeGreaterThan(0);
    });

    it('should handle zero turnout percentage', () => {
      render(<ElectionsPage />);

      const zeroTurnout = screen.getAllByText('0.0% turnout');
      expect(zeroTurnout.length).toBe(2);
    });

    it('should handle large voter numbers', () => {
      render(<ElectionsPage />);

      expect(screen.getByText('3,500')).toBeInTheDocument();
    });

    it('should display past, present, and future elections', () => {
      render(<ElectionsPage />);

      // Past (completed)
      expect(screen.getByText('Completed')).toBeInTheDocument();

      // Present (active)
      expect(screen.getByText('Active')).toBeInTheDocument();

      // Future (scheduled)
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
    });
  });

  describe('data consistency', () => {
    it('should show consistent election information across columns', () => {
      render(<ElectionsPage />);

      // First election should have all data
      expect(screen.getByText('Board of Directors Election 2025')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('1,247')).toBeInTheDocument();
      expect(screen.getByText('892')).toBeInTheDocument();
      expect(screen.getByText('71.5% turnout')).toBeInTheDocument();
    });

    it('should display all 4 elections', () => {
      const { container } = render(<ElectionsPage />);

      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(4);
    });

    it('should have matching number of view links and elections', () => {
      const { container } = render(<ElectionsPage />);

      const viewLinks = screen.getAllByText(/View/);
      const rows = container.querySelectorAll('tbody tr');

      expect(viewLinks.length).toBe(rows.length);
    });
  });

  describe('visual hierarchy', () => {
    it('should have larger page title', () => {
      render(<ElectionsPage />);

      const title = screen.getByRole('heading', { name: 'Elections' });
      expect(title.className).toContain('text-3xl');
    });

    it('should have medium font weight for election titles', () => {
      const { container } = render(<ElectionsPage />);

      const titles = container.querySelectorAll('.font-medium');
      expect(titles.length).toBeGreaterThan(0);
    });

    it('should have smaller text for secondary information', () => {
      const { container } = render(<ElectionsPage />);

      const secondaryText = container.querySelectorAll('.text-sm');
      expect(secondaryText.length).toBeGreaterThan(0);
    });
  });

  describe('spacing and padding', () => {
    it('should have padding on table cells', () => {
      const { container } = render(<ElectionsPage />);

      const cells = container.querySelectorAll('td');
      cells.forEach(cell => {
        expect(cell.className).toContain('px-6');
        expect(cell.className).toContain('py-4');
      });
    });

    it('should have gap between search and filter', () => {
      const { container } = render(<ElectionsPage />);

      const searchFilterContainer = container.querySelector('.flex.gap-4');
      expect(searchFilterContainer).toBeInTheDocument();
    });

    it('should have consistent vertical spacing', () => {
      const { container } = render(<ElectionsPage />);

      const mainContainer = container.querySelector('.space-y-6');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('search input functionality', () => {
    it('should be type search', () => {
      render(<ElectionsPage />);

      const searchInput = screen.getByLabelText('Search elections');
      expect(searchInput).toHaveAttribute('type', 'search');
    });

    it('should have search icon positioned absolutely', () => {
      const { container } = render(<ElectionsPage />);

      const icon = container.querySelector('.absolute.left-3');
      expect(icon).toBeInTheDocument();
    });

    it('should have left padding for icon', () => {
      render(<ElectionsPage />);

      const searchInput = screen.getByLabelText('Search elections');
      expect(searchInput.className).toContain('pl-10');
    });
  });

  describe('filter button', () => {
    it('should be a button element', () => {
      render(<ElectionsPage />);

      const filterButton = screen.getByRole('button', { name: /filter/i });
      expect(filterButton.tagName).toBe('BUTTON');
    });

    it('should have filter icon', () => {
      render(<ElectionsPage />);

      const filterButton = screen.getByRole('button', { name: /filter/i });
      const icon = filterButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should display Filter text', () => {
      render(<ElectionsPage />);

      expect(screen.getByText('Filter')).toBeInTheDocument();
    });
  });
});
