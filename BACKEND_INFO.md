# Backend Repository Information

The backend code has been separated into its own repository for better organization and independent deployment.

## Backend Repository Location

**Local Path**: `../agenticSDLC-backend/`

**GitHub** (after you push): `https://github.com/YOUR_USERNAME/agenticSDLC-backend`

## What's in the Backend Repository?

- Express.js REST API server
- PostgreSQL database integration
- Workflow management endpoints (CRUD)
- Database schema and setup scripts
- Comprehensive documentation

## How to Run Backend

### Option 1: If you already have it locally

```bash
cd ../agenticSDLC-backend
npm install
npm run dev
```

### Option 2: Clone from GitHub (after pushing)

```bash
cd ..
git clone https://github.com/YOUR_USERNAME/agenticSDLC-backend.git
cd agenticSDLC-backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run setup-db
npm run dev
```

## Running Full Application

You need BOTH backend and frontend running:

### Terminal 1: Backend
```bash
cd agenticSDLC-backend
npm run dev
```
✅ Backend running on http://localhost:3001

### Terminal 2: Frontend
```bash
cd agenticSDLC-UI-Code
npm run dev
```
✅ Frontend running on http://localhost:5173

## Backend API Endpoints

The frontend connects to these backend endpoints:

- `GET /health` - Health check
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/:id` - Get workflow by ID
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

## Environment Configuration

**Frontend (`.env` in this repo):**
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_GITHUB_TOKEN=your_token
VITE_GITHUB_OWNER=your_username
VITE_GITHUB_REPO=agenticsdlc-agents
```

**Backend (`.env` in backend repo):**
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agenticsdlc
DB_USER=postgres
DB_PASSWORD="YourPassword"
CORS_ORIGIN=http://localhost:5173
```

## Services That Connect to Backend

These frontend services make API calls to the backend:

- `src/services/workflow.service.ts` - Workflow CRUD operations
- Base URL configured in `.env` as `VITE_API_BASE_URL`

## Troubleshooting

### "Failed to fetch" errors in frontend

**Cause**: Backend not running or wrong API URL

**Fix**:
1. Check backend is running: `curl http://localhost:3001/health`
2. Verify `VITE_API_BASE_URL` in frontend `.env`
3. Restart frontend after changing `.env`

### Backend database connection errors

**Fix**:
```bash
cd ../agenticSDLC-backend
npm run test-db
```

Check database credentials in backend `.env`

## Backend Documentation

For detailed backend documentation, see:

- `../agenticSDLC-backend/README.md` - Complete overview
- `../agenticSDLC-backend/SETUP.md` - Setup instructions  
- `../agenticSDLC-backend/API.md` - API documentation
- `../agenticSDLC-backend/QUICKSTART.md` - Quick start guide

## Pushing Backend to GitHub

See: `../agenticSDLC-backend/GITHUB_SETUP.md`

Quick steps:
```bash
cd ../agenticSDLC-backend
git remote add origin https://github.com/YOUR_USERNAME/agenticSDLC-backend.git
git branch -M main
git push -u origin main
```

## Benefits of Separation

✅ Independent deployment  
✅ Separate version control  
✅ Team can work independently  
✅ Scale backend separately  
✅ Reuse backend for multiple frontends  

## Need Help?

Check the backend repository documentation or open an issue in the respective repository.
