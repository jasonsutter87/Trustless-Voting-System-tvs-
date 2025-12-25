import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { CredentialDialog } from '../credential-dialog';

describe('CredentialDialog', () => {
  const defaultProps = {
    open: true,
    voterIds: ['1', '2', '3'],
    voterCount: 3,
    onClose: jest.fn(),
    onGenerateCredentials: jest.fn().mockResolvedValue({ generated: 3, failed: 0 }),
    onSendCredentials: jest.fn().mockResolvedValue({ sent: 3, failed: 0 }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generate step', () => {
    it('should render generate credentials dialog', () => {
      render(<CredentialDialog {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /generate credentials/i })).toBeInTheDocument();
      expect(screen.getByText(/3 voters selected/i)).toBeInTheDocument();
    });

    it('should show information about credentials', () => {
      render(<CredentialDialog {...defaultProps} />);

      expect(screen.getByText(/unique voting code/i)).toBeInTheDocument();
      expect(screen.getByText(/cryptographically secured/i)).toBeInTheDocument();
    });

    it('should call onGenerateCredentials when generate button is clicked', async () => {
      const user = userEvent.setup();
      render(<CredentialDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate credentials/i }));

      await waitFor(() => {
        expect(defaultProps.onGenerateCredentials).toHaveBeenCalledWith(['1', '2', '3']);
      });
    });

    it('should show error if generation fails', async () => {
      const user = userEvent.setup();
      defaultProps.onGenerateCredentials.mockRejectedValueOnce(new Error('Generation failed'));

      render(<CredentialDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate credentials/i }));

      expect(await screen.findByText(/generation failed/i)).toBeInTheDocument();
    });
  });

  describe('distribute step', () => {
    it('should show distribution options after generation', async () => {
      const user = userEvent.setup();
      render(<CredentialDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate credentials/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /distribute credentials/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/send via email/i)).toBeInTheDocument();
      expect(screen.getByText(/download csv/i)).toBeInTheDocument();
    });

    it('should show generation result', async () => {
      const user = userEvent.setup();
      render(<CredentialDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate credentials/i }));

      expect(await screen.findByText(/3 credentials generated/i)).toBeInTheDocument();
    });

    it('should allow selecting email distribution', async () => {
      const user = userEvent.setup();
      render(<CredentialDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate credentials/i }));

      await waitFor(() => {
        expect(screen.getByRole('radio', { name: /send via email/i })).toBeInTheDocument();
      });

      const emailRadio = screen.getByLabelText(/send via email/i);
      expect(emailRadio).toBeChecked();
    });

    it('should allow selecting download distribution', async () => {
      const user = userEvent.setup();
      render(<CredentialDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate credentials/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/download csv/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/download csv/i));

      expect(screen.getByLabelText(/download csv/i)).toBeChecked();
    });

    it('should call onSendCredentials with email method', async () => {
      const user = userEvent.setup();
      render(<CredentialDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate credentials/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send emails/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /send emails/i }));

      await waitFor(() => {
        expect(defaultProps.onSendCredentials).toHaveBeenCalledWith(['1', '2', '3'], 'email');
      });
    });

    it('should call onSendCredentials with download method', async () => {
      const user = userEvent.setup();
      render(<CredentialDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate credentials/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/download csv/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/download csv/i));
      await user.click(screen.getByRole('button', { name: /download csv/i }));

      await waitFor(() => {
        expect(defaultProps.onSendCredentials).toHaveBeenCalledWith(['1', '2', '3'], 'download');
      });
    });
  });

  describe('complete step', () => {
    it('should show completion message after email sending', async () => {
      const user = userEvent.setup();
      render(<CredentialDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate credentials/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send emails/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /send emails/i }));

      expect(await screen.findByRole('heading', { name: /distribution complete/i })).toBeInTheDocument();
      expect(screen.getByText(/3 emails sent/i)).toBeInTheDocument();
    });

    it('should show download link after download generation', async () => {
      const user = userEvent.setup();
      defaultProps.onSendCredentials.mockResolvedValueOnce({
        sent: 3,
        failed: 0,
        downloadUrl: 'https://example.com/credentials.csv',
      });

      render(<CredentialDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate credentials/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/download csv/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/download csv/i));
      await user.click(screen.getByRole('button', { name: /download csv/i }));

      expect(await screen.findByRole('link', { name: /download credentials csv/i })).toBeInTheDocument();
    });
  });

  describe('dialog behavior', () => {
    it('should call onClose when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<CredentialDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when skip distribution is clicked', async () => {
      const user = userEvent.setup();
      render(<CredentialDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate credentials/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip distribution/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /skip distribution/i }));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when done is clicked after completion', async () => {
      const user = userEvent.setup();
      render(<CredentialDialog {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate credentials/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send emails/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /send emails/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /done/i }));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('single voter', () => {
    it('should use singular text for single voter', () => {
      render(<CredentialDialog {...defaultProps} voterIds={['1']} voterCount={1} />);

      expect(screen.getByText(/1 voter selected/i)).toBeInTheDocument();
    });
  });
});
