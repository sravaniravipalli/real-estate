import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWithTimeout, fetchWithRetry, handleApiError, ApiError } from '../utils/apiUtils';

describe('API Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchWithTimeout', () => {
    it('should resolve if promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await fetchWithTimeout(promise, 1000);
      expect(result).toBe('success');
    });

    it('should reject on timeout', async () => {
      const promise = new Promise((resolve) => setTimeout(() => resolve('late'), 2000));
      await expect(fetchWithTimeout(promise, 100)).rejects.toThrow('Request timeout');
    });
  });

  describe('handleApiError', () => {
    it('should handle timeout errors', () => {
      const error = new Error('Request timeout');
      const result = handleApiError(error);
      expect(result.type).toBe('timeout');
      expect(result.message).toContain('timed out');
    });

    it('should handle ApiError', () => {
      const error = new ApiError('API failed', 500, {});
      const result = handleApiError(error);
      expect(result.type).toBe('api');
      expect(result.status).toBe(500);
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      const result = handleApiError(error);
      expect(result.type).toBe('unknown');
    });
  });
});
