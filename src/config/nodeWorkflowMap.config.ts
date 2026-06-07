// Maps every canvas node type to the GitHub Actions workflow it triggers
// and the node config key whose value becomes the workflow input.

export interface NodeWorkflowMapping {
  file: string;       // GitHub workflow filename, e.g. 'code-analyst.yml'
  inputKey: string;   // key in node.inputs that maps to the workflow dispatch input
  label?: string;     // friendly label shown in the UI
}

export const NODE_WORKFLOW_MAP: Record<string, NodeWorkflowMapping | null> = {
  'product-vision':    { file: 'product-agent.yml',       inputKey: 'vision_document',         label: 'Product Agent' },
  'prd':               { file: 'business-analyst.yml',    inputKey: 'vision_path',              label: 'Business Analyst' },
  'epic':              { file: 'product-strategist.yml',  inputKey: 'prd_path',                 label: 'Product Strategist' },
  'user-story':        { file: 'product-strategist.yml',  inputKey: 'epic_path',                label: 'Product Strategist' },
  'code-analysis':     { file: 'code-analyst.yml',        inputKey: 'repository_url_or_path',   label: 'Code Analyst' },
  'design-analysis':   { file: 'design-analyst.yml',      inputKey: 'design_path',              label: 'Design Analyst' },
  'hld':               { file: 'solution-architect.yml',  inputKey: 'requirements_path',        label: 'Solution Architect' },
  'lld':               { file: 'architecture-agent.yml',  inputKey: 'hld_path',                 label: 'Architecture Agent' },
  'adr':               { file: 'solution-architect.yml',  inputKey: 'context_path',             label: 'Solution Architect' },
  'api-contract':      { file: 'solution-architect.yml',  inputKey: 'spec_path',                label: 'Solution Architect' },
  'ui-ux':             { file: 'design-analyst.yml',      inputKey: 'requirements_path',        label: 'Design Analyst' },
  'code-module':       { file: 'frontend-developer.yml',  inputKey: 'story_path',               label: 'Frontend Developer' },
  'pull-request':      null, // auto-created by dev agent — no direct trigger
  'test-strategy':     { file: 'qa-agent.yml',            inputKey: 'requirements_path',        label: 'QA Agent' },
  'test-cases':        { file: 'qa-engineer.yml',         inputKey: 'test_strategy_path',       label: 'QA Engineer' },
  'test-plan':         { file: 'qa-agent.yml',            inputKey: 'story_path',               label: 'QA Agent' },
  'test-suite':        { file: 'qa-engineer.yml',         inputKey: 'test_cases_path',          label: 'QA Engineer' },
  'test-report':       { file: 'qa-engineer.yml',         inputKey: 'test_suite_path',          label: 'QA Engineer' },
  'ai-agent-reviewer': { file: 'security-reviewer.yml',   inputKey: 'code_path',                label: 'Security Reviewer' },
  'human-in-loop':     null, // PAUSE — requires human approval before continuing
  'deployment':        { file: 'devops-agent.yml',        inputKey: 'artifact_path',            label: 'DevOps Agent' },
  'release':           { file: 'devops-agent.yml',        inputKey: 'deployment_path',          label: 'DevOps Agent' },
  'incident':          { file: 'incident-analyzer.yml',   inputKey: 'incident_details',         label: 'Incident Analyzer' },
  'monitoring':        { file: 'sre-agent.yml',           inputKey: 'service_name',             label: 'SRE Agent' },
};

/** Returns the input key label for the node property panel */
export function getInputLabel(nodeType: string): string {
  const mapping = NODE_WORKFLOW_MAP[nodeType];
  if (!mapping) return '';
  const labels: Record<string, string> = {
    vision_document: 'Vision Document Path',
    vision_path: 'Vision Document Path',
    prd_path: 'PRD Path',
    epic_path: 'Epic Path',
    repository_url_or_path: 'Repository URL / Path',
    design_path: 'Design Document Path',
    requirements_path: 'Requirements Path',
    hld_path: 'HLD Path',
    context_path: 'Context Path',
    spec_path: 'Spec Path',
    story_path: 'Story Path',
    test_strategy_path: 'Test Strategy Path',
    test_cases_path: 'Test Cases Path',
    test_suite_path: 'Test Suite Path',
    code_path: 'Code Path',
    artifact_path: 'Artifact Path',
    deployment_path: 'Deployment Path',
    incident_details: 'Incident Details',
    service_name: 'Service Name',
  };
  return labels[mapping.inputKey] || mapping.inputKey;
}
