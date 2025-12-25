import { render, screen, waitFor, within } from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { VoterList } from '../voter-list';
import type { Voter } from '@/lib/actions/voters';

const mockVoters: Voter[] = [
  {
    id: '1',
    electionId: 'election-1',
    email: 'alice@example.com',
    name: 'Alice Smith',
    jurisdiction: 'District 1',
    status: 'registered',
    credentialGenerated: false,
    hasVoted: false,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    electionId: 'election-1',
    email: 'bob@example.com',
    name: 'Bob Jones',
    jurisdiction: 'District 2',
    status: 'credential_generated',
    credentialGenerated: true,
    hasVoted: false,
    createdAt: '2025-01-02T00:00:00Z',
  },
  {
    id: '3',
    electionId: 'election-1',
    email: 'charlie@example.com',
    name: 'Charlie Brown',
    jurisdiction: 'District 1',
    status: 'voted',
    credentialGenerated: true,
    hasVoted: true,
    createdAt: '2025-01-03T00:00:00Z',
  },
];

describe('VoterList', () => {
  const defaultProps = {
    voters: mockVoters,
    totalVoters: 3,
    currentPage: 1,
    pageSize: 10,
    onPageChange: jest.fn(),
    onVoterSelect: jest.fn(),
    onVoterEdit: jest.fn(),
    onVoterDelete: jest.fn(),
    onGenerateCredential: jest.fn(),
    onSearch: jest.fn(),
    onFilterChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render voter list', () => {
      render(<VoterList {...defaultProps} />);

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });

    it('should display voter emails', () => {
      render(<VoterList {...defaultProps} />);

      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });

    it('should display voter jurisdictions', () => {
      render(<VoterList {...defaultProps} />);

      expect(screen.getAllByText('District 1')).toHaveLength(2);
      expect(screen.getByText('District 2')).toBeInTheDocument();
    });

    it('should display voter status badges', () => {
      render(<VoterList {...defaultProps} />);

      // Use getAllByText since status labels appear in both badges and filter dropdown
      expect(screen.getAllByText('Registered')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Credential Generated')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Voted')[0]).toBeInTheDocument();
    });

    it('should render empty state when no voters', () => {
      render(<VoterList {...defaultProps} voters={[]} totalVoters={0} />);

      expect(screen.getByText(/no voters found/i)).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(<VoterList {...defaultProps} isLoading />);

      expect(screen.getByTestId('voter-list-loading')).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('should render checkboxes for each voter', () => {
      render(<VoterList {...defaultProps} selectable />);

      const checkboxes = screen.getAllByRole('checkbox');
      // +1 for select all checkbox
      expect(checkboxes).toHaveLength(mockVoters.length + 1);
    });

    it('should call onVoterSelect when checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<VoterList {...defaultProps} selectable />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // First voter checkbox

      expect(defaultProps.onVoterSelect).toHaveBeenCalledWith(['1']);
    });

    it('should select all voters when select all is clicked', async () => {
      const user = userEvent.setup();
      render(<VoterList {...defaultProps} selectable />);

      const selectAll = screen.getByRole('checkbox', { name: /select all/i });
      await user.click(selectAll);

      expect(defaultProps.onVoterSelect).toHaveBeenCalledWith(['1', '2', '3']);
    });

    it('should show selected count', async () => {
      render(<VoterList {...defaultProps} selectable selectedVoterIds={['1', '2']} />);

      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('should render edit button for each voter', () => {
      render(<VoterList {...defaultProps} />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons).toHaveLength(mockVoters.length);
    });

    it('should call onVoterEdit when edit is clicked', async () => {
      const user = userEvent.setup();
      render(<VoterList {...defaultProps} />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(defaultProps.onVoterEdit).toHaveBeenCalledWith(mockVoters[0]);
    });

    it('should render delete button for each voter', () => {
      render(<VoterList {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(mockVoters.length);
    });

    it('should call onVoterDelete when delete is clicked', async () => {
      const user = userEvent.setup();
      render(<VoterList {...defaultProps} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(defaultProps.onVoterDelete).toHaveBeenCalledWith(mockVoters[0]);
    });

    it('should disable delete for voters who have voted', () => {
      render(<VoterList {...defaultProps} />);

      const row = screen.getByText('Charlie Brown').closest('tr');
      const deleteButton = within(row!).getByRole('button', { name: /delete/i });

      expect(deleteButton).toBeDisabled();
    });

    it('should render generate credential button for voters without credentials', () => {
      render(<VoterList {...defaultProps} />);

      const row = screen.getByText('Alice Smith').closest('tr');
      const credButton = within(row!).getByRole('button', { name: /generate credential/i });

      expect(credButton).toBeInTheDocument();
    });

    it('should call onGenerateCredential when clicked', async () => {
      const user = userEvent.setup();
      render(<VoterList {...defaultProps} />);

      const row = screen.getByText('Alice Smith').closest('tr');
      const credButton = within(row!).getByRole('button', { name: /generate credential/i });
      await user.click(credButton);

      expect(defaultProps.onGenerateCredential).toHaveBeenCalledWith(mockVoters[0]);
    });
  });

  describe('search', () => {
    it('should render search input', () => {
      render(<VoterList {...defaultProps} />);

      expect(screen.getByPlaceholderText(/search voters/i)).toBeInTheDocument();
    });

    it('should call onSearch when typing', async () => {
      const user = userEvent.setup();
      render(<VoterList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search voters/i);
      await user.type(searchInput, 'alice');

      await waitFor(() => {
        expect(defaultProps.onSearch).toHaveBeenCalledWith('alice');
      });
    });

    it('should debounce search calls', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<VoterList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search voters/i);
      await user.type(searchInput, 'alice');

      // Should not call immediately
      expect(defaultProps.onSearch).not.toHaveBeenCalled();

      // Advance past debounce delay
      jest.advanceTimersByTime(300);

      expect(defaultProps.onSearch).toHaveBeenCalledWith('alice');

      jest.useRealTimers();
    });
  });

  describe('filtering', () => {
    it('should render status filter dropdown', () => {
      render(<VoterList {...defaultProps} />);

      expect(screen.getByRole('combobox', { name: /filter by status/i })).toBeInTheDocument();
    });

    it('should call onFilterChange when status filter changes', async () => {
      const user = userEvent.setup();
      render(<VoterList {...defaultProps} />);

      const statusFilter = screen.getByRole('combobox', { name: /filter by status/i });
      await user.selectOptions(statusFilter, 'voted');

      expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ status: 'voted' });
    });

    it('should render jurisdiction filter when jurisdictions provided', () => {
      render(
        <VoterList {...defaultProps} jurisdictions={['District 1', 'District 2', 'District 3']} />
      );

      expect(
        screen.getByRole('combobox', { name: /filter by jurisdiction/i })
      ).toBeInTheDocument();
    });

    it('should call onFilterChange when jurisdiction filter changes', async () => {
      const user = userEvent.setup();
      render(
        <VoterList {...defaultProps} jurisdictions={['District 1', 'District 2', 'District 3']} />
      );

      const jurisdictionFilter = screen.getByRole('combobox', { name: /filter by jurisdiction/i });
      await user.selectOptions(jurisdictionFilter, 'District 1');

      expect(defaultProps.onFilterChange).toHaveBeenCalledWith({ jurisdiction: 'District 1' });
    });
  });

  describe('pagination', () => {
    it('should render pagination controls', () => {
      render(<VoterList {...defaultProps} totalVoters={100} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should show page information', () => {
      render(<VoterList {...defaultProps} totalVoters={100} currentPage={2} pageSize={10} />);

      expect(screen.getByText(/page 2/i)).toBeInTheDocument();
    });

    it('should call onPageChange when next is clicked', async () => {
      const user = userEvent.setup();
      render(<VoterList {...defaultProps} totalVoters={100} />);

      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
    });

    it('should disable previous on first page', () => {
      render(<VoterList {...defaultProps} totalVoters={100} currentPage={1} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    });

    it('should disable next on last page', () => {
      render(<VoterList {...defaultProps} totalVoters={30} currentPage={3} pageSize={10} />);

      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('should hide pagination when all voters fit on one page', () => {
      render(<VoterList {...defaultProps} totalVoters={3} pageSize={10} />);

      expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
    });
  });

  describe('bulk actions', () => {
    it('should show bulk actions when voters are selected', () => {
      render(<VoterList {...defaultProps} selectable selectedVoterIds={['1', '2']} />);

      expect(screen.getByText(/bulk actions/i)).toBeInTheDocument();
    });

    it('should show generate all credentials button', () => {
      render(<VoterList {...defaultProps} selectable selectedVoterIds={['1', '2']} />);

      expect(
        screen.getByRole('button', { name: /generate credentials/i })
      ).toBeInTheDocument();
    });

    it('should show delete all button', () => {
      render(<VoterList {...defaultProps} selectable selectedVoterIds={['1', '2']} />);

      expect(screen.getByRole('button', { name: /delete selected/i })).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('should render sortable column headers', () => {
      render(<VoterList {...defaultProps} sortable />);

      expect(screen.getByRole('button', { name: /sort by name/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sort by email/i })).toBeInTheDocument();
    });

    it('should call onSort when column header is clicked', async () => {
      const user = userEvent.setup();
      const onSort = jest.fn();
      render(<VoterList {...defaultProps} sortable onSort={onSort} />);

      await user.click(screen.getByRole('button', { name: /sort by name/i }));

      expect(onSort).toHaveBeenCalledWith('name', 'asc');
    });

    it('should toggle sort direction on repeated clicks', async () => {
      const user = userEvent.setup();
      const onSort = jest.fn();
      render(<VoterList {...defaultProps} sortable onSort={onSort} sortBy="name" sortDirection="asc" />);

      await user.click(screen.getByRole('button', { name: /sort by name/i }));

      expect(onSort).toHaveBeenCalledWith('name', 'desc');
    });
  });

  describe('accessibility', () => {
    it('should have accessible table structure', () => {
      render(<VoterList {...defaultProps} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(mockVoters.length + 1); // +1 for header
    });

    it('should have accessible column headers', () => {
      render(<VoterList {...defaultProps} />);

      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    });
  });
});
