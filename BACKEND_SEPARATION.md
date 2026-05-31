# Backend Separation Complete

The backend code has been successfully separated into its own repository.

## Repository Structure

### Frontend Repository (Current)
- **Location**: `agenticSDLC-UI-Code/`
- **Contents**: React + Vite frontend application
- **Port**: 5173 (development)
- **Services**: Workflow designer UI, Live runs visualization

### Backend Repository (New)
- **Location**: `../agenticSDLC-backend/`
- **Contents**: Node.js + Express API server
- **Port**: 3001
- **Services**: REST API, PostgreSQL database

## What Changed

### Frontend (agenticSDLC-UI-Code)
- **Removed**: `backend/` directory
- **Kept**: 
  - Frontend source code (`src/`)
  - Services that call backend API (`src/services/`)
  - Environment configuration (`.env`)
  - Frontend dependencies

### Backend (agenticSDLC-backend)
- **Added**: Complete standalone backend with:
  - Express.js server
  - Database configuration
  - API routes
  - Models and database connection
  - Comprehensive documentation
  - Setup scripts
  - Git repository initialized

## How to Use

### 1. Backend Repository

#### Push to GitHub:
```bash
cd ../agenticSDLC-backend
git remote add origin https://github.com/yourusername/agenticSDLC-backend.git
git branch -M main
git push -u origin main
```

#### Clone and Run (for others):
```bash
git clone https://github.com/yourusername/agenticSDLC-backend.git
cd agenticSDLC-backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run setup-db
npm run dev
```

### 2. Frontend Repository

The frontend already has service files that connect to the backend at `http://localhost:3001`.

No changes needed in frontend code!

## Running Both Applications

### Terminal 1: Backend
```bash
cd agenticSDLC-backend
npm run dev
```

Output: `Server running on port 3001`

### Terminal 2: Frontend
```bash
cd agenticSDLC-UI-Code
npm run dev
```

Output: `Local: http://localhost:5173/`

## API Connection

Frontend connects to backend via:
- **Base URL**: `http://localhost:3001`
- **Configuration**: `.env` file with `VITE_API_BASE_URL`
- **Service**: `src/services/workflow.service.ts`

## Documentation

### Backend Documentation
- `README.md` - Complete overview and documentation
- `SETUP.md` - Quick setup guide
- `API.md` - API endpoint reference

### Frontend Documentation
- Main README in frontend repo

## Benefits of Separation

1. **Independent Deployment**: Deploy frontend and backend separately
2. **Team Organization**: Frontend and backend teams can work independently
3. **Scalability**: Scale backend independently from frontend
4. **Version Control**: Separate commit history and release cycles
5. **Reusability**: Backend API can serve multiple frontends (web, mobile, etc.)

## Environment Variables

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_GITHUB_TOKEN=your_token
VITE_GITHUB_OWNER=your_username
VITE_GITHUB_REPO=agenticsdlc-agents
```

### Backend (.env)
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

## Production Deployment

### Option 1: Same Server
- Backend: `http://your-domain.com/api`
- Frontend: `http://your-domain.com`
- Use reverse proxy (nginx)

### Option 2: Separate Servers
- Backend: `https://api.your-domain.com`
- Frontend: `https://app.your-domain.com`
- Update CORS and API base URL

### Option 3: Cloud Services
- Backend: Heroku, Railway, Render
- Frontend: Vercel, Netlify, Cloudflare Pages
- Database: AWS RDS, DigitalOcean Managed Postgres

## Troubleshooting

### Frontend Can't Connect to Backend
1. Check backend is running: `curl http://localhost:3001/health`
2. Check CORS settings in backend `.env`
3. Verify `VITE_API_BASE_URL` in frontend `.env`

### Backend Database Connection Failed
1. Check PostgreSQL is running
2. Verify credentials in backend `.env`
3. Run: `npm run test-db`

## Next Steps

1. ✅ Backend separated and committed to git
2. ⬜ Push backend to GitHub
3. ⬜ Update frontend README to reference backend repo
4. ⬜ Add CI/CD pipelines (optional)
5. ⬜ Add authentication layer (future)
6. ⬜ Add API rate limiting (future)

## Support

- Backend issues: Check `../agenticSDLC-backend/README.md`
- Frontend issues: Check current repo documentation
- Integration issues: Verify environment variables in both projects
