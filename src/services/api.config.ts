/**
 * API Configuration
 *
 * Centralized configuration for API endpoints
 */

// Get API base URL from environment variable or use default
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// API endpoints
export const API_ENDPOINTS = {
  WORKFLOWS: `${API_BASE_URL}/api/workflows`,
  WORKFLOW_BY_ID: (id: string) => `${API_BASE_URL}/api/workflows/${id}`,
  WORKFLOW_CONTENT: (id: string) => `${API_BASE_URL}/api/workflows/${id}/content`,
  WORKFLOW_EXECUTE: (id: string) => `${API_BASE_URL}/api/workflows/${id}/execute`,
  WORKFLOW_EXECUTION: (id: string) => `${API_BASE_URL}/api/workflows/${id}/execution`,
  WORKFLOW_APPROVE: (id: string, nodeId: string) => `${API_BASE_URL}/api/workflows/${id}/execution/approve/${nodeId}`,
  WORKFLOW_REJECT: (id: string, nodeId: string) => `${API_BASE_URL}/api/workflows/${id}/execution/reject/${nodeId}`,
  HEALTH: `${API_BASE_URL}/health`,
};

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  REQUEST_TIMEOUT,
  DEFAULT_HEADERS,
};
