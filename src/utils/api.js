/**
 * Global API utility for consistent error handling and response parsing.
 * All API calls should use this wrapper for standardized behavior.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
if (!import.meta.env.VITE_API_URL) {
  console.warn("VITE_API_URL is undefined, falling back to http://localhost:5000");
}

/**
 * Custom error class for API errors with status code and type.
 */
export class ApiError extends Error {
  constructor(message, status, type = 'api') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type; // 'api' | 'network' | 'parse'
  }
}

/**
 * Make an API request with standardized error handling.
 * @param {string} endpoint - API endpoint path (e.g., '/api/chat')
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise<object>} Parsed response data
 * @throws {ApiError} On network, parse, or API errors
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  // Stringify body if it's an object
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  let res;
  try {
    res = await fetch(url, config);
  } catch (err) {
    // Network error — server unreachable, DNS failure, CORS, etc.
    throw new ApiError(
      'Cannot reach the backend server. Make sure it is running on port 5000.',
      0,
      'network'
    );
  }

  let response;
  try {
    response = await res.json();
  } catch {
    // Server returned non-JSON (e.g. HTML error page, empty body)
    throw new ApiError(
      `Server returned an invalid response (HTTP ${res.status}).`,
      res.status,
      'parse'
    );
  }

  if (!response.success) {
    throw new ApiError(
      response.error || 'Something went wrong.',
      res.status,
      'api'
    );
  }

  return response.data;
}

/**
 * Helper to get a user-friendly error message from any error.
 * @param {Error} err - The caught error
 * @returns {string} Human-readable error message
 */
export function getErrorMessage(err) {
  if (err instanceof ApiError) {
    switch (err.type) {
      case 'network':
        return '🔌 Server unreachable — check that the backend is running.';
      case 'parse':
        return '⚠️ Unexpected server response. Please try again.';
      default:
        return err.message;
    }
  }
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return '🔌 Network error — check your internet connection.';
  }
  return err.message || 'An unexpected error occurred.';
}

/**
 * Get the base API URL (for components that build URLs manually).
 */
export function getApiUrl() {
  return API_URL;
}
