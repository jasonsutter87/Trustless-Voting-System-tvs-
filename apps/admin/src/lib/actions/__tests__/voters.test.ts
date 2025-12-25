import {
  getVoters,
  getVoter,
  addVoter,
  addVotersBatch,
  updateVoter,
  deleteVoter,
  generateCredential,
  generateCredentialsBatch,
  sendCredentials,
  importVotersFromCSV,
  exportVoters,
  getVoterStats,
  type Voter,
  type VoterInput,
  type VoterCredential,
} from '../voters';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('voters actions', () => {
  const electionId = 'test-election-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVoters', () => {
    it('should fetch voters for an election', async () => {
      const mockVoters: Voter[] = [
        {
          id: '1',
          electionId,
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
          electionId,
          email: 'bob@example.com',
          name: 'Bob Jones',
          jurisdiction: 'District 2',
          status: 'registered',
          credentialGenerated: true,
          hasVoted: false,
          createdAt: '2025-01-01T00:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ voters: mockVoters, total: 2 }),
      });

      const result = await getVoters(electionId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/elections/${electionId}/voters`),
        expect.any(Object)
      );
      expect(result.voters).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should support pagination', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ voters: [], total: 0 }),
      });

      await getVoters(electionId, { page: 2, limit: 20 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=20'),
        expect.any(Object)
      );
    });

    it('should support filtering by status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ voters: [], total: 0 }),
      });

      await getVoters(electionId, { status: 'voted' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=voted'),
        expect.any(Object)
      );
    });

    it('should support search', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ voters: [], total: 0 }),
      });

      await getVoters(electionId, { search: 'alice' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=alice'),
        expect.any(Object)
      );
    });

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Election not found' }),
      });

      await expect(getVoters(electionId)).rejects.toThrow('Election not found');
    });
  });

  describe('getVoter', () => {
    it('should fetch a single voter', async () => {
      const mockVoter: Voter = {
        id: '1',
        electionId,
        email: 'alice@example.com',
        name: 'Alice Smith',
        jurisdiction: 'District 1',
        status: 'registered',
        credentialGenerated: false,
        hasVoted: false,
        createdAt: '2025-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ voter: mockVoter }),
      });

      const result = await getVoter(electionId, '1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/elections/${electionId}/voters/1`),
        expect.any(Object)
      );
      expect(result.voter.email).toBe('alice@example.com');
    });
  });

  describe('addVoter', () => {
    it('should add a single voter', async () => {
      const input: VoterInput = {
        email: 'new@example.com',
        name: 'New Voter',
        jurisdiction: 'District 1',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            voter: { id: '123', electionId, ...input, status: 'registered' },
          }),
      });

      const result = await addVoter(electionId, input);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/elections/${electionId}/voters`),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(input),
        })
      );
      expect(result.voter.email).toBe('new@example.com');
    });

    it('should validate email format', async () => {
      const input: VoterInput = {
        email: 'invalid-email',
        name: 'New Voter',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid email format' }),
      });

      await expect(addVoter(electionId, input)).rejects.toThrow('Invalid email format');
    });
  });

  describe('addVotersBatch', () => {
    it('should add multiple voters at once', async () => {
      const inputs: VoterInput[] = [
        { email: 'a@example.com', name: 'A' },
        { email: 'b@example.com', name: 'B' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            added: 2,
            failed: 0,
            errors: [],
          }),
      });

      const result = await addVotersBatch(electionId, inputs);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/elections/${electionId}/voters/batch`),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.added).toBe(2);
    });

    it('should report failed imports', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            added: 1,
            failed: 1,
            errors: [{ email: 'invalid', error: 'Invalid email' }],
          }),
      });

      const result = await addVotersBatch(electionId, [
        { email: 'valid@example.com', name: 'Valid' },
        { email: 'invalid', name: 'Invalid' },
      ]);

      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('updateVoter', () => {
    it('should update voter information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            voter: {
              id: '1',
              electionId,
              email: 'alice@example.com',
              name: 'Alice Updated',
              jurisdiction: 'District 2',
            },
          }),
      });

      const result = await updateVoter(electionId, '1', {
        name: 'Alice Updated',
        jurisdiction: 'District 2',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/elections/${electionId}/voters/1`),
        expect.objectContaining({
          method: 'PATCH',
        })
      );
      expect(result.voter.name).toBe('Alice Updated');
    });
  });

  describe('deleteVoter', () => {
    it('should delete a voter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await deleteVoter(electionId, '1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/elections/${electionId}/voters/1`),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result.success).toBe(true);
    });

    it('should fail if voter has already voted', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Cannot delete voter who has already voted' }),
      });

      await expect(deleteVoter(electionId, '1')).rejects.toThrow(
        'Cannot delete voter who has already voted'
      );
    });
  });

  describe('generateCredential', () => {
    it('should generate credential for a voter', async () => {
      const mockCredential: VoterCredential = {
        voterId: '1',
        code: 'ABC123DEF456',
        nullifier: 'nullifier-hash-123',
        expiresAt: '2025-12-31T23:59:59Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ credential: mockCredential }),
      });

      const result = await generateCredential(electionId, '1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/elections/${electionId}/voters/1/credential`),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.credential.code).toBe('ABC123DEF456');
    });
  });

  describe('generateCredentialsBatch', () => {
    it('should generate credentials for multiple voters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            generated: 5,
            failed: 0,
          }),
      });

      const result = await generateCredentialsBatch(electionId, ['1', '2', '3', '4', '5']);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/elections/${electionId}/voters/credentials/batch`),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.generated).toBe(5);
    });
  });

  describe('sendCredentials', () => {
    it('should send credentials via email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            sent: 3,
            failed: 0,
          }),
      });

      const result = await sendCredentials(electionId, ['1', '2', '3'], 'email');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/elections/${electionId}/voters/credentials/send`),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.sent).toBe(3);
    });

    it('should support download method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            downloadUrl: 'https://example.com/credentials.pdf',
          }),
      });

      const result = await sendCredentials(electionId, ['1'], 'download');

      expect(result.downloadUrl).toBeDefined();
    });
  });

  describe('importVotersFromCSV', () => {
    it('should import voters from CSV file', async () => {
      const csvContent = 'email,name,jurisdiction\nalice@example.com,Alice,District 1';
      const file = new File([csvContent], 'voters.csv', { type: 'text/csv' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            imported: 1,
            failed: 0,
            errors: [],
          }),
      });

      const result = await importVotersFromCSV(electionId, file);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/elections/${electionId}/voters/import`),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.imported).toBe(1);
    });

    it('should handle CSV parse errors', async () => {
      const file = new File(['invalid csv'], 'voters.csv', { type: 'text/csv' });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid CSV format' }),
      });

      await expect(importVotersFromCSV(electionId, file)).rejects.toThrow('Invalid CSV format');
    });
  });

  describe('exportVoters', () => {
    it('should export voters to CSV', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            downloadUrl: 'https://example.com/export.csv',
            expiresAt: '2025-01-02T00:00:00Z',
          }),
      });

      const result = await exportVoters(electionId, 'csv');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/elections/${electionId}/voters/export`),
        expect.any(Object)
      );
      expect(result.downloadUrl).toBeDefined();
    });

    it('should support JSON export format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            downloadUrl: 'https://example.com/export.json',
            expiresAt: '2025-01-02T00:00:00Z',
          }),
      });

      await exportVoters(electionId, 'json');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('format=json'),
        expect.any(Object)
      );
    });
  });

  describe('getVoterStats', () => {
    it('should fetch voter statistics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            stats: {
              total: 100,
              registered: 80,
              credentialsGenerated: 70,
              credentialsSent: 60,
              voted: 50,
              byJurisdiction: {
                'District 1': { total: 50, voted: 25 },
                'District 2': { total: 50, voted: 25 },
              },
            },
          }),
      });

      const result = await getVoterStats(electionId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/elections/${electionId}/voters/stats`),
        expect.any(Object)
      );
      expect(result.stats.total).toBe(100);
      expect(result.stats.voted).toBe(50);
    });
  });
});
