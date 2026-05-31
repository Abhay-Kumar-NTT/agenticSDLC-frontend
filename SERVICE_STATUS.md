# Service Status Checker Guide

Quick reference for checking if backend services are running.

## 🚀 Quick Check Methods

### Method 1: Automated Status Checker (Recommended)

**Windows:**
```bash
# Double-click or run in terminal
check-services.bat
```

**Cross-platform (Node.js):**
```bash
node check-services.cjs
```

**Output:**
```
========================================
AgenticSDLC - Service Status Checker
========================================

[1/4] Checking PostgreSQL Database...
    ✓ RUNNING PostgreSQL is listening on port 5432

[2/4] Checking Backend API Server...
    ✓ RUNNING Backend is listening on port 3001
    ✓ HEALTHY Health endpoint responds

[3/4] Checking Frontend Dev Server...
    ✓ RUNNING Frontend is listening on port 5173

[4/4] Testing Database Connection...
    ✓ CONNECTED Database connection successful

========================================
Summary
========================================
PostgreSQL:  RUNNING
Backend:     RUNNING (HEALTHY)
Frontend:    RUNNING

✓ ALL SERVICES RUNNING
```

---

### Method 2: Manual Port Checks

**Check specific ports:**
```bash
# PostgreSQL (port 5432)
netstat -ano | findstr ":5432"

# Backend API (port 3001)
netstat -ano | findstr ":3001"

# Frontend Dev Server (port 5173)
netstat -ano | findstr ":5173"
```

**Expected output when running:**
```
TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    12345
```

---

### Method 3: Health Endpoints

**Backend health check:**
```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{"status":"healthy","environment":"development","timestamp":"2026-05-30T18:09:42.071Z"}
```

**Frontend check:**
```bash
curl http://localhost:5173
```

**Expected:** HTML content (frontend page)

---

### Method 4: Database Connection Test

```bash
cd backend
node test-db-simple.cjs
```

**Expected output:**
```
Testing PostgreSQL Connection...
✅ Connected successfully!
✅ Database time: 2026-05-30T18:09:42.071Z
✅ PostgreSQL version: PostgreSQL 18.4
```

---

## 📊 Service Ports Reference

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| PostgreSQL | 5432 | TCP | Database server |
| Backend API | 3001 | HTTP | REST API endpoints |
| Frontend Dev | 5173 | HTTP | Vite dev server |

---

## 🔧 Starting Services

### Start PostgreSQL
```bash
# Windows
net start postgresql*

# Linux/Mac
pg_ctl start
# or
sudo systemctl start postgresql
```

### Start Backend
```bash
cd backend
npm run dev
```

**Expected output:**
```
✅ Database connected successfully
🚀 Server running on: http://localhost:3001
```

### Start Frontend
```bash
npm run dev
```

**Expected output:**
```
➜  Local:   http://localhost:5173/
```

---

## 🛑 Stopping Services

### Stop Backend
Press `Ctrl+C` in the terminal running backend

### Stop Frontend
Press `Ctrl+C` in the terminal running frontend

### Stop PostgreSQL
```bash
# Windows
net stop postgresql*

# Linux/Mac
pg_ctl stop
```

---

## ⚡ Quick Start All Services

**Windows:**
```bash
# Double-click or run
START_TESTING.bat
```

This script will:
1. Check PostgreSQL status
2. Start backend in new window
3. Start frontend in new window
4. Open browser to http://localhost:5173

---

## 🔍 Troubleshooting

### Service Shows "STOPPED" but Should Be Running

**Check process ID:**
```bash
netstat -ano | findstr ":<port>"
```

The last column is the PID. Check what's using it:
```bash
tasklist | findstr "<PID>"
```

### Port Already in Use

**Kill process on port:**
```bash
# Find PID
netstat -ano | findstr ":3001"

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Database Connection Fails

**Check PostgreSQL service:**
```bash
Get-Service postgresql*
```

**Start if stopped:**
```bash
net start postgresql*
```

**Test connection:**
```bash
psql -U postgres -d agenticsdlc_dev
```

### Backend Shows "RUNNING" but "UNHEALTHY"

**Check backend logs in terminal**

Common issues:
- Database connection failed
- Missing environment variables
- Module import errors

**Restart backend:**
```bash
# Stop: Ctrl+C
# Start:
cd backend
npm run dev
```

### Frontend Won't Load

**Check for errors:**
```bash
# Look at frontend terminal logs
```

**Common fixes:**
```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

---

## 📈 Monitoring Services

### Watch Backend Logs
Terminal running `npm run dev` in backend/

### Watch Frontend Logs
Terminal running `npm run dev` in root

### Watch Database Logs
```bash
# Windows
Get-EventLog -LogName Application -Source PostgreSQL
```

---

## 🎯 Health Check URLs

Open in browser to verify:

- **Frontend:** http://localhost:5173
- **Backend Health:** http://localhost:3001/health
- **API Test:** http://localhost:3001/api/workflows

---

## 💡 Pro Tips

1. **Keep terminals open** - Don't close backend/frontend terminals while testing
2. **Check logs first** - If something fails, check terminal output
3. **Use automated checker** - Run `check-services.cjs` before testing
4. **Restart in order** - PostgreSQL → Backend → Frontend
5. **Port conflicts** - Make sure no other apps use 3001, 5173, or 5432

---

## 📝 Quick Command Reference

```bash
# Check all services
node check-services.cjs

# Start all (Windows)
START_TESTING.bat

# Check ports
netstat -ano | findstr ":3001"
netstat -ano | findstr ":5173"
netstat -ano | findstr ":5432"

# Health checks
curl http://localhost:3001/health
curl http://localhost:5173

# Database test
cd backend && node test-db-simple.cjs

# Start PostgreSQL
net start postgresql*

# Start backend
cd backend && npm run dev

# Start frontend
npm run dev
```

---

## 🆘 Need Help?

If services still won't start:
1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for initial setup
2. Check [WORKFLOW_SAVE_TEST.md](WORKFLOW_SAVE_TEST.md) for testing guide
3. Run `node check-services.cjs` to see detailed status
4. Check terminal logs for error messages
