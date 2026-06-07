import { useState, useEffect, useCallback, useRef } from "react";
import { SlidersHorizontal, Activity } from "lucide-react";
import { Status } from '../../types';
import * as workflowService from '../../services/workflow.service';
import * as repositoryService from '../../services/repository.service';
import { SprintCanvas, WorkflowDesigner } from '../canvas';

const POLL_INTERVAL_MS = 5000;

// Map backend node execution status → canvas Status
function toCanvasStatus(backendStatus: string): Status {
  switch (backendStatus) {
    case 'running':           return 'running';
    case 'completed':         return 'completed';
    case 'failed':            return 'failed';
    case 'awaiting_approval': return 'blocked';
    case 'rejected':          return 'failed';
    default:                  return 'waiting';
  }
}

export function WorkflowsView() {
  const [tab, setTab] = useState<"live" | "designer">("designer");
  const [liveRuns, setLiveRuns] = useState<Array<{
    id: string;
    name: string;
    nodes: any[];
    edges: any[];
    status: string;
    startedAt: string;
    githubRunId?: number;
  }>>([]);
  const [connectedRepos, setConnectedRepos] = useState<any[]>([]);
  const pollTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Load connected repositories on mount
  useEffect(() => {
    repositoryService.getAllRepositories()
      .then(r => { if (r.success && r.data) setConnectedRepos(r.data); })
      .catch(err => console.error('Error loading repositories:', err));
  }, []);

  // Helpers to build a scaled live-run from a full workflow object
  const buildLiveRun = useCallback((wf: any, nodeStatusMap: Record<string, Status> = {}) => {
    const nodesWithPositions = wf.nodes.map((n: any) => ({
      ...n,
      x: parseFloat(n.x) || 0,
      y: parseFloat(n.y) || 0,
    }));

    const minX = Math.min(...nodesWithPositions.map((n: any) => n.x));
    const maxX = Math.max(...nodesWithPositions.map((n: any) => n.x));
    const minY = Math.min(...nodesWithPositions.map((n: any) => n.y));
    const maxY = Math.max(...nodesWithPositions.map((n: any) => n.y));
    const workflowWidth  = maxX - minX + 128;
    const workflowHeight = maxY - minY + 56;
    const canvasWidth = 1120;
    const canvasHeight = 320;
    const padding = 40;
    const scale = Math.min(
      (canvasWidth  - padding * 2) / workflowWidth,
      (canvasHeight - padding * 2) / workflowHeight,
      1,
    );
    const scaledWidth  = workflowWidth  * scale;
    const scaledHeight = workflowHeight * scale;
    const offsetX = (canvasWidth  - scaledWidth)  / 2 - minX * scale;
    const offsetY = (canvasHeight - scaledHeight) / 2 - minY * scale;

    return {
      id: wf.id,
      name: wf.name,
      status: wf.status,
      startedAt: wf.updated_at || wf.created_at,
      nodes: nodesWithPositions.map((n: any) => ({
        id: n.id,
        label: n.label,
        type: n.category?.toLowerCase() || 'strategic',
        nodeType: n.type,
        status: nodeStatusMap[n.id] ?? ('waiting' as Status),
        x: n.x * scale + offsetX,
        y: n.y * scale + offsetY,
        artifacts: 0,
      })),
      edges: wf.edges.map((e: any) => ({
        from: e.fromId,
        to: e.toId,
        fromId: e.fromId,
        toId: e.toId,
        relationship: e.relationship || 'successor',
      })),
    };
  }, []);

  // Load active workflows on mount
  useEffect(() => {
    const load = async () => {
      try {
        const response = await workflowService.getAllWorkflows();
        if (!response.success || !response.data) return;

        const activeWorkflows = response.data.filter((wf: any) => wf.status === 'active');
        if (!activeWorkflows.length) return;

        setTab('live');

        const runs = (await Promise.all(
          activeWorkflows.map(async (wf: any) => {
            try {
              const detail = await workflowService.getWorkflowById(wf.id);
              if (!detail.success || !detail.data) return null;

              // Fetch current execution state for node statuses
              const execState = await workflowService.getExecutionState(wf.id);
              const nodeStatusMap: Record<string, Status> = {};
              if (execState.success && execState.data?.nodeExecutions) {
                for (const ne of execState.data.nodeExecutions) {
                  nodeStatusMap[ne.node_id] = toCanvasStatus(ne.status);
                }
              }

              return buildLiveRun(detail.data, nodeStatusMap);
            } catch (err) {
              console.error(`Error loading workflow ${wf.id}:`, err);
              return null;
            }
          })
        )).filter(Boolean) as any[];

        setLiveRuns(runs);

        // Start polling for each active run
        for (const run of runs) {
          startPolling(run.id);
        }
      } catch (err) {
        console.error('Error loading active workflows:', err);
      }
    };

    load();

    return () => {
      // Clear all poll timers on unmount
      Object.values(pollTimers.current).forEach(clearInterval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll execution state for a run and update node statuses
  const pollExecution = useCallback(async (runId: string) => {
    try {
      const execState = await workflowService.getExecutionState(runId);
      if (!execState.success || !execState.data) return;

      const { status: execStatus, nodeExecutions } = execState.data;

      setLiveRuns(prev => prev.map(run => {
        if (run.id !== runId) return run;
        return {
          ...run,
          status: execStatus,
          nodes: run.nodes.map((n: any) => {
            const ne = nodeExecutions?.find((x: any) => x.node_id === n.id);
            return ne ? { ...n, status: toCanvasStatus(ne.status) } : n;
          }),
        };
      }));

      // Stop polling when execution is terminal
      if (['completed', 'failed', 'cancelled'].includes(execStatus)) {
        stopPolling(runId);
      }
    } catch (err) {
      console.error(`Poll error for run ${runId}:`, err);
    }
  }, []);

  const startPolling = useCallback((runId: string) => {
    if (pollTimers.current[runId]) return; // already polling
    pollTimers.current[runId] = setInterval(() => pollExecution(runId), POLL_INTERVAL_MS);
  }, [pollExecution]);

  const stopPolling = useCallback((runId: string) => {
    if (pollTimers.current[runId]) {
      clearInterval(pollTimers.current[runId]);
      delete pollTimers.current[runId];
    }
  }, []);

  // Called by WorkflowDesigner after launch
  const handleLaunch = useCallback((run: any) => {
    setLiveRuns(prev => [run, ...prev]);
    setTab('live');
    startPolling(run.id);
  }, [startPolling]);

  // Approve a human-in-loop node
  const handleApprove = useCallback(async (runId: string, nodeId: string) => {
    const res = await workflowService.approveNode(runId, nodeId);
    if (res.success) {
      // Immediately reflect approval in UI
      setLiveRuns(prev => prev.map(run =>
        run.id !== runId ? run : {
          ...run,
          nodes: run.nodes.map((n: any) =>
            n.id === nodeId ? { ...n, status: 'running' as Status } : n
          ),
        }
      ));
    }
  }, []);

  // Reject a human-in-loop node
  const handleReject = useCallback(async (runId: string, nodeId: string) => {
    const res = await workflowService.rejectNode(runId, nodeId);
    if (res.success) {
      setLiveRuns(prev => prev.map(run =>
        run.id !== runId ? run : {
          ...run,
          status: 'failed',
          nodes: run.nodes.map((n: any) =>
            n.id === nodeId ? { ...n, status: 'failed' as Status } : n
          ),
        }
      ));
      stopPolling(runId);
    }
  }, [stopPolling]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-0 flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-foreground">Workflow Orchestration Canvas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Visualize, design, save and launch SDLC workflows</p>
        </div>
        <div className="flex gap-1 border border-border rounded-lg p-0.5 bg-muted">
          {([
            { id: "designer" as const, label: "Workflow Designer", icon: SlidersHorizontal },
            { id: "live"     as const, label: "Live Runs",         icon: Activity },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={11} />
              {t.label}
              {t.id === "live" && liveRuns.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-400">
                  {liveRuns.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden mt-4 relative">
        {tab === "live" ? (
          <SprintCanvas
            liveRuns={liveRuns}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : (
          <WorkflowDesigner
            onLaunch={handleLaunch}
            connectedRepos={connectedRepos}
          />
        )}
      </div>
    </div>
  );
}
