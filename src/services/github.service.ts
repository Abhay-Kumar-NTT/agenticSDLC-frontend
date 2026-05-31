/**
 * GitHub Service
 *
 * Handles all GitHub API calls for workflows
 */

/// <reference types="vite/client" />

// GitHub Configuration
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || '';
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || '';

// Types
export interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  run_number: number;
  workflow_id: number;
  head_branch: string;
}

export interface WorkflowJob {
  id: number;
  run_id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  started_at: string;
  completed_at: string;
  steps: Array<{
    name: string;
    status: 'queued' | 'in_progress' | 'completed';
    conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
    number: number;
    started_at: string;
    completed_at: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Check if GitHub is configured
 */
function isGitHubConfigured(): boolean {
  return !!(GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO);
}

/**
 * Make authenticated GitHub API request
 */
async function githubFetch(endpoint: string, options: RequestInit = {}) {
  // Check if GitHub is configured
  if (!isGitHubConfigured()) {
    throw new Error(
      'GitHub not configured. Please set VITE_GITHUB_TOKEN, VITE_GITHUB_OWNER, and VITE_GITHUB_REPO in .env file.'
    );
  }

  const url = `${GITHUB_API_BASE}${endpoint}`;

  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    // Handle 204 No Content responses (like workflow dispatch)
    if (response.status === 204) {
      return null;
    }

    // Only parse JSON if there's content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return null;
  } catch (error: any) {
    console.error('GitHub API error:', error);
    throw error;
  }
}

/**
 * Trigger a GitHub workflow
 * @param workflowFileName - Workflow file name (e.g., 'product-agent.yml')
 * @param ref - Git ref (branch/tag) to run workflow on
 * @param inputs - Optional workflow inputs
 */
export async function triggerWorkflow(
  workflowFileName: string,
  ref: string = 'main',
  inputs?: Record<string, string>
): Promise<ApiResponse<void>> {
  try {
    console.log(`Triggering GitHub workflow: ${workflowFileName} on ${ref}`);
    console.log(`URL: /repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflowFileName}/dispatches`);

    await githubFetch(
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflowFileName}/dispatches`,
      {
        method: 'POST',
        body: JSON.stringify({
          ref,
          inputs: inputs || {},
        }),
      }
    );

    console.log('✅ Workflow triggered successfully');
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('❌ Trigger workflow error:', error);
    return {
      success: false,
      error: error.message || 'Failed to trigger workflow',
    };
  }
}

/**
 * Get latest workflow runs
 * @param workflowFileName - Optional workflow file name to filter
 * @param perPage - Number of results per page
 */
export async function getWorkflowRuns(
  workflowFileName?: string,
  perPage: number = 10
): Promise<ApiResponse<WorkflowRun[]>> {
  try {
    let endpoint = `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs?per_page=${perPage}`;

    if (workflowFileName) {
      // First get the workflow ID
      const workflows = await githubFetch(
        `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows`
      );

      const workflow = workflows.workflows.find((w: any) =>
        w.path.includes(workflowFileName)
      );

      if (workflow) {
        endpoint = `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflow.id}/runs?per_page=${perPage}`;
      }
    }

    const data = await githubFetch(endpoint);

    return {
      success: true,
      data: data.workflow_runs,
    };
  } catch (error: any) {
    console.error('Get workflow runs error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch workflow runs',
    };
  }
}

/**
 * Get specific workflow run by ID
 */
export async function getWorkflowRun(runId: number): Promise<ApiResponse<WorkflowRun>> {
  try {
    const data = await githubFetch(
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${runId}`
    );

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('Get workflow run error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch workflow run',
    };
  }
}

/**
 * Get jobs for a workflow run
 */
export async function getWorkflowJobs(runId: number): Promise<ApiResponse<WorkflowJob[]>> {
  try {
    const data = await githubFetch(
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${runId}/jobs`
    );

    return {
      success: true,
      data: data.jobs,
    };
  } catch (error: any) {
    console.error('Get workflow jobs error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch workflow jobs',
    };
  }
}

/**
 * Cancel a workflow run
 */
export async function cancelWorkflowRun(runId: number): Promise<ApiResponse<void>> {
  try {
    await githubFetch(
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${runId}/cancel`,
      {
        method: 'POST',
      }
    );

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Cancel workflow run error:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel workflow run',
    };
  }
}

/**
 * Re-run a failed workflow
 */
export async function rerunWorkflow(runId: number): Promise<ApiResponse<void>> {
  try {
    await githubFetch(
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${runId}/rerun`,
      {
        method: 'POST',
      }
    );

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Rerun workflow error:', error);
    return {
      success: false,
      error: error.message || 'Failed to rerun workflow',
    };
  }
}

/**
 * Get workflow run logs
 */
export async function getWorkflowLogs(runId: number): Promise<ApiResponse<string>> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${runId}/logs`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.status}`);
    }

    const logs = await response.text();

    return {
      success: true,
      data: logs,
    };
  } catch (error: any) {
    console.error('Get workflow logs error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch workflow logs',
    };
  }
}

/**
 * Map GitHub status to our application status
 */
export function mapGitHubStatus(
  status: string,
  conclusion: string | null
): 'running' | 'completed' | 'failed' | 'waiting' | 'blocked' {
  if (status === 'queued') return 'waiting';
  if (status === 'in_progress') return 'running';
  if (status === 'completed') {
    if (conclusion === 'success') return 'completed';
    if (conclusion === 'cancelled') return 'blocked';
    return 'failed';
  }
  return 'waiting';
}

export default {
  triggerWorkflow,
  getWorkflowRuns,
  getWorkflowRun,
  getWorkflowJobs,
  cancelWorkflowRun,
  rerunWorkflow,
  getWorkflowLogs,
  mapGitHubStatus,
};
