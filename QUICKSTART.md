# Quick Start Guide

## 🚀 Run the App (Local Development)

```bash
# Navigate to project root
cd "Mistral hackathon"

# Install dependencies (first time only)
npm install

# Start both client and server
npm run dev
```

**Output** (should see):
```
$ concurrently --kill-others-on-fail "npm run dev --workspace=server" "npm run dev --workspace=client"

Server:  Starting... http://localhost:3000
Client:  Starting... http://localhost:5173
```

---

## 🌐 Access the App

**Open in browser**: [`http://localhost:5173`](http://localhost:5173)

---

## ✨ Features Ready to Test

### 1. Time Travel (Feature 1 + Feature 4)
1. Click any hotspot on the map OR select a district from the sidebar
2. Right panel opens → Click "Land Intelligence" tab
3. Scroll down to "Time Horizon Slider"
4. Drag slider: 2000 → Current Year → 2050
5. ✅ Climate data should **change** for each year
   - **2000**: Cool/wet (historical baseline)
   - **2024**: Current actual data
   - **2050**: Warm/dry (projected future)

### 2. CSV Policy Upload (Feature 3)
1. Click any hotspot → Right panel opens
2. Click "Policy Simulator" tab
3. Drag & drop a CSV file OR click to upload
4. Once parsed, scroll down → Click **"✨ Generate"** button
5. Wait 2-5 seconds
6. ✅ Cabinet brief appears with Mistral-generated policy analysis

**Sample CSV format**:
```csv
district_id,crop,budget_amount_inr_lakh,subsidy_type,target_area_hectares
ahmednagar_mh,Sugarcane,50,Direct,1000
yavatmal_mh,Cotton,30,Input,500
```

### 3. Map District Colors (TerraYield Sync)
1. Map shows all India districts
2. Scroll to see color coding:
   - 🟢 **Green** = Low risk
   - 🟠 **Orange** = Medium risk
   - 🔴 **Red** = High risk
   - 🔴 **Dark Red** = Severe risk
3. Hover over districts → See tooltip
4. Click "Show all" toggle → Toggle between viewing all colors vs. only hovered

### 4. District Search
1. Top-left sidebar → "Search Districts" section
2. Type district name (e.g., "Ahmednagar")
3. Click result → Map zooms to district
4. Opens right panel with full data

---

## 🔑 Environment Setup

Mistral API keys are already configured in `server/.env`:
```
MISTRAL_FEATURE1_KEY=...
MISTRAL_FEATURE2_KEY=...
MISTRAL_FEATURE3_KEY=...
MISTRAL_FEATURE4_KEY=...  (new)
```

**No need to configure** — server proxy handles all LLM calls securely.

---

## 📋 Checklist Before Testing

- [ ] `npm install` completed successfully
- [ ] No error messages during startup
- [ ] Server shows "listening on 3000"
- [ ] Client shows "vite ready in XXXms"
- [ ] Browser opens to http://localhost:5173

---

## 🐛 Troubleshooting

### "npm: command not found"
- Install Node.js 18+ from https://nodejs.org/

### "Cannot find module 'xyz'"
- Run `npm install` again
- Delete `node_modules/` and reinstall: `npm install`

### Mistral API calls not working
- Check `server/.env` has all 4 keys
- Check server console for error messages
- Verify internet connection to api.mistral.ai

### Map not showing
- Check browser console (F12) for errors
- Verify GeoJSON files exist in `client/public/india/`
- Check `client/public/india/manifest.json`

---

## 📊 File Structure

```
Mistral hackathon/
├── client/                           # React app (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapScene.jsx         # Main map (with boundaries + colors)
│   │   │   ├── Sidebar.jsx          # Search + toggle
│   │   │   ├── RightPanel.jsx       # Feature tabs
│   │   │   ├── ErrorBoundary.jsx    # New
│   │   │   └── panels/
│   │   │       ├── LandIntelligence.jsx  # Feature 1 + time-travel
│   │   │       ├── CropMatchmaker.jsx    # Feature 2
│   │   │       └── PolicySimulator.jsx   # Feature 3
│   │   ├── utils/
│   │   │   ├── cropApi.js                      # Mistral calls
│   │   │   ├── districtsDegradationApi.js      # New
│   │   │   └── indiaBoundariesApi.js           # Updated
│   │   ├── hooks/
│   │   │   └── useDistrictData.js             # Orchestrator
│   │   └── constants/
│   │       └── mapConfig.js                   # Updated
│   └── public/
│       ├── data/
│       │   └── districts.csv                  # New
│       ├── india/
│       │   ├── manifest.json                  # Updated
│       │   └── *.geojson                      # New (33 files)
│       └── districts/
│           ├── ahmednagar_mh.json
│           ├── yavatmal_mh.json
│           ├── bathinda_pb.json
│           └── mandya_ka.json
│
├── server/                           # Node.js (Fastify)
│   ├── src/
│   │   ├── interfaces/
│   │   │   └── http/
│   │   │       └── routes/
│   │   │           └── llm.ts       # Feature 4 route
│   │   └── infrastructure/
│   │       └── ai/
│   │           └── MistralAiService.ts
│   └── .env                         # Keys (not in repo)
│
└── IMPLEMENTATION_SUMMARY.md        # New (this doc)
```

---

## 🎯 What's New

| Feature | Status | Change |
|---------|--------|--------|
| Time Travel (Mistral) | ✅ Fixed | Now shows different data per year |
| CSV Generate (Mistral) | ✅ Fixed | Button works with error feedback |
| District Boundaries | ✅ Synced | 33 states, colored by risk |
| District Search | ✅ Synced | Fuzzy match, zoom-to-district |
| Show All Colors Toggle | ✅ Synced | Toggle risk visualization |
| ErrorBoundary | ✅ Synced | Graceful error handling |

---

## 📞 Support

See `IMPLEMENTATION_SUMMARY.md` for detailed architecture + testing checklist.

---

**Ready to go!** 🚀
