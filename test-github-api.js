// Test GitHub API Connection
require('dotenv').config();
const https = require('https');

const GITHUB_TOKEN = process.env.VITE_GITHUB_TOKEN;
const GITHUB_OWNER = process.env.VITE_GITHUB_OWNER || 'Abhay-Kumar-NTT';
const GITHUB_REPO = process.env.VITE_GITHUB_REPO || 'agenticsdlc-agents';

console.log('========================================');
console.log('GitHub API Connection Test');
console.log('========================================\n');

console.log('Configuration:');
console.log(`  Owner: ${GITHUB_OWNER}`);
console.log(`  Repo:  ${GITHUB_REPO}`);
console.log(`  Token: ${GITHUB_TOKEN ? GITHUB_TOKEN.substring(0, 8) + '...' : 'NOT SET'}\n`);

if (!GITHUB_TOKEN) {
  console.log('❌ ERROR: VITE_GITHUB_TOKEN not set in .env file\n');
  console.log('To fix:');
  console.log('  1. Run: setup-github.bat');
  console.log('  2. Or edit .env and add your token\n');
  process.exit(1);
}

// Test 1: Get workflow info
console.log('[1/2] Testing: Get workflow file...');
const workflowOptions = {
  hostname: 'api.github.com',
  path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/product-agent.yml`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'AgenticSDLC'
  }
};

const req1 = https.request(workflowOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      const workflow = JSON.parse(data);
      console.log(`    ✅ SUCCESS - Found workflow: "${workflow.name}"`);
      console.log(`    ID: ${workflow.id}`);
      console.log(`    Path: ${workflow.path}`);
      console.log(`    State: ${workflow.state}\n`);
      
      // Test 2: Trigger workflow
      testTriggerWorkflow();
    } else {
      console.log(`    ❌ FAILED - Status: ${res.statusCode}`);
      console.log(`    Response: ${data}\n`);
      process.exit(1);
    }
  });
});

req1.on('error', (error) => {
  console.log(`    ❌ ERROR: ${error.message}\n`);
  process.exit(1);
});

req1.end();

function testTriggerWorkflow() {
  console.log('[2/2] Testing: Trigger workflow...');
  console.log('    (This will actually trigger the workflow in GitHub!)');
  
  const payload = JSON.stringify({
    ref: 'main',
    inputs: {
      vision_path: 'artifacts/vision.md'
    }
  });
  
  const triggerOptions = {
    hostname: 'api.github.com',
    path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/product-agent.yml/dispatches`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'AgenticSDLC',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };
  
  const req2 = https.request(triggerOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 204) {
        console.log('    ✅ SUCCESS - Workflow triggered!');
        console.log('    Status: 204 No Content (expected)\n');
        console.log('========================================');
        console.log('✅ ALL TESTS PASSED!');
        console.log('========================================\n');
        console.log('Check GitHub Actions:');
        console.log(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions\n`);
      } else {
        console.log(`    ❌ FAILED - Status: ${res.statusCode}`);
        console.log(`    Response: ${data}\n`);
        
        if (res.statusCode === 401) {
          console.log('Possible causes:');
          console.log('  - Invalid token');
          console.log('  - Token expired');
          console.log('  - Token needs "workflow" scope\n');
        } else if (res.statusCode === 404) {
          console.log('Possible causes:');
          console.log('  - Wrong owner or repo name');
          console.log('  - Workflow file does not exist');
          console.log('  - Workflow file not named product-agent.yml\n');
        }
      }
    });
  });
  
  req2.on('error', (error) => {
    console.log(`    ❌ ERROR: ${error.message}\n`);
  });
  
  req2.write(payload);
  req2.end();
}
