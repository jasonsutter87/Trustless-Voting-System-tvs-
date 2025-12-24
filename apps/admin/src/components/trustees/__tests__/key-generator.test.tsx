import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { KeyGenerator } from '../key-generator';

// Mock crypto API
const mockGenerateKey = jest.fn();
const mockExportKey = jest.fn();
const mockGetRandomValues = jest.fn();

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      generateKey: mockGenerateKey,
      exportKey: mockExportKey,
    },
    getRandomValues: mockGetRandomValues,
  },
});

describe('KeyGenerator', () => {
  const defaultProps = {
    onKeyGenerated: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock crypto responses
    mockGenerateKey.mockResolvedValue({
      publicKey: { type: 'public' },
      privateKey: { type: 'private' },
    });

    mockExportKey.mockImplementation((format, key) => {
      if (key.type === 'public') {
        return Promise.resolve(new Uint8Array([1, 2, 3, 4]).buffer);
      }
      return Promise.resolve(new Uint8Array([5, 6, 7, 8]).buffer);
    });

    mockGetRandomValues.mockImplementation((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    });
  });

  describe('initial state', () => {
    it('should render generate button', () => {
      render(<KeyGenerator {...defaultProps} />);

      expect(screen.getByRole('button', { name: /generate key/i })).toBeInTheDocument();
    });

    it('should show instructions', () => {
      render(<KeyGenerator {...defaultProps} />);

      expect(screen.getByText(/generate a new key pair/i)).toBeInTheDocument();
    });

    it('should not show keys initially', () => {
      render(<KeyGenerator {...defaultProps} />);

      // Should not have the key display sections (looking for the copy/download buttons)
      expect(screen.queryByRole('button', { name: /copy public key/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /download private key/i })).not.toBeInTheDocument();
    });
  });

  describe('key generation', () => {
    it('should generate keys when button is clicked', async () => {
      const user = userEvent.setup();
      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      await waitFor(() => {
        expect(mockGenerateKey).toHaveBeenCalled();
      });
    });

    it('should show loading state during generation', async () => {
      const user = userEvent.setup();
      mockGenerateKey.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });

    it('should display public key after generation', async () => {
      const user = userEvent.setup();
      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      await waitFor(() => {
        expect(screen.getByText(/public key/i)).toBeInTheDocument();
      });
    });

    it('should display private key warning after generation', async () => {
      const user = userEvent.setup();
      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      await waitFor(() => {
        expect(screen.getByText(/save your private key/i)).toBeInTheDocument();
      });
    });

    it('should call onKeyGenerated with public key', async () => {
      const user = userEvent.setup();
      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      await waitFor(() => {
        expect(defaultProps.onKeyGenerated).toHaveBeenCalledWith(
          expect.objectContaining({
            publicKey: expect.any(String),
            privateKey: expect.any(String),
          })
        );
      });
    });
  });

  describe('error handling', () => {
    it('should show error when crypto API fails', async () => {
      const user = userEvent.setup();
      mockGenerateKey.mockRejectedValue(new Error('Crypto error'));

      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to generate/i)).toBeInTheDocument();
      });
    });

    it('should call onError when generation fails', async () => {
      const user = userEvent.setup();
      mockGenerateKey.mockRejectedValue(new Error('Crypto error'));

      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      mockGenerateKey
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({
          publicKey: { type: 'public' },
          privateKey: { type: 'private' },
        });

      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to generate/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /try again/i }));

      await waitFor(() => {
        expect(screen.getByText(/public key/i)).toBeInTheDocument();
      });
    });
  });

  describe('key display', () => {
    it('should show copy button for public key', async () => {
      const user = userEvent.setup();
      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy public key/i })).toBeInTheDocument();
      });
    });

    it('should show download button for private key', async () => {
      const user = userEvent.setup();
      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download private key/i })).toBeInTheDocument();
      });
    });

    it('should toggle private key visibility', async () => {
      const user = userEvent.setup();
      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      await waitFor(() => {
        expect(screen.getByText(/private key/i)).toBeInTheDocument();
      });

      // Private key should be hidden by default
      const toggleButton = screen.getByRole('button', { name: /show private key/i });
      expect(toggleButton).toBeInTheDocument();

      await user.click(toggleButton);

      expect(screen.getByRole('button', { name: /hide private key/i })).toBeInTheDocument();
    });
  });

  describe('security', () => {
    it('should warn about private key storage', async () => {
      const user = userEvent.setup();
      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      await waitFor(() => {
        expect(screen.getByText(/keep your private key secure/i)).toBeInTheDocument();
      });
    });

    it('should not expose private key in DOM initially', async () => {
      const user = userEvent.setup();
      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      await waitFor(() => {
        expect(screen.getByText(/private key/i)).toBeInTheDocument();
      });

      // The actual private key value should be obscured
      const privateKeySection = screen.getByTestId('private-key-section');
      expect(privateKeySection.textContent).toContain('••••');
    });
  });

  describe('regeneration', () => {
    it('should warn before regenerating keys', async () => {
      const user = userEvent.setup();
      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy public key/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /regenerate/i }));

      // Check for the dialog title which is unique
      expect(screen.getByRole('heading', { name: /regenerate keys/i })).toBeInTheDocument();
    });

    it('should regenerate keys after confirmation', async () => {
      const user = userEvent.setup();
      render(<KeyGenerator {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /generate key/i }));

      await waitFor(() => {
        expect(screen.getByText(/public key/i)).toBeInTheDocument();
      });

      const firstCallCount = mockGenerateKey.mock.calls.length;

      await user.click(screen.getByRole('button', { name: /regenerate/i }));
      await user.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        expect(mockGenerateKey.mock.calls.length).toBeGreaterThan(firstCallCount);
      });
    });
  });
});
