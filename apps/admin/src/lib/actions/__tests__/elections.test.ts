/**
 * Elections Server Actions Tests
 * Comprehensive tests for election CRUD operations
 */

import {
  createElection,
  getElection,
  getElections,
  updateElectionStatus,
  getElectionResults,
} from '../elections';
import type { CreateElectionInput, Election, CeremonyStatus } from '../elections';

// Mock the api-config module
jest.mock('../../api-config', () => ({
  apiFetch: jest.fn(),
  API_BASE_URL: 'http://localhost:3000',
}));

import { apiFetch } from '../../api-config';
const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe('Elections Server Actions', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  describe('createElection', () => {
    const validInput: CreateElectionInput = {
      name: 'Test Election 2025',
      description: 'A test election for unit testing',
      startTime: '2025-01-01T00:00:00Z',
      endTime: '2025-01-15T23:59:59Z',
      threshold: 3,
      totalTrustees: 5,
      candidates: [{ name: 'Candidate A' }, { name: 'Candidate B' }],
    };

    it('should create election with valid input', async () => {
      const mockResponse = {
        election: {
          id: 'election-123',
          ...validInput,
          status: 'setup' as const,
          candidates: validInput.candidates.map((c, i) => ({ id: `c${i}`, name: c.name, position: i })),
          createdAt: '2024-12-24T00:00:00Z',
        },
        ceremonyStatus: {
          phase: 'CREATED' as const,
          registeredCount: 0,
          requiredCount: 5,
          committedCount: 0,
        },
      };
      mockApiFetch.mockResolvedValueOnce(mockResponse);

      const result = await createElection(validInput);

      expect(mockApiFetch).toHaveBeenCalledWith('/api/elections', {
        method: 'POST',
        body: JSON.stringify(validInput),
      });
      expect(result.election.id).toBe('election-123');
      expect(result.election.status).toBe('setup');
      expect(result.ceremonyStatus.phase).toBe('CREATED');
    });

    it('should create election with minimal input', async () => {
      const minimalInput: CreateElectionInput = {
        name: 'Minimal Election',
        startTime: '2025-01-01T00:00:00Z',
        endTime: '2025-01-02T00:00:00Z',
        threshold: 2,
        totalTrustees: 3,
        candidates: [{ name: 'Yes' }, { name: 'No' }],
      };

      mockApiFetch.mockResolvedValueOnce({
        election: { id: 'min-1', ...minimalInput, status: 'setup', candidates: [], createdAt: '' },
        ceremonyStatus: { phase: 'CREATED', registeredCount: 0, requiredCount: 3, committedCount: 0 },
      });

      await createElection(minimalInput);

      expect(mockApiFetch).toHaveBeenCalledWith('/api/elections', {
        method: 'POST',
        body: expect.stringContaining('Minimal Election'),
      });
    });

    it('should handle special characters in election name', async () => {
      const inputWithSpecialChars: CreateElectionInput = {
        ...validInput,
        name: "Election \"2025\" & More — Test's (Special)",
      };

      mockApiFetch.mockResolvedValueOnce({
        election: { id: '1', ...inputWithSpecialChars, status: 'setup', candidates: [], createdAt: '' },
        ceremonyStatus: { phase: 'CREATED', registeredCount: 0, requiredCount: 5, committedCount: 0 },
      });

      const result = await createElection(inputWithSpecialChars);
      expect(result.election.name).toContain('Election "2025"');
    });

    it('should handle unicode characters', async () => {
      const inputWithUnicode: CreateElectionInput = {
        ...validInput,
        name: '選挙 2025 🗳️ Élection Выборы',
        description: '日本語の説明 مع عربي',
      };

      mockApiFetch.mockResolvedValueOnce({
        election: { id: '1', ...inputWithUnicode, status: 'setup', candidates: [], createdAt: '' },
        ceremonyStatus: { phase: 'CREATED', registeredCount: 0, requiredCount: 5, committedCount: 0 },
      });

      const result = await createElection(inputWithUnicode);
      expect(result.election.name).toContain('選挙');
    });

    it('should handle API errors gracefully', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Validation failed: name is required'));

      await expect(createElection(validInput)).rejects.toThrow('Validation failed');
    });

    it('should handle network errors', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(createElection(validInput)).rejects.toThrow('Failed to fetch');
    });

    // Security tests
    describe('XSS attack prevention', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        'javascript:alert("xss")',
        '<svg onload=alert("xss")>',
        '"><script>alert(1)</script>',
      ];

      xssPayloads.forEach((payload) => {
        it(`should handle XSS payload in name: ${payload.substring(0, 30)}...`, async () => {
          const maliciousInput: CreateElectionInput = {
            ...validInput,
            name: payload,
          };

          mockApiFetch.mockResolvedValueOnce({
            election: { id: '1', ...maliciousInput, status: 'setup', candidates: [], createdAt: '' },
            ceremonyStatus: { phase: 'CREATED', registeredCount: 0, requiredCount: 5, committedCount: 0 },
          });

          // The function should pass the input - sanitization happens on server/render
          const result = await createElection(maliciousInput);
          expect(result.election).toBeDefined();
        });
      });
    });

    describe('SQL injection prevention', () => {
      const sqlPayloads = [
        "'; DROP TABLE elections;--",
        "1' OR '1'='1",
        "' UNION SELECT * FROM users--",
        "admin'--",
      ];

      sqlPayloads.forEach((payload) => {
        it(`should handle SQL injection payload: ${payload.substring(0, 30)}...`, async () => {
          const maliciousInput: CreateElectionInput = {
            ...validInput,
            name: payload,
          };

          mockApiFetch.mockResolvedValueOnce({
            election: { id: '1', ...maliciousInput, status: 'setup', candidates: [], createdAt: '' },
            ceremonyStatus: { phase: 'CREATED', registeredCount: 0, requiredCount: 5, committedCount: 0 },
          });

          const result = await createElection(maliciousInput);
          expect(result.election).toBeDefined();
        });
      });
    });

    describe('boundary conditions', () => {
      it('should handle empty description', async () => {
        const inputNoDesc: CreateElectionInput = {
          ...validInput,
          description: undefined,
        };

        mockApiFetch.mockResolvedValueOnce({
          election: { id: '1', ...inputNoDesc, description: '', status: 'setup', candidates: [], createdAt: '' },
          ceremonyStatus: { phase: 'CREATED', registeredCount: 0, requiredCount: 5, committedCount: 0 },
        });

        const result = await createElection(inputNoDesc);
        expect(result.election).toBeDefined();
      });

      it('should handle very long name', async () => {
        const longName = 'A'.repeat(1000);
        const inputLongName: CreateElectionInput = {
          ...validInput,
          name: longName,
        };

        mockApiFetch.mockResolvedValueOnce({
          election: { id: '1', ...inputLongName, status: 'setup', candidates: [], createdAt: '' },
          ceremonyStatus: { phase: 'CREATED', registeredCount: 0, requiredCount: 5, committedCount: 0 },
        });

        const result = await createElection(inputLongName);
        expect(result.election.name).toHaveLength(1000);
      });

      it('should handle many candidates', async () => {
        const manyCandidates = Array.from({ length: 100 }, (_, i) => ({ name: `Candidate ${i}` }));
        const inputManyCandidates: CreateElectionInput = {
          ...validInput,
          candidates: manyCandidates,
        };

        mockApiFetch.mockResolvedValueOnce({
          election: { id: '1', ...inputManyCandidates, status: 'setup', candidates: [], createdAt: '' },
          ceremonyStatus: { phase: 'CREATED', registeredCount: 0, requiredCount: 5, committedCount: 0 },
        });

        await createElection(inputManyCandidates);
        expect(mockApiFetch).toHaveBeenCalledWith(
          '/api/elections',
          expect.objectContaining({
            body: expect.stringContaining('Candidate 99'),
          })
        );
      });

      it('should handle threshold equal to totalTrustees', async () => {
        const inputThresholdMax: CreateElectionInput = {
          ...validInput,
          threshold: 5,
          totalTrustees: 5,
        };

        mockApiFetch.mockResolvedValueOnce({
          election: { id: '1', ...inputThresholdMax, status: 'setup', candidates: [], createdAt: '' },
          ceremonyStatus: { phase: 'CREATED', registeredCount: 0, requiredCount: 5, committedCount: 0 },
        });

        const result = await createElection(inputThresholdMax);
        expect(result.election.threshold).toBe(5);
      });

      it('should handle minimum threshold of 1', async () => {
        const inputThresholdMin: CreateElectionInput = {
          ...validInput,
          threshold: 1,
          totalTrustees: 1,
        };

        mockApiFetch.mockResolvedValueOnce({
          election: { id: '1', ...inputThresholdMin, status: 'setup', candidates: [], createdAt: '' },
          ceremonyStatus: { phase: 'CREATED', registeredCount: 0, requiredCount: 1, committedCount: 0 },
        });

        const result = await createElection(inputThresholdMin);
        expect(result.election.threshold).toBe(1);
      });
    });

    describe('date handling', () => {
      it('should handle dates in different timezones', async () => {
        const inputWithTimezone: CreateElectionInput = {
          ...validInput,
          startTime: '2025-01-01T00:00:00+05:30',
          endTime: '2025-01-15T23:59:59-08:00',
        };

        mockApiFetch.mockResolvedValueOnce({
          election: { id: '1', ...inputWithTimezone, status: 'setup', candidates: [], createdAt: '' },
          ceremonyStatus: { phase: 'CREATED', registeredCount: 0, requiredCount: 5, committedCount: 0 },
        });

        await createElection(inputWithTimezone);
        expect(mockApiFetch).toHaveBeenCalled();
      });

      it('should handle far future dates', async () => {
        const inputFuture: CreateElectionInput = {
          ...validInput,
          startTime: '2099-12-31T00:00:00Z',
          endTime: '2100-01-01T00:00:00Z',
        };

        mockApiFetch.mockResolvedValueOnce({
          election: { id: '1', ...inputFuture, status: 'setup', candidates: [], createdAt: '' },
          ceremonyStatus: { phase: 'CREATED', registeredCount: 0, requiredCount: 5, committedCount: 0 },
        });

        const result = await createElection(inputFuture);
        expect(result.election.startTime).toContain('2099');
      });
    });
  });

  describe('getElection', () => {
    const mockElection: Election = {
      id: 'election-123',
      name: 'Test Election',
      description: 'Test description',
      startTime: '2025-01-01T00:00:00Z',
      endTime: '2025-01-15T23:59:59Z',
      status: 'draft',
      threshold: 3,
      totalTrustees: 5,
      candidates: [{ id: 'c1', name: 'Candidate 1', position: 0 }],
      createdAt: '2024-12-24T00:00:00Z',
    };

    it('should fetch election by ID', async () => {
      mockApiFetch.mockResolvedValueOnce({ election: mockElection });

      const result = await getElection('election-123');

      expect(mockApiFetch).toHaveBeenCalledWith('/api/elections/election-123');
      expect(result.election.id).toBe('election-123');
    });

    it('should include ceremony status when available', async () => {
      const ceremonyStatus: CeremonyStatus = {
        phase: 'REGISTRATION',
        registeredCount: 2,
        requiredCount: 5,
        committedCount: 0,
      };
      mockApiFetch.mockResolvedValueOnce({ election: mockElection, ceremonyStatus });

      const result = await getElection('election-123');

      expect(result.ceremonyStatus).toBeDefined();
      expect(result.ceremonyStatus?.phase).toBe('REGISTRATION');
    });

    it('should include public key when election is finalized', async () => {
      const finalizedElection = { ...mockElection, status: 'complete' as const };
      mockApiFetch.mockResolvedValueOnce({
        election: finalizedElection,
        publicKey: 'pk-abc123def456',
      });

      const result = await getElection('election-123');

      expect(result.publicKey).toBe('pk-abc123def456');
    });

    it('should handle non-existent election', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Election not found'));

      await expect(getElection('non-existent')).rejects.toThrow('Election not found');
    });

    describe('ID validation', () => {
      it('should handle UUID format IDs', async () => {
        mockApiFetch.mockResolvedValueOnce({ election: mockElection });

        await getElection('550e8400-e29b-41d4-a716-446655440000');

        expect(mockApiFetch).toHaveBeenCalledWith(
          '/api/elections/550e8400-e29b-41d4-a716-446655440000'
        );
      });

      it('should handle path traversal attempts', async () => {
        // The action should pass the ID - server validates
        mockApiFetch.mockRejectedValueOnce(new Error('Invalid ID'));

        await expect(getElection('../../../etc/passwd')).rejects.toThrow('Invalid ID');
      });

      it('should handle empty ID', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Invalid ID'));

        await expect(getElection('')).rejects.toThrow('Invalid ID');
      });
    });
  });

  describe('getElections', () => {
    it('should fetch all elections', async () => {
      const elections: Election[] = [
        {
          id: '1',
          name: 'Election 1',
          description: '',
          startTime: '',
          endTime: '',
          status: 'draft',
          threshold: 3,
          totalTrustees: 5,
          candidates: [],
          createdAt: '',
        },
        {
          id: '2',
          name: 'Election 2',
          description: '',
          startTime: '',
          endTime: '',
          status: 'active',
          threshold: 2,
          totalTrustees: 3,
          candidates: [],
          createdAt: '',
        },
      ];
      mockApiFetch.mockResolvedValueOnce({ elections });

      const result = await getElections();

      expect(mockApiFetch).toHaveBeenCalledWith('/api/elections');
      expect(result.elections).toHaveLength(2);
    });

    it('should return empty array when no elections exist', async () => {
      mockApiFetch.mockResolvedValueOnce({ elections: [] });

      const result = await getElections();

      expect(result.elections).toEqual([]);
    });

    it('should handle large number of elections', async () => {
      const manyElections = Array.from({ length: 500 }, (_, i) => ({
        id: `election-${i}`,
        name: `Election ${i}`,
        description: '',
        startTime: '',
        endTime: '',
        status: 'draft' as const,
        threshold: 3,
        totalTrustees: 5,
        candidates: [],
        createdAt: '',
      }));
      mockApiFetch.mockResolvedValueOnce({ elections: manyElections });

      const result = await getElections();

      expect(result.elections).toHaveLength(500);
    });
  });

  describe('updateElectionStatus', () => {
    const statuses: Election['status'][] = ['setup', 'draft', 'registration', 'voting', 'tallying', 'complete'];

    statuses.forEach((status) => {
      it(`should update election status to ${status}`, async () => {
        mockApiFetch.mockResolvedValueOnce({
          election: { id: '1', status },
        });

        const result = await updateElectionStatus('election-123', status);

        expect(mockApiFetch).toHaveBeenCalledWith('/api/elections/election-123/status', {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
        expect(result.election.status).toBe(status);
      });
    });

    it('should include bitcoin anchor info when transitioning to complete', async () => {
      mockApiFetch.mockResolvedValueOnce({
        election: { id: '1', status: 'complete' },
        bitcoinAnchor: { submitted: true },
      });

      const result = await updateElectionStatus('election-123', 'complete');

      expect(result.bitcoinAnchor?.submitted).toBe(true);
    });

    it('should handle pending bitcoin anchor', async () => {
      mockApiFetch.mockResolvedValueOnce({
        election: { id: '1', status: 'complete' },
        bitcoinAnchor: { pending: 'Waiting for confirmation' },
      });

      const result = await updateElectionStatus('election-123', 'complete');

      expect(result.bitcoinAnchor?.pending).toBe('Waiting for confirmation');
    });

    it('should handle bitcoin anchor error', async () => {
      mockApiFetch.mockResolvedValueOnce({
        election: { id: '1', status: 'complete' },
        bitcoinAnchor: { error: 'Bitcoin network unavailable' },
      });

      const result = await updateElectionStatus('election-123', 'complete');

      expect(result.bitcoinAnchor?.error).toBe('Bitcoin network unavailable');
    });

    it('should handle invalid status transition', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Invalid status transition'));

      await expect(updateElectionStatus('election-123', 'complete')).rejects.toThrow(
        'Invalid status transition'
      );
    });
  });

  describe('getElectionResults', () => {
    it('should fetch election results', async () => {
      const mockResults = {
        election: {
          id: '1',
          name: 'Test',
          description: '',
          startTime: '',
          endTime: '',
          status: 'complete' as const,
          threshold: 3,
          totalTrustees: 5,
          candidates: [],
          createdAt: '',
        },
        results: [
          { candidate: { id: 'c1', name: 'Candidate 1', position: 0 }, votes: 150 },
          { candidate: { id: 'c2', name: 'Candidate 2', position: 1 }, votes: 100 },
        ],
      };
      mockApiFetch.mockResolvedValueOnce(mockResults);

      const result = await getElectionResults('election-123');

      expect(mockApiFetch).toHaveBeenCalledWith('/api/elections/election-123/results');
      expect(result.results).toHaveLength(2);
      expect(result.results[0].votes).toBe(150);
    });

    it('should handle election with no votes', async () => {
      mockApiFetch.mockResolvedValueOnce({
        election: { id: '1' },
        results: [
          { candidate: { id: 'c1', name: 'Candidate 1', position: 0 }, votes: 0 },
          { candidate: { id: 'c2', name: 'Candidate 2', position: 1 }, votes: 0 },
        ],
      });

      const result = await getElectionResults('election-123');

      expect(result.results.every((r) => r.votes === 0)).toBe(true);
    });

    it('should handle results not ready error', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Results not yet available'));

      await expect(getElectionResults('election-123')).rejects.toThrow('Results not yet available');
    });

    it('should handle large vote counts', async () => {
      mockApiFetch.mockResolvedValueOnce({
        election: { id: '1' },
        results: [
          { candidate: { id: 'c1', name: 'Candidate 1', position: 0 }, votes: 1000000 },
        ],
      });

      const result = await getElectionResults('election-123');

      expect(result.results[0].votes).toBe(1000000);
    });
  });
});
