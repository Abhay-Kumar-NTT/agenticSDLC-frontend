# GitHub Integration - Quick Setup Guide

## The Error You're Seeing

```
GitHub Workflow trigger failed: Failed to fetch
```

**Cause:** Missing GitHub configuration in `.env` file.

---

## Quick Fix (3 Steps)

### Step 1: Get Your GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Set name: `AgenticSDLC Integration`
4. Select scopes:
   - ✅ **repo** (all sub-scopes)
   - ✅ **workflow**
5. Click **"Generate token"**
6. **COPY THE TOKEN** (you won't see it again!)

### Step 2: Configure Environment

**Option A: Automated Setup (Recommended)**
```bash
# Run the setup script
setup-github.bat

# It will prompt you for your token
# Paste your token and press Enter
```

**Option B: Manual Setup**
1. Open `.env` file in the root directory
2. Find the line: `VITE_GITHUB_TOKEN=`
3. Add your token: `VITE_GITHUB_TOKEN=ghp_your_token_here`
4. Save the file

Your `.env` should look like:
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# GitHub Configuration
VITE_GITHUB_TOKEN=ghp_your_actual_token_here
VITE_GITHUB_OWNER=Abhay-Kumar-NTT
VITE_GITHUB_REPO=agenticsdlc-agents
```

### Step 3: Restart Frontend

```bash
# In your frontend terminal:
# 1. Press Ctrl+C to stop
# 2. Restart:
npm run dev
```

---

## Test the Fix

1. Open http://localhost:5173
2. Go to **Workflows** → **Workflow Designer**
3. Load a saved workflow with "Product Vision" as first node
4. Click **"Launch"** button
5. You should see: "GitHub workflow 'product-agent' triggered successfully"

---

## Verify Configuration

Run this command to check if configuration is loaded:
```bash
# In browser console (F12):
console.log(import.meta.env.VITE_GITHUB_TOKEN ? 'Configured' : 'Not configured')
```

Or check programmatically:
```bash
node -e "require('dotenv').config(); console.log(process.env.VITE_GITHUB_TOKEN ? 'Configured' : 'Missing')"
```

---

## Troubleshooting

### Error: "GitHub not configured"
- **Solution:** Make sure `.env` file exists with `VITE_GITHUB_TOKEN`
- **Solution:** Restart frontend after editing `.env`

### Error: "401 Unauthorized"
- **Cause:** Invalid token
- **Solution:** Generate a new token with correct scopes (repo, workflow)

### Error: "404 Not Found"
- **Cause:** Wrong owner or repo name
- **Solution:** Check `.env` values match your GitHub repo

### Error: "403 Forbidden"
- **Cause:** Token doesn't have `workflow` scope
- **Solution:** Regenerate token with `workflow` scope

### Error: "Failed to fetch" (still)
- **Cause 1:** Token has special characters, needs quotes
  - **Solution:** Wrap token in quotes: `VITE_GITHUB_TOKEN="ghp_..."`
- **Cause 2:** Frontend not restarted
  - **Solution:** Stop (Ctrl+C) and restart: `npm run dev`
- **Cause 3:** Browser cached old environment
  - **Solution:** Hard refresh: Ctrl+Shift+R

---

## Check Your Configuration

Your current setup:
- **Owner:** `Abhay-Kumar-NTT`
- **Repo:** `agenticsdlc-agents`
- **Workflow:** `product-agent.yml` (should be in `.github/workflows/`)

Verify the workflow file exists:
```bash
cd ../agenticsdlc-agents
ls .github/workflows/product-agent.yml
```

---

## Alternative: Test Without GitHub

If you want to test workflows without GitHub integration:

1. Keep `.env` with empty token:
   ```bash
   VITE_GITHUB_TOKEN=
   ```

2. The workflow will launch in "Live Runs" but won't trigger GitHub

3. You'll see: "GitHub workflow trigger failed" but workflow still works locally

---

## Security Notes

⚠️ **Important:**
- Never commit `.env` to git (it's in `.gitignore`)
- Never share your token
- Rotate tokens every 90 days
- Use minimum required scopes

---

## Quick Reference

```bash
# Setup
./setup-github.bat

# Restart frontend
npm run dev

# Check status
node check-services.cjs

# Test GitHub API manually
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.github.com/repos/Abhay-Kumar-NTT/agenticsdlc-agents/actions/workflows
```

---

## Need Help?

1. Check [GITHUB_INTEGRATION.md](GITHUB_INTEGRATION.md) for detailed guide
2. Run `node check-services.cjs` to verify all services
3. Check browser console (F12) for detailed errors
4. Check frontend terminal for build errors

---

## Files to Check

- ✅ `.env` - Must exist with VITE_GITHUB_TOKEN
- ✅ `setup-github.bat` - Automated setup script
- ✅ `src/services/github.service.ts` - GitHub API client
- ✅ `.github/workflows/product-agent.yml` - Workflow in agents repo

---

**Once configured, workflows with "Product Vision" will automatically trigger the GitHub workflow!** 🚀
