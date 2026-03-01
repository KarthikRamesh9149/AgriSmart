# 🚀 Restart Server & Test Everything

## Step 1: Kill All Old Processes
```bash
taskkill /F /IM node.exe
# Or via PowerShell:
# Stop-Process -Name node -Force -ErrorAction SilentlyContinue
```

## Step 2: Start Dev Server Fresh
```bash
cd "c:\Users\rames\OneDrive\Desktop\Mistral hackathon"
npm run dev
```

**Wait for output**:
```
Server: listening on localhost:3000
Client: ready in XXXms at http://localhost:5173
```

## Step 3: Open App in Browser
```
http://localhost:5173
```

## Step 4: Watch Server Logs
Keep the terminal window visible to see logs. You should see detailed logging now with:
- `Calling Mistral API` messages
- `Time-travel snapshot from Mistral API SUCCESS` (if working)
- Or `Mistral API FAILED` (if there's an issue)

## Step 5: Test Time Travel
1. Click any hotspot on map
2. Right panel → "Land Intelligence" tab
3. Drag slider: 2000 → 2026 → 2050
4. **Watch server logs** - you should see API calls happening
5. **Verify values change**: 23°C → 26°C → 29°C

## Step 6: Test CSV Generate
1. Click hotspot → "Policy Simulator" tab
2. Upload CSV
3. Click "✨ Generate"
4. **Watch server logs** - you should see `Calling Mistral API for feature3`
5. **Verify analysis appears** (not fallback message)

## If Still Using Fallback:

### Check Server Logs For:
- **"Mistral API FAILED"** - Shows the actual error
- **"hasKey: false"** - API key not being detected
- **Connection errors** - Network issues

### Common Issues:

**Issue 1: "hasKey: false"**
- API keys not being loaded from .env
- **Fix**: Verify .env file exists and has valid keys
  ```bash
  cat server/.env | grep MISTRAL_FEATURE
  ```

**Issue 2: Timeout errors**
- API taking too long to respond
- **Fix**: Network/firewall issue, check internet connection

**Issue 3: Response parse errors**
- Mistral API returning unexpected format
- **Fix**: Server logs will show what was returned

## Script to Monitor Logs Real-Time:

```bash
# In a separate terminal window
cd "c:\Users\rames\OneDrive\Desktop\Mistral hackathon"
npm run dev 2>&1 | grep -i "mistral\|feature\|api\|time-travel\|policy"
```

This filters for relevant log lines.

## Expected Server Log Output (When Working):

```
Time travel request:
  ℹ️ Time travel snapshot requested [feature:feature4, timeHorizon:2000]
  ℹ️ Calling Mistral API [feature:feature4, timeHorizon:2000]
  ✅ Time-travel snapshot from Mistral API SUCCESS [temp:23.2, rain:910, heat:22]

CSV generate request:
  ℹ️ Generating freeform policy analysis [feature:feature3, hasKey:true]
  ℹ️ Calling Mistral API for feature3
  ✅ Successfully generated policy analysis [feature:feature3, responseLength:453]
```

## Expected Server Log Output (When Fallback):

```
Time travel request:
  ℹ️ Time travel snapshot requested [feature:feature4, timeHorizon:2000, hasKey:false]
  ❌ Feature4 key not available, using deterministic
  ℹ️ Returning deterministic fallback [source:deterministic_fallback]

CSV generate request:
  ℹ️ Generating freeform policy analysis [feature:feature3, hasKey:false]
  ❌ Feature3 API key not configured
  ❌ Failed to generate freeform policy analysis [error:Feature3 API key not configured]
```

## Checklist:

```
[ ] Killed all node.exe processes
[ ] Started npm run dev
[ ] See "Client: ready" message
[ ] Opened http://localhost:5173
[ ] Tested time travel slider (checked server logs)
[ ] Tested CSV generate (checked server logs)
[ ] Saw "Mistral API SUCCESS" in logs (or "FAILED" with error details)
```

## If Everything Works:

```
Time Travel: ✅ Shows 23°C → 26°C → 29°C
CSV Generate: ✅ Shows Mistral AI analysis
Server Logs: ✅ Show "SUCCESS" messages
```

## If Still Broken:

**Share the server log output showing**:
1. What happens when you test time travel
2. What happens when you test CSV generate
3. Any "FAILED" or error messages

Then I can see exactly what's failing and fix it.
