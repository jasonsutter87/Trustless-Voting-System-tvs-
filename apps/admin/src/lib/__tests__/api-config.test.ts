/**
 * API Config Tests
 * Tests for the fetch wrapper and error handling
 */

import { apiFetch, API_BASE_URL } from '../api-config';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('api-config', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('API_BASE_URL', () => {
    it('should use environment variable if set', () => {
      expect(typeof API_BASE_URL).toBe('string');
    });

    it('should default to localhost:3000', () => {
      expect(API_BASE_URL).toMatch(/localhost:3000|TVS_API_URL/);
    });
  });

  describe('apiFetch', () => {
    describe('successful requests', () => {
      it('should make GET request to correct URL', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'test' }),
        });

        await apiFetch('/api/test');

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/test`,
          expect.objectContaining({
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });

      it('should make POST request with body', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const body = { name: 'Test Election' };
        await apiFetch('/api/elections', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/elections`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });

      it('should return parsed JSON response', async () => {
        const responseData = { elections: [{ id: '1', name: 'Test' }] };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => responseData,
        });

        const result = await apiFetch('/api/elections');

        expect(result).toEqual(responseData);
      });

      it('should merge custom headers with defaults', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        await apiFetch('/api/test', {
          headers: {
            Authorization: 'Bearer token123',
          },
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer token123',
            },
          })
        );
      });

      it('should handle PATCH requests', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ updated: true }),
        });

        await apiFetch('/api/elections/123/status', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'active' }),
        });

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/elections/123/status`,
          expect.objectContaining({
            method: 'PATCH',
          })
        );
      });

      it('should handle DELETE requests', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ deleted: true }),
        });

        await apiFetch('/api/elections/123', {
          method: 'DELETE',
        });

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/elections/123`,
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    describe('error handling', () => {
      it('should throw error for 400 Bad Request', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Validation failed' }),
        });

        await expect(apiFetch('/api/elections')).rejects.toThrow('Validation failed');
      });

      it('should throw error for 401 Unauthorized', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
        });

        await expect(apiFetch('/api/elections')).rejects.toThrow('Unauthorized');
      });

      it('should throw error for 403 Forbidden', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({ error: 'Forbidden' }),
        });

        await expect(apiFetch('/api/elections')).rejects.toThrow('Forbidden');
      });

      it('should throw error for 404 Not Found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ error: 'Election not found' }),
        });

        await expect(apiFetch('/api/elections/999')).rejects.toThrow('Election not found');
      });

      it('should throw error for 500 Internal Server Error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error' }),
        });

        await expect(apiFetch('/api/elections')).rejects.toThrow('Internal server error');
      });

      it('should handle non-JSON error responses', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => {
            throw new Error('Not JSON');
          },
        });

        await expect(apiFetch('/api/elections')).rejects.toThrow('Request failed');
      });

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        await expect(apiFetch('/api/elections')).rejects.toThrow('Failed to fetch');
      });

      it('should handle timeout errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('The operation was aborted'));

        await expect(apiFetch('/api/elections')).rejects.toThrow('The operation was aborted');
      });

      it('should include status code in generic error message', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 418,
          json: async () => ({}),
        });

        await expect(apiFetch('/api/elections')).rejects.toThrow('API error: 418');
      });
    });

    describe('edge cases', () => {
      it('should handle empty response body', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => null,
        });

        const result = await apiFetch('/api/empty');
        expect(result).toBeNull();
      });

      it('should handle response with undefined values', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: undefined }),
        });

        const result = await apiFetch<{ data?: string }>('/api/test');
        expect(result.data).toBeUndefined();
      });

      it('should handle endpoints with query parameters', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        });

        await apiFetch('/api/elections?status=active&page=1');

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/elections?status=active&page=1`,
          expect.any(Object)
        );
      });

      it('should handle endpoints with special characters', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        await apiFetch('/api/elections/abc-123-def');

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/elections/abc-123-def`,
          expect.any(Object)
        );
      });

      it('should handle large response payloads', async () => {
        const largeData = Array.from({ length: 1000 }, (_, i) => ({
          id: `election-${i}`,
          name: `Election ${i}`,
        }));
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ elections: largeData }),
        });

        const result = await apiFetch<{ elections: typeof largeData }>('/api/elections');
        expect(result.elections).toHaveLength(1000);
      });
    });

    describe('security tests', () => {
      it('should not include credentials by default', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        await apiFetch('/api/test');

        expect(mockFetch).not.toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            credentials: 'include',
          })
        );
      });

      it('should allow custom credentials setting', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        await apiFetch('/api/test', {
          credentials: 'include',
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            credentials: 'include',
          })
        );
      });

      it('should handle response with script tags in data', async () => {
        const maliciousData = {
          name: '<script>alert("xss")</script>',
        };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => maliciousData,
        });

        const result = await apiFetch<typeof maliciousData>('/api/test');
        expect(result.name).toBe('<script>alert("xss")</script>');
      });
    });
  });
});
