import { useState, useCallback, useRef, useEffect } from "react";
import {
  Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, Clock, XCircle,
  TrendingUp, Users, FileText, Eye, Plus, ExternalLink, Circle, Terminal,
  Layers, GitMerge, MonitorDot, Gauge, SlidersHorizontal, ChevronUp, Minus,
  TriangleAlert, Info, Braces, PackageCheck, Server, TrendingDown, Radio,
  Database, MapPin, Trash2, RefreshCw
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
export function SprintCanvas({
  liveRuns,
  onApprove,
  onReject,
}: {
  liveRuns: Array<{ id: string; name: string; nodes: any[]; edges: any[]; status: string; startedAt: string; githubRunId?: number }>;
  onApprove?: (runId: string, nodeId: string) => Promise<void>;
  onReject?: (runId: string, nodeId: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [runState, setRunState] = useState<"running" | "paused">("running");
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempNodePositions, setTempNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const canvasRef = useRef<SVGSVGElement>(null);

  // Use live runs if available, otherwise show example
  const activeRun = liveRuns.length > 0 ? liveRuns[0] : null;
  const baseNodes = activeRun ? activeRun.nodes : workflowNodes;
  const displayEdges = activeRun ? activeRun.edges : workflowEdges;
  const workflowName = activeRun ? activeRun.name : "User Auth Module v2.4.1 — Sprint 14";

  // Apply temporary positions to nodes
  const displayNodes = baseNodes.map((n: any) =>
    tempNodePositions[n.id] ? { ...n, ...tempNodePositions[n.id] } : n
  );

  // Debug logging
  if (activeRun) {
    console.log('Live Runs - Active run:', activeRun.name);
    console.log('Live Runs - Nodes:', displayNodes.length, displayNodes.map((n: any) => n.id));
    console.log('Live Runs - Edges:', displayEdges.length, displayEdges);

    // Check for edge ID mismatches
    displayEdges.forEach((e: any) => {
      const fromNode = displayNodes.find((n: any) => n.id === (e.from || e.fromId));
      const toNode = displayNodes.find((n: any) => n.id === (e.to || e.toId));
      if (!fromNode || !toNode) {
        console.warn('Edge ID mismatch:', e, 'fromNode:', !!fromNode, 'toNode:', !!toNode);
      }
    });
  }

  const [approvingNodeId, setApprovingNodeId] = useState<string | null>(null);

  const handleApprove = async (nodeId: string) => {
    if (!activeRun || !onApprove) return;
    setApprovingNodeId(nodeId);
    try { await onApprove(activeRun.id, nodeId); } finally { setApprovingNodeId(null); }
  };

  const handleReject = async (nodeId: string) => {
    if (!activeRun || !onReject) return;
    setApprovingNodeId(nodeId);
    try { await onReject(activeRun.id, nodeId); } finally { setApprovingNodeId(null); }
  };

  const selectedNode = displayNodes.find((n: any) => n.id === selected);
  function nodeCenter(id: string) {
    const n = displayNodes.find((n: any) => n.id === id);
    if (!n && activeRun) {
      console.warn('nodeCenter: Node not found for ID:', id);
    }
    if (!n) return { x: 0, y: 0 };

    // Check if node is circular (Human-in-Loop or AI Agent Reviewer)
    // These nodes are 70px diameter circles (same as WorkflowDesigner)
    const isCircular = n.type === "human-in-loop" || n.type === "ai-agent-reviewer";
    if (isCircular) {
      // For circular nodes: 70px diameter, center at radius (35px)
      const circleSize = 70;
      return { x: n.x + circleSize / 2, y: n.y + circleSize / 2 };
    }

    // For rectangular nodes: 128x56, center at half width/height
    return { x: n.x + 128 / 2, y: n.y + 56 / 2 };
  }

  // Drag handlers for nodes
  const startNodeDrag = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = displayNodes.find((n: any) => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const svgX = e.clientX - rect.left;
    const svgY = e.clientY - rect.top;

    setDraggingNodeId(nodeId);
    setDragOffset({ x: svgX - node.x, y: svgY - node.y });
  };

  const handleNodeDrag = (e: React.MouseEvent) => {
    if (!draggingNodeId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const svgX = e.clientX - rect.left;
    const svgY = e.clientY - rect.top;

    const newX = Math.max(0, svgX - dragOffset.x);
    const newY = Math.max(0, svgY - dragOffset.y);

    setTempNodePositions(prev => ({
      ...prev,
      [draggingNodeId]: { x: newX, y: newY }
    }));
  };

  const stopNodeDrag = () => {
    setDraggingNodeId(null);
  };

  // Helper functions for edge rendering - SAME as WorkflowDesigner
  const portOut = (n: any) => {
    const isCircular = n.type === "human-in-loop" || n.type === "ai-agent-reviewer";
    if (isCircular) {
      const circleSize = 70;
      return { x: n.x + circleSize, y: n.y + circleSize / 2 };
    }
    return { x: n.x + NODE_W, y: n.y + NODE_H / 2 };
  };
  const portIn = (n: any) => {
    const isCircular = n.type === "human-in-loop" || n.type === "ai-agent-reviewer";
    if (isCircular) {
      const circleSize = 70;
      return { x: n.x, y: n.y + circleSize / 2 };
    }
    return { x: n.x, y: n.y + NODE_H / 2 };
  };
  const bezier = (x1: number, y1: number, x2: number, y2: number) => {
    const cx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`;
  };

  return (
    <div className="p-4 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">{workflowName}</p>
          {!activeRun && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Example Data
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={runState === "running" ? "running" : "waiting"} />
          <button onClick={() => setRunState(s => s === "running" ? "paused" : "running")} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${runState === "running" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
            {runState === "running" ? <><Pause size={11} />Pause</> : <><Play size={11} />Resume</>}
          </button>
          <button className="px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 bg-muted text-muted-foreground border border-border hover:text-foreground transition-colors"><RotateCcw size={11} />Retry</button>
          <button className="px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 bg-muted text-muted-foreground border border-border hover:text-foreground transition-colors"><Eye size={11} />Logs</button>
        </div>
      </div>
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Canvas container - EXACTLY like WorkflowDesigner */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden border border-border rounded-lg"
          style={{ backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.15) 1px, transparent 1px)", backgroundSize: "24px 24px", backgroundColor: "#ffffff" }}
          onMouseMove={handleNodeDrag}
          onMouseUp={stopNodeDrag}
          onMouseLeave={stopNodeDrag}
        >
          {/* SVG edge layer - SAME as WorkflowDesigner */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              {relationships.map(r => (
                <marker key={r.type} id={`sprint-arrow-${r.type}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={r.color} opacity={0.8} />
                </marker>
              ))}
            </defs>

            {/* Drawn edges */}
            {displayEdges.map((e: any, i: number) => {
              const fromId = e.from || e.fromId;
              const toId = e.to || e.toId;
              const fn = displayNodes.find((n: any) => n.id === fromId);
              const tn = displayNodes.find((n: any) => n.id === toId);
              if (!fn || !tn) return null;
              const from = portOut(fn);
              const to = portIn(tn);
              const rel = relationships.find(r => r.type === (e.relationship || 'successor')) ?? relationships[0];
              const done = fn.status === "completed";
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;

              return (
                <g key={i}>
                  <path
                    d={bezier(from.x, from.y, to.x, to.y)}
                    fill="none"
                    stroke={done ? "#22c55e" : rel.color}
                    strokeWidth={done ? 2 : 1.5}
                    strokeDasharray={done ? "0" : (rel.dash ? "6 3" : "0")}
                    opacity={done ? 0.8 : 0.7}
                    markerEnd={`url(#sprint-arrow-${rel.type})`}
                  />
                  <rect x={midX - 26} y={midY - 9} width={52} height={16} rx={4} fill="#ffffff" stroke={rel.color} strokeWidth={1} opacity={1} />
                  <text x={midX} y={midY + 2} textAnchor="middle" fontSize={8} fill={rel.color} fontFamily="Inter, sans-serif" fontWeight={600}>{rel.label}</text>
                  {done && <circle cx={to.x} cy={to.y} r={3} fill="#22c55e" opacity={0.6} />}
                </g>
              );
            })}
          </svg>

          {/* Node divs - EXACTLY like WorkflowDesigner */}
          {displayNodes.map((node: any) => {
            const isSelected = selected === node.id;
            const col = node.color || nodeColorByType[node.category] || nodeColorByType[node.type] || "#3b82f6";
            const isDragging = draggingNodeId === node.id;
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
                    zIndex: isDragging ? 10 : 2,
                  }}
                  onMouseDown={e => startNodeDrag(e, node.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(isSelected ? null : node.id);
                  }}
                  title={node.label}
                >
                  {/* Circular background with icon and text inside */}
                  <div
                    className={`rounded-full border-2 flex flex-col items-center justify-center gap-1 transition-all select-none cursor-grab active:cursor-grabbing
                      ${isSelected ? "shadow-lg scale-110" : ""}
                    `}
                    style={{
                      width: circleSize,
                      height: circleSize,
                      backgroundColor: isSelected ? `${col}30` : "#ffffff",
                      borderColor: isSelected ? col : "rgba(100,116,139,0.3)",
                      padding: "4px"
                    }}
                  >
                    {/* Modern AI Robot icon */}
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginTop: "-4px" }}>
                      {/* Robot head with antenna */}
                      <rect x="6" y="8" width="12" height="10" rx="2" fill={col} opacity="0.2" stroke={col} strokeWidth="1.5" />
                      <circle cx="12" cy="6" r="1.5" fill={col} />
                      <line x1="12" y1="6" x2="12" y2="8" stroke={col} strokeWidth="1.5" />
                      {/* Eyes with glow effect */}
                      <circle cx="9.5" cy="12" r="1.2" fill={col} />
                      <circle cx="14.5" cy="12" r="1.2" fill={col} />
                      {/* Circuit pattern mouth */}
                      <path d="M8 15 L10 15 L10 16 L12 16 L12 15 L14 15 L14 16 L16 16" stroke={col} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                      {/* Side connections */}
                      <line x1="6" y1="11" x2="4" y2="11" stroke={col} strokeWidth="1.5" />
                      <line x1="18" y1="11" x2="20" y2="11" stroke={col} strokeWidth="1.5" />
                    </svg>

                    {/* AI Review text inside circle */}
                    <div className="text-[9px] font-medium" style={{ color: col, marginTop: "-2px" }}>
                      AI Review
                    </div>
                  </div>

                  {/* Output port - positioned on right edge of circle at center */}
                  <div
                    className="absolute w-4 h-4 rounded-full border-2 flex items-center justify-center"
                    style={{
                      left: `${circleSize}px`,
                      top: `${centerY}px`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: "#ffffff",
                      borderColor: col,
                      pointerEvents: 'none'
                    }}
                  >
                    <span className="w-0 h-0" style={{ borderTop: "3px solid transparent", borderBottom: "3px solid transparent", borderLeft: `4px solid ${col}` }} />
                  </div>
                  {/* Input port - positioned on left edge of circle at center */}
                  <div
                    className="absolute w-3 h-3 rounded-full border-2"
                    style={{
                      left: '0px',
                      top: `${centerY}px`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: "#ffffff",
                      borderColor: col,
                      opacity: 0.8
                    }}
                  />
                </div>
              );
            }

            // Human-in-Loop: Small circular node with Approve/Reject when awaiting
            if (isHumanInLoop) {
              const circleSize = 70;
              const centerY = circleSize / 2;
              const isAwaiting = node.status === 'blocked';
              const isProcessing = approvingNodeId === node.id;
              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: node.x,
                    top: node.y,
                    width: isAwaiting ? 160 : circleSize,
                    zIndex: isDragging ? 10 : 2,
                  }}
                  onMouseDown={e => startNodeDrag(e, node.id)}
                  onClick={(e) => { e.stopPropagation(); setSelected(isSelected ? null : node.id); }}
                  title={node.label}
                >
                  <div
                    className={`rounded-full border-2 flex flex-col items-center justify-center gap-1 transition-all select-none cursor-grab active:cursor-grabbing ${isSelected ? "shadow-lg scale-110" : ""}`}
                    style={{
                      width: circleSize,
                      height: circleSize,
                      backgroundColor: isAwaiting ? "#fef3c720" : (isSelected ? `${col}30` : "#ffffff"),
                      borderColor: isAwaiting ? "#f59e0b" : (isSelected ? col : "rgba(100,116,139,0.3)"),
                      padding: "4px"
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginTop: "-4px" }}>
                      <circle cx="12" cy="7" r="3.5" fill={isAwaiting ? "#f59e0b" : col} />
                      <path d="M12 12 C8.5 12 6 14 6 17 L6 20 L18 20 L18 17 C18 14 15.5 12 12 12 Z" fill={isAwaiting ? "#f59e0b" : col} />
                    </svg>
                    <div className="text-[9px] font-medium" style={{ color: isAwaiting ? "#f59e0b" : col, marginTop: "-2px" }}>
                      {isAwaiting ? "Waiting" : "Review"}
                    </div>
                  </div>

                  {/* Approve/Reject buttons shown below circle when awaiting approval */}
                  {isAwaiting && (
                    <div className="flex gap-1 mt-1" style={{ width: 160 }}>
                      <button
                        disabled={isProcessing}
                        onClick={(e) => { e.stopPropagation(); handleApprove(node.id); }}
                        className="flex-1 py-1 rounded text-[10px] font-semibold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? "…" : "Approve"}
                      </button>
                      <button
                        disabled={isProcessing}
                        onClick={(e) => { e.stopPropagation(); handleReject(node.id); }}
                        className="flex-1 py-1 rounded text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  <div
                    className="absolute w-4 h-4 rounded-full border-2 flex items-center justify-center"
                    style={{ left: `${circleSize}px`, top: `${centerY}px`, transform: 'translate(-50%, -50%)', backgroundColor: "#ffffff", borderColor: col, pointerEvents: 'none' }}
                  >
                    <span className="w-0 h-0" style={{ borderTop: "3px solid transparent", borderBottom: "3px solid transparent", borderLeft: `4px solid ${col}` }} />
                  </div>
                  <div
                    className="absolute w-3 h-3 rounded-full border-2"
                    style={{ left: '0px', top: `${centerY}px`, transform: 'translate(-50%, -50%)', backgroundColor: "#ffffff", borderColor: col, opacity: 0.8 }}
                  />
                </div>
              );
            }

            // Regular rectangular node
            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: node.x,
                  top: node.y,
                  width: NODE_W,
                  height: NODE_H,
                  zIndex: isDragging ? 10 : 2,
                  backgroundColor: isSelected ? `${col}18` : "#ffffff",
                  borderColor: isSelected ? col : "rgba(100,116,139,0.3)",
                }}
                className={`rounded-lg border flex flex-col justify-center px-3 transition-shadow select-none cursor-grab active:cursor-grabbing
                  ${isSelected ? "shadow-lg" : ""}
                `}
                onMouseDown={e => startNodeDrag(e, node.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(isSelected ? null : node.id);
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col }} />
                  <span className="text-xs font-semibold truncate flex-1" style={{ color: "#1e293b" }}>{node.label}</span>
                </div>
                <div className="text-[10px] mt-0.5 ml-4" style={{ color: col }}>{node.category || (node.type.charAt(0).toUpperCase()+node.type.slice(1))}</div>

                {/* Status indicator - top right corner */}
                {node.status === "running"   && <div className="absolute right-2 top-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}
                {node.status === "completed" && <div className="absolute right-2 top-2 w-2 h-2 rounded-full bg-green-500" />}
                {node.status === "failed"    && <div className="absolute right-2 top-2 w-2 h-2 rounded-full bg-red-500" />}
                {node.status === "blocked"   && <div className="absolute right-2 top-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                {(node.status === "waiting" || node.status === "pending") && <div className="absolute right-2 top-2 w-2 h-2 rounded-full bg-slate-400 opacity-50" />}
              </div>
            );
          })}
        </div>
        <div className="w-56 bg-card border border-border rounded-lg p-3 flex flex-col gap-3 text-xs">
          {selectedNode ? (
            <>
              <div className="font-semibold text-foreground">{selectedNode.label}</div>
              <StatusBadge status={selectedNode.status} />
              {[["Artifacts", String(selectedNode.artifacts)], ["Model", "claude-opus-4-7"], ["Cost", selectedNode.status === "completed" ? "$0.84" : "—"], ["Duration", selectedNode.status === "completed" ? "4m 12s" : selectedNode.status === "running" ? "Running…" : "—"]].map(([l, v]) => (
                <div key={l} className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className="font-mono text-foreground">{v}</span></div>
              ))}
            </>
          ) : (
            <>
              <div className="text-muted-foreground uppercase tracking-wider font-medium">Summary</div>
              {(["completed","running","waiting","blocked"] as Status[]).map(s => { const c = displayNodes.filter((n: any) => n.status === s).length; return c > 0 ? <div key={s} className="flex justify-between items-center"><StatusBadge status={s} /><span className="font-semibold text-foreground">{c}</span></div> : null; })}
              <div className="border-t border-border pt-2 space-y-1.5 mt-1">
                {[["Cost","$4.22"],["Elapsed","1h 12m"],["Artifacts","20"]].map(([l,v]) => <div key={l} className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className="font-mono text-foreground">{v}</span></div>)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
