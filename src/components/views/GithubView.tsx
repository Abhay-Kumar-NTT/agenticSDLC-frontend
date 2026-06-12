import { useState, useEffect } from "react";
import {
  FolderGit2, GitPullRequest, ListChecks, Zap, Plus, RefreshCw,
  XCircle, Info, Github, GitBranch, GitCommit
} from "lucide-react";
import { pullRequests } from '../../data';
import * as githubService from '../../services/github.service';
import * as repositoryService from '../../services/repository.service';

export function GithubView({ initialTab }: { initialTab?: "repos" | "prs" | "issues" | "pipelines" }) {
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
        alert(`❌ Failed to fetch repository: ${repoResponse.error || 'Unknown error'}`);
        setConnecting(false);
        return;
      }

      const repoData = repoResponse.data;
      console.log('Repository data:', repoData);

      // Save to database
      const saveResponse = await repositoryService.createRepository({
        fullName: `${repoOwner}/${repoName}`,
        name: repoName,
        owner: repoOwner,
        url: repoData.html_url || `https://github.com/${repoOwner}/${repoName}`,
        description: repoData.description || '',
        language: repoData.language || 'Unknown',
        stars: repoData.stargazers_count || 0,
        branches: repoData.default_branch ? 1 : 0,
        status: 'active',
      });

      if (saveResponse.success && saveResponse.data) {
        console.log('✅ Repository saved to database:', saveResponse.data);

        // Add to local state
        setConnectedRepos(prev => [...prev, saveResponse.data]);

        // Close modal and reset form
        setShowConnectModal(false);
        setRepoOwner('');
        setRepoName('');

        alert(`✅ Successfully connected to ${repoOwner}/${repoName}`);
      } else {
        alert(`❌ Failed to save repository: ${saveResponse.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error connecting repository:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setConnecting(false);
    }
  };

  // Handle disconnecting a repository
  const handleDisconnectRepo = async (repoId: string, repoFullName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${repoFullName}?`)) {
      return;
    }

    try {
      console.log(`Disconnecting repository: ${repoFullName} (ID: ${repoId})`);
      const response = await repositoryService.deleteRepository(repoId);

      if (response.success) {
        console.log('✅ Repository disconnected from database');
        setConnectedRepos(prev => prev.filter(r => r.id !== repoId));
        alert(`✅ Successfully disconnected ${repoFullName}`);
      } else {
        alert(`❌ Failed to disconnect repository: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error disconnecting repository:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-5 h-full overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-foreground">GitHub Operations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage repositories, PRs, issues, and CI/CD pipelines</p>
        </div>
        {tab === "repos" && (
          <button
            onClick={() => setShowConnectModal(true)}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
          >
            <Plus size={12} /> Connect Repository
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon size={11} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "repos" && (
        <>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : connectedRepos.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FolderGit2 size={32} className="mx-auto mb-3 opacity-50" />
                <div className="text-sm font-medium">No repositories connected</div>
                <div className="text-xs mt-1 mb-4">Connect a GitHub repository to get started</div>
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Connect Repository
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3">
              {connectedRepos.map(r => (
                <div
                  key={r.id}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer group relative"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-foreground text-sm flex items-center gap-2">
                      <Github size={14} className="flex-shrink-0" />
                      {r.fullName || r.name}
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
