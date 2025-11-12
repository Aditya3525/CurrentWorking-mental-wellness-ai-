/**
 * CENTRALIZED API CONFIGURATION
 * Single source of truth for all API calls
 */

const getApiBaseUrl = (): string => {
  // PRIORITY 1: Use environment variable (set in render.yaml for production)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // PRIORITY 2: Localhost development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }

  // PRIORITY 3: Production fallback - should never reach here if VITE_API_URL is set
  console.warn('VITE_API_URL not set, using fallback. This should not happen in production!');
  return `http://${window.location.hostname}:5000/api`;
};

/**
 * Base API URL - Use this everywhere for API calls
 */
export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper to construct full API endpoint URL
 * Handles both /api/endpoint and /endpoint formats
 */
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Remove /api prefix if present (we already have it in API_BASE_URL)
  if (cleanEndpoint.startsWith('api/')) {
    cleanEndpoint = cleanEndpoint.slice(4);
  }
  
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    API_BASE_URL,
    hostname: window.location.hostname
  });
}
