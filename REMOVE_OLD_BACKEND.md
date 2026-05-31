# Remove Old Backend Folder

The backend code has been copied to a new repository at:
`../agenticSDLC-backend/`

The old `backend/` folder in this frontend repository is now a **duplicate** and should be removed.

## Why Remove It?

- ✅ Avoids confusion about which backend to use
- ✅ Prevents accidentally editing the wrong files
- ✅ Reduces repository size
- ✅ Clarifies that backend is now separate

## Current State

**Old (duplicate)**: `agenticSDLC-UI-Code/backend/` ❌ Should be removed
**New (official)**: `agenticSDLC-backend/` ✅ Use this one

## How to Remove

### Method 1: Using the Script (Easiest)

1. Close all open terminals
2. Close VS Code or any IDE
3. Close File Explorer if viewing backend folder
4. Run: `remove-backend.bat`

### Method 2: Manual Removal

1. Close all applications that might have files open:
   - File Explorer
   - VS Code / Any IDE
   - Any terminal in `backend/` directory
   - Node.js processes (npm run dev)

2. Delete the folder:
   - Open File Explorer
   - Navigate to: `agenticSDLC-UI-Code`
   - Right-click `backend` folder
   - Click "Delete"

3. If "file in use" error:
   - Open Task Manager (Ctrl+Shift+Esc)
   - End any Node.js or terminal processes
   - Try deleting again

### Method 3: Force Remove (if others fail)

1. Restart your computer (closes all file handles)
2. Delete the `backend` folder
3. Or use: `rmdir /s /q backend` in Command Prompt

## After Removal

Once the old `backend/` folder is removed:

### Update .gitignore (if tracking this repo in git)

Add to `.gitignore`:
```
# Backend is now in separate repository
backend/
```

### Update README.md

Add backend repository reference:
```markdown
## Backend Repository

This frontend connects to a separate backend API.

**Backend Repository**: https://github.com/YOUR_USERNAME/agenticSDLC-backend

See [BACKEND_INFO.md](BACKEND_INFO.md) for details.
```

### Update npm scripts (if any reference backend)

Check `package.json` for any scripts that reference `backend/`:
```json
// Remove scripts like:
"backend": "cd backend && npm start"  // ❌ Remove this
```

## Running Backend After Removal

The backend is now in a separate folder:

```bash
# Terminal 1: Backend (separate repository)
cd ../agenticSDLC-backend
npm run dev

# Terminal 2: Frontend (this repository)  
cd agenticSDLC-UI-Code
npm run dev
```

## Troubleshooting

### "Device or resource busy"

**Cause**: A program has files open in the backend folder

**Solutions**:
1. Close VS Code/IDE
2. Close all terminals
3. Close File Explorer
4. End Node.js processes in Task Manager
5. Restart computer (last resort)

### "Access denied"

**Cause**: Need administrator permissions

**Solution**: Right-click Command Prompt → "Run as administrator"
```cmd
cd "C:\Users\267564\OneDrive - NTT Data Group\_GenAI CoE\Exploration\agenticSDLC-UI-Code"
rmdir /s /q backend
```

### Node.js still running

Check for running processes:
```bash
netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

## Verification

After removing, verify:

```bash
cd agenticSDLC-UI-Code
ls -la backend  # Should show "No such file or directory"
```

✅ Old backend removed  
✅ New backend at `../agenticSDLC-backend/`  
✅ No duplication

## Important Notes

- **Don't delete** `../agenticSDLC-backend/` - that's the new official backend!
- **Only delete** `agenticSDLC-UI-Code/backend/` - that's the old duplicate
- The frontend services (`src/services/`) will continue to work - they connect via HTTP to localhost:3001

## Need the Backend?

If you need to run the backend:

```bash
# Navigate to the NEW backend location
cd ../agenticSDLC-backend

# Install and run
npm install
npm run dev
```

## Summary

| Location | Status | Action |
|----------|--------|--------|
| `agenticSDLC-UI-Code/backend/` | Duplicate ❌ | **DELETE** |
| `agenticSDLC-backend/` | Official ✅ | **KEEP & USE** |

The backend code exists in **one place only**: `../agenticSDLC-backend/`
