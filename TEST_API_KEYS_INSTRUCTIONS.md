# Test API Keys - Instructions

## Issue
The server is returning "API error: 500 Internal Server Error" when trying to use the Mistral API keys.

This could mean:
1. API keys are invalid/expired
2. API is temporarily down
3. Network/firewall issue
4. Rate limiting

---

## Step 1: Test API Keys with Node.js Script

### Run the Test

**Command Prompt:**
```cmd
cd "c:\Users\rames\OneDrive\Desktop\Mistral hackathon"
node test_api_keys_simple.js
```

You should see output like:
```
================================================================================
Testing Mistral API Keys
================================================================================

MISTRAL_FEATURE1_KEY      ✅ PASS
MISTRAL_FEATURE2_KEY      ✅ PASS
MISTRAL_FEATURE3_KEY      ✅ PASS
MISTRAL_FEATURE4_KEY      ✅ PASS
MISTRAL_BRIEF_KEY         ✅ PASS

================================================================================
Summary
================================================================================

Passed: 5/5
✅ All API keys are VALID and working!
```

### If Some Keys Fail

Look for error messages like:
- `❌ FAIL (401)` → Key is invalid or expired
- `❌ FAIL (429)` → Rate limit reached
- `❌ FAIL (500)` → Mistral service error
- `❌ FAIL (Network Error)` → Connection problem

---

## Step 2: If Keys Are Invalid

### Get New API Keys

1. Go to: https://console.mistral.ai
2. Log in with your account
3. Click "API Keys" in sidebar
4. Generate a NEW API key (if old one expired)
5. Copy the key

### Update .env File

Edit `server/.env`:

```bash
# Replace with your NEW keys:
MISTRAL_FEATURE1_KEY=<your_new_key_here>
MISTRAL_FEATURE2_KEY=<your_new_key_here>
MISTRAL_FEATURE3_KEY=<your_new_key_here>
MISTRAL_FEATURE4_KEY=<your_new_key_here>
MISTRAL_BRIEF_KEY=<your_new_key_here>
```

### Restart Server

```cmd
npm run dev
```

Then test again:
```cmd
node test_api_keys_simple.js
```

---

## Step 3: Check Server Logs

When you run the dev server, look for messages like:

### ✅ Working (you should see these):
```
[INFO] Calling Mistral API [feature:feature3, ...]
[INFO] Successfully generated policy analysis [feature:feature3]
```

### ❌ Not Working (you should NOT see these):
```
[ERROR] Mistral API FAILED [error: 401 Unauthorized]
[ERROR] Feature3 API key not configured
[WARN] Failed to parse Mistral response
```

---

## Step 4: Test in Browser

After confirming API keys work:

1. Start dev server: `npm run dev`
2. Open: http://localhost:5173
3. Click hotspot → "Policy Sim" tab
4. Upload CSV
5. Click "✨ Generate"
6. Wait for modal to appear

If 500 error still appears:
- Check Node.js server terminal for error messages
- Look for `[ERROR]` lines
- Share the error message

---

## Common Issues & Solutions

### Issue 1: "401 Unauthorized" Error
**Cause:** API key is wrong or expired

**Solution:**
1. Get a new API key from https://console.mistral.ai
2. Update `.env` file
3. Restart server

### Issue 2: "429 Too Many Requests" Error
**Cause:** Rate limit hit (too many API calls)

**Solution:**
1. Wait 5-10 minutes
2. Try again
3. If persistent, check if other services using same key

### Issue 3: "Connection Refused" / "Network Error"
**Cause:** Firewall or network issue

**Solution:**
1. Check internet connection
2. Check if firewall blocks api.mistral.ai
3. Try VPN if behind corporate network

### Issue 4: "500 Internal Server Error" (Still Appearing)
**Cause:** Mistral service might be down or key issue

**Solution:**
1. Run `node test_api_keys_simple.js` again
2. Check if keys pass validation
3. If keys pass but 500 still appears, try these debugging steps:
   - Hard refresh browser: `Ctrl+Shift+R`
   - Restart server: `npm run dev`
   - Check server logs for detailed error

---

## Debugging Steps (Advanced)

### Check .env is being read

In server terminal, you should see:
```
[INFO] Starting server...
[DEBUG] Configuration loaded
[DEBUG] API key count: 5
```

If you don't see this:
- Check `.env` file exists in root `server/` directory
- Check env variables are being loaded
- Restart server

### Check API call is happening

In browser DevTools (F12 → Network tab):
1. Click "Generate"
2. Look for request to `/api/llm/policy-freeform`
3. Check response:
   - ✅ 200 = Success (check response body)
   - ❌ 500 = Server error (check server logs)

### Check server logs in detail

When you click Generate, server should log:
```
[INFO] Generating freeform policy analysis [feature:feature3, hasKey:true]
[INFO] Calling Mistral API for feature3
```

If you see `hasKey:false`, the API key is not being read from `.env`.

---

## Quick Verification Checklist

- [ ] `.env` file exists in `server/` directory
- [ ] `.env` has all 5 API keys
- [ ] API keys are not blank or malformed
- [ ] Run `node test_api_keys_simple.js` → All pass ✅
- [ ] Start dev server: `npm run dev`
- [ ] Check server logs show "API key count: 5"
- [ ] Test in browser: Upload CSV → Click Generate
- [ ] Modal should appear without 500 error

---

## Command Reference

```bash
# Test API keys
node test_api_keys_simple.js

# Start dev server
npm run dev

# View .env file
cat server/.env | grep MISTRAL

# Kill old server
taskkill /F /IM node.exe
```

---

## Contact / Support

If keys pass validation but 500 error still appears:

1. Share the server terminal output (last 20 lines when error happens)
2. Share the browser console output (F12 → Console)
3. Share the API key test results (`node test_api_keys_simple.js` output)
4. I can then diagnose what's wrong

---

## Summary

1. **Run:** `node test_api_keys_simple.js`
2. **Check results** - all should show ✅ PASS
3. **If any FAIL:**
   - Get new keys from https://console.mistral.ai
   - Update `server/.env`
   - Restart server
4. **Test in browser** - should work now!

Good luck! 🚀
