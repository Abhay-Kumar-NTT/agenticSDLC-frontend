import { useState, useCallback, useRef, useEffect } from "react";
import {
  Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, Clock, XCircle,
  TrendingUp, Users, FileText, Eye, Plus, ExternalLink, Circle, Terminal,
  Layers, GitMerge, MonitorDot, Gauge, SlidersHorizontal, ChevronUp, Minus,
  TriangleAlert, Info, Braces, PackageCheck, Server, TrendingDown, Radio,
  Database, MapPin, Trash2, RefreshCw, ArrowRight
} from "lucide-react";
import { ViewId, Status, DesignerNode, DesignerEdge, SavedWorkflow, WorkflowNode, WorkflowEdge } from '../../types';
import {
  workflowNodes, workflowEdges, defaultSavedWorkflows
} from '../../data';
import {
  statusConfig, nodeColorByType, statusFillByStatus,
  paletteCategories, relationships,
  NODE_W, NODE_H
} from '../../config';
import { StatusBadge } from '../common';
import * as workflowService from '../../services/workflow.service';
import * as githubService from '../../services/github.service';


export function WorkflowDesigner({ onLaunch, connectedRepos }: { onLaunch: (run: any) => void; connectedRepos: any[] }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasNodes, setCanvasNodes] = useState<DesignerNode[]>([]);
  const [edges, setEdges] = useState<DesignerEdge[]>([]);
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>(defaultSavedWorkflows);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [activeRelType, setActiveRelType] = useState("successor");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [rightTab, setRightTab] = useState<"properties" | "saved">("saved");
  const [saveModal, setSaveModal] = useState(false);
  const [wfName, setWfName] = useState("");
  const [launchedId, setLaunchedId] = useState<string | null>(null);
  const [previewWorkflow, setPreviewWorkflow] = useState<SavedWorkflow | null>(null);

  const selectedNode = canvasNodes.find(n => n.id === selectedId);
  const selectedEdge = edges.find(e => e.id === selectedEdgeId);

  // ── Load workflows from database on mount ──
  useEffect(() => {
    const loadWorkflowsFromDB = async () => {
      try {
        console.log('Loading workflows from database...');
        const response = await workflowService.getAllWorkflows();

        if (response.success && response.data) {
          const dbWorkflows: SavedWorkflow[] = response.data.map((wf: any) => ({
            id: wf.id,
            name: wf.name,
            nodes: [],  // Summary view doesn't include full nodes
            edges: [],  // Summary view doesn't include full edges
            nodeCount: parseInt(wf.node_count) || 0,  // Use count from database
            edgeCount: parseInt(wf.edge_count) || 0,  // Use count from database
            createdAt: new Date(wf.created_at).toLocaleDateString(),
            status: wf.status as "draft" | "active" | "paused"
          }));

          // Merge with default workflows (keep defaults if DB is empty)
          if (dbWorkflows.length > 0) {
            setSavedWorkflows(dbWorkflows);
            console.log(`Loaded ${dbWorkflows.length} workflows from database`);
          } else {
            console.log('No workflows in database, using defaults');
          }
        }
      } catch (error) {
        console.error('Error loading workflows:', error);
        // Keep default workflows if DB load fails
      }
    };

    loadWorkflowsFromDB();
  }, []); // Run once on mount

  // ── Canvas rect helper ──
  const canvasRect = () => canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };

  // ── Drop from palette ──
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("palette-item") || "null");
    if (!data) return;
    const rect = canvasRect();
    const x = Math.max(0, e.clientX - rect.left - NODE_W / 2);
    const y = Math.max(0, e.clientY - rect.top  - NODE_H / 2);
    const id = `dn-${Date.now()}`;
    setCanvasNodes(prev => [...prev, { id, ...data, x, y }]);
    setSelectedId(id);
    setSelectedEdgeId(null);
    setRightTab("properties");
  };

  // ── Node drag on canvas ──
  const startNodeDrag = (e: React.MouseEvent, nodeId: string) => {
    if (connectingFrom) return;
    e.stopPropagation();
    const node = canvasNodes.find(n => n.id === nodeId)!;
    const rect = canvasRect();
    setDraggingId(nodeId);
    setDragOffset({ x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y });
  };
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setMousePos({ x: mx, y: my });
    if (draggingId) {
      setCanvasNodes(prev => prev.map(n => n.id === draggingId ? { ...n, x: mx - dragOffset.x, y: my - dragOffset.y } : n));
    }
  };
  const stopDrag = () => setDraggingId(null);

  // ── Port click → connect ──
  const handleOutputPort = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectingFrom === nodeId) { setConnectingFrom(null); return; }
    setConnectingFrom(nodeId);
    setSelectedId(null);
    setSelectedEdgeId(null);
  };
  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectingFrom && connectingFrom !== nodeId) {
      const already = edges.find(ed => ed.fromId === connectingFrom && ed.toId === nodeId);
      if (!already) {
        setEdges(prev => [...prev, { id: `edge-${Date.now()}`, fromId: connectingFrom, toId: nodeId, relationship: activeRelType }]);
      }
      setConnectingFrom(null);
    } else {
      setSelectedId(nodeId);
      setSelectedEdgeId(null);
      setRightTab("properties");
      setConnectingFrom(null);
    }
  };

  // ── Delete ──
  const deleteSelected = () => {
    if (selectedId) { setCanvasNodes(p => p.filter(n => n.id !== selectedId)); setEdges(p => p.filter(e => e.fromId !== selectedId && e.toId !== selectedId)); setSelectedId(null); }
    if (selectedEdgeId) { setEdges(p => p.filter(e => e.id !== selectedEdgeId)); setSelectedEdgeId(null); }
  };

  // ── Save ──
  const saveWorkflow = async () => {
    if (!wfName.trim()) return;

    try {
      // Show loading state
      console.log('Saving workflow to database...');

      // Prepare workflow data for API
      const workflowData: workflowService.Workflow = {
        name: wfName,
        description: `Workflow created on ${new Date().toLocaleDateString()}`,
        status: 'draft',
        nodes: canvasNodes.map(node => ({
          id: node.id,
          type: node.type,
          label: node.label,
          category: node.category,
          color: node.color,
          x: node.x,
          y: node.y,
          config: {
            inputs: {
              ...(node.inputs || {}),
              // map legacy repoToAnalyse into the canonical input key
              ...(node.repoToAnalyse
                ? { repository_url_or_path: node.repoToAnalyse }
                : {}),
            }
          }
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          fromId: edge.fromId,
          toId: edge.toId,
          relationship: edge.relationship,
          config: {}
        })),
        createdBy: 'current-user', // You can replace this with actual user
        metadata: {
          canvasVersion: '1.0',
          savedAt: new Date().toISOString()
        }
      };

      // Call API to save workflow
      const response = await workflowService.createWorkflow(workflowData);

      if (response.success && response.data) {
        // Add to local state with database ID
        const savedWf: SavedWorkflow = {
          id: response.data.id || `sw-${Date.now()}`,
          name: response.data.name,
          nodes: canvasNodes,
          edges,
          createdAt: new Date(response.data.created_at || Date.now()).toLocaleDateString(),
          status: response.data.status || 'draft'
        };

        setSavedWorkflows(prev => [savedWf, ...prev]);
        setSaveModal(false);
        setWfName("");

        // Show success message
        alert(`✅ Workflow "${response.data.name}" saved successfully to database!\nWorkflow ID: ${response.data.id}`);
        console.log('Workflow saved:', response.data);
      } else {
        throw new Error(response.error || 'Failed to save workflow');
      }
    } catch (error: any) {
      console.error('Error saving workflow:', error);
      alert(`❌ Failed to save workflow: ${error.message}\n\nPlease check:\n- Backend server is running (http://localhost:3001)\n- Database connection is working`);
    }
  };

  // ── Poll GitHub workflow status ──
  const pollWorkflowStatus = async (workflowId: string, pollInterval: number = 10000) => {
    try {
      console.log('Starting to poll GitHub workflow status...');

      // Get latest workflow runs
      const runsResponse = await githubService.getWorkflowRuns('product-agent.yml', 5);

      if (!runsResponse.success || !runsResponse.data || runsResponse.data.length === 0) {
        console.log('No workflow runs found yet, will retry...');
        return;
      }

      // Get the most recent run
      const latestRun = runsResponse.data[0];
      console.log('Latest GitHub workflow run:', latestRun);

      // Get jobs for this run
      const jobsResponse = await githubService.getWorkflowJobs(latestRun.id);

      if (jobsResponse.success && jobsResponse.data) {
        console.log('Workflow jobs:', jobsResponse.data);

        // Update live run nodes based on job statuses
        // This would require access to the live runs state from parent component
        // For now, just log the status
        jobsResponse.data.forEach((job: any) => {
          console.log(`Job "${job.name}": ${job.status} (${job.conclusion || 'in progress'})`);
        });
      }

      // Continue polling if workflow is still running
      if (latestRun.status === 'in_progress' || latestRun.status === 'queued') {
        setTimeout(() => pollWorkflowStatus(workflowId, pollInterval), pollInterval);
      } else {
        console.log(`Workflow completed with status: ${latestRun.status}, conclusion: ${latestRun.conclusion}`);
      }
    } catch (error) {
      console.error('Error polling workflow status:', error);
    }
  };

  // ── Launch workflow ──
  const launchWorkflow = async (wf: SavedWorkflow) => {
    try {
      // Fetch complete workflow data
      const response = await workflowService.getWorkflowById(wf.id);
      if (!response.success || !response.data) throw new Error('Failed to load workflow details');
      const fullWorkflow = response.data;

      // Scale nodes to fit the Live Runs canvas
      const nodesWithPositions = fullWorkflow.nodes.map((n: any) => ({
        ...n,
        x: parseFloat(n.x) || 0,
        y: parseFloat(n.y) || 0,
      }));

      const minX = Math.min(...nodesWithPositions.map((n: any) => n.x));
      const maxX = Math.max(...nodesWithPositions.map((n: any) => n.x));
      const minY = Math.min(...nodesWithPositions.map((n: any) => n.y));
      const maxY = Math.max(...nodesWithPositions.map((n: any) => n.y));
      const workflowWidth = maxX - minX + 128;
      const workflowHeight = maxY - minY + 56;
      const canvasWidth = 1120;
      const canvasHeight = 320;
      const padding = 40;
      const scale = Math.min((canvasWidth - padding * 2) / workflowWidth, (canvasHeight - padding * 2) / workflowHeight, 1);
      const scaledWidth = workflowWidth * scale;
      const scaledHeight = workflowHeight * scale;
      const offsetX = (canvasWidth - scaledWidth) / 2 - minX * scale;
      const offsetY = (canvasHeight - scaledHeight) / 2 - minY * scale;

      const liveNodes = nodesWithPositions.map((n: any) => ({
        id: n.id,
        label: n.label,
        type: n.category?.toLowerCase() || 'strategic',
        nodeType: n.type,
        status: 'pending' as const,
        x: n.x * scale + offsetX,
        y: n.y * scale + offsetY,
        artifacts: 0,
      }));

      const liveEdges = fullWorkflow.edges.map((e: any) => ({
        from: e.fromId,
        to: e.toId,
        fromId: e.fromId,
        toId: e.toId,
        relationship: e.relationship || 'successor',
      }));

      const liveRun = {
        id: wf.id,
        name: wf.name,
        nodes: liveNodes,
        edges: liveEdges,
        status: 'running',
        startedAt: new Date().toISOString(),
      };

      // Push to Live Runs tab immediately
      setSavedWorkflows(prev => prev.map(w => w.id === wf.id ? { ...w, status: 'active' } : w));
      setLaunchedId(wf.id);
      onLaunch(liveRun);

      // Tell the backend to start sequential execution (triggers GitHub per node)
      const execResponse = await workflowService.executeWorkflow(wf.id);
      if (execResponse.success) {
        console.log('Execution started:', execResponse.data);
      } else {
        console.warn('Backend execution start failed:', execResponse.error);
      }
    } catch (error: any) {
      console.error('Error launching workflow:', error);
      alert(`Failed to launch workflow: ${error.message}`);
    }
  };

  // ── Delete saved workflow ──
  const deleteWorkflow = async (wf: SavedWorkflow) => {
    try {
      // Confirm deletion
      const confirmed = window.confirm(
        `Are you sure you want to delete workflow "${wf.name}"?\n\nThis action cannot be undone.`
      );

      if (!confirmed) {
        return;
      }

      console.log('Deleting workflow:', wf.id);
      const response = await workflowService.deleteWorkflow(wf.id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete workflow');
      }

      // Remove from local state
      setSavedWorkflows(prev => prev.filter(w => w.id !== wf.id));

      // Clear launched state if this workflow was launched
      if (launchedId === wf.id) {
        setLaunchedId(null);
      }

      console.log('Workflow deleted successfully');
      alert(`✅ Workflow "${wf.name}" deleted successfully!`);
    } catch (error: any) {
      console.error('Error deleting workflow:', error);
      alert(`❌ Failed to delete workflow: ${error.message}`);
    }
  };

  // ── Load saved workflow onto canvas ──
  const loadWorkflow = async (wf: SavedWorkflow) => {
    try {
      // Fetch complete workflow data from database (including nodes and edges)
      console.log('Loading workflow from database:', wf.id);
      const response = await workflowService.getWorkflowById(wf.id);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load workflow');
      }

      const fullWorkflow = response.data;
      console.log('Loaded workflow:', fullWorkflow);

      // Check if we have nodes and edges
      if (!fullWorkflow.nodes || fullWorkflow.nodes.length === 0) {
        alert('⚠️ This workflow has no nodes to display.');
        return;
      }

      // Convert positions to numbers and find bounding box
      const nodesWithPositions = fullWorkflow.nodes.map((n: any) => ({
        ...n,
        x: parseFloat(n.x) || 0,
        y: parseFloat(n.y) || 0
      }));

      // Calculate bounding box
      const minX = Math.min(...nodesWithPositions.map((n: any) => n.x));
      const maxX = Math.max(...nodesWithPositions.map((n: any) => n.x));
      const minY = Math.min(...nodesWithPositions.map((n: any) => n.y));
      const maxY = Math.max(...nodesWithPositions.map((n: any) => n.y));

      // Calculate current center of the workflow
      const workflowCenterX = (minX + maxX) / 2;
      const workflowCenterY = (minY + maxY) / 2;

      // Get canvas dimensions (or use defaults)
      const canvasWidth = canvasRef.current?.clientWidth || 1000;
      const canvasHeight = canvasRef.current?.clientHeight || 600;

      // Calculate target center (middle of visible canvas)
      const targetCenterX = canvasWidth / 2;
      const targetCenterY = canvasHeight / 2;

      // Calculate offset to center the workflow
      const offsetX = targetCenterX - workflowCenterX;
      const offsetY = targetCenterY - workflowCenterY;

      console.log(`Centering workflow: offset (${offsetX.toFixed(0)}, ${offsetY.toFixed(0)})`);

      // Map nodes with new IDs and centered positions
      const timestamp = Date.now();
      const idMap: Record<string, string> = {};

      const loadedNodes = nodesWithPositions.map((n: any, i: number) => {
        const newId = `loaded-${n.id}-${timestamp + i}`;
        idMap[n.id] = newId;
        return {
          id: newId,
          type: n.type,
          label: n.label,
          category: n.category,
          color: n.color,
          x: n.x + offsetX,
          y: n.y + offsetY
        };
      });

      // Map edges using the new node IDs
      const loadedEdges = (fullWorkflow.edges || []).map((e: any, i: number) => ({
        id: `le-${timestamp}-${i}`,
        fromId: idMap[e.fromId] || e.fromId,
        toId: idMap[e.toId] || e.toId,
        relationship: e.relationship
      }));

      setCanvasNodes(loadedNodes);
      setEdges(loadedEdges);
      setSelectedId(null);
      setSelectedEdgeId(null);

      console.log(`Loaded ${loadedNodes.length} nodes and ${loadedEdges.length} edges`);
    } catch (error: any) {
      console.error('Error loading workflow:', error);
      alert(`❌ Failed to load workflow: ${error.message}`);
    }
  };

  // ── Edge path helpers ──
  const portOut = (n: DesignerNode) => {
    const isCircular = n.type === "human-in-loop" || n.type === "ai-agent-reviewer";
    if (isCircular) {
      const circleSize = 70;
      return { x: n.x + circleSize, y: n.y + circleSize / 2 };
    }
    return { x: n.x + NODE_W, y: n.y + NODE_H / 2 };
  };
  const portIn = (n: DesignerNode) => {
    const isCircular = n.type === "human-in-loop" || n.type === "ai-agent-reviewer";
    if (isCircular) {
      const circleSize = 70;
      return { x: n.x, y: n.y + circleSize / 2 };
    }
    return { x: n.x, y: n.y + NODE_H / 2 };
  };
  const bezier  = (x1: number, y1: number, x2: number, y2: number) => {
    const cx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`;
  };

  const canvasEmpty = canvasNodes.length === 0;

  return (
    <div className="flex h-full min-h-0">
      {/* ── Left Palette ── */}
      <div className="w-48 flex-shrink-0 bg-card border-r border-border flex flex-col overflow-y-auto">
        <div className="px-3 py-2.5 border-b border-border">
          <div className="text-xs font-semibold text-foreground">Element Palette</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Drag onto canvas</div>
        </div>
        <div className="flex-1 px-2 py-2 space-y-3 overflow-y-auto">
          {paletteCategories.map(cat => (
            <div key={cat.category}>
              <div className="px-1 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: cat.color }}>{cat.category}</div>
              <div className="space-y-1">
                {cat.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={e => e.dataTransfer.setData("palette-item", JSON.stringify({ type: item.type, label: item.label, category: cat.category, color: item.color || cat.color }))}
                      className="flex items-center gap-2 px-2.5 py-2 rounded cursor-grab active:cursor-grabbing border border-transparent hover:border-border hover:bg-muted/60 transition-colors select-none group"
                    >
                      <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color || cat.color}18` }}>
                        <Icon size={11} style={{ color: item.color || cat.color }} />
                      </div>
                      <span className="text-xs text-foreground truncate">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Relationship type picker */}
          <div className="border-t border-border pt-3">
            <div className="px-1 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Relationship</div>
            <div className="space-y-1">
              {relationships.map(r => (
                <button
                  key={r.type}
                  onClick={() => setActiveRelType(r.type)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${activeRelType === r.type ? "border" : "border border-transparent hover:bg-muted/60"}`}
                  style={activeRelType === r.type ? { borderColor: r.color, backgroundColor: `${r.color}12`, color: r.color } : {}}
                >
                  <span className="w-4 flex-shrink-0 flex items-center">
                    <span className="flex-1 border-t" style={{ borderColor: r.color, borderStyle: r.dash ? "dashed" : "solid" }} />
                    <span className="w-0 h-0 ml-0.5" style={{ borderTop: "3px solid transparent", borderBottom: "3px solid transparent", borderLeft: `5px solid ${r.color}` }} />
                  </span>
                  <span className={activeRelType === r.type ? "" : "text-muted-foreground"}>{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-9 border-b border-border flex items-center px-3 gap-2 flex-shrink-0 bg-background/80">
          <span className="text-xs text-muted-foreground">
            {connectingFrom
              ? <span className="text-blue-400 font-medium flex items-center gap-1"><Circle size={8} className="fill-blue-400" /> Click a target node to connect · Esc to cancel</span>
              : `${canvasNodes.length} nodes · ${edges.length} edges`}
          </span>
          <div className="flex-1" />
          {(selectedId || selectedEdgeId) && (
            <button onClick={deleteSelected} className="px-2.5 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-1">
              <XCircle size={11} /> Delete
            </button>
          )}
          <button onClick={() => { setCanvasNodes([]); setEdges([]); setSelectedId(null); setSelectedEdgeId(null); }} className="px-2.5 py-1 rounded text-xs font-medium bg-muted text-muted-foreground border border-border hover:text-foreground transition-colors">Clear</button>
          <button
            onClick={() => { if (canvasNodes.length) { setSaveModal(true); } }}
            disabled={canvasNodes.length === 0}
            className="px-2.5 py-1 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={11} /> Save Workflow
          </button>
        </div>

        {/* Drop zone */}
        <div
          ref={canvasRef}
          className={`flex-1 relative overflow-hidden ${connectingFrom ? "cursor-crosshair" : draggingId ? "cursor-grabbing" : "cursor-default"}`}
          style={{ backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.15) 1px, transparent 1px)", backgroundSize: "24px 24px", backgroundColor: "#ffffff" }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onClick={() => { setSelectedId(null); setSelectedEdgeId(null); if (connectingFrom) setConnectingFrom(null); }}
          onKeyDown={e => e.key === "Escape" && setConnectingFrom(null)}
          tabIndex={0}
        >
          {canvasEmpty && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none">
              <div className="w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: "rgba(100,116,139,0.3)" }}>
                <Plus size={20} style={{ color: "#64748b" }} />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium" style={{ color: "#475569" }}>Drag elements from the palette</div>
                <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>Connect nodes by clicking the output port (▶) then a target node</div>
              </div>
            </div>
          )}

          {/* SVG edge layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              {relationships.map(r => (
                <marker key={r.type} id={`arrow-${r.type}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={r.color} opacity={0.8} />
                </marker>
              ))}
            </defs>

            {/* Drawn edges */}
            {edges.map(edge => {
              const fn = canvasNodes.find(n => n.id === edge.fromId);
              const tn = canvasNodes.find(n => n.id === edge.toId);
              if (!fn || !tn) return null;
              const from = portOut(fn); const to = portIn(tn);
              const rel = relationships.find(r => r.type === edge.relationship) ?? relationships[0];
              const isSelEdge = selectedEdgeId === edge.id;
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              return (
                <g key={edge.id} style={{ pointerEvents: "all" }} onClick={e => { e.stopPropagation(); setSelectedEdgeId(edge.id); setSelectedId(null); setRightTab("properties"); }}>
                  {/* Wider invisible hit area */}
                  <path d={bezier(from.x, from.y, to.x, to.y)} fill="none" stroke="transparent" strokeWidth={12} className="cursor-pointer" />
                  <path
                    d={bezier(from.x, from.y, to.x, to.y)} fill="none"
                    stroke={rel.color} strokeWidth={isSelEdge ? 2 : 1.5} opacity={isSelEdge ? 1 : 0.7}
                    strokeDasharray={rel.dash ? "6 3" : "0"}
                    markerEnd={`url(#arrow-${rel.type})`}
                  />
                  {/* Edge label */}
                  <rect x={midX - 26} y={midY - 9} width={52} height={16} rx={4} fill="#ffffff" stroke={rel.color} strokeWidth={1} opacity={1} />
                  <text x={midX} y={midY + 2} textAnchor="middle" fontSize={8} fill={rel.color} fontFamily="Inter, sans-serif" fontWeight={600}>{rel.label}</text>
                </g>
              );
            })}

            {/* Preview line while connecting */}
            {connectingFrom && (() => {
              const fn = canvasNodes.find(n => n.id === connectingFrom);
              if (!fn) return null;
              const from = portOut(fn);
              const rel = relationships.find(r => r.type === activeRelType) ?? relationships[0];
              return (
                <path
                  d={bezier(from.x, from.y, mousePos.x, mousePos.y)} fill="none"
                  stroke={rel.color} strokeWidth={1.5} opacity={0.5} strokeDasharray="6 3"
                />
              );
            })()}
          </svg>

          {/* Node divs */}
          {canvasNodes.map(node => {
            const isSelected = selectedId === node.id;
            const isConnFrom = connectingFrom === node.id;
            const isConnTarget = !!connectingFrom && connectingFrom !== node.id;
            const isHumanInLoop = node.type === "human-in-loop";
            const isAIAgentReviewer = node.type === "ai-agent-reviewer";

            // AI Agent Reviewer: Small circular node with AI icon
            if (isAIAgentReviewer) {
              const circleSize = 70;
              const centerY = circleSize / 2;
              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: node.x,
                    top: node.y,
                    width: circleSize,
                    height: circleSize,
                    zIndex: draggingId === node.id ? 10 : 2,
                  }}
                  onMouseDown={e => startNodeDrag(e, node.id)}
                  onClick={e => handleNodeClick(e, node.id)}
                  title={node.label} // Show label on hover
                >
                  {/* Circular background with icon and text inside */}
                  <div
                    className={`rounded-full border-2 flex flex-col items-center justify-center gap-1 transition-all select-none cursor-grab active:cursor-grabbing
                      ${isSelected ? "shadow-lg scale-110" : ""}
                      ${isConnFrom ? "ring-2 ring-blue-400" : ""}
                      ${isConnTarget ? "hover:ring-2 hover:ring-green-400 cursor-pointer" : ""}
                    `}
                    style={{
                      width: circleSize,
                      height: circleSize,
                      backgroundColor: isSelected ? `${node.color}30` : "#ffffff",
                      borderColor: isSelected ? node.color : "rgba(100,116,139,0.3)",
                      padding: "4px"
                    }}
                  >
                    {/* Modern AI Robot icon */}
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginTop: "-4px" }}>
                      {/* Robot head with antenna */}
                      <rect x="6" y="8" width="12" height="10" rx="2" fill={node.color} opacity="0.2" stroke={node.color} strokeWidth="1.5" />
                      <circle cx="12" cy="6" r="1.5" fill={node.color} />
                      <line x1="12" y1="6" x2="12" y2="8" stroke={node.color} strokeWidth="1.5" />
                      {/* Eyes with glow effect */}
                      <circle cx="9.5" cy="12" r="1.2" fill={node.color} />
                      <circle cx="14.5" cy="12" r="1.2" fill={node.color} />
                      {/* Circuit pattern mouth */}
                      <path d="M8 15 L10 15 L10 16 L12 16 L12 15 L14 15 L14 16 L16 16" stroke={node.color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                      {/* Side connections */}
                      <line x1="6" y1="11" x2="4" y2="11" stroke={node.color} strokeWidth="1.5" />
                      <line x1="18" y1="11" x2="20" y2="11" stroke={node.color} strokeWidth="1.5" />
                    </svg>

                    {/* AI Review text inside circle */}
                    <div className="text-[9px] font-medium" style={{ color: node.color, marginTop: "-2px" }}>
                      AI Review
                    </div>
                  </div>

                  {/* Output port - positioned on right edge of circle at center */}
                  <button
                    className="absolute w-4 h-4 rounded-full border-2 flex items-center justify-center hover:scale-125 transition-transform z-10"
                    style={{
                      left: `${circleSize}px`,
                      top: `${centerY}px`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: isConnFrom ? node.color : "#ffffff",
                      borderColor: node.color
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => handleOutputPort(e, node.id)}
                    title="Connect from here"
                  >
                    <span className="w-0 h-0" style={{ borderTop: "3px solid transparent", borderBottom: "3px solid transparent", borderLeft: `4px solid ${node.color}` }} />
                  </button>
                  {/* Input port - positioned on left edge of circle at center */}
                  <div
                    className="absolute w-3 h-3 rounded-full border-2"
                    style={{
                      left: '0px',
                      top: `${centerY}px`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: "#ffffff",
                      borderColor: node.color,
                      opacity: 0.8
                    }}
                  />
                </div>
              );
            }

            // Human-in-Loop: Small circular node
            if (isHumanInLoop) {
              const circleSize = 70;
              const centerY = circleSize / 2;
              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: node.x,
                    top: node.y,
                    width: circleSize,
                    height: circleSize,
                    zIndex: draggingId === node.id ? 10 : 2,
                  }}
                  onMouseDown={e => startNodeDrag(e, node.id)}
                  onClick={e => handleNodeClick(e, node.id)}
                  title={node.label} // Show label on hover
                >
                  {/* Circular background with icon and text inside */}
                  <div
                    className={`rounded-full border-2 flex flex-col items-center justify-center gap-1 transition-all select-none cursor-grab active:cursor-grabbing
                      ${isSelected ? "shadow-lg scale-110" : ""}
                      ${isConnFrom ? "ring-2 ring-blue-400" : ""}
                      ${isConnTarget ? "hover:ring-2 hover:ring-green-400 cursor-pointer" : ""}
                    `}
                    style={{
                      width: circleSize,
                      height: circleSize,
                      backgroundColor: isSelected ? `${node.color}30` : "#ffffff",
                      borderColor: isSelected ? node.color : "rgba(100,116,139,0.3)",
                      padding: "4px"
                    }}
                  >
                    {/* Human icon */}
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginTop: "-4px" }}>
                      <circle cx="12" cy="7" r="3.5" fill={node.color} />
                      <path d="M12 12 C8.5 12 6 14 6 17 L6 20 L18 20 L18 17 C18 14 15.5 12 12 12 Z" fill={node.color} />
                    </svg>

                    {/* Review text inside circle */}
                    <div className="text-[9px] font-medium" style={{ color: node.color, marginTop: "-2px" }}>
                      Review
                    </div>
                  </div>

                  {/* Output port - positioned on right edge of circle at center */}
                  <button
                    className="absolute w-4 h-4 rounded-full border-2 flex items-center justify-center hover:scale-125 transition-transform z-10"
                    style={{
                      left: `${circleSize}px`,
                      top: `${centerY}px`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: isConnFrom ? node.color : "#ffffff",
                      borderColor: node.color
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => handleOutputPort(e, node.id)}
                    title="Connect from here"
                  >
                    <span className="w-0 h-0" style={{ borderTop: "3px solid transparent", borderBottom: "3px solid transparent", borderLeft: `4px solid ${node.color}` }} />
                  </button>
                  {/* Input port - positioned on left edge of circle at center */}
                  <div
                    className="absolute w-3 h-3 rounded-full border-2"
                    style={{
                      left: '0px',
                      top: `${centerY}px`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: "#ffffff",
                      borderColor: node.color,
                      opacity: 0.8
                    }}
                  />
                </div>
              );
            }

            // Regular rectangular node for all other types
            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: node.x,
                  top: node.y,
                  width: NODE_W,
                  height: NODE_H,
                  zIndex: draggingId === node.id ? 10 : 2,
                  backgroundColor: isSelected ? `${node.color}18` : "#ffffff",
                  borderColor: isSelected ? node.color : "rgba(100,116,139,0.3)",
                }}
                className={`rounded-lg border flex flex-col justify-center px-3 transition-shadow select-none
                  ${isSelected ? "shadow-lg" : ""}
                  ${isConnFrom ? "ring-2 ring-blue-400" : ""}
                  ${isConnTarget ? "hover:ring-2 hover:ring-green-400 cursor-pointer" : ""}
                `}
                onMouseDown={e => startNodeDrag(e, node.id)}
                onClick={e => handleNodeClick(e, node.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: node.color }} />
                  <span className="text-xs font-semibold truncate flex-1" style={{ color: "#1e293b" }}>{node.label}</span>
                </div>
                <div className="text-[10px] mt-0.5 ml-4" style={{ color: node.color }}>{node.category}</div>

                {/* Output port */}
                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center hover:scale-125 transition-transform z-10"
                  style={{ backgroundColor: isConnFrom ? node.color : "#ffffff", borderColor: node.color }}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => handleOutputPort(e, node.id)}
                  title="Drag to connect"
                >
                  <span className="w-0 h-0" style={{ borderTop: "3px solid transparent", borderBottom: "3px solid transparent", borderLeft: `4px solid ${node.color}` }} />
                </button>
                {/* Input port */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2" style={{ backgroundColor: "#ffffff", borderColor: node.color, opacity: 0.8 }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-64 flex-shrink-0 bg-card border-l border-border flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {[{ id: "properties" as const, label: "Properties" }, { id: "saved" as const, label: "Saved Workflows" }].map(t => (
            <button key={t.id} onClick={() => setRightTab(t.id)} className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${rightTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {rightTab === "properties" ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {selectedNode ? (
              <>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Node</div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: selectedNode.color }} />
                  <span className="text-sm font-semibold text-foreground">{selectedNode.label}</span>
                </div>
                <div className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${selectedNode.color}15`, color: selectedNode.color }}>{selectedNode.category}</div>

                {/* Configuration section for code-analysis and design-analysis nodes */}
                {(selectedNode.type === "code-analysis" || selectedNode.type === "design-analysis") && (
                  <>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium pt-2">Configuration</div>

                    {/* Agent property */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Agent</label>
                      <div className="bg-muted border border-border rounded-md px-2 py-1.5 text-xs text-foreground">
                        {selectedNode.type === "code-analysis" ? "Code Analyst" : "Design Analyst"}
                      </div>
                    </div>

                    {/* Repo to Analyse dropdown */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Repo to Analyse</label>
                      <select
                        value={selectedNode.repoToAnalyse || ""}
                        onChange={(e) => {
                          setCanvasNodes(prev => prev.map(n =>
                            n.id === selectedNode.id ? { ...n, repoToAnalyse: e.target.value } : n
                          ));
                        }}
                        className="w-full bg-muted border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                      >
                        <option value="">Select a repository</option>
                        {connectedRepos.map(repo => (
                          <option key={repo.id} value={repo.fullName || `${repo.owner}/${repo.name}`}>
                            {repo.fullName || `${repo.owner}/${repo.name}`}
                          </option>
                        ))}
                      </select>
                      {connectedRepos.length === 0 && (
                        <p className="text-[10px] text-amber-400 italic">No repositories connected. Connect repositories in GitHub Operations.</p>
                      )}
                    </div>

                    {/* Output */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Output</label>
                      <div className="bg-muted border border-border rounded-md px-2 py-1.5 text-xs text-foreground">
                        Code_Analyis_doc.md
                      </div>
                    </div>
                  </>
                )}

                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium pt-1">Outgoing edges</div>
                {edges.filter(e => e.fromId === selectedNode.id).length === 0
                  ? <p className="text-xs text-muted-foreground italic">No outgoing connections</p>
                  : edges.filter(e => e.fromId === selectedNode.id).map(e => {
                    const tn = canvasNodes.find(n => n.id === e.toId);
                    const rel = relationships.find(r => r.type === e.relationship);
                    return (
                      <div key={e.id} className="flex items-center gap-2 text-xs">
                        <span className="w-4 border-t" style={{ borderColor: rel?.color, borderStyle: rel?.dash ? "dashed" : "solid" }} />
                        <span className="text-muted-foreground">{rel?.label}</span>
                        <ArrowRight size={9} className="text-muted-foreground" />
                        <span className="text-foreground truncate">{tn?.label ?? "?"}</span>
                      </div>
                    );
                  })
                }
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium pt-1">Incoming edges</div>
                {edges.filter(e => e.toId === selectedNode.id).length === 0
                  ? <p className="text-xs text-muted-foreground italic">No incoming connections</p>
                  : edges.filter(e => e.toId === selectedNode.id).map(e => {
                    const fn = canvasNodes.find(n => n.id === e.fromId);
                    const rel = relationships.find(r => r.type === e.relationship);
                    return (
                      <div key={e.id} className="flex items-center gap-2 text-xs">
                        <span className="text-foreground truncate">{fn?.label ?? "?"}</span>
                        <ArrowRight size={9} className="text-muted-foreground" />
                        <span className="text-muted-foreground">{rel?.label}</span>
                      </div>
                    );
                  })
                }
                <button onClick={deleteSelected} className="w-full mt-2 py-1.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1">
                  <XCircle size={11} /> Remove node
                </button>
              </>
            ) : selectedEdge ? (
              <>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Edge</div>
                {(() => {
                  const fn = canvasNodes.find(n => n.id === selectedEdge.fromId);
                  const tn = canvasNodes.find(n => n.id === selectedEdge.toId);
                  const rel = relationships.find(r => r.type === selectedEdge.relationship)!;
                  return (
                    <div className="space-y-3">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2"><span className="text-muted-foreground">From:</span><span className="text-foreground font-medium">{fn?.label}</span></div>
                        <div className="flex items-center gap-2"><span className="text-muted-foreground">To:</span><span className="text-foreground font-medium">{tn?.label}</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">Relationship</div>
                        <div className="grid grid-cols-2 gap-1">
                          {relationships.map(r => (
                            <button
                              key={r.type}
                              onClick={() => setEdges(prev => prev.map(e => e.id === selectedEdge.id ? { ...e, relationship: r.type } : e))}
                              className="px-2 py-1 rounded text-[10px] font-medium border transition-colors text-left"
                              style={selectedEdge.relationship === r.type ? { borderColor: r.color, backgroundColor: `${r.color}18`, color: r.color } : { borderColor: "rgba(148,163,184,0.1)", color: "#6b7598" }}
                            >{r.label}</button>
                          ))}
                        </div>
                      </div>
                      <button onClick={deleteSelected} className="w-full py-1.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1">
                        <XCircle size={11} /> Remove edge
                      </button>
                    </div>
                  );
                })()}
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">Select a node or edge to inspect its properties.</p>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-3 border-b border-border">
              <div className="text-xs text-muted-foreground">Saved workflows — click Launch to run, Load to edit.</div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {savedWorkflows.map(wf => (
                <div key={wf.id} className={`p-3 hover:bg-muted/30 transition-colors ${launchedId === wf.id ? "bg-green-500/5 border-l-2 border-green-500" : ""}`}>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="text-xs font-semibold text-foreground leading-tight">{wf.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0 ${wf.status === "active" ? "bg-green-400/10 text-green-400 border-green-400/20" : wf.status === "paused" ? "bg-amber-400/10 text-amber-400 border-amber-400/20" : "bg-muted text-muted-foreground border-border"}`}>
                      {wf.status === "active" ? "running" : wf.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                    <span>{wf.nodeCount ?? wf.nodes.length} nodes</span>
                    <span>{wf.edgeCount ?? wf.edges.length} edges</span>
                    <span>{wf.createdAt}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={async () => await launchWorkflow(wf)}
                      className="flex-1 py-1 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                    >
                      <Play size={9} /> Launch
                    </button>
                    <button
                      onClick={async () => { await loadWorkflow(wf); setRightTab("properties"); }}
                      className="flex-1 py-1 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border hover:text-foreground transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => setPreviewWorkflow(wf)}
                      className="px-2 py-1 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border hover:text-foreground transition-colors"
                      title="Preview"
                    >
                      <Eye size={10} />
                    </button>
                    <button
                      onClick={async (e) => { e.stopPropagation(); await deleteWorkflow(wf); }}
                      className="px-2 py-1 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      title="Delete workflow"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                  {launchedId === wf.id && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Launched successfully
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Save Modal ── */}
      {saveModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSaveModal(false)}>
          <div className="bg-card border border-border rounded-xl p-5 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground mb-1">Save Workflow</h3>
            <p className="text-xs text-muted-foreground mb-4">{canvasNodes.length} nodes · {edges.length} edges</p>
            <input
              autoFocus
              value={wfName}
              onChange={e => setWfName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveWorkflow()}
              placeholder="e.g. Sprint 14 Auth Pipeline"
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary mb-3"
            />
            <div className="flex gap-2">
              <button onClick={() => setSaveModal(false)} className="flex-1 py-2 rounded text-xs font-medium bg-muted text-muted-foreground border border-border hover:text-foreground transition-colors">Cancel</button>
              <button onClick={saveWorkflow} disabled={!wfName.trim()} className="flex-1 py-2 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Workflow Preview Modal ── */}
      {previewWorkflow && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setPreviewWorkflow(null)}>
          <div className="bg-card border border-border rounded-xl w-[640px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{previewWorkflow.name}</h3>
                <p className="text-xs text-muted-foreground">{previewWorkflow.nodeCount ?? previewWorkflow.nodes.length} nodes · {previewWorkflow.edgeCount ?? previewWorkflow.edges.length} edges · {previewWorkflow.createdAt}</p>
              </div>
              <button onClick={() => setPreviewWorkflow(null)} className="text-muted-foreground hover:text-foreground"><XCircle size={16} /></button>
            </div>
            <div className="relative overflow-hidden" style={{ height: 260, backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.15) 1px, transparent 1px)", backgroundSize: "20px 20px", backgroundColor: "#ffffff" }}>
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {previewWorkflow.edges.map(e => {
                  const fn = previewWorkflow.nodes.find(n => n.id === e.fromId);
                  const tn = previewWorkflow.nodes.find(n => n.id === e.toId);
                  if (!fn || !tn) return null;
                  const rel = relationships.find(r => r.type === e.relationship) ?? relationships[0];
                  const x1 = fn.x + NODE_W; const y1 = fn.y + NODE_H / 2;
                  const x2 = tn.x; const y2 = tn.y + NODE_H / 2;
                  const cx = (x1 + x2) / 2;
                  return <path key={e.id} d={`M ${x1} ${y1} C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`} fill="none" stroke={rel.color} strokeWidth={1.5} opacity={0.6} strokeDasharray={rel.dash ? "5 3" : "0"} />;
                })}
              </svg>
              {previewWorkflow.nodes.map(node => (
                <div key={node.id} style={{ position: "absolute", left: node.x, top: node.y, width: NODE_W, height: NODE_H, backgroundColor: "#ffffff", borderColor: "rgba(100,116,139,0.3)" }} className="rounded-lg border flex flex-col justify-center px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: node.color }} />
                    <span className="text-xs font-semibold truncate" style={{ color: "#1e293b" }}>{node.label}</span>
                  </div>
                  <div className="text-[10px] ml-4" style={{ color: node.color }}>{node.category}</div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border flex gap-2 justify-end">
              <button onClick={async () => { await loadWorkflow(previewWorkflow); setPreviewWorkflow(null); setRightTab("properties"); }} className="px-3 py-1.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border hover:text-foreground transition-colors">Load to Editor</button>
              <button onClick={async () => { await launchWorkflow(previewWorkflow); setPreviewWorkflow(null); }} className="px-3 py-1.5 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"><Play size={11} /> Launch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
