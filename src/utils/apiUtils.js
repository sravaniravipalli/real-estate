/**
 * Utility function to add timeout to fetch requests
 * @param {Promise} promise - The fetch promise
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000ms = 30s)
 * @returns {Promise} - Promise that rejects on timeout
 */
export const fetchWithTimeout = (promise, timeoutMs = 30000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

/**
 * Enhanced fetch wrapper with timeout and retry logic
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @param {number} retries - Number of retry attempts
 * @returns {Promise} - Fetch response
 */
export const fetchWithRetry = async (url, options = {}, timeout = 30000, retries = 1) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (i === retries) {
        throw error;
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Handle API errors consistently
 * @param {Error} error - The error object
 * @returns {object} - Formatted error object
 */
export const handleApiError = (error) => {
  if (error.name === 'AbortError') {
    return {
      message: 'Request was cancelled',
      type: 'abort'
    };
  }

  if (error.message === 'Request timeout') {
    return {
      message: 'Request timed out. Please check your connection and try again.',
      type: 'timeout'
    };
  }

  if (error instanceof ApiError) {
    return {
      message: error.message,
      status: error.status,
      data: error.data,
      type: 'api'
    };
  }

  return {
    message: error.message || 'An unexpected error occurred',
    type: 'unknown'
  };
};
