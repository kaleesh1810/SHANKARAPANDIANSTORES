/**
 * Simple API Service wrapper around fetch
 * Provides get, post, put, del methods for HTTP requests
 */

const API_BASE = "http://dikshiserver/spstores/api";

const apiService = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint path (relative to base URL)
   * @param {object} params - Optional query parameters
   * @returns {Promise} JSON response from server
   */
  async get(endpoint, params = {}) {
    let url = `${API_BASE}/${endpoint}`;
    
    // Handle both query params and path-based params
    if (params && typeof params === 'object' && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API GET failed: ${response.status} ${response.statusText} for ${url}`);
    }
    return response.json();
  },

  /**
   * POST request
   * @param {string} endpoint - API endpoint path (relative to base URL)
   * @param {object} data - Request payload
   * @returns {Promise} JSON response from server
   */
  async post(endpoint, data = {}) {
    const url = `${API_BASE}/${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API POST failed: ${response.status} ${response.statusText} for ${url}`);
    }
    return response.json().catch(() => ({})); // some endpoints may not return JSON
  },

  /**
   * PUT request
   * @param {string} endpoint - API endpoint path (relative to base URL)
   * @param {object} data - Request payload
   * @returns {Promise} JSON response from server
   */
  async put(endpoint, data = {}) {
    const url = `${API_BASE}/${endpoint}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API PUT failed: ${response.status} ${response.statusText} for ${url}`);
    }
    return response.json().catch(() => ({}));
  },

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint path (relative to base URL)
   * @param {object} data - Optional request payload
   * @returns {Promise} JSON response from server
   */
  async del(endpoint, data = {}) {
    const url = `${API_BASE}/${endpoint}`;
    const options = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (data && Object.keys(data).length > 0) {
      options.body = JSON.stringify(data);
    }
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API DELETE failed: ${response.status} ${response.statusText} for ${url}`);
    }
    return response.json().catch(() => ({}));
  },
};

export default apiService;
