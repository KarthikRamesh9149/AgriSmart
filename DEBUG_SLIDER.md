# Debug Time Travel Slider

## Restart Server First

```bash
taskkill /F /IM node.exe
npm run dev
```

Wait for both messages:
```
✅ Server: listening on localhost:3000
✅ Client: ready in XXXms at http://localhost:5173
```

---

## Test 1: Check Slider Values

1. Open http://localhost:5173
2. Click ANY hotspot on map
3. Right panel → "🌍 Land Intelligence" tab
4. Find the **YEAR SLIDER** control
5. **Drag it from 2000 → 2050**

### Expected Values:
- **2000:** ~23°C, ~910mm, ~22 heat days (COOL)
- **2026:** ~26°C, ~700mm, ~40 heat days (CURRENT)
- **2050:** ~29°C, ~525mm, ~68 heat days (HOT)

### Check Temperature:
- ✅ Should change from 23 to 26 to 29 (6°C total difference!)
- ✅ NOT just 25.8, 26, 26.2 (tiny differences)

---

## Test 2: Check Browser Console

Press **F12** → **Console tab**

Look for messages like:
```javascript
// When you drag slider:
"Error fetching time-travel snapshot: ..."
// OR
"Mistral time-travel fetch failed, using local stubs: ..."
// OR (working)
"No errors shown"
```

**If you see errors:**
- Copy the error message
- Share it with me

---

## Test 3: Check Server Logs

In the **server terminal** (where you ran `npm run dev`):

Look for lines with:
```
[INFO] Calling Mistral API [feature:feature4
```

**If you see these:**
- ✅ Server is trying to call LLM (good!)
- Check next line for SUCCESS or FAILED

**If you DON'T see these:**
- ❌ Server not receiving the slider request
- Might be a network issue

---

## Test 4: Network Debugging

1. Press F12 → **Network tab**
2. Set filter to show XHR/Fetch only
3. Drag the slider
4. Look for request to `/api/llm/feature4-time-travel`

**Should see:**
```
POST /api/llm/feature4-time-travel
Status: 200 (success) OR 500/400 (error)
```

**If request doesn't appear:**
- ❌ Frontend not sending request
- Check if `USE_REAL_API` is true in cropApi.js

---

## Debugging Checklist

- [ ] Server started successfully (both "listening" and "ready" messages)
- [ ] Slider appears in Land Intelligence tab
- [ ] Can drag slider (responds to mouse)
- [ ] Temperature value changes when dragging
- [ ] Temperature shows 23/26/29 (NOT 25.8/26/26.2)
- [ ] No red errors in browser console
- [ ] Network tab shows API requests (or doesn't, depending on success)

---

## If Slider Still Shows Same Values

**Most Likely Cause:** Browser cached old code

**Fix:**
1. Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. Restart server if needed: `npm run dev`
3. Try again

---

## If Hard Refresh Doesn't Work

**Check these files:**
1. `client/src/hooks/useDistrictData.js` - Should NOT import `selectClimateSnapshot`
2. Look for baseline/current/projected values
3. Should see: `max_temp_c - 2.8`, `max_temp_c`, `max_temp_c + 3.5`

If values are different (like - 1.2, + 2.6), they haven't been updated.

---

## Complete Test Script

Run this in order:

```bash
# 1. Kill old processes
taskkill /F /IM node.exe

# 2. Wait 2 seconds
timeout /t 2

# 3. Start fresh server
cd "c:\Users\rames\OneDrive\Desktop\Mistral hackathon"
npm run dev

# Wait for "Client: ready" message
```

Then:
```
1. Open http://localhost:5173
2. Click hotspot → Land Intelligence tab
3. Drag slider: 2000 → 2050
4. Check if temperature changes: 23 → 26 → 29
5. If not, press Ctrl+Shift+R and try again
```

---

## Report Results

Tell me:
1. **Does temperature change when you drag slider?** (Yes/No)
2. **What values do you see?** (e.g., "25.8, 26, 26.2" or "23, 26, 29")
3. **Any red errors in console?** (Yes/No) If yes, what's the error?
4. **Server logs show API calls?** (Yes/No)

Then I can fix any remaining issues!

---

## Expected Flow (When Working)

```
1. Click hotspot
   → district data loads
   → slider shows year 2026 by default
   → temperature shows ~26°C

2. Drag slider to 2000
   → temperature changes to ~23°C
   → rainfall changes to ~910mm
   → heat days changes to ~22

3. Drag slider to 2050
   → temperature changes to ~29°C
   → rainfall changes to ~525mm
   → heat days changes to ~68

4. Server is trying API calls
   → May succeed (Mistral data) or fail
   → Falls back to these values either way
```

Let me know what you see!
