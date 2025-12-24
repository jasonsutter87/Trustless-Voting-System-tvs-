/**
 * Trustees Server Actions Tests
 * Comprehensive tests for trustee management and ceremony operations
 */

import {
  registerTrustee,
  getTrustees,
  getTrustee,
  submitCommitment,
  getTrusteeShare,
} from '../trustees';
import type { Trustee, CeremonyStatus, FeldmanCommitment } from '../trustees';

// Mock the api-config module
jest.mock('../../api-config', () => ({
  apiFetch: jest.fn(),
  API_BASE_URL: 'http://localhost:3000',
}));

import { apiFetch } from '../../api-config';
const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe('Trustees Server Actions', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  describe('registerTrustee', () => {
    const validInput = {
      name: 'Test Trustee',
      publicKey: 'pk-abc123def456ghi789',
    };

    const mockTrustee: Trustee = {
      id: 'trustee-123',
      electionId: 'election-456',
      name: 'Test Trustee',
      publicKey: 'pk-abc123def456ghi789',
      status: 'registered',
    };

    const mockCeremonyStatus: CeremonyStatus = {
      phase: 'REGISTRATION',
      registeredCount: 1,
      requiredCount: 5,
      committedCount: 0,
    };

    it('should register trustee successfully', async () => {
      mockApiFetch.mockResolvedValueOnce({
        trustee: mockTrustee,
        ceremonyStatus: mockCeremonyStatus,
      });

      const result = await registerTrustee('election-456', validInput);

      expect(mockApiFetch).toHaveBeenCalledWith('/api/elections/election-456/trustees', {
        method: 'POST',
        body: JSON.stringify(validInput),
      });
      expect(result.trustee.id).toBe('trustee-123');
      expect(result.ceremonyStatus.registeredCount).toBe(1);
    });

    it('should update ceremony status after registration', async () => {
      mockApiFetch.mockResolvedValueOnce({
        trustee: mockTrustee,
        ceremonyStatus: {
          ...mockCeremonyStatus,
          registeredCount: 5,
          phase: 'COMMITMENT',
        },
      });

      const result = await registerTrustee('election-456', validInput);

      expect(result.ceremonyStatus.phase).toBe('COMMITMENT');
    });

    describe('public key validation', () => {
      it('should handle long public keys', async () => {
        const longKeyInput = {
          name: 'Trustee',
          publicKey: 'pk-' + 'a'.repeat(500),
        };
        mockApiFetch.mockResolvedValueOnce({
          trustee: { ...mockTrustee, publicKey: longKeyInput.publicKey },
          ceremonyStatus: mockCeremonyStatus,
        });

        const result = await registerTrustee('election-456', longKeyInput);
        expect(result.trustee.publicKey).toHaveLength(503);
      });

      it('should handle hex-encoded public keys', async () => {
        const hexKeyInput = {
          name: 'Trustee',
          publicKey: '0x' + 'abcdef0123456789'.repeat(8),
        };
        mockApiFetch.mockResolvedValueOnce({
          trustee: { ...mockTrustee, publicKey: hexKeyInput.publicKey },
          ceremonyStatus: mockCeremonyStatus,
        });

        await registerTrustee('election-456', hexKeyInput);
        expect(mockApiFetch).toHaveBeenCalled();
      });

      it('should handle base64-encoded public keys', async () => {
        const base64Key = Buffer.from('test-public-key').toString('base64');
        const base64Input = {
          name: 'Trustee',
          publicKey: base64Key,
        };
        mockApiFetch.mockResolvedValueOnce({
          trustee: { ...mockTrustee, publicKey: base64Key },
          ceremonyStatus: mockCeremonyStatus,
        });

        await registerTrustee('election-456', base64Input);
        expect(mockApiFetch).toHaveBeenCalled();
      });
    });

    describe('name validation', () => {
      it('should handle names with special characters', async () => {
        const specialNameInput = {
          name: "O'Brien-Smith, Jr.",
          publicKey: 'pk-test',
        };
        mockApiFetch.mockResolvedValueOnce({
          trustee: { ...mockTrustee, name: specialNameInput.name },
          ceremonyStatus: mockCeremonyStatus,
        });

        const result = await registerTrustee('election-456', specialNameInput);
        expect(result.trustee.name).toBe("O'Brien-Smith, Jr.");
      });

      it('should handle unicode names', async () => {
        const unicodeInput = {
          name: '山田太郎 Müller 김철수',
          publicKey: 'pk-test',
        };
        mockApiFetch.mockResolvedValueOnce({
          trustee: { ...mockTrustee, name: unicodeInput.name },
          ceremonyStatus: mockCeremonyStatus,
        });

        const result = await registerTrustee('election-456', unicodeInput);
        expect(result.trustee.name).toContain('山田');
      });
    });

    describe('security tests', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
      ];

      xssPayloads.forEach((payload) => {
        it(`should handle XSS in name: ${payload.substring(0, 20)}...`, async () => {
          const maliciousInput = { name: payload, publicKey: 'pk-test' };
          mockApiFetch.mockResolvedValueOnce({
            trustee: { ...mockTrustee, name: payload },
            ceremonyStatus: mockCeremonyStatus,
          });

          await registerTrustee('election-456', maliciousInput);
          expect(mockApiFetch).toHaveBeenCalled();
        });

        it(`should handle XSS in publicKey: ${payload.substring(0, 20)}...`, async () => {
          const maliciousInput = { name: 'Trustee', publicKey: payload };
          mockApiFetch.mockResolvedValueOnce({
            trustee: mockTrustee,
            ceremonyStatus: mockCeremonyStatus,
          });

          await registerTrustee('election-456', maliciousInput);
          expect(mockApiFetch).toHaveBeenCalled();
        });
      });

      const sqlPayloads = [
        "'; DROP TABLE trustees;--",
        "1' OR '1'='1",
        "admin'--",
      ];

      sqlPayloads.forEach((payload) => {
        it(`should handle SQL injection: ${payload.substring(0, 20)}...`, async () => {
          const maliciousInput = { name: payload, publicKey: 'pk-test' };
          mockApiFetch.mockResolvedValueOnce({
            trustee: mockTrustee,
            ceremonyStatus: mockCeremonyStatus,
          });

          await registerTrustee('election-456', maliciousInput);
          expect(mockApiFetch).toHaveBeenCalled();
        });
      });
    });

    describe('error handling', () => {
      it('should handle duplicate trustee error', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Trustee already registered'));

        await expect(registerTrustee('election-456', validInput)).rejects.toThrow(
          'Trustee already registered'
        );
      });

      it('should handle election not found', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Election not found'));

        await expect(registerTrustee('non-existent', validInput)).rejects.toThrow(
          'Election not found'
        );
      });

      it('should handle invalid public key format', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Invalid public key format'));

        await expect(registerTrustee('election-456', validInput)).rejects.toThrow(
          'Invalid public key format'
        );
      });

      it('should handle registration closed', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Registration phase has ended'));

        await expect(registerTrustee('election-456', validInput)).rejects.toThrow(
          'Registration phase has ended'
        );
      });
    });
  });

  describe('getTrustees', () => {
    const mockTrustees: Trustee[] = [
      {
        id: 't1',
        electionId: 'e1',
        name: 'Trustee 1',
        publicKey: 'pk-1',
        status: 'registered',
      },
      {
        id: 't2',
        electionId: 'e1',
        name: 'Trustee 2',
        publicKey: 'pk-2',
        status: 'committed',
      },
      {
        id: 't3',
        electionId: 'e1',
        name: 'Trustee 3',
        publicKey: 'pk-3',
        status: 'share_received',
      },
    ];

    it('should fetch all trustees for election', async () => {
      mockApiFetch.mockResolvedValueOnce({ trustees: mockTrustees });

      const result = await getTrustees('election-123');

      expect(mockApiFetch).toHaveBeenCalledWith('/api/elections/election-123/trustees');
      expect(result.trustees).toHaveLength(3);
    });

    it('should include ceremony status when available', async () => {
      mockApiFetch.mockResolvedValueOnce({
        trustees: mockTrustees,
        ceremonyStatus: {
          phase: 'COMMITMENT',
          registeredCount: 3,
          requiredCount: 5,
          committedCount: 1,
        },
      });

      const result = await getTrustees('election-123');

      expect(result.ceremonyStatus).toBeDefined();
      expect(result.ceremonyStatus?.phase).toBe('COMMITMENT');
    });

    it('should return empty array when no trustees', async () => {
      mockApiFetch.mockResolvedValueOnce({ trustees: [] });

      const result = await getTrustees('election-123');

      expect(result.trustees).toEqual([]);
    });

    it('should handle election not found', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Election not found'));

      await expect(getTrustees('non-existent')).rejects.toThrow('Election not found');
    });
  });

  describe('getTrustee', () => {
    const mockTrustee: Trustee = {
      id: 'trustee-123',
      electionId: 'election-456',
      name: 'Test Trustee',
      publicKey: 'pk-abc123',
      status: 'registered',
      shareIndex: 1,
    };

    it('should fetch single trustee', async () => {
      mockApiFetch.mockResolvedValueOnce({ trustee: mockTrustee });

      const result = await getTrustee('election-456', 'trustee-123');

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/elections/election-456/trustees/trustee-123'
      );
      expect(result.trustee.id).toBe('trustee-123');
    });

    it('should include share index when available', async () => {
      mockApiFetch.mockResolvedValueOnce({ trustee: mockTrustee });

      const result = await getTrustee('election-456', 'trustee-123');

      expect(result.trustee.shareIndex).toBe(1);
    });

    it('should handle trustee not found', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Trustee not found'));

      await expect(getTrustee('election-456', 'non-existent')).rejects.toThrow(
        'Trustee not found'
      );
    });

    describe('ID validation', () => {
      it('should handle path traversal in election ID', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Invalid ID'));

        await expect(getTrustee('../../../etc/passwd', 'trustee-123')).rejects.toThrow();
      });

      it('should handle path traversal in trustee ID', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Invalid ID'));

        await expect(getTrustee('election-456', '../../../etc/passwd')).rejects.toThrow();
      });
    });
  });

  describe('submitCommitment', () => {
    const validCommitment = {
      commitmentHash: 'hash-abc123def456',
      feldmanCommitments: [
        { x: '123456', y: '789012' },
        { x: '345678', y: '901234' },
        { x: '567890', y: '123456' },
      ] as FeldmanCommitment[],
    };

    it('should submit commitment and return awaiting status', async () => {
      mockApiFetch.mockResolvedValueOnce({
        status: 'awaiting_commitments',
        ceremonyStatus: {
          phase: 'COMMITMENT',
          registeredCount: 5,
          requiredCount: 5,
          committedCount: 3,
        },
      });

      const result = await submitCommitment('election-456', 'trustee-123', validCommitment);

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/elections/election-456/trustees/trustee-123/commitment',
        {
          method: 'POST',
          body: JSON.stringify(validCommitment),
        }
      );
      expect(result.status).toBe('awaiting_commitments');
    });

    it('should return finalized status when ceremony completes', async () => {
      mockApiFetch.mockResolvedValueOnce({
        status: 'finalized',
        publicKey: 'election-public-key-abc123',
        threshold: 3,
        totalParticipants: 5,
        completedAt: '2024-12-24T12:00:00Z',
      });

      const result = await submitCommitment('election-456', 'trustee-123', validCommitment);

      expect(result.status).toBe('finalized');
      if (result.status === 'finalized') {
        expect(result.publicKey).toBe('election-public-key-abc123');
        expect(result.threshold).toBe(3);
        expect(result.totalParticipants).toBe(5);
      }
    });

    describe('Feldman commitment validation', () => {
      it('should handle large commitment values', async () => {
        const largeCommitments = {
          commitmentHash: 'hash-123',
          feldmanCommitments: Array.from({ length: 10 }, () => ({
            x: '9'.repeat(100),
            y: '9'.repeat(100),
          })),
        };
        mockApiFetch.mockResolvedValueOnce({
          status: 'awaiting_commitments',
          ceremonyStatus: { phase: 'COMMITMENT', registeredCount: 5, requiredCount: 5, committedCount: 1 },
        });

        await submitCommitment('election-456', 'trustee-123', largeCommitments);
        expect(mockApiFetch).toHaveBeenCalled();
      });

      it('should handle hex-encoded commitments', async () => {
        const hexCommitments = {
          commitmentHash: '0xabcdef123456',
          feldmanCommitments: [
            { x: '0xabcdef', y: '0x123456' },
          ],
        };
        mockApiFetch.mockResolvedValueOnce({
          status: 'awaiting_commitments',
          ceremonyStatus: { phase: 'COMMITMENT', registeredCount: 5, requiredCount: 5, committedCount: 1 },
        });

        await submitCommitment('election-456', 'trustee-123', hexCommitments);
        expect(mockApiFetch).toHaveBeenCalled();
      });
    });

    describe('cryptographic security tests', () => {
      it('should handle commitment hash collision attempt', async () => {
        const collisionAttempt = {
          commitmentHash: 'hash-same-as-another-trustee',
          feldmanCommitments: validCommitment.feldmanCommitments,
        };
        mockApiFetch.mockRejectedValueOnce(new Error('Commitment hash already exists'));

        await expect(
          submitCommitment('election-456', 'trustee-123', collisionAttempt)
        ).rejects.toThrow('Commitment hash already exists');
      });

      it('should handle invalid commitment format', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Invalid Feldman commitment format'));

        await expect(
          submitCommitment('election-456', 'trustee-123', validCommitment)
        ).rejects.toThrow('Invalid Feldman commitment format');
      });

      it('should handle commitment verification failure', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Commitment verification failed'));

        await expect(
          submitCommitment('election-456', 'trustee-123', validCommitment)
        ).rejects.toThrow('Commitment verification failed');
      });
    });

    describe('error handling', () => {
      it('should handle wrong ceremony phase', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Ceremony not in commitment phase'));

        await expect(
          submitCommitment('election-456', 'trustee-123', validCommitment)
        ).rejects.toThrow('Ceremony not in commitment phase');
      });

      it('should handle already committed', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Trustee has already committed'));

        await expect(
          submitCommitment('election-456', 'trustee-123', validCommitment)
        ).rejects.toThrow('Trustee has already committed');
      });

      it('should handle unregistered trustee', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Trustee not registered'));

        await expect(
          submitCommitment('election-456', 'trustee-123', validCommitment)
        ).rejects.toThrow('Trustee not registered');
      });
    });
  });

  describe('getTrusteeShare', () => {
    it('should fetch trustee share', async () => {
      mockApiFetch.mockResolvedValueOnce({ share: 'encrypted-share-data-abc123' });

      const result = await getTrusteeShare('election-456', 'trustee-123');

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/elections/election-456/trustees/trustee-123/share'
      );
      expect(result.share).toBe('encrypted-share-data-abc123');
    });

    it('should handle share not yet available', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Share not yet distributed'));

      await expect(getTrusteeShare('election-456', 'trustee-123')).rejects.toThrow(
        'Share not yet distributed'
      );
    });

    it('should handle unauthorized access', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Unauthorized to access share'));

      await expect(getTrusteeShare('election-456', 'trustee-123')).rejects.toThrow(
        'Unauthorized to access share'
      );
    });

    it('should handle encrypted share data', async () => {
      const encryptedShare = Buffer.from('encrypted-share-content').toString('base64');
      mockApiFetch.mockResolvedValueOnce({ share: encryptedShare });

      const result = await getTrusteeShare('election-456', 'trustee-123');

      expect(result.share).toBe(encryptedShare);
    });
  });

  describe('ceremony phase transitions', () => {
    it('should track progression through all phases', async () => {
      const phases: CeremonyStatus['phase'][] = [
        'CREATED',
        'REGISTRATION',
        'COMMITMENT',
        'SHARE_DISTRIBUTION',
        'FINALIZED',
      ];

      for (const phase of phases) {
        mockApiFetch.mockResolvedValueOnce({
          trustees: [],
          ceremonyStatus: {
            phase,
            registeredCount: phase === 'CREATED' ? 0 : 5,
            requiredCount: 5,
            committedCount: ['COMMITMENT', 'SHARE_DISTRIBUTION', 'FINALIZED'].includes(phase) ? 5 : 0,
          },
        });

        const result = await getTrustees('election-123');
        expect(result.ceremonyStatus?.phase).toBe(phase);
      }
    });
  });
});
