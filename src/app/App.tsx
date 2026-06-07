import { useState, useCallback, useRef, useEffect } from "react";
import { ProductDiscoveryView } from "./components/ProductDiscoveryView";
import { PlanningView } from "./components/PlanningView";
import { ArchitectureView } from "./components/ArchitectureView";
import { DevelopmentView } from "./components/DevelopmentView";
import { QAView } from "./components/QAView";
import { DeploymentView } from "./components/DeploymentView";
import { ObservabilityView } from "./components/ObservabilityView";
import {
  LayoutDashboard, Lightbulb, BookOpen, GitBranch, Code2, FlaskConical,
  Rocket, Activity, Bot, CheckSquare, Network, Github, FolderGit2,
  GitPullRequest, Zap, Shield, ScrollText, Lock, Settings, Bell, Search,
  ChevronRight, ChevronDown, Play, Pause, RotateCcw, AlertTriangle,
  CheckCircle2, Clock, XCircle, TrendingUp, Users, FileText, Eye,
  ThumbsUp, ThumbsDown, RefreshCw, Filter, MoreHorizontal, Plus,
  ExternalLink, Cpu, AlertCircle, Circle, Terminal, Layers, GitMerge,
  MonitorDot, Gauge, ListChecks, GitCommit, ArrowRight, Workflow,
  SlidersHorizontal, ChevronUp, Minus, TriangleAlert, Info, Braces,
  PackageCheck, Server, TrendingDown, Radio, Database, MapPin, Trash2,
  Edit3, MessageSquare
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import * as workflowService from "../services/workflow.service";
import * as githubService from "../services/github.service";
import * as repositoryService from "../services/repository.service";

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewId =
  | "dashboard" | "discovery" | "planning" | "architecture" | "development"
  | "qa" | "deployment" | "observability" | "agents" | "workflows"
  | "approvals" | "context-graph" | "artifacts" | "repositories" | "issues"
  | "pull-requests" | "pipelines" | "policies" | "audit" | "security" | "settings";

type Status = "running" | "completed" | "failed" | "waiting" | "blocked" | "retrying" | "pending";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const metricsData = [
  { t: "00:00", latency: 142, errors: 0.8, throughput: 1240 },
  { t: "04:00", latency: 138, errors: 0.5, throughput: 1380 },
  { t: "08:00", latency: 195, errors: 1.2, throughput: 2100 },
  { t: "10:00", latency: 312, errors: 3.8, throughput: 1850 },
  { t: "12:00", latency: 178, errors: 1.1, throughput: 2340 },
  { t: "14:00", latency: 155, errors: 0.9, throughput: 2550 },
  { t: "16:00", latency: 163, errors: 0.7, throughput: 2410 },
  { t: "18:00", latency: 148, errors: 0.6, throughput: 2180 },
  { t: "20:00", latency: 141, errors: 0.4, throughput: 1920 },
  { t: "22:00", latency: 136, errors: 0.3, throughput: 1640 },
];

const deployData = [
  { date: "May 20", success: 4, failed: 0 },
  { date: "May 21", success: 6, failed: 1 },
  { date: "May 22", success: 5, failed: 0 },
  { date: "May 23", success: 8, failed: 2 },
  { date: "May 24", success: 7, failed: 0 },
  { date: "May 25", success: 9, failed: 1 },
  { date: "May 26", success: 3, failed: 0 },
];

const activityFeed = [
  { id: 1, agent: "PRD Agent", action: "Generated PRD v1.3", artifact: "User Auth Module PRD", time: "2m ago", status: "completed" as Status },
  { id: 2, agent: "Architecture Agent", action: "Generated HLD diagram", artifact: "Microservices Topology", time: "8m ago", status: "completed" as Status },
  { id: 3, agent: "QA Agent", action: "Detected 3 missing edge cases", artifact: "Payment Flow Tests", time: "14m ago", status: "waiting" as Status },
  { id: 4, agent: "Development Agent", action: "Raised PR #487", artifact: "feat: JWT refresh token", time: "21m ago", status: "completed" as Status },
  { id: 5, agent: "Security Reviewer", action: "Flagged OWASP A07 risk", artifact: "Auth middleware", time: "35m ago", status: "blocked" as Status },
  { id: 6, agent: "DevOps Agent", action: "Deployed to staging", artifact: "release/v2.4.1", time: "1h ago", status: "completed" as Status },
];

const agents = [
  { id: "a1", name: "Product Strategist", type: "Strategic", status: "running" as Status, model: "claude-opus-4-7", cost: "$0.84", lastRun: "2m ago", approvalRequired: false, executions: 142 },
  { id: "a2", name: "Business Analyst", type: "Strategic", status: "completed" as Status, model: "claude-sonnet-4-6", cost: "$0.31", lastRun: "12m ago", approvalRequired: false, executions: 89 },
  { id: "a3", name: "Solution Architect", type: "Strategic", status: "waiting" as Status, model: "claude-opus-4-7", cost: "$1.24", lastRun: "18m ago", approvalRequired: true, executions: 67 },
  { id: "a12", name: "Code Analyst", type: "Strategic", status: "completed" as Status, model: "claude-sonnet-4-6", cost: "$0.45", lastRun: "25m ago", approvalRequired: false, executions: 156 },
  { id: "a13", name: "Design Analyst", type: "Strategic", status: "running" as Status, model: "claude-sonnet-4-6", cost: "$0.38", lastRun: "8m ago", approvalRequired: false, executions: 124 },
  { id: "a4", name: "Backend Developer", type: "Engineering", status: "running" as Status, model: "claude-sonnet-4-6", cost: "$0.52", lastRun: "5m ago", approvalRequired: false, executions: 318 },
  { id: "a5", name: "Frontend Developer", type: "Engineering", status: "completed" as Status, model: "claude-sonnet-4-6", cost: "$0.41", lastRun: "31m ago", approvalRequired: false, executions: 201 },
  { id: "a6", name: "QA Engineer", type: "Engineering", status: "running" as Status, model: "claude-haiku-4-5", cost: "$0.12", lastRun: "3m ago", approvalRequired: false, executions: 445 },
  { id: "a7", name: "Security Reviewer", type: "Governance", status: "blocked" as Status, model: "claude-opus-4-7", cost: "$0.92", lastRun: "36m ago", approvalRequired: true, executions: 54 },
  { id: "a8", name: "Compliance Validator", type: "Governance", status: "completed" as Status, model: "claude-sonnet-4-6", cost: "$0.37", lastRun: "2h ago", approvalRequired: true, executions: 38 },
  { id: "a9", name: "DevOps Agent", type: "Operational", status: "completed" as Status, model: "claude-sonnet-4-6", cost: "$0.28", lastRun: "1h ago", approvalRequired: true, executions: 127 },
  { id: "a10", name: "SRE Agent", type: "Operational", status: "waiting" as Status, model: "claude-sonnet-4-6", cost: "$0.33", lastRun: "4h ago", approvalRequired: true, executions: 92 },
  { id: "a11", name: "Incident Analyzer", type: "Operational", status: "completed" as Status, model: "claude-opus-4-7", cost: "$1.10", lastRun: "6h ago", approvalRequired: false, executions: 29 },
];

const approvals = [
  { id: "ap1", item: "PR #487 — feat: JWT refresh token rotation", workflow: "Development", agent: "Backend Developer", risk: "Medium", approver: "Sarah Chen", status: "pending" as Status, sla: "2h remaining" },
  { id: "ap2", item: "Architecture Approval — Microservices v2 HLD", workflow: "Architecture", agent: "Solution Architect", risk: "High", approver: "Abhay Kumar", status: "pending" as Status, sla: "6h remaining" },
  { id: "ap3", item: "Deploy release/v2.4.1 → Production", workflow: "Deployment", agent: "DevOps Agent", risk: "High", approver: "Emma Torres", status: "pending" as Status, sla: "1h remaining" },
  { id: "ap4", item: "Security Override — Auth Middleware OWASP A07", workflow: "Governance", agent: "Security Reviewer", risk: "Critical", approver: "Daniel Kim", status: "blocked" as Status, sla: "OVERDUE" },
  { id: "ap5", item: "PR #482 — refactor: payment service extraction", workflow: "Development", agent: "Backend Developer", risk: "Low", approver: "Sarah Chen", status: "completed" as Status, sla: "Approved 3h ago" },
  { id: "ap6", item: "Infrastructure IaC — EKS cluster autoscaling", workflow: "Deployment", agent: "DevOps Agent", risk: "Medium", approver: "Emma Torres", status: "pending" as Status, sla: "12h remaining" },
];

const pullRequests = [
  { id: "pr487", title: "feat: JWT refresh token rotation", author: "Backend Developer (AI)", branch: "feat/jwt-refresh", status: "review" as const, checks: "passing", comments: 3, age: "2h" },
  { id: "pr486", title: "fix: race condition in order processor", author: "Backend Developer (AI)", branch: "fix/order-race", status: "merged" as const, checks: "passing", comments: 7, age: "5h" },
  { id: "pr485", title: "feat: dashboard KPI widgets", author: "Frontend Developer (AI)", branch: "feat/dashboard-kpi", status: "review" as const, checks: "passing", comments: 1, age: "8h" },
  { id: "pr484", title: "test: expand payment flow coverage", author: "QA Engineer (AI)", branch: "test/payment-coverage", status: "review" as const, checks: "failing", comments: 0, age: "1d" },
  { id: "pr483", title: "docs: ADR-012 event sourcing decision", author: "Solution Architect (AI)", branch: "docs/adr-012", status: "merged" as const, checks: "passing", comments: 4, age: "1d" },
];

const repositories = [
  { name: "agenticsdlc-core", language: "TypeScript", stars: 0, branches: 12, lastCommit: "3m ago", status: "active" as const },
  { name: "agenticsdlc-agents", language: "Python", stars: 0, branches: 8, lastCommit: "18m ago", status: "active" as const },
  { name: "agenticsdlc-infra", language: "HCL", stars: 0, branches: 4, lastCommit: "2h ago", status: "active" as const },
  { name: "agenticsdlc-ui", language: "TypeScript", stars: 0, branches: 6, lastCommit: "31m ago", status: "active" as const },
];

const workflowNodes = [
  { id: "n1", label: "Product Vision", type: "strategic", status: "completed" as Status, x: 60, y: 80, artifacts: 1 },
  { id: "n2", label: "PRD Agent", type: "strategic", status: "completed" as Status, x: 220, y: 80, artifacts: 3 },
  { id: "n3", label: "Story Generator", type: "strategic", status: "completed" as Status, x: 380, y: 80, artifacts: 14 },
  { id: "n4", label: "Architecture Agent", type: "engineering", status: "running" as Status, x: 540, y: 80, artifacts: 2 },
  { id: "n5", label: "Development Agent", type: "engineering", status: "waiting" as Status, x: 700, y: 80, artifacts: 0 },
  { id: "n6", label: "Security Reviewer", type: "governance", status: "waiting" as Status, x: 540, y: 220, artifacts: 0 },
  { id: "n7", label: "QA Agent", type: "engineering", status: "waiting" as Status, x: 700, y: 220, artifacts: 0 },
  { id: "n8", label: "DevOps Agent", type: "operational", status: "waiting" as Status, x: 860, y: 150, artifacts: 0 },
  { id: "n9", label: "Observability Agent", type: "operational", status: "waiting" as Status, x: 1020, y: 150, artifacts: 0 },
];

const workflowEdges = [
  { from: "n1", to: "n2" }, { from: "n2", to: "n3" }, { from: "n3", to: "n4" },
  { from: "n4", to: "n5" }, { from: "n4", to: "n6" }, { from: "n5", to: "n7" },
  { from: "n6", to: "n7" }, { from: "n7", to: "n8" }, { from: "n8", to: "n9" },
];

const auditLogs = [
  { id: "al1", time: "2026-05-26 14:32:11", user: "Backend Developer (AI)", action: "CREATE", resource: "PR #487", outcome: "success" },
  { id: "al2", time: "2026-05-26 14:28:03", user: "sarah.chen@org.io", action: "APPROVE", resource: "ADR-012", outcome: "success" },
  { id: "al3", time: "2026-05-26 14:15:47", user: "Security Reviewer (AI)", action: "FLAG", resource: "Auth Middleware", outcome: "warning" },
  { id: "al4", time: "2026-05-26 14:01:22", user: "DevOps Agent (AI)", action: "DEPLOY", resource: "release/v2.4.1 → staging", outcome: "success" },
  { id: "al5", time: "2026-05-26 13:54:09", user: "james.park@org.io", action: "REJECT", resource: "Microservices HLD v1", outcome: "info" },
  { id: "al6", time: "2026-05-26 13:41:55", user: "Solution Architect (AI)", action: "GENERATE", resource: "HLD v2 — Microservices", outcome: "success" },
];

// ─── Utility Components ───────────────────────────────────────────────────────

const statusConfig: Record<Status, { label: string; color: string; dot: string }> = {
  running:   { label: "Running",   color: "text-blue-400 bg-blue-400/10 border-blue-400/20",   dot: "bg-blue-400" },
  completed: { label: "Completed", color: "text-green-400 bg-green-400/10 border-green-400/20", dot: "bg-green-400" },
  failed:    { label: "Failed",    color: "text-red-400 bg-red-400/10 border-red-400/20",       dot: "bg-red-400" },
  waiting:   { label: "Waiting",   color: "text-slate-400 bg-slate-400/10 border-slate-400/20", dot: "bg-slate-400" },
  blocked:   { label: "Blocked",   color: "text-amber-400 bg-amber-400/10 border-amber-400/20", dot: "bg-amber-400" },
  retrying:  { label: "Retrying",  color: "text-purple-400 bg-purple-400/10 border-purple-400/20", dot: "bg-purple-400" },
  pending:   { label: "Pending",   color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", dot: "bg-yellow-400" },
};

function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === "running" ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const cfg: Record<string, string> = {
    Low: "text-green-400 bg-green-400/10 border-green-400/20",
    Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    High: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    Critical: "text-red-400 bg-red-400/10 border-red-400/20",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${cfg[risk] ?? cfg.Medium}`}>
      {risk}
    </span>
  );
}

function KpiCard({ label, value, sub, icon: Icon, trend, trendUp }: {
  label: string; value: string; sub: string;
  icon: React.ElementType; trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
          <Icon size={15} className="text-muted-foreground" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? "text-green-400" : "text-red-400"}`}>
          {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function ComingSoon({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center">
      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
        <Icon size={24} className="text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">This workspace is part of the full platform rollout.</p>
      </div>
      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
        Request Early Access
      </button>
    </div>
  );
}

// ─── Shared chart tooltip (defined outside any component to avoid recharts key conflicts) ──

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 text-xs shadow-xl">
      <div className="text-muted-foreground mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView({ setView }: { setView: (v: ViewId) => void }) {

  return (
    <div className="p-6 space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Active Workflows" value="12" sub="4 awaiting approval" icon={Workflow} trend="+3 vs yesterday" trendUp />
        <KpiCard label="Pending Approvals" value="7" sub="2 critical, 1 overdue" icon={CheckSquare} trend="1 overdue" trendUp={false} />
        <KpiCard label="Open Risks" value="3" sub="1 critical severity" icon={AlertTriangle} trend="-2 resolved today" trendUp />
        <KpiCard label="Deployment Health" value="98.2%" sub="Staging — healthy" icon={Rocket} trend="+0.4% uptime" trendUp />
        <KpiCard label="AI Agent Health" value="9/11" sub="2 agents blocked" icon={Bot} trend="2 need attention" trendUp={false} />
        <KpiCard label="Active Incidents" value="2" sub="P2 — investigating" icon={AlertCircle} trend="-1 resolved today" trendUp />
      </div>

      {/* Workflow Timeline */}
      <div className="bg-card border border-border rounded-lg p-4">
        <SectionHeader title="SDLC Workflow Progress" sub="Current sprint — User Auth Module v2.4.1" />
        <div className="flex items-center gap-0">
          {[
            { label: "Vision", done: true }, { label: "PRD", done: true },
            { label: "Stories", done: true }, { label: "Architecture", done: false, active: true },
            { label: "Development", done: false }, { label: "QA", done: false },
            { label: "Deployment", done: false },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  step.done ? "bg-green-500 border-green-500 text-white"
                  : step.active ? "bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse"
                  : "bg-muted border-border text-muted-foreground"
                }`}>
                  {step.done ? <CheckCircle2 size={13} /> : i + 1}
                </div>
                <span className={`text-xs font-medium truncate max-w-full ${step.done ? "text-green-400" : step.active ? "text-blue-400" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className={`h-0.5 flex-shrink-0 w-8 -mx-1 ${step.done ? "bg-green-500/50" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <SectionHeader title="AI Agent Activity" sub="Real-time execution feed">
            <button onClick={() => setView("agents")} className="text-xs text-primary hover:underline flex items-center gap-1">
              View all agents <ArrowRight size={11} />
            </button>
          </SectionHeader>
          <div className="space-y-2">
            {activityFeed.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  item.status === "completed" ? "bg-green-500/10" : item.status === "blocked" ? "bg-amber-500/10" : "bg-blue-500/10"
                }`}>
                  <Bot size={11} className={
                    item.status === "completed" ? "text-green-400" : item.status === "blocked" ? "text-amber-400" : "text-blue-400"
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{item.agent}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{item.action}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <FileText size={10} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-primary truncate">{item.artifact}</span>
                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">{item.time}</span>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>

        {/* GitHub Activity */}
        <div className="bg-card border border-border rounded-lg p-4">
          <SectionHeader title="GitHub Activity" sub="Live repository signals">
            <button onClick={() => setView("pull-requests")} className="text-xs text-primary hover:underline flex items-center gap-1">
              View PRs <ArrowRight size={11} />
            </button>
          </SectionHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Pull Requests</div>
              {pullRequests.slice(0, 3).map(pr => (
                <div key={pr.id} className="flex items-center gap-2 py-1.5 hover:bg-muted/40 rounded px-1.5 cursor-pointer group">
                  <GitPullRequest size={12} className={pr.status === "merged" ? "text-purple-400" : "text-blue-400"} />
                  <span className="text-xs text-foreground truncate flex-1">{pr.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${pr.checks === "passing" ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
                    {pr.checks === "passing" ? "✓" : "✗"}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-1.5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Deployments</div>
              {[
                { env: "staging", status: "healthy", time: "1h ago" },
                { env: "qa", status: "healthy", time: "3h ago" },
                { env: "production", status: "v2.4.0 — stable", time: "2d ago" },
              ].map(d => (
                <div key={d.env} className="flex items-center gap-2 py-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="text-xs font-mono text-foreground">{d.env}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{d.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <SectionHeader title="API Latency & Errors" sub="Last 24 hours" />
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={metricsData}>
              <defs>
                <linearGradient id="dashboard-lat-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#6b7598" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7598" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={1.5} fill="url(#dashboard-lat-gradient)" name="Latency (ms)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <SectionHeader title="Deployments — 7 Days" sub="Success vs failed runs" />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={deployData} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7598" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7598" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="success" fill="#22c55e" radius={[3, 3, 0, 0]} name="Success" />
              <Bar dataKey="failed" fill="#ef4444" radius={[3, 3, 0, 0]} name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Workflow Canvas View ─────────────────────────────────────────────────────

// ── Designer types ──
interface DesignerNode {
  id: string; type: string; label: string; category: string;
  color: string; x: number; y: number;
  repoToAnalyse?: string; // For code-analysis and design-analysis nodes
}
interface DesignerEdge {
  id: string; fromId: string; toId: string; relationship: string;
}
interface SavedWorkflow {
  id: string;
  name: string;
  nodes: DesignerNode[];
  edges: DesignerEdge[];
  nodeCount?: number;  // For summary view
  edgeCount?: number;  // For summary view
  createdAt: string;
  status: "draft" | "active" | "paused" | "archived";
}

// ── Palette data ──
const paletteCategories = [
  {
    category: "Strategic", color: "#6366f1",
    items: [
      { type: "product-vision", label: "Product Vision", icon: Lightbulb },
      { type: "prd", label: "PRD", icon: FileText },
      { type: "epic", label: "Epic", icon: Layers },
      { type: "user-story", label: "User Story", icon: BookOpen },
    ],
  },
  {
    category: "Analysis", color: "#8b5cf6",
    items: [
      { type: "code-analysis", label: "Code Analysis", icon: Terminal },
      { type: "design-analysis", label: "Design Analysis", icon: Layers },
    ],
  },
  {
    category: "Architecture", color: "#f59e0b",
    items: [
      { type: "hld", label: "HLD", icon: Network },
      { type: "lld", label: "LLD", icon: Layers },
      { type: "adr", label: "ADR", icon: ScrollText },
      { type: "api-contract", label: "API Contract", icon: Braces },
      { type: "ui-ux", label: "UI/UX", icon: Layers },
    ],
  },
  {
    category: "Development", color: "#22c55e",
    items: [
      { type: "code-module", label: "Code Module", icon: Code2 },
      { type: "pull-request", label: "Pull Request", icon: GitPullRequest },
    ],
  },
  {
    category: "QA", color: "#a855f7",
    items: [
      { type: "test-strategy", label: "Test Strategy", icon: FileText },
      { type: "test-cases", label: "Test Cases", icon: CheckSquare },
      { type: "test-plan", label: "Test Plan", icon: BookOpen },
      { type: "test-suite", label: "Test Suite", icon: FlaskConical },
      { type: "test-report", label: "Test Report", icon: ListChecks },
    ],
  },
  {
    category: "Reviews", color: "#ec4899",
    items: [
      { type: "ai-agent-reviewer", label: "AI Agent Reviewer", icon: Bot, color: "#06b6d4" }, // Cyan for robotic look
      { type: "human-in-loop", label: "Human-in-Loop", icon: Users },
    ],
  },
  {
    category: "Operations", color: "#3b82f6",
    items: [
      { type: "deployment", label: "Deployment", icon: Rocket },
      { type: "release", label: "Release", icon: PackageCheck },
    ],
  },
  {
    category: "Observability", color: "#ef4444",
    items: [
      { type: "incident", label: "Incident Alert", icon: AlertCircle },
      { type: "monitoring", label: "Monitoring", icon: Activity },
    ],
  },
];

const relationships = [
  { type: "successor",   label: "Successor",   color: "#3b82f6", dash: false },
  { type: "predecessor", label: "Predecessor",  color: "#6366f1", dash: false },
  { type: "triggers",    label: "Triggers",     color: "#f59e0b", dash: false },
  { type: "blocks",      label: "Blocks",       color: "#ef4444", dash: true  },
  { type: "validates",   label: "Validates",    color: "#22c55e", dash: false },
  { type: "generates",   label: "Generates",    color: "#a855f7", dash: false },
  { type: "depends-on",  label: "Depends On",   color: "#06b6d4", dash: true  },
  { type: "reviewed-by", label: "Reviewed By",  color: "#f97316", dash: true  },
];

const NODE_W = 148;
const NODE_H = 54;

const defaultSavedWorkflows: SavedWorkflow[] = [
  {
    id: "sw1", name: "Full SDLC Pipeline", status: "active", createdAt: "May 24, 2026",
    nodes: [
      { id: "sn1", type: "product-vision", label: "Product Vision", category: "Strategic",  color: "#6366f1", x: 40,  y: 60  },
      { id: "sn2", type: "prd",            label: "PRD",             category: "Strategic",  color: "#6366f1", x: 240, y: 60  },
      { id: "sn3", type: "epic",           label: "Epic",            category: "Strategic",  color: "#6366f1", x: 440, y: 60  },
      { id: "sn4", type: "hld",            label: "HLD",             category: "Architecture", color: "#f59e0b", x: 640, y: 60  },
      { id: "sn5", type: "code-module",    label: "Code Module",     category: "Development", color: "#22c55e", x: 440, y: 180 },
      { id: "sn6", type: "test-suite",     label: "Test Suite",      category: "QA",         color: "#a855f7", x: 640, y: 180 },
      { id: "sn7", type: "deployment",     label: "Deployment",      category: "Operations",  color: "#3b82f6", x: 840, y: 120 },
    ],
    edges: [
      { id: "se1", fromId: "sn1", toId: "sn2", relationship: "generates"  },
      { id: "se2", fromId: "sn2", toId: "sn3", relationship: "generates"  },
      { id: "se3", fromId: "sn3", toId: "sn4", relationship: "triggers"   },
      { id: "se4", fromId: "sn3", toId: "sn5", relationship: "successor"  },
      { id: "se5", fromId: "sn5", toId: "sn6", relationship: "validates"  },
      { id: "se6", fromId: "sn6", toId: "sn7", relationship: "triggers"   },
    ],
  },
  {
    id: "sw2", name: "Hotfix Workflow", status: "draft", createdAt: "May 25, 2026",
    nodes: [
      { id: "hn1", type: "incident",    label: "Incident Alert", category: "Observability", color: "#ef4444", x: 40,  y: 80 },
      { id: "hn2", type: "code-module", label: "Code Module",    category: "Development",   color: "#22c55e", x: 240, y: 80 },
      { id: "hn3", type: "pull-request",label: "Pull Request",   category: "Development",   color: "#22c55e", x: 440, y: 80 },
      { id: "hn4", type: "deployment",  label: "Deployment",     category: "Operations",    color: "#3b82f6", x: 640, y: 80 },
    ],
    edges: [
      { id: "he1", fromId: "hn1", toId: "hn2", relationship: "triggers"  },
      { id: "he2", fromId: "hn2", toId: "hn3", relationship: "successor" },
      { id: "he3", fromId: "hn3", toId: "hn4", relationship: "triggers"  },
    ],
  },
];

// ── Sprint live-run canvas (with dynamic workflows) ──
function SprintCanvas({
  liveRuns,
  onRefreshStatus
}: {
  liveRuns: Array<{ id: string; name: string; nodes: any[]; edges: any[]; status: string; startedAt: string; githubRunId?: number }>;
  onRefreshStatus?: (runId: string, githubRunId: number) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [runState, setRunState] = useState<"running" | "paused">("running");
  const [refreshing, setRefreshing] = useState(false);
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

  // Manual refresh GitHub status
  const handleRefresh = async () => {
    if (!activeRun || !activeRun.githubRunId || !onRefreshStatus) return;

    setRefreshing(true);
    try {
      await onRefreshStatus(activeRun.id, activeRun.githubRunId);
    } finally {
      setRefreshing(false);
    }
  };

  const selectedNode = displayNodes.find((n: any) => n.id === selected);
  const nodeColor: Record<string, string> = {
    strategic: "#3b82f6",
    engineering: "#22c55e",
    governance: "#f59e0b",
    operational: "#a855f7",
    Strategic: "#6366f1",
    Analysis: "#8b5cf6",
    Architecture: "#f59e0b",
    Development: "#22c55e",
    QA: "#a855f7",
    Reviews: "#ec4899",
    Operations: "#3b82f6",
    Observability: "#ef4444"
  };
  const statusFill: Record<Status, string> = { completed: "#22c55e", running: "#3b82f6", waiting: "#374151", failed: "#ef4444", blocked: "#f59e0b", retrying: "#a855f7", pending: "#6b7598" };
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
          <button
            onClick={handleRefresh}
            disabled={refreshing || !activeRun?.githubRunId}
            className="px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 bg-muted text-muted-foreground border border-border hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Syncing..." : "Sync GitHub"}
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
            const col = node.color || nodeColor[node.category] || nodeColor[node.type] || "#3b82f6";
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
                    {/* Human icon */}
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginTop: "-4px" }}>
                      <circle cx="12" cy="7" r="3.5" fill={col} />
                      <path d="M12 12 C8.5 12 6 14 6 17 L6 20 L18 20 L18 17 C18 14 15.5 12 12 12 Z" fill={col} />
                    </svg>

                    {/* Review text inside circle */}
                    <div className="text-[9px] font-medium" style={{ color: col, marginTop: "-2px" }}>
                      Review
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
                {node.status === "running" && (
                  <div className="absolute right-2 top-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                )}
                {node.status === "completed" && <div className="absolute right-2 top-2 w-2 h-2 rounded-full bg-green-500" />}
                {node.status === "failed" && <div className="absolute right-2 top-2 w-2 h-2 rounded-full bg-red-500" />}
                {node.status === "waiting" && <div className="absolute right-2 top-2 w-2 h-2 rounded-full bg-slate-400 opacity-50" />}
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

// ── Workflow Designer ──
function WorkflowDesigner({ onLaunch, connectedRepos }: { onLaunch: (run: any) => void; connectedRepos: any[] }) {
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
          config: {}
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
      console.log('Launching workflow:', wf.name);

      // Fetch complete workflow data
      const response = await workflowService.getWorkflowById(wf.id);
      if (!response.success || !response.data) {
        throw new Error('Failed to load workflow details');
      }

      const fullWorkflow = response.data;

      // Update workflow status to "active" in database
      console.log('Updating workflow status to "active" in database...');
      const updateResponse = await workflowService.updateWorkflow(wf.id, {
        status: 'active',
        metadata: {
          ...fullWorkflow.metadata,
          launchedAt: new Date().toISOString()
        }
      });

      if (!updateResponse.success) {
        console.warn('Failed to update workflow status in database:', updateResponse.error);
        // Continue anyway - local state will still update
      } else {
        console.log('✅ Workflow status updated to "active" in database');
      }

      // Convert positions to numbers
      const nodesWithPositions = fullWorkflow.nodes.map((n: any) => ({
        ...n,
        x: parseFloat(n.x) || 0,
        y: parseFloat(n.y) || 0
      }));

      // Calculate bounding box of the workflow
      const minX = Math.min(...nodesWithPositions.map((n: any) => n.x));
      const maxX = Math.max(...nodesWithPositions.map((n: any) => n.x));
      const minY = Math.min(...nodesWithPositions.map((n: any) => n.y));
      const maxY = Math.max(...nodesWithPositions.map((n: any) => n.y));

      const workflowWidth = maxX - minX + 128;  // Node width = 128
      const workflowHeight = maxY - minY + 56;  // Node height = 56

      // Target canvas size for Live Runs
      const canvasWidth = 1120;
      const canvasHeight = 320;

      // Calculate scale to fit workflow in canvas (with padding)
      const padding = 40;
      const availableWidth = canvasWidth - padding * 2;
      const availableHeight = canvasHeight - padding * 2;

      const scaleX = availableWidth / workflowWidth;
      const scaleY = availableHeight / workflowHeight;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

      // Calculate offset to center the workflow
      const scaledWidth = workflowWidth * scale;
      const scaledHeight = workflowHeight * scale;
      const offsetX = (canvasWidth - scaledWidth) / 2 - minX * scale;
      const offsetY = (canvasHeight - scaledHeight) / 2 - minY * scale;

      console.log(`Scaling workflow for Live Runs: scale=${scale.toFixed(2)}, offset=(${offsetX.toFixed(0)}, ${offsetY.toFixed(0)})`);

      // Map nodes to live run format with status and scaled positions
      const liveNodes = nodesWithPositions.map((n: any, i: number) => ({
        id: n.id,
        label: n.label,
        type: n.category?.toLowerCase() || "strategic",
        status: i === 0 ? "running" : "waiting",  // First node starts running
        x: n.x * scale + offsetX,
        y: n.y * scale + offsetY,
        artifacts: 0
      }));

      // Map edges to live run format
      const liveEdges = fullWorkflow.edges.map((e: any) => ({
        from: e.fromId,
        to: e.toId,
        fromId: e.fromId,
        toId: e.toId,
        relationship: e.relationship || "successor"
      }));

      // Create live run object
      const liveRun = {
        id: wf.id,
        name: wf.name,
        nodes: liveNodes,
        edges: liveEdges,
        status: "running",
        startedAt: new Date().toISOString()
      };

      // Update saved workflows status in local state
      setSavedWorkflows(prev => prev.map(w =>
        w.id === wf.id ? { ...w, status: "active" } : w
      ));
      setLaunchedId(wf.id);

      // Add to live runs FIRST, then switch to Live Runs tab
      onLaunch(liveRun);

      // Trigger GitHub workflow if first node is "Product Vision"
      const firstNode = fullWorkflow.nodes[0];
      if (firstNode && (firstNode.type === "product-vision" || firstNode.label === "Product Vision")) {
        console.log('Triggering GitHub workflow: product-agent');

        // Trigger GitHub workflow
        const githubResponse = await githubService.triggerWorkflow('product-agent.yml', 'main');

        if (githubResponse.success) {
          alert(`🚀 Workflow "${wf.name}" launched!\n\n✅ Status: Running\n✅ Added to Live Runs\n⚙️ GitHub workflow "product-agent" triggered successfully`);

          // Start polling for workflow status
          pollWorkflowStatus(wf.id);
        } else {
          alert(`🚀 Workflow "${wf.name}" launched!\n\n✅ Status: Running\n✅ Added to Live Runs\n⚠️ GitHub workflow trigger failed: ${githubResponse.error}\n\nWorkflow will run locally only.`);
        }
      } else {
        alert(`🚀 Workflow "${wf.name}" launched!\n\n✅ Status: Running\n✅ Added to Live Runs`);
      }

      console.log('Workflow launched:', liveRun);
      console.log(`Live run created with ${liveNodes.length} nodes and ${liveEdges.length} edges`);
      console.log('Node IDs:', liveNodes.map(n => n.id));
      console.log('Node positions:', liveNodes.map(n => `${n.label}: (${n.x.toFixed(0)}, ${n.y.toFixed(0)})`));
      console.log('Edge connections:', liveEdges.map(e => `${e.fromId} -> ${e.toId}`));
    } catch (error: any) {
      console.error('Error launching workflow:', error);
      alert(`❌ Failed to launch workflow: ${error.message}`);
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

// ── Tabbed WorkflowsView ──
function WorkflowsView() {
  const [tab, setTab] = useState<"live" | "designer">("designer");
  const [liveRuns, setLiveRuns] = useState<Array<{ id: string; name: string; nodes: any[]; edges: any[]; status: string; startedAt: string; githubRunId?: number }>>([]);
  const [connectedRepos, setConnectedRepos] = useState<any[]>([]);

  // Load connected repositories on component mount
  useEffect(() => {
    const loadRepositories = async () => {
      try {
        const response = await repositoryService.getAllRepositories();
        if (response.success && response.data) {
          setConnectedRepos(response.data);
        }
      } catch (error) {
        console.error('Error loading repositories:', error);
      }
    };
    loadRepositories();
  }, []);

  // Load active workflows on component mount
  useEffect(() => {
    const loadActiveWorkflows = async () => {
      try {
        console.log('Loading active workflows from database...');
        const response = await workflowService.getAllWorkflows();

        if (response.success && response.data) {
          // Filter for active workflows only
          const activeWorkflows = response.data.filter((wf: any) => wf.status === 'active');

          if (activeWorkflows.length === 0) {
            console.log('No active workflows found');
            return;
          }

          console.log(`Found ${activeWorkflows.length} active workflows`);

          // Switch to Live Runs tab if there are active workflows
          setTab("live");

          // Load full details for each active workflow and convert to live runs
          const liveRunsPromises = activeWorkflows.map(async (wf: any) => {
            try {
              const detailResponse = await workflowService.getWorkflowById(wf.id);
              if (!detailResponse.success || !detailResponse.data) {
                console.warn(`Failed to load details for workflow ${wf.id}`);
                return null;
              }

              const fullWorkflow = detailResponse.data;

              // Convert positions to numbers
              const nodesWithPositions = fullWorkflow.nodes.map((n: any) => ({
                ...n,
                x: parseFloat(n.x) || 0,
                y: parseFloat(n.y) || 0
              }));

              // Calculate bounding box and scaling for Live Runs canvas
              const minX = Math.min(...nodesWithPositions.map((n: any) => n.x));
              const maxX = Math.max(...nodesWithPositions.map((n: any) => n.x));
              const minY = Math.min(...nodesWithPositions.map((n: any) => n.y));
              const maxY = Math.max(...nodesWithPositions.map((n: any) => n.y));

              const workflowWidth = maxX - minX + 128;
              const workflowHeight = maxY - minY + 56;

              const canvasWidth = 1120;
              const canvasHeight = 320;
              const padding = 40;
              const availableWidth = canvasWidth - padding * 2;
              const availableHeight = canvasHeight - padding * 2;

              const scaleX = availableWidth / workflowWidth;
              const scaleY = availableHeight / workflowHeight;
              const scale = Math.min(scaleX, scaleY, 1);

              const scaledWidth = workflowWidth * scale;
              const scaledHeight = workflowHeight * scale;
              const offsetX = (canvasWidth - scaledWidth) / 2 - minX * scale;
              const offsetY = (canvasHeight - scaledHeight) / 2 - minY * scale;

              // Map nodes to live run format with scaled positions
              const liveNodes = nodesWithPositions.map((n: any, i: number) => ({
                id: n.id,
                label: n.label,
                type: n.category?.toLowerCase() || "strategic",
                status: "completed" as Status, // Default to completed for existing runs
                x: n.x * scale + offsetX,
                y: n.y * scale + offsetY,
                artifacts: 0
              }));

              // Map edges to live run format
              const liveEdges = fullWorkflow.edges.map((e: any) => ({
                from: e.fromId,
                to: e.toId,
                fromId: e.fromId,
                toId: e.toId,
                relationship: e.relationship || "successor"
              }));

              return {
                id: wf.id,
                name: wf.name,
                nodes: liveNodes,
                edges: liveEdges,
                status: wf.status,
                startedAt: wf.updated_at || wf.created_at
              };
            } catch (error) {
              console.error(`Error loading workflow ${wf.id}:`, error);
              return null;
            }
          });

          const loadedRuns = (await Promise.all(liveRunsPromises)).filter(Boolean);
          console.log(`Loaded ${loadedRuns.length} live runs`);
          setLiveRuns(loadedRuns as any[]);
        }
      } catch (error) {
        console.error('Error loading active workflows:', error);
      }
    };

    loadActiveWorkflows();
  }, []); // Run once on mount

  // Update live run node status
  const updateLiveRunNode = useCallback((runId: string, nodeId: string, status: Status, artifacts?: number) => {
    setLiveRuns(prev => prev.map(run => {
      if (run.id === runId) {
        return {
          ...run,
          nodes: run.nodes.map((n: any) =>
            n.id === nodeId ? { ...n, status, artifacts: artifacts ?? n.artifacts } : n
          )
        };
      }
      return run;
    }));
  }, []);

  // Sync GitHub workflow status
  const syncGitHubStatus = useCallback(async (runId: string, githubRunId: number) => {
    try {
      const jobsResponse = await githubService.getWorkflowJobs(githubRunId);

      if (jobsResponse.success && jobsResponse.data) {
        jobsResponse.data.forEach((job: any) => {
          const status = githubService.mapGitHubStatus(job.status, job.conclusion);
          // Map job name to node - would need better mapping logic based on your workflow
          const nodeIndex = jobsResponse.data.indexOf(job);
          updateLiveRunNode(runId, `node-${nodeIndex}`, status);
        });
      }
    } catch (error) {
      console.error('Error syncing GitHub status:', error);
    }
  }, [updateLiveRunNode]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-0 flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-foreground">Workflow Orchestration Canvas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Visualize, design, save and launch SDLC workflows</p>
        </div>
        <div className="flex gap-1 border border-border rounded-lg p-0.5 bg-muted">
          {[{ id: "designer" as const, label: "Workflow Designer", icon: SlidersHorizontal }, { id: "live" as const, label: "Live Runs", icon: Activity }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <t.icon size={11} /> {t.label} {t.id === "live" && liveRuns.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-400">{liveRuns.length}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden mt-4 relative">
        {tab === "live" ? (
          <SprintCanvas liveRuns={liveRuns} onRefreshStatus={syncGitHubStatus} />
        ) : (
          <WorkflowDesigner
            onLaunch={(run) => { setLiveRuns(prev => [run, ...prev]); setTab("live"); }}
            connectedRepos={connectedRepos}
          />
        )}
      </div>
    </div>
  );
}

// ─── Artifacts View ───────────────────────────────────────────────────────────

const artifactTypes = [
  { type: "prd", label: "PRD", icon: FileText, color: "#6366f1" },
  { type: "architecture", label: "Architecture Doc", icon: Network, color: "#f59e0b" },
  { type: "adr", label: "ADR", icon: ScrollText, color: "#8b5cf6" },
  { type: "user-story", label: "User Story", icon: BookOpen, color: "#22c55e" },
  { type: "test-plan", label: "Test Plan", icon: FlaskConical, color: "#a855f7" },
  { type: "deployment", label: "Deployment Record", icon: Rocket, color: "#3b82f6" },
  { type: "incident", label: "Incident Report", icon: AlertCircle, color: "#ef4444" },
  { type: "analysis", label: "Analysis", icon: Search, color: "#06b6d4" },
];

const mockArtifacts = [
  { id: "art1", type: "prd", name: "User Authentication Module PRD", version: "v1.3", status: "approved" as const, owner: "Product Strategist (AI)", created: "May 24, 2026", modified: "2h ago", linkedCount: 8, aiConfidence: 0.94 },
  { id: "art2", type: "architecture", name: "Microservices Architecture HLD", version: "v2.1", status: "pending" as const, owner: "Solution Architect (AI)", created: "May 25, 2026", modified: "1h ago", linkedCount: 12, aiConfidence: 0.89 },
  { id: "art3", type: "adr", name: "ADR-012: Event Sourcing for Orders", version: "v1.0", status: "approved" as const, owner: "Backend Developer (AI)", created: "May 23, 2026", modified: "1d ago", linkedCount: 5, aiConfidence: 0.92 },
  { id: "art4", type: "user-story", name: "JWT Refresh Token Implementation", version: "v1.0", status: "approved" as const, owner: "Backend Developer (AI)", created: "May 26, 2026", modified: "3h ago", linkedCount: 4, aiConfidence: 0.96 },
  { id: "art5", type: "test-plan", name: "Payment Flow E2E Test Plan", version: "v1.2", status: "draft" as const, owner: "QA Engineer (AI)", created: "May 25, 2026", modified: "5h ago", linkedCount: 6, aiConfidence: 0.88 },
  { id: "art6", type: "deployment", name: "Release v2.4.1 Deployment", version: "v1.0", status: "approved" as const, owner: "DevOps Agent (AI)", created: "May 26, 2026", modified: "1h ago", linkedCount: 3, aiConfidence: 0.95 },
  { id: "art7", type: "analysis", name: "Code Quality Analysis Report", version: "v1.0", status: "approved" as const, owner: "Code Analyst (AI)", created: "May 26, 2026", modified: "30m ago", linkedCount: 7, aiConfidence: 0.91 },
];

function ArtifactsView() {
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>("art1");
  const [filterType, setFilterType] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"overview" | "lineage" | "ai-history" | "comments" | "github" | "logs">("overview");

  const artifact = mockArtifacts.find(a => a.id === selectedArtifact);
  const artifactType = artifact ? artifactTypes.find(t => t.type === artifact.type) : null;
  const types = ["All", "PRD", "Architecture", "ADR", "User Story", "Test Plan", "Deployment", "Incident", "Analysis"];
  const filtered = filterType === "All" ? mockArtifacts : mockArtifacts.filter(a => {
    const typeLabel = artifactTypes.find(t => t.type === a.type)?.label;
    return typeLabel === filterType;
  });

  const statusColors: Record<string, string> = {
    approved: "text-green-400 bg-green-400/10 border-green-400/20",
    pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    draft: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* LEFT PANEL - Artifact List */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4 p-6 border-r border-border overflow-y-auto">
        <div>
          <h2 className="text-base font-semibold text-foreground">Artifacts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Structured SDLC documents</p>
        </div>

        <div className="flex items-center gap-1.5 bg-muted rounded px-2.5 py-1.5">
          <Search size={11} className="text-muted-foreground" />
          <input placeholder="Search artifacts…" className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none flex-1" />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${filterType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          {filtered.map(art => {
            const artType = artifactTypes.find(t => t.type === art.type)!;
            const Icon = artType.icon;
            return (
              <div
                key={art.id}
                onClick={() => setSelectedArtifact(art.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedArtifact === art.id ? "bg-primary/5 border-primary" : "border-transparent hover:bg-muted/50"}`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${artType.color}15` }}>
                    <Icon size={12} style={{ color: artType.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-foreground truncate mb-0.5">{art.name}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span>{art.version}</span>
                      <span>•</span>
                      <span className={`px-1 py-0.5 rounded ${statusColors[art.status]}`}>
                        {art.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT AREA - Document Editor */}
      {artifact && artifactType ? (
        <>
          <div className="flex-1 flex flex-col overflow-hidden bg-card border-x border-border">
            {/* Header */}
            <div className="border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${artifactType.color}15` }}>
                  <artifactType.icon size={16} style={{ color: artifactType.color }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{artifact.name}</h2>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span>{artifactType.label}</span>
                    <span>•</span>
                    <span>{artifact.version}</span>
                    <span className={`px-1.5 py-0.5 rounded border ${statusColors[artifact.status]}`}>
                      {artifact.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-2.5 py-1.5 bg-muted text-muted-foreground border border-border rounded text-xs hover:text-foreground transition-colors">
                  <Edit3 size={11} />
                </button>
                <button className="px-2.5 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors">
                  Save
                </button>
              </div>
            </div>

            {/* Main Content Area - Rich Document Editor */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* AI Generation Metadata */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Bot size={12} className="text-primary" />
                    <span className="text-foreground font-medium">Generated by {artifact.owner}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">Modified {artifact.modified}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-foreground">AI Confidence: {Math.round(artifact.aiConfidence * 100)}%</span>
                  </div>
                </div>

                {/* Document Content - Rich Editor Area */}
                <div className="prose prose-sm max-w-none">
                  <h1 className="text-foreground">{artifact.name}</h1>

                  <h2 className="text-foreground">Executive Summary</h2>
                  <p className="text-muted-foreground">
                    This document outlines the comprehensive approach for implementing a secure, scalable authentication module
                    that supports multiple authentication strategies including JWT, OAuth 2.0, and SSO integration.
                  </p>

                  <h2 className="text-foreground">Product Goals</h2>
                  <ul className="text-muted-foreground">
                    <li>Enable seamless user authentication across all platform services</li>
                    <li>Support enterprise SSO requirements (SAML, OIDC)</li>
                    <li>Implement role-based access control (RBAC) with fine-grained permissions</li>
                    <li>Ensure compliance with SOC 2, GDPR, and industry security standards</li>
                  </ul>

                  <h2 className="text-foreground">Technical Specifications</h2>
                  <p className="text-muted-foreground">
                    The authentication service will be built as a standalone microservice using Node.js and Express,
                    with Redis for session management and PostgreSQL for user data persistence.
                  </p>

                  <h3 className="text-foreground">Architecture Components</h3>
                  <ul className="text-muted-foreground">
                    <li><strong>Auth Service API:</strong> RESTful API for authentication operations</li>
                    <li><strong>Token Service:</strong> JWT generation, validation, and refresh logic</li>
                    <li><strong>Session Store:</strong> Redis-backed distributed session management</li>
                    <li><strong>Identity Provider Integration:</strong> OAuth 2.0 and SAML connectors</li>
                  </ul>

                  <h2 className="text-foreground">Implementation Details</h2>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto"><code>{`// JWT Token Generation
const generateAccessToken = (userId: string, roles: string[]) => {
  return jwt.sign(
    { sub: userId, roles },
    process.env.JWT_SECRET,
    { expiresIn: '15m', issuer: 'agenticsdlc' }
  );
};`}</code></pre>

                  <h2 className="text-foreground">Acceptance Criteria</h2>
                  <ul className="text-muted-foreground">
                    <li>Users can register and authenticate using email/password</li>
                    <li>JWT tokens expire after 15 minutes; refresh tokens valid for 7 days</li>
                    <li>Failed login attempts trigger rate limiting after 5 attempts</li>
                    <li>All authentication events logged to audit trail</li>
                    <li>Password requirements: minimum 12 characters, complexity rules enforced</li>
                  </ul>

                  <h2 className="text-foreground">AI-Generated Insights</h2>
                  <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Bot size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-foreground font-medium mb-1">Security Recommendation</p>
                        <p className="text-xs text-muted-foreground">
                          Consider implementing WebAuthn for passwordless authentication to improve security
                          and user experience. This aligns with modern authentication best practices.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Tabs with Context */}
          <div className="w-80 flex-shrink-0 bg-card flex flex-col overflow-hidden border-r border-border">
            {/* Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: "overview" as const, label: "Overview", icon: FileText },
                { id: "lineage" as const, label: "Lineage", icon: GitBranch },
                { id: "ai-history" as const, label: "AI History", icon: Bot },
                { id: "comments" as const, label: "Comments", icon: MessageSquare },
                { id: "github" as const, label: "GitHub", icon: Github },
                { id: "logs" as const, label: "Logs", icon: Terminal },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    title={tab.label}
                  >
                    <Icon size={11} />
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Metadata</div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-0.5">Owner</div>
                        <div className="text-xs text-foreground">{artifact.owner}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-0.5">Version</div>
                        <div className="text-xs text-foreground">{artifact.version}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-0.5">Created</div>
                        <div className="text-xs text-foreground">{artifact.created}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-0.5">AI Confidence</div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-green-400" style={{ width: `${artifact.aiConfidence * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-foreground font-medium">{Math.round(artifact.aiConfidence * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Linked Artifacts ({artifact.linkedCount})</div>
                    <div className="space-y-1.5">
                      {[
                        { name: "User Auth Epic", type: "epic", rel: "Parent" },
                        { name: "JWT Implementation Story", type: "story", rel: "Child" },
                        { name: "Security ADR-008", type: "adr", rel: "Referenced by" },
                      ].map((link, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs p-2 rounded hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border">
                          <GitBranch size={10} className="text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-foreground text-[11px] font-medium truncate">{link.name}</div>
                            <div className="text-muted-foreground text-[10px]">{link.rel}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dependencies</div>
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-muted-foreground p-2 bg-muted rounded">
                        <AlertCircle size={10} className="inline mr-1" />
                        No blocking dependencies
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "lineage" && (
                <div className="space-y-3">
                  <div className="text-center py-8">
                    <GitBranch size={24} className="text-muted-foreground mx-auto mb-2" />
                    <div className="text-xs font-medium text-foreground mb-1">Artifact Lineage</div>
                    <div className="text-[10px] text-muted-foreground">Interactive graph visualization</div>
                  </div>
                </div>
              )}

              {activeTab === "ai-history" && (
                <div className="space-y-2">
                  {[
                    { time: "2h ago", agent: "Product Strategist", action: "Generated version v1.3" },
                    { time: "1d ago", agent: "Solution Architect", action: "Reviewed and approved" },
                    { time: "2d ago", agent: "Backend Developer", action: "Generated initial draft v1.0" },
                  ].map((log, i) => (
                    <div key={i} className="bg-muted rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Bot size={10} className="text-primary" />
                        <span className="text-[11px] font-medium text-foreground">{log.agent}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">{log.action}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{log.time}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "comments" && (
                <div className="text-center py-8">
                  <MessageSquare size={24} className="text-muted-foreground mx-auto mb-2" />
                  <div className="text-xs font-medium text-foreground mb-1">No Comments</div>
                  <div className="text-[10px] text-muted-foreground">Add collaborative comments</div>
                </div>
              )}

              {activeTab === "github" && (
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sync Status</div>
                    <div className="flex items-center gap-2 text-xs p-2 bg-green-400/10 border border-green-400/20 rounded">
                      <CheckCircle2 size={12} className="text-green-400" />
                      <span className="text-foreground text-[11px]">Synced to Issue #142</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Linked Resources</div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs p-2 rounded hover:bg-muted/50 cursor-pointer">
                        <GitPullRequest size={11} className="text-blue-400" />
                        <span className="text-foreground text-[11px]">PR #487</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs p-2 rounded hover:bg-muted/50 cursor-pointer">
                        <GitCommit size={11} className="text-green-400" />
                        <span className="text-foreground text-[11px]">feat/jwt-refresh</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "logs" && (
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="text-green-400">[14:32:11] Generated successfully</div>
                  <div className="text-blue-400">[14:32:15] AI validated (94%)</div>
                  <div className="text-green-400">[14:32:18] Synced to GitHub</div>
                  <div className="text-amber-400">[14:35:42] Version v1.3 created</div>
                  <div className="text-green-400">[14:35:45] Approval requested</div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <FileText size={32} className="mx-auto mb-3 opacity-50" />
            <div className="text-sm font-medium">No artifact selected</div>
            <div className="text-xs mt-1">Select an artifact from the list to view details</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Agents View ───────────────────────────────────────────────────────────

function AgentsView() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("All");
  const agent = agents.find(a => a.id === selectedAgent);
  const types = ["All", "Strategic", "Engineering", "Governance", "Operational"];
  const filtered = filterType === "All" ? agents : agents.filter(a => a.type === filterType);

  const execHistory = [
    { t: "Mon", count: 24 }, { t: "Tue", count: 38 }, { t: "Wed", count: 31 },
    { t: "Thu", count: 45 }, { t: "Fri", count: 52 }, { t: "Sat", count: 18 }, { t: "Sun", count: 11 },
  ];

  return (
    <div className="p-6 flex gap-5 h-full min-h-0">
      {/* Agent List */}
      <div className={`flex flex-col gap-4 ${selectedAgent ? "w-[55%]" : "w-full"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">AI Agent Console</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage and observe all platform agents</p>
          </div>
          <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors">
            <Plus size={12} /> New Agent
          </button>
        </div>

        <div className="flex items-center gap-2">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 bg-muted rounded px-2.5 py-1.5">
            <Search size={11} className="text-muted-foreground" />
            <input placeholder="Search agents…" className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-32" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["Agent", "Type", "Status", "Model", "Cost/Run", "Last Run", "Approval"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedAgent(selectedAgent === a.id ? null : a.id)}
                  className={`border-b border-border cursor-pointer transition-colors hover:bg-muted/40 ${selectedAgent === a.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${a.type === "Strategic" ? "bg-blue-500/10" : a.type === "Engineering" ? "bg-green-500/10" : a.type === "Governance" ? "bg-amber-500/10" : "bg-purple-500/10"}`}>
                        <Bot size={11} className={a.type === "Strategic" ? "text-blue-400" : a.type === "Engineering" ? "text-green-400" : a.type === "Governance" ? "text-amber-400" : "text-purple-400"} />
                      </div>
                      <span className="font-medium text-foreground">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-muted-foreground">{a.type}</span>
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge status={a.status} /></td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground">{a.model}</td>
                  <td className="px-3 py-2.5 font-mono text-foreground">{a.cost}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{a.lastRun}</td>
                  <td className="px-3 py-2.5">
                    {a.approvalRequired
                      ? <span className="text-amber-400 flex items-center gap-1"><CheckSquare size={10} /> Required</span>
                      : <span className="text-muted-foreground">Autonomous</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Detail */}
      {agent && (
        <div className="flex-1 bg-card border border-border rounded-lg p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{agent.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{agent.type} Agent · {agent.executions} executions</p>
            </div>
            <StatusBadge status={agent.status} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Model", value: agent.model },
              { label: "Avg Cost", value: agent.cost },
              { label: "Last Run", value: agent.lastRun },
              { label: "Approval", value: agent.approvalRequired ? "Required" : "Autonomous" },
            ].map(row => (
              <div key={row.label} className="bg-muted rounded-md p-2.5">
                <div className="text-xs text-muted-foreground">{row.label}</div>
                <div className="text-xs font-medium text-foreground mt-0.5 font-mono">{row.value}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Execution History (7d)</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={execHistory} barCategoryGap="30%">
                <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#6b7598" }} axisLine={false} tickLine={false} />
                <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">System Instructions</div>
            <div className="bg-muted rounded-md p-3 font-mono text-xs text-muted-foreground leading-relaxed">
              You are a specialized {agent.name.toLowerCase()} operating within the AgenticSDLC platform. You produce structured, versioned artifacts and collaborate with upstream and downstream agents via shared context graphs. All outputs must include traceability metadata.
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Tool Permissions</div>
            <div className="flex flex-wrap gap-1.5">
              {["read_context", "write_artifact", "github_read", "github_write", "trigger_workflow", ...(agent.approvalRequired ? [] : ["auto_merge"])].map(t => (
                <span key={t} className="px-2 py-0.5 bg-green-400/10 text-green-400 border border-green-400/20 rounded text-xs font-mono">{t}</span>
              ))}
              {["deploy_production", "delete_resource"].map(t => (
                <span key={t} className="px-2 py-0.5 bg-red-400/10 text-red-400 border border-red-400/20 rounded text-xs font-mono line-through opacity-60">{t}</span>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-3 flex gap-2 mt-auto">
            <button className="flex-1 py-2 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
              Configure
            </button>
            <button className={`flex-1 py-2 rounded text-xs font-medium border transition-colors ${agent.status === "running" ? "bg-amber-400/10 text-amber-400 border-amber-400/20 hover:bg-amber-400/20" : "bg-green-400/10 text-green-400 border-green-400/20 hover:bg-green-400/20"}`}>
              {agent.status === "running" ? "Pause Agent" : "Enable Agent"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Approvals View ───────────────────────────────────────────────────────────

function ApprovalsView() {
  const [items, setItems] = useState(approvals);
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const act = useCallback((id: string, action: "approve" | "reject" | "escalate") => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, status: action === "approve" ? "completed" : action === "reject" ? "failed" : "blocked" as Status }
        : item
    ));
  }, []);

  const filtered = filterStatus === "All" ? items : items.filter(i => {
    if (filterStatus === "Pending") return i.status === "pending";
    if (filterStatus === "Blocked") return i.status === "blocked";
    if (filterStatus === "Resolved") return ["completed", "failed"].includes(i.status);
    return true;
  });

  const pending = items.filter(i => i.status === "pending").length;
  const overdue = items.filter(i => i.sla === "OVERDUE").length;

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Approval Workflows</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Human governance layer for critical AI actions</p>
        </div>
        <div className="flex items-center gap-3">
          {overdue > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-400/10 border border-red-400/20 rounded text-xs text-red-400 font-medium">
              <AlertTriangle size={11} /> {overdue} overdue approval{overdue > 1 ? "s" : ""}
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded text-xs text-amber-400 font-medium">
            <Clock size={11} /> {pending} pending
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {["All", "Pending", "Blocked", "Resolved"].map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterStatus === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              {["Item", "Workflow", "Agent", "Risk", "Approver", "Status", "SLA", "Actions"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-3 py-3 max-w-xs">
                  <div className="font-medium text-foreground truncate">{item.item}</div>
                </td>
                <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{item.workflow}</td>
                <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{item.agent}</td>
                <td className="px-3 py-3"><RiskBadge risk={item.risk} /></td>
                <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{item.approver}</td>
                <td className="px-3 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-3 py-3">
                  <span className={`font-mono text-xs ${item.sla === "OVERDUE" ? "text-red-400 font-bold" : "text-muted-foreground"}`}>
                    {item.sla}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {item.status === "pending" || item.status === "blocked" ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => act(item.id, "approve")}
                        className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs font-medium hover:bg-green-500/20 transition-colors flex items-center gap-1"
                      >
                        <ThumbsUp size={10} /> Approve
                      </button>
                      <button
                        onClick={() => act(item.id, "reject")}
                        className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs font-medium hover:bg-red-500/20 transition-colors flex items-center gap-1"
                      >
                        <ThumbsDown size={10} /> Reject
                      </button>
                      <button
                        onClick={() => act(item.id, "escalate")}
                        className="px-2 py-1 bg-muted text-muted-foreground border border-border rounded text-xs font-medium hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        <ArrowRight size={10} /> Escalate
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {item.status === "completed" ? "✓ Approved" : item.status === "failed" ? "✗ Rejected" : "—"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── GitHub Operations View ───────────────────────────────────────────────────

function GithubView({ initialTab }: { initialTab?: "repos" | "prs" | "issues" | "pipelines" }) {
  const [tab, setTab] = useState<"repos" | "prs" | "issues" | "pipelines">(initialTab ?? "repos");
  const [connectedRepos, setConnectedRepos] = useState<any[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load connected repositories from database on mount
  useEffect(() => {
    const loadRepositories = async () => {
      try {
        console.log('Loading connected repositories from database...');
        const response = await repositoryService.getAllRepositories();

        if (response.success && response.data) {
          setConnectedRepos(response.data);
          console.log(`Loaded ${response.data.length} repositories from database`);
        } else {
          console.warn('Failed to load repositories:', response.error);
        }
      } catch (error) {
        console.error('Error loading repositories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRepositories();
  }, []);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConnectModal) {
        setShowConnectModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showConnectModal]);

  const tabs = [
    { id: "repos" as const, label: "Repositories", icon: FolderGit2 },
    { id: "prs" as const, label: "Pull Requests", icon: GitPullRequest },
    { id: "issues" as const, label: "Issues & Projects", icon: ListChecks },
    { id: "pipelines" as const, label: "CI/CD Pipelines", icon: Zap },
  ];

  const issues = [
    { id: "GH-142", title: "Implement JWT refresh token rotation", epic: "Auth Module", status: "In Progress", assignee: "Backend Developer (AI)", sprint: "Sprint 14" },
    { id: "GH-141", title: "Add rate limiting to API gateway", epic: "Infrastructure", status: "Todo", assignee: "Backend Developer (AI)", sprint: "Sprint 14" },
    { id: "GH-140", title: "Dashboard KPI widgets implementation", epic: "Frontend MVP", status: "In Progress", assignee: "Frontend Developer (AI)", sprint: "Sprint 14" },
    { id: "GH-139", title: "E2E tests for payment checkout flow", epic: "QA Coverage", status: "Todo", assignee: "QA Engineer (AI)", sprint: "Sprint 14" },
    { id: "GH-138", title: "ADR-012: Adopt event sourcing for orders", epic: "Architecture", status: "Done", assignee: "Solution Architect (AI)", sprint: "Sprint 13" },
  ];

  const pipelines = [
    { name: "ci-core", repo: "agenticsdlc-core", trigger: "PR #487", status: "passing" as const, duration: "4m 12s", time: "3m ago" },
    { name: "ci-agents", repo: "agenticsdlc-agents", trigger: "push main", status: "passing" as const, duration: "6m 44s", time: "18m ago" },
    { name: "deploy-staging", repo: "agenticsdlc-core", trigger: "manual", status: "passing" as const, duration: "2m 08s", time: "1h ago" },
    { name: "ci-ui", repo: "agenticsdlc-ui", trigger: "PR #485", status: "failing" as const, duration: "1m 55s", time: "2h ago" },
    { name: "security-scan", repo: "agenticsdlc-core", trigger: "schedule", status: "passing" as const, duration: "8m 30s", time: "4h ago" },
  ];

  // Handle connecting to a GitHub repository
  const handleConnectRepo = async () => {
    if (!repoOwner.trim() || !repoName.trim()) {
      alert('⚠️ Please enter both owner and repository name');
      return;
    }

    setConnecting(true);
    try {
      console.log(`Connecting to GitHub repository: ${repoOwner}/${repoName}`);

      // Call GitHub API to get repository info
      const repoResponse = await githubService.getRepository(repoOwner, repoName);

      if (!repoResponse.success || !repoResponse.data) {
        throw new Error(repoResponse.error || 'Failed to fetch repository');
      }

      const repo = repoResponse.data;

      // Prepare repository data for database
      const newRepoData = {
        name: repo.name,
        owner: repoOwner,
        fullName: repo.full_name,
        language: repo.language || 'Unknown',
        stars: repo.stargazers_count || 0,
        branches: 1, // Default, would need additional API call to get exact count
        description: repo.description || '',
        url: repo.html_url,
        lastCommit: 'just now',
        status: 'active' as const,
        connectedAt: new Date().toISOString()
      };

      // Save to database
      console.log('Saving repository to database...');
      const saveResponse = await repositoryService.connectRepository(newRepoData);

      if (!saveResponse.success || !saveResponse.data) {
        throw new Error(saveResponse.error || 'Failed to save repository to database');
      }

      // Add to local state with database ID
      setConnectedRepos(prev => [saveResponse.data!, ...prev]);

      // Reset form and close modal
      setRepoOwner("");
      setRepoName("");
      setShowConnectModal(false);

      alert(`✅ Successfully connected to repository "${repo.full_name}"!\n\n💾 Repository saved to database`);
      console.log('Repository connected and saved:', saveResponse.data);
    } catch (error: any) {
      console.error('Error connecting repository:', error);
      alert(`❌ Failed to connect repository: ${error.message}\n\nPlease check:\n- Repository owner and name are correct\n- Repository exists and is accessible\n- Backend server is running (http://localhost:3001)\n- Database connection is working`);
    } finally {
      setConnecting(false);
    }
  };

  // Handle disconnecting a repository
  const handleDisconnectRepo = async (repoId: string, repoName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to disconnect repository "${repoName}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log('Disconnecting repository:', repoId);

      // Delete from database
      const response = await repositoryService.disconnectRepository(repoId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to disconnect repository');
      }

      // Remove from local state
      setConnectedRepos(prev => prev.filter(r => r.id !== repoId));

      console.log('Repository disconnected successfully');
      alert(`✅ Repository "${repoName}" disconnected successfully!`);
    } catch (error: any) {
      console.error('Error disconnecting repository:', error);
      alert(`❌ Failed to disconnect repository: ${error.message}`);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">GitHub Operations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Orchestration visibility over GitHub workflows</p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground border border-primary rounded text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={12} /> Connect Repository
        </button>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "repos" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw size={16} className="animate-spin" />
                <span className="text-sm">Loading repositories...</span>
              </div>
            </div>
          ) : connectedRepos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <FolderGit2 size={20} className="text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">No repositories connected</h3>
              <p className="text-xs text-muted-foreground mb-4">Connect your first GitHub repository to get started</p>
              <button
                onClick={() => setShowConnectModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus size={12} /> Connect Repository
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {connectedRepos.map(r => (
                <div key={r.id || r.name} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FolderGit2 size={14} className="text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm truncate">{r.name}</span>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={11} />
                          </a>
                        </div>
                        {r.fullName && (
                          <p className="text-[10px] text-muted-foreground font-mono">{r.fullName}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDisconnectRepo(r.id, r.fullName || r.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2 p-1.5 rounded text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20"
                      title="Disconnect repository"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      {r.language}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitBranch size={10} />
                      {r.branches} branches
                    </span>
                    {r.lastCommit && (
                      <span className="flex items-center gap-1">
                        <GitCommit size={10} />
                        {r.lastCommit}
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "prs" && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["PR", "Title", "Author", "Status", "Checks", "Comments", "Age"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pullRequests.map(pr => (
                <tr key={pr.id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-3 py-2.5 font-mono text-muted-foreground">#{pr.id.replace("pr", "")}</td>
                  <td className="px-3 py-2.5 font-medium text-foreground max-w-xs truncate">{pr.title}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{pr.author}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${pr.status === "merged" ? "bg-purple-400/10 text-purple-400 border border-purple-400/20" : "bg-blue-400/10 text-blue-400 border border-blue-400/20"}`}>
                      {pr.status === "merged" ? "Merged" : "Open"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`font-mono text-xs font-semibold ${pr.checks === "passing" ? "text-green-400" : "text-red-400"}`}>
                      {pr.checks === "passing" ? "✓ passing" : "✗ failing"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{pr.comments}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{pr.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "issues" && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["ID", "Title", "Epic", "Assignee", "Sprint", "Status"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {issues.map(iss => (
                <tr key={iss.id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-3 py-2.5 font-mono text-muted-foreground">{iss.id}</td>
                  <td className="px-3 py-2.5 font-medium text-foreground">{iss.title}</td>
                  <td className="px-3 py-2.5"><span className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{iss.epic}</span></td>
                  <td className="px-3 py-2.5 text-muted-foreground">{iss.assignee}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{iss.sprint}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${iss.status === "Done" ? "bg-green-400/10 text-green-400 border-green-400/20" : iss.status === "In Progress" ? "bg-blue-400/10 text-blue-400 border-blue-400/20" : "bg-muted text-muted-foreground border-border"}`}>
                      {iss.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "pipelines" && (
        <div className="space-y-2">
          {pipelines.map(p => (
            <div key={p.name} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === "passing" ? "bg-green-400" : "bg-red-400"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-xs">{p.name}</span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-muted-foreground text-xs font-mono">{p.repo}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Triggered by: {p.trigger}</div>
              </div>
              <div className="text-xs text-muted-foreground font-mono">{p.duration}</div>
              <div className="text-xs text-muted-foreground">{p.time}</div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${p.status === "passing" ? "bg-green-400/10 text-green-400 border-green-400/20" : "bg-red-400/10 text-red-400 border-red-400/20"}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Connect Repository Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowConnectModal(false)}>
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Connect GitHub Repository</h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Repository Owner / Organization
                </label>
                <input
                  type="text"
                  value={repoOwner}
                  onChange={(e) => setRepoOwner(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnectRepo()}
                  placeholder="e.g., anthropics"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnectRepo()}
                  placeholder="e.g., claude-code"
                  className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="bg-muted/50 border border-border rounded p-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Info size={14} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Example:</p>
                    <p>For repository <span className="font-mono text-foreground">https://github.com/anthropics/claude-code</span></p>
                    <p className="mt-1">Owner: <span className="font-mono text-foreground">anthropics</span></p>
                    <p>Name: <span className="font-mono text-foreground">claude-code</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 px-4 py-2 bg-muted text-muted-foreground border border-border rounded text-sm font-medium hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConnectRepo}
                disabled={connecting || !repoOwner.trim() || !repoName.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {connecting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Github size={14} />
                    Connect
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audit Logs View ──────────────────────────────────────────────────────────

function AuditView() {
  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Audit Logs</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Immutable record of all platform actions</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-muted text-muted-foreground border border-border rounded text-xs font-medium hover:text-foreground transition-colors flex items-center gap-1.5">
            <Filter size={11} /> Filter
          </button>
          <button className="px-3 py-1.5 bg-muted text-muted-foreground border border-border rounded text-xs font-medium hover:text-foreground transition-colors flex items-center gap-1.5">
            <RefreshCw size={11} /> Export
          </button>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              {["Timestamp", "Actor", "Action", "Resource", "Outcome"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">{log.time}</td>
                <td className="px-3 py-2.5 text-foreground">{log.user}</td>
                <td className="px-3 py-2.5"><span className="font-mono text-xs px-1.5 py-0.5 bg-muted rounded text-foreground">{log.action}</span></td>
                <td className="px-3 py-2.5 text-primary">{log.resource}</td>
                <td className="px-3 py-2.5">
                  <span className={`text-xs font-medium ${log.outcome === "success" ? "text-green-400" : log.outcome === "warning" ? "text-amber-400" : log.outcome === "info" ? "text-blue-400" : "text-muted-foreground"}`}>
                    ● {log.outcome}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Context Graph View ───────────────────────────────────────────────────────

function ContextGraphView() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const graphNodes = [
    { id: "vision", label: "Vision", color: "#6366f1", x: 540, y: 60 },
    { id: "prd", label: "PRD v1.3", color: "#3b82f6", x: 380, y: 160 },
    { id: "epic1", label: "Epic: Auth", color: "#3b82f6", x: 200, y: 270 },
    { id: "epic2", label: "Epic: API", color: "#3b82f6", x: 380, y: 280 },
    { id: "story1", label: "Story GH-142", color: "#22c55e", x: 120, y: 380 },
    { id: "story2", label: "Story GH-141", color: "#22c55e", x: 280, y: 390 },
    { id: "arch", label: "HLD v2", color: "#f59e0b", x: 680, y: 180 },
    { id: "code", label: "PR #487", color: "#06b6d4", x: 160, y: 490 },
    { id: "deploy", label: "Deploy v2.4.1", color: "#a855f7", x: 700, y: 340 },
    { id: "incident", label: "INC-009", color: "#ef4444", x: 820, y: 460 },
  ];

  const graphEdges = [
    { from: "vision", to: "prd", label: "derived from" },
    { from: "prd", to: "epic1", label: "generates" },
    { from: "prd", to: "epic2", label: "generates" },
    { from: "epic1", to: "story1", label: "contains" },
    { from: "epic2", to: "story2", label: "contains" },
    { from: "prd", to: "arch", label: "informs" },
    { from: "story1", to: "code", label: "implemented by" },
    { from: "arch", to: "deploy", label: "deployed via" },
    { from: "deploy", to: "incident", label: "triggered" },
  ];

  const findNode = (id: string) => graphNodes.find(n => n.id === id)!;

  return (
    <div className="p-6 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Context & Traceability Graph</h2>
          <p className="text-xs text-muted-foreground mt-0.5">End-to-end artifact lineage: Vision → PRD → Epic → Story → Code → Deploy → Incident</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-muted text-muted-foreground border border-border rounded text-xs font-medium hover:text-foreground transition-colors flex items-center gap-1.5">
            <Filter size={11} /> Filter nodes
          </button>
          <button className="px-3 py-1.5 bg-muted text-muted-foreground border border-border rounded text-xs font-medium hover:text-foreground transition-colors flex items-center gap-1.5">
            <MapPin size={11} /> Impact analysis
          </button>
        </div>
      </div>
      <div className="flex-1 bg-card border border-border rounded-lg relative overflow-hidden" style={{ minHeight: 460 }}>
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.05) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <svg width="100%" height="100%" viewBox="0 0 980 560" className="relative z-10">
          {/* Edges */}
          {graphEdges.map((e, i) => {
            const from = findNode(e.from);
            const to = findNode(e.to);
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const highlighted = hoveredNode === e.from || hoveredNode === e.to;
            return (
              <g key={i}>
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={highlighted ? from.color : "rgba(148,163,184,0.15)"}
                  strokeWidth={highlighted ? 1.5 : 1}
                  strokeDasharray={highlighted ? "0" : "5 3"}
                />
                <text x={midX} y={midY - 4} textAnchor="middle" fontSize={8} fill="rgba(148,163,184,0.4)" fontFamily="Inter, sans-serif">
                  {e.label}
                </text>
              </g>
            );
          })}
          {/* Nodes */}
          {graphNodes.map(node => {
            const isHovered = hoveredNode === node.id;
            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                <circle cx={node.x} cy={node.y} r={isHovered ? 26 : 22} fill={`${node.color}18`} stroke={node.color} strokeWidth={isHovered ? 2 : 1.5} />
                <circle cx={node.x} cy={node.y} r={6} fill={node.color} opacity={0.8} />
                <text x={node.x} y={node.y + 36} textAnchor="middle" fontSize={10} fill="#e8eaf0" fontFamily="Inter, sans-serif" fontWeight={500}>
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        {[
          { label: "Strategic", color: "#6366f1" }, { label: "Requirements", color: "#3b82f6" },
          { label: "Engineering", color: "#22c55e" }, { label: "Architecture", color: "#f59e0b" },
          { label: "Operations", color: "#a855f7" }, { label: "Incident", color: "#ef4444" },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Navigation Config ────────────────────────────────────────────────────────

const navSections = [
  {
    title: "SDLC WORKFLOWS",
    items: [
      { id: "discovery" as ViewId, label: "Product Discovery", icon: Lightbulb },
      { id: "planning" as ViewId, label: "Planning & Requirements", icon: BookOpen },
      { id: "architecture" as ViewId, label: "Architecture", icon: Layers },
      { id: "development" as ViewId, label: "Development", icon: Code2 },
      { id: "qa" as ViewId, label: "QA & Validation", icon: FlaskConical },
      { id: "deployment" as ViewId, label: "Deployment", icon: Rocket },
      { id: "observability" as ViewId, label: "Observability", icon: Activity },
    ],
  },
  {
    title: "AI ORCHESTRATION",
    items: [
      { id: "agents" as ViewId, label: "Agents", icon: Bot },
      { id: "workflows" as ViewId, label: "Workflow Runs", icon: Workflow },
      { id: "approvals" as ViewId, label: "Approvals", icon: CheckSquare, badge: "7" },
      { id: "artifacts" as ViewId, label: "Artifacts", icon: FileText },
      { id: "context-graph" as ViewId, label: "Context Graph", icon: Network },
    ],
  },
  {
    title: "GITHUB OPERATIONS",
    items: [
      { id: "repositories" as ViewId, label: "Repositories", icon: FolderGit2 },
      { id: "issues" as ViewId, label: "Issues & Projects", icon: ListChecks },
      { id: "pull-requests" as ViewId, label: "Pull Requests", icon: GitPullRequest },
      { id: "pipelines" as ViewId, label: "CI/CD Pipelines", icon: Zap },
    ],
  },
  {
    title: "GOVERNANCE",
    items: [
      { id: "policies" as ViewId, label: "Policies", icon: Shield },
      { id: "audit" as ViewId, label: "Audit Logs", icon: ScrollText },
      { id: "security" as ViewId, label: "Security", icon: Lock },
    ],
  },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ active, setView }: { active: ViewId; setView: (v: ViewId) => void }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <aside className="w-56 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-sidebar-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Cpu size={14} className="text-primary-foreground" />
        </div>
        <div>
          <div className="text-xs font-bold text-foreground tracking-tight">AgenticSDLC</div>
          <div className="text-[10px] text-muted-foreground">AI Orchestration Platform</div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-5">
        {/* Dashboard */}
        <button
          onClick={() => setView("dashboard")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors ${active === "dashboard" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"}`}
        >
          <LayoutDashboard size={13} />
          Dashboard
        </button>

        {navSections.map(section => (
          <div key={section.title}>
            <button
              onClick={() => setCollapsed(c => ({ ...c, [section.title]: !c[section.title] }))}
              className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-semibold tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-1"
            >
              <span>{section.title}</span>
              {collapsed[section.title] ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
            </button>
            {!collapsed[section.title] && (
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors ${active === item.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"}`}
                  >
                    <item.icon size={13} className="flex-shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {"badge" in item && item.badge && (
                      <span className="px-1.5 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded text-[10px] font-medium">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-2 py-3">
        <button
          onClick={() => setView("settings")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors ${active === "settings" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"}`}
        >
          <Settings size={13} />
          Settings
        </button>
      </div>
    </aside>
  );
}

// ─── Top Nav ──────────────────────────────────────────────────────────────────

function TopNav({ active }: { active: ViewId }) {
  const [notifOpen, setNotifOpen] = useState(false);

  const breadcrumb: Record<ViewId, string> = {
    dashboard: "Dashboard", discovery: "Product Discovery", planning: "Planning & Requirements",
    architecture: "Architecture", development: "Development", qa: "QA & Validation",
    deployment: "Deployment Center", observability: "Observability", agents: "AI Agents",
    workflows: "Workflow Runs", approvals: "Approvals", artifacts: "Artifact Workspace",
    "context-graph": "Context Graph", repositories: "Repositories", issues: "Issues & Projects",
    "pull-requests": "Pull Requests", pipelines: "CI/CD Pipelines", policies: "Policies",
    audit: "Audit Logs", security: "Security", settings: "Settings",
  };

  return (
    <header className="h-12 border-b border-border flex items-center px-4 gap-4 bg-background/95 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>AgenticSDLC</span>
        <ChevronRight size={11} />
        <span className="text-foreground font-medium">{breadcrumb[active]}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 bg-muted rounded px-2.5 py-1.5 w-52">
        <Search size={11} className="text-muted-foreground flex-shrink-0" />
        <input
          placeholder="Search artifacts, agents…"
          className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full"
        />
        <kbd className="text-[9px] text-muted-foreground border border-border rounded px-1">⌘K</kbd>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        9 agents active
      </div>

      <div className="relative">
        <button
          onClick={() => setNotifOpen(o => !o)}
          className="relative w-8 h-8 rounded-md bg-muted flex items-center justify-center hover:bg-sidebar-accent transition-colors"
        >
          <Bell size={13} className="text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full border border-background" />
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-10 w-72 bg-popover border border-border rounded-lg shadow-2xl z-50 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border text-xs font-medium text-foreground">Notifications</div>
            {[
              { text: "Security Reviewer flagged OWASP A07 risk", time: "35m ago", type: "warning" },
              { text: "PR #487 awaiting your approval", time: "2h ago", type: "info" },
              { text: "Deploy to production pending approval", time: "3h ago", type: "warning" },
            ].map((n, i) => (
              <div key={i} className="px-3 py-2.5 hover:bg-muted/40 transition-colors cursor-pointer border-b border-border last:border-0">
                <div className="flex gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.type === "warning" ? "bg-amber-400" : "bg-blue-400"}`} />
                  <div>
                    <div className="text-xs text-foreground">{n.text}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{n.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pl-2 border-l border-border">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white">
          AK
        </div>
        <div className="hidden sm:block">
          <div className="text-xs font-medium text-foreground">Abhay Kumar</div>
          <div className="text-[10px] text-muted-foreground">Solution Architect</div>
        </div>
      </div>
    </header>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<ViewId>("dashboard");

  const githubTabMap: Partial<Record<ViewId, "repos" | "prs" | "issues" | "pipelines">> = {
    repositories: "repos",
    "pull-requests": "prs",
    issues: "issues",
    pipelines: "pipelines",
  };

  function renderView() {
    switch (view) {
      case "dashboard":   return <DashboardView setView={setView} />;
      case "workflows":   return <WorkflowsView />;
      case "agents":      return <AgentsView />;
      case "approvals":   return <ApprovalsView />;
      case "artifacts":   return <ArtifactsView />;
      case "context-graph": return <ContextGraphView />;
      case "repositories":
      case "pull-requests":
      case "issues":
      case "pipelines":
        return <GithubView initialTab={githubTabMap[view]} />;
      case "audit":       return <AuditView />;
      case "discovery":   return <ProductDiscoveryView />;
      case "planning":    return <PlanningView />;
      case "architecture": return <ArchitectureView />;
      case "development": return <DevelopmentView />;
      case "qa":          return <QAView />;
      case "deployment":  return <DeploymentView />;
      case "observability": return <ObservabilityView />;
      case "policies":    return <ComingSoon title="Policy Management" icon={Shield} />;
      case "security":    return <ComingSoon title="Security Center" icon={Lock} />;
      case "settings":    return <ComingSoon title="Platform Settings" icon={Settings} />;
      default:            return <DashboardView setView={setView} />;
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar active={view} setView={setView} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNav active={view} />
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
