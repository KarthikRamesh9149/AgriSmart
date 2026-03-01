# 🚀 FINAL RESTART & TESTING GUIDE

## ⚡ QUICK START (5 minutes)

### Option A: Automatic (RECOMMENDED)
1. Double-click: **`START_DEV_SERVER.bat`** in the project folder
2. Wait for both messages:
   - ✅ "Server: listening on localhost:3000"
   - ✅ "Client: ready in XXXms at http://localhost:5173"
3. Open browser: **http://localhost:5173**
4. Jump to [Testing](#testing-both-features) section

### Option B: Manual (Command Prompt)
1. Press `Win+R`
2. Type: `cmd`
3. Paste:
```cmd
cd "c:\Users\rames\OneDrive\Desktop\Mistral hackathon"
npm run dev
```
4. Wait for both "listening" and "ready" messages
5. Open browser: **http://localhost:5173**

---

## 📋 TESTING BOTH FEATURES

Keep terminal visible to watch logs. Look for **"Mistral API SUCCESS"** messages.

### TEST #1: Time Travel Slider ⏰

**Expected**: Values change dramatically as you drag slider
- Year 2000: ~23°C, 910mm, 22 heat days (cool/wet)
- Year 2026: ~26°C, 700mm, 40 heat days (current)
- Year 2050: ~29°C, 525mm, 68 heat days (warm/dry)

**Steps**:
1. Click any **colored hotspot** on the map
2. Right panel → Click **"Land Intelligence"** tab
3. Find the **slider** (year range)
4. Drag slider from **2000 → 2050**
5. ✅ Watch values **CHANGE** (temperature increases, rainfall decreases)

**Server Log Should Show**:
```
[INFO] Time travel snapshot requested [feature:feature4, hasKey:true, timeHorizon:2000]
[INFO] Calling Mistral API [feature:feature4, timeHorizon:2000]
✅ Time-travel snapshot from Mistral API SUCCESS [temp:23.2, rain:910, heat:22]
```

**If values DON'T change**:
- Browser might be caching old code
- Press `Ctrl+Shift+R` to hard refresh
- Check server terminal for **"FAILED"** messages

---

### TEST #2: CSV Generate 📊

**Expected**: Analysis appears in ~3-5 seconds, NOT a fallback message

**Steps**:
1. Click any hotspot on map
2. Right panel → Click **"Policy Simulator"** tab
3. Click **"📁 Choose file"** button
4. Select any CSV or Excel file with data
5. After file uploads, click **"✨ Generate"** button
6. ✅ Watch for analysis to appear (real Mistral AI content, not "fallback mode")

**Server Log Should Show**:
```
[INFO] Generating freeform policy analysis [feature:feature3, hasKey:true]
[INFO] Calling Mistral API for feature3
✅ Successfully generated policy analysis [feature:feature3, responseLength:453]
```

**If still showing fallback**:
- Server logs will show **"Mistral API FAILED"** with error details
- Note the error message and share it

---

## 🔍 WHAT TO WATCH FOR IN TERMINAL

### ✅ WORKING (You'll see these):
```
[INFO] Time travel snapshot requested [feature:feature4, hasKey:true]
[INFO] Calling Mistral API [feature:feature4, timeHorizon:2000]
✅ Time-travel snapshot from Mistral API SUCCESS [temp:23.2, rain:910, heat:22]

[INFO] Generating freeform policy analysis [feature:feature3, hasKey:true]
[INFO] Calling Mistral API for feature3
✅ Successfully generated policy analysis [feature:feature3]
```

### ❌ BROKEN (If you see these):
```
[ERROR] Feature3 API key not configured
[ERROR] Mistral API FAILED [error: 401 Unauthorized]
[WARN] Failed to parse Mistral response
hasKey: false
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] Killed old node.exe processes (or used START_DEV_SERVER.bat)
- [ ] See "Server: listening on localhost:3000" in terminal
- [ ] See "Client: ready in XXXms at http://localhost:5173" in terminal
- [ ] Opened http://localhost:5173 in browser
- [ ] Clicked a hotspot on the map (turns white/highlighted)
- [ ] Time Travel: Dragged slider, saw temp/rainfall/heat_days **CHANGE**
- [ ] Server logs showed "Time-travel snapshot from Mistral API SUCCESS"
- [ ] CSV Generate: Uploaded file, clicked Generate, saw analysis appear
- [ ] Server logs showed "Successfully generated policy analysis"
- [ ] Browser console has NO red errors (only blue info logs are OK)

---

## 🎯 EXPECTED RESULTS

### If Everything Works ✅
```
Time Travel Slider:
  → Drag from 2000: 23°C drops to
  → Current 2026: 26°C rises to
  → Future 2050: 29°C
  ✅ OBVIOUSLY DIFFERENT

CSV Generate:
  → Upload CSV
  → Click Generate
  → See detailed analysis (not "fallback mode" message)
  ✅ NO ERROR, NO FREEZING

Server Logs:
  → Show "Mistral API SUCCESS" messages
  ✅ WORKING WITH REAL AI
```

### If Still Broken ❌
1. Check server terminal for **"FAILED"** or **"hasKey: false"**
2. Copy the entire error message
3. Verify .env file has keys:
   ```cmd
   type server\.env | find "MISTRAL_FEATURE"
   ```
4. Share the error details

---

## 📱 BROWSER TROUBLESHOOTING

If map doesn't load or you see errors:

1. **Hard Refresh** (clears cache):
   - Press `Ctrl+Shift+R` (Windows)
   - Or `Cmd+Shift+R` (Mac)

2. **Check Browser Console**:
   - Press `F12` to open Developer Tools
   - Click "Console" tab
   - Should be NO red error messages
   - Blue info logs are normal

3. **Check if Ports are In Use**:
   - Port 3000: Server
   - Port 5173: Client
   - If in use, kill processes and restart

---

## 🆘 QUICK DIAGNOSTICS

### "Values still look the same on slider"
- **Cause**: Browser cached old code OR fallback mode with tiny variations
- **Fix**: `Ctrl+Shift+R` hard refresh
- **Check**: Server logs for "Mistral API SUCCESS" vs "FAILED"

### "CSV button freezes, no response"
- **Cause**: API error not being handled
- **Fix**: Restart server, check logs for "FAILED"
- **Verify**: .env has MISTRAL_FEATURE3_KEY

### "No error messages but nothing changes"
- **Cause**: Silent fallback (happens if API is slow or times out)
- **Fix**: Check server logs for "hasKey: true" vs "hasKey: false"
- **Verify**: API keys are in .env

### "Server won't start (npm not found)"
- **Cause**: You're in Git Bash or shell without Node.js PATH
- **Fix**: Use Command Prompt or PowerShell instead
- **Alternative**: Double-click `START_DEV_SERVER.bat`

---

## 📞 IF STILL BROKEN

Share these details:
1. **Server log output** (last 20 lines showing the error)
2. **Browser console errors** (F12 → Console tab)
3. **Which test failed** (time travel or CSV)
4. **What you see** (fallback message, frozen button, etc.)

Then I can pinpoint exactly what's wrong and fix it.

---

## 🎉 SUCCESS CRITERIA

- ✅ Time travel slider shows 23°C → 26°C → 29°C (OBVIOUSLY DIFFERENT)
- ✅ CSV generate shows real analysis (not fallback message)
- ✅ No 500 errors, no frozen buttons
- ✅ Server logs show "Mistral API SUCCESS"
- ✅ Features work with real Mistral AI responses

**Ready? Start the server!** 🚀
