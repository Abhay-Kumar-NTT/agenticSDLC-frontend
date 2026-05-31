#!/usr/bin/env node

const http = require('http');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  green: '\x1b[92m',
  red: '\x1b[91m',
  yellow: '\x1b[93m',
  blue: '\x1b[94m',
  reset: '\x1b[0m'
};

console.log('========================================');
console.log('AgenticSDLC - Service Status Checker');
console.log('========================================\n');

// Check if port is listening
function checkPort(port) {
  try {
    const command = process.platform === 'win32' 
      ? `netstat -ano | findstr ":${port}"`
      : `lsof -i :${port}`;
    
    execSync(command, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Check HTTP endpoint
async function checkEndpoint(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Service status
const services = {
  database: { port: 5432, name: 'PostgreSQL Database', status: 'UNKNOWN' },
  backend: { port: 3001, name: 'Backend API Server', status: 'UNKNOWN', health: null },
  frontend: { port: 5173, name: 'Frontend Dev Server', status: 'UNKNOWN' }
};

async function checkServices() {
  // Check PostgreSQL
  console.log(`${colors.blue}[1/4] Checking PostgreSQL Database...${colors.reset}`);
  if (checkPort(5432)) {
    console.log(`    ${colors.green}✓ RUNNING${colors.reset} PostgreSQL is listening on port 5432`);
    services.database.status = 'RUNNING';
  } else {
    console.log(`    ${colors.red}✗ STOPPED${colors.reset} PostgreSQL is not running`);
    services.database.status = 'STOPPED';
  }

  // Check Backend
  console.log(`\n${colors.blue}[2/4] Checking Backend API Server...${colors.reset}`);
  if (checkPort(3001)) {
    console.log(`    ${colors.green}✓ RUNNING${colors.reset} Backend is listening on port 3001`);
    services.backend.status = 'RUNNING';

    // Check health endpoint
    const healthy = await checkEndpoint('http://localhost:3001/health');
    if (healthy) {
      console.log(`    ${colors.green}✓ HEALTHY${colors.reset} Health endpoint responds`);
      services.backend.health = 'HEALTHY';
    } else {
      console.log(`    ${colors.yellow}⚠ WARNING${colors.reset} Port open but health check failed`);
      services.backend.health = 'UNHEALTHY';
    }
  } else {
    console.log(`    ${colors.red}✗ STOPPED${colors.reset} Backend is not running`);
    services.backend.status = 'STOPPED';
  }

  // Check Frontend
  console.log(`\n${colors.blue}[3/4] Checking Frontend Dev Server...${colors.reset}`);
  if (checkPort(5173)) {
    console.log(`    ${colors.green}✓ RUNNING${colors.reset} Frontend is listening on port 5173`);
    services.frontend.status = 'RUNNING';
  } else {
    console.log(`    ${colors.red}✗ STOPPED${colors.reset} Frontend is not running`);
    services.frontend.status = 'STOPPED';
  }

  // Test Database Connection
  console.log(`\n${colors.blue}[4/4] Testing Database Connection...${colors.reset}`);
  try {
    execSync('node backend/test-db-simple.cjs', { stdio: 'pipe', cwd: __dirname });
    console.log(`    ${colors.green}✓ CONNECTED${colors.reset} Database connection successful`);
  } catch {
    console.log(`    ${colors.red}✗ FAILED${colors.reset} Cannot connect to database`);
  }

  // Summary
  console.log('\n========================================');
  console.log('Summary');
  console.log('========================================');
  console.log(`PostgreSQL:  ${services.database.status}`);
  console.log(`Backend:     ${services.backend.status}${services.backend.health ? ` (${services.backend.health})` : ''}`);
  console.log(`Frontend:    ${services.frontend.status}`);
  console.log('');

  // Overall status
  const allRunning = Object.values(services).every(s => s.status === 'RUNNING');
  
  if (allRunning) {
    console.log(`${colors.green}✓ ALL SERVICES RUNNING${colors.reset}\n`);
    console.log('You can access the application at:');
    console.log('  Frontend: http://localhost:5173');
    console.log('  Backend:  http://localhost:3001');
    console.log('  Health:   http://localhost:3001/health');
  } else {
    console.log(`${colors.red}✗ SOME SERVICES NOT RUNNING${colors.reset}\n`);
    console.log('To start missing services:');
    
    if (services.database.status === 'STOPPED') {
      console.log('  - PostgreSQL: net start postgresql* (Windows) or pg_ctl start (Linux/Mac)');
    }
    if (services.backend.status === 'STOPPED') {
      console.log('  - Backend: cd backend && npm run dev');
    }
    if (services.frontend.status === 'STOPPED') {
      console.log('  - Frontend: npm run dev');
    }
  }
  
  console.log('\n========================================');
  
  // Exit with appropriate code
  process.exit(allRunning ? 0 : 1);
}

checkServices().catch(console.error);
