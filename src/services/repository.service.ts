/**
 * Repository Service
 *
 * Handles all API calls related to connected GitHub repositories
 */

import { API_BASE_URL, DEFAULT_HEADERS, REQUEST_TIMEOUT } from './api.config';

// Types
export interface ConnectedRepository {
  id?: string;
  name: string;
  owner: string;
  fullName: string;
  language: string;
  stars: number;
  branches: number;
  description?: string;
  url: string;
  lastCommit?: string;
  status: 'active' | 'inactive';
  connectedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Make API request with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Get all connected repositories
 */
export async function getAllRepositories(): Promise<ApiResponse<ConnectedRepository[]>> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/repositories`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch repositories');
    }

    return data;
  } catch (error: any) {
    console.error('Get repositories error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch repositories',
    };
  }
}

/**
 * Connect a new repository
 */
export async function connectRepository(
  repository: Omit<ConnectedRepository, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<ConnectedRepository>> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/repositories`, {
      method: 'POST',
      body: JSON.stringify(repository),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to connect repository');
    }

    return data;
  } catch (error: any) {
    console.error('Connect repository error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect repository',
    };
  }
}

/**
 * Disconnect a repository
 */
export async function disconnectRepository(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/repositories/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to disconnect repository');
    }

    return data;
  } catch (error: any) {
    console.error('Disconnect repository error:', error);
    return {
      success: false,
      error: error.message || 'Failed to disconnect repository',
    };
  }
}

/**
 * Update repository details
 */
export async function updateRepository(
  id: string,
  updates: Partial<Omit<ConnectedRepository, 'id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<ConnectedRepository>> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/repositories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update repository');
    }

    return data;
  } catch (error: any) {
    console.error('Update repository error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update repository',
    };
  }
}

export const createRepository = connectRepository;

export default {
  getAllRepositories,
  connectRepository,
  createRepository: connectRepository,
  disconnectRepository,
  updateRepository,
};
