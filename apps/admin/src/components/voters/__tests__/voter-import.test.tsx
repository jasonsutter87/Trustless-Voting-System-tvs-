import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { VoterImport } from '../voter-import';

describe('VoterImport', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onImport: jest.fn().mockResolvedValue({ imported: 10, failed: 0, errors: [] }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render import dialog', () => {
      render(<VoterImport {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /import voters from csv/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
    });

    it('should show CSV format instructions', () => {
      render(<VoterImport {...defaultProps} />);

      expect(screen.getByText(/csv format/i)).toBeInTheDocument();
      expect(screen.getByText(/name,email,jurisdiction/i)).toBeInTheDocument();
    });
  });

  describe('file selection', () => {
    it('should allow file selection via browse button', async () => {
      const user = userEvent.setup();
      render(<VoterImport {...defaultProps} />);

      const file = new File(['name,email\nJohn,john@example.com'], 'voters.csv', {
        type: 'text/csv',
      });

      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      expect(screen.getByText('voters.csv')).toBeInTheDocument();
    });

    it('should show error for non-CSV files', async () => {
      const user = userEvent.setup();
      render(<VoterImport {...defaultProps} />);

      const file = new File(['data'], 'voters.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      expect(await screen.findByText(/please select a csv file/i)).toBeInTheDocument();
    });

    it('should allow removing selected file', async () => {
      const user = userEvent.setup();
      render(<VoterImport {...defaultProps} />);

      const file = new File(['name,email\nJohn,john@example.com'], 'voters.csv', {
        type: 'text/csv',
      });
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      await user.click(screen.getByRole('button', { name: /remove/i }));

      expect(screen.queryByText('voters.csv')).not.toBeInTheDocument();
    });
  });

  describe('import process', () => {
    it('should call onImport when import button is clicked', async () => {
      const user = userEvent.setup();
      render(<VoterImport {...defaultProps} />);

      const file = new File(['name,email\nJohn,john@example.com'], 'voters.csv', {
        type: 'text/csv',
      });
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      await user.click(screen.getByRole('button', { name: /import voters/i }));

      await waitFor(() => {
        expect(defaultProps.onImport).toHaveBeenCalledWith(file);
      });
    });

    it('should show success message after import', async () => {
      const user = userEvent.setup();
      render(<VoterImport {...defaultProps} />);

      const file = new File(['name,email\nJohn,john@example.com'], 'voters.csv', {
        type: 'text/csv',
      });
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      await user.click(screen.getByRole('button', { name: /import voters/i }));

      expect(await screen.findByText(/import successful/i)).toBeInTheDocument();
      expect(screen.getByText(/10 voters imported/i)).toBeInTheDocument();
    });

    it('should show errors when some imports fail', async () => {
      const user = userEvent.setup();
      defaultProps.onImport.mockResolvedValueOnce({
        imported: 8,
        failed: 2,
        errors: [
          { row: 3, error: 'Invalid email' },
          { row: 5, error: 'Duplicate email' },
        ],
      });

      render(<VoterImport {...defaultProps} />);

      const file = new File(['name,email\nJohn,john@example.com'], 'voters.csv', {
        type: 'text/csv',
      });
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      await user.click(screen.getByRole('button', { name: /import voters/i }));

      expect(await screen.findByText(/completed with errors/i)).toBeInTheDocument();
      expect(screen.getByText(/8 voters imported/i)).toBeInTheDocument();
      expect(screen.getByText(/2 failed/i)).toBeInTheDocument();
    });

    it('should show error on import failure', async () => {
      const user = userEvent.setup();
      defaultProps.onImport.mockRejectedValueOnce(new Error('Import failed'));

      render(<VoterImport {...defaultProps} />);

      const file = new File(['name,email\nJohn,john@example.com'], 'voters.csv', {
        type: 'text/csv',
      });
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      await user.click(screen.getByRole('button', { name: /import voters/i }));

      expect(await screen.findByText(/import failed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  describe('dialog behavior', () => {
    it('should call onClose when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<VoterImport {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when done is clicked after success', async () => {
      const user = userEvent.setup();
      render(<VoterImport {...defaultProps} />);

      const file = new File(['name,email\nJohn,john@example.com'], 'voters.csv', {
        type: 'text/csv',
      });
      const input = screen.getByLabelText(/select csv file/i);
      await user.upload(input, file);

      await user.click(screen.getByRole('button', { name: /import voters/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /done/i }));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should disable import button when no file selected', () => {
      render(<VoterImport {...defaultProps} />);

      expect(screen.getByRole('button', { name: /import voters/i })).toBeDisabled();
    });
  });
});
