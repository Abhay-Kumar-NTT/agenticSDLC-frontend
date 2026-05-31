# Live Runs - Visibility Fix

## Issue: Nodes and Edges Not Visible on Live Runs Page

### What Was Fixed:

1. **Automatic Scaling & Centering** - Nodes now automatically scale to fit the Live Runs canvas (1120x320)
2. **Position Calculation** - Workflow is centered on the canvas
3. **Debug Logging** - Added console logs to track node positions
4. **Visual Indicator** - "Example Data" badge shows when no live runs exist

### Changes Made:

- **File:** `src/app/App.tsx` - `launchWorkflow()` function
- **What:** Added scaling logic to fit nodes within canvas bounds
- **How:** 
  - Calculates bounding box of workflow
  - Scales down if needed (never scales up)
  - Centers workflow on 1120x320 canvas
  - Preserves relative positions

---

## How to Test the Fix:

### Step 1: Restart Frontend (REQUIRED)
```bash
# In frontend terminal:
# Press Ctrl+C
# Then:
npm run dev
```

### Step 2: Launch a Workflow
1. Go to **Workflows** → **Workflow Designer**
2. Click **"Load"** on a saved workflow
3. Click **"Launch"** button
4. Wait for success alert
5. Tab automatically switches to **"Live Runs"**

### Step 3: Verify Nodes Are Visible
✅ **Good signs:**
- No "Example Data" badge
- Workflow name shows at top
- All nodes visible on canvas
- Lines connecting nodes
- First node has blue pulsing dot (running status)
- Other nodes are gray (waiting status)

❌ **Bad signs:**
- "Example Data" badge visible
- Empty canvas or only partial nodes
- No connecting lines

---

## Debug in Browser Console (F12)

After launching, check console for these logs:

```
Expected output:
------------------
Launching workflow: [Your Workflow Name]
Scaling workflow for Live Runs: scale=0.XX, offset=(XX, XX)
Workflow launched: [object]
Live run created with N nodes and M edges
Node positions: [Array showing positions]
Live Runs - Active run: [Your Workflow Name]
Live Runs - Nodes: N [Array]
Live Runs - Edges: M [Array]
```

### Check Node Positions:
```javascript
// In browser console (F12):
console.table(displayNodes.map(n => ({
  label: n.label,
  x: Math.round(n.x),
  y: Math.round(n.y),
  status: n.status
})));
```

All nodes should have:
- X between 0 and 1120
- Y between 0 and 320

---

## Common Issues:

### Issue 1: Still See "Example Data" Badge

**Cause:** Workflow didn't launch properly

**Fix:**
1. Check for errors in console
2. Make sure backend is running: `node check-services.cjs`
3. Try launching again
4. Check database has the workflow: `curl http://localhost:3001/api/workflows`

### Issue 2: Nodes Still Outside Canvas

**Cause:** Very large workflow that can't fit even with scaling

**Check console for:**
```
Scaling workflow for Live Runs: scale=0.XX
```

If scale is very small (<0.3), nodes might be too tiny to see.

**Workaround:** Create smaller workflows with fewer nodes

### Issue 3: Edges Don't Connect

**Cause:** Node ID mismatch between nodes and edges

**Check console for:**
```javascript
// Should see matching IDs:
const nodeIds = displayNodes.map(n => n.id);
const edgeIds = displayEdges.flatMap(e => [e.fromId, e.toId]);
console.log('Node IDs:', nodeIds);
console.log('Edge refs:', edgeIds);
```

---

## Manual Test Commands:

### Test 1: Check Services
```bash
node check-services.cjs
```

All should be RUNNING.

### Test 2: Check API
```bash
# Get workflows
curl http://localhost:3001/api/workflows

# Get specific workflow (replace ID)
curl http://localhost:3001/api/workflows/YOUR-WORKFLOW-ID
```

Should return nodes and edges arrays.

### Test 3: Verify in Browser
```
1. Open http://localhost:5173
2. Open DevTools (F12) → Console tab
3. Go to Workflows → Workflow Designer → Saved Workflows
4. Click "Launch" on any workflow
5. Watch console logs
6. Verify nodes appear in Live Runs
```

---

## Expected Behavior:

### Before Launch:
- **Live Runs tab** shows "Example Data" badge
- Shows default "User Auth Module v2.4.1" workflow
- Example nodes at predefined positions

### After Launch:
- **Live Runs tab** badge shows count (e.g., "Live Runs 1")
- No "Example Data" badge
- Shows YOUR workflow name
- All your nodes visible and centered
- First node has blue pulsing indicator
- Other nodes are gray

---

## Scaling Logic:

```javascript
Target canvas: 1120 x 320 pixels
Node size: 128 x 56 pixels
Padding: 40 pixels on each side

Process:
1. Calculate workflow bounding box
2. Calculate scale to fit (with padding)
3. Never scale up, only down
4. Center scaled workflow
5. Apply to all nodes
```

Example:
```
Original workflow: 800x400 at (100, 200)
Canvas available: 1040x240 (with padding)
Scale: min(1040/800, 240/400) = min(1.3, 0.6) = 0.6
Scaled workflow: 480x240
Offset to center: (320, 40)
```

---

## Files Modified:

| File | Function | Change |
|------|----------|--------|
| `App.tsx` | `launchWorkflow()` | Added scaling & centering logic |
| `App.tsx` | `SprintCanvas` | Added debug logging |
| `App.tsx` | Live Runs header | Added "Example Data" badge |

---

## Need More Help?

1. **Capture console logs:**
   - Open DevTools (F12)
   - Go to Console tab
   - Launch workflow
   - Copy all console output
   - Share the logs

2. **Check workflow data:**
   ```bash
   # Get your workflow from database
   curl http://localhost:3001/api/workflows | json_pp
   ```

3. **Verify node count:**
   - Should match between saved workflow and live run
   - Check console: "Live run created with N nodes"

---

## Quick Fix Checklist:

- [ ] Frontend restarted after code changes
- [ ] Backend running (port 3001)
- [ ] Database connected
- [ ] Workflow saved to database
- [ ] Launch button clicked
- [ ] Success alert appeared
- [ ] Tab switched to Live Runs
- [ ] Console logs show scaling applied
- [ ] No "Example Data" badge visible
- [ ] Nodes visible on canvas
- [ ] Edges connecting nodes
- [ ] First node showing "running" status

If all checked, nodes should be visible! 🎉

---

## Additional Improvements Applied:

1. ✅ Automatic scaling for any workflow size
2. ✅ Automatic centering on canvas
3. ✅ Debug logging for troubleshooting
4. ✅ Visual indicator for example vs live data
5. ✅ Proper status assignment (first node running, others waiting)
6. ✅ Node positions logged to console
7. ✅ Responsive canvas with scrolling support

The Live Runs page should now properly display all workflows! 🚀
