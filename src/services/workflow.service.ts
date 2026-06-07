/**
 * Workflow Service
 *
 * Handles all API calls related to workflows
 */

import { API_ENDPOINTS, DEFAULT_HEADERS, REQUEST_TIMEOUT } from './api.config';

// Types
export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  category: string;
  color: string;
  x: number;
  y: number;
  config?: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  fromId: string;
  toId: string;
  relationship: string;
  config?: Record<string, any>;
}

export interface Workflow {
  id?: string;
  name: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdBy?: string;
  metadata?: Record<string, any>;
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
 * Create a new workflow
 */
export async function createWorkflow(workflow: Workflow): Promise<ApiResponse<Workflow>> {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.WORKFLOWS, {
      method: 'POST',
      body: JSON.stringify(workflow),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create workflow');
    }

    return data;
  } catch (error: any) {
    console.error('Create workflow error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create workflow',
    };
  }
}

/**
 * Get all workflows
 */
export async function getAllWorkflows(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<Workflow[]>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = params ? `${API_ENDPOINTS.WORKFLOWS}?${queryParams}` : API_ENDPOINTS.WORKFLOWS;
    const response = await fetchWithTimeout(url);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch workflows');
    }

    return data;
  } catch (error: any) {
    console.error('Get workflows error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch workflows',
    };
  }
}

/**
 * Get workflow by ID
 */
export async function getWorkflowById(id: string): Promise<ApiResponse<Workflow>> {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.WORKFLOW_BY_ID(id));

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch workflow');
    }

    return data;
  } catch (error: any) {
    console.error('Get workflow error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch workflow',
    };
  }
}

/**
 * Update workflow metadata
 */
export async function updateWorkflow(
  id: string,
  updates: Partial<Pick<Workflow, 'name' | 'description' | 'status' | 'metadata'>>
): Promise<ApiResponse<Workflow>> {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.WORKFLOW_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update workflow');
    }

    return data;
  } catch (error: any) {
    console.error('Update workflow error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update workflow',
    };
  }
}

/**
 * Update workflow content (nodes and edges)
 */
export async function updateWorkflowContent(
  id: string,
  content: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }
): Promise<ApiResponse<Workflow>> {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.WORKFLOW_CONTENT(id), {
      method: 'PUT',
      body: JSON.stringify(content),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update workflow content');
    }

    return data;
  } catch (error: any) {
    console.error('Update workflow content error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update workflow content',
    };
  }
}

/**
 * Delete workflow
 */
export async function deleteWorkflow(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.WORKFLOW_BY_ID(id), {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete workflow');
    }

    return data;
  } catch (error: any) {
    console.error('Delete workflow error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete workflow',
    };
  }
}

/**
 * Start workflow execution (triggers sequential node execution on the backend)
 */
export async function executeWorkflow(id: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.WORKFLOW_EXECUTE(id), {
      method: 'POST',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to start execution');
    return data;
  } catch (error: any) {
    console.error('Execute workflow error:', error);
    return { success: false, error: error.message || 'Failed to start execution' };
  }
}

/**
 * Get current execution state for a workflow (all node statuses)
 */
export async function getExecutionState(id: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.WORKFLOW_EXECUTION(id));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch execution state');
    return data;
  } catch (error: any) {
    console.error('Get execution state error:', error);
    return { success: false, error: error.message || 'Failed to fetch execution state' };
  }
}

/**
 * Approve a human-in-loop node — resumes execution
 */
export async function approveNode(workflowId: string, nodeId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.WORKFLOW_APPROVE(workflowId, nodeId), {
      method: 'POST',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to approve node');
    return data;
  } catch (error: any) {
    console.error('Approve node error:', error);
    return { success: false, error: error.message || 'Failed to approve node' };
  }
}

/**
 * Reject a human-in-loop node — stops execution
 */
export async function rejectNode(workflowId: string, nodeId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.WORKFLOW_REJECT(workflowId, nodeId), {
      method: 'POST',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to reject node');
    return data;
  } catch (error: any) {
    console.error('Reject node error:', error);
    return { success: false, error: error.message || 'Failed to reject node' };
  }
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<ApiResponse<any>> {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.HEALTH);

    if (!response.ok) {
      throw new Error('API is not healthy');
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('Health check error:', error);
    return {
      success: false,
      error: error.message || 'API health check failed',
    };
  }
}

export default {
  createWorkflow,
  getAllWorkflows,
  getWorkflowById,
  updateWorkflow,
  updateWorkflowContent,
  deleteWorkflow,
  executeWorkflow,
  getExecutionState,
  approveNode,
  rejectNode,
  checkHealth,
};
