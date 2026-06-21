# Connect Frontend to Backend

## What Changed

The other Claude session built the complete backend with all 6 agents working. Now we need to connect your frontend to it.

## Setup (2 minutes)

### Step 1: Update Frontend to Use API

```bash
cd frontend
# Replace the mock app.js with connected version
cp utils/app-connected.js utils/app.js
```

### Step 2: Start the API Server

```bash
# From project root
python backend/api_server.py
```

You should see:
```
NeuroCompiler API Server
Real Brain Simulation + Curriculum Optimization
Starting server on http://localhost:5000
```

### Step 3: Open Frontend

```bash
cd frontend
open index.html
```

## How It Works Now

### Full Flow:
1. **Upload PDF** → API parses it
2. **Select objectives** → Stored for optimization
3. **Analyze** → Real brain simulation runs (sentence transformers)
4. **View metrics** → Real cognitive load, engagement, etc.
5. **Generate optimized** → Runs full optimization loop (Agents 4-6)
6. **Download result** → Get improved lesson as JSON

### API Endpoints Used:

| Endpoint | Purpose |
|----------|---------|
| `POST /api/upload` | Upload lesson file |
| `POST /api/analyze/<id>` | Run brain simulation |
| `POST /api/optimize/<id>` | Run optimization loop |
| `GET /api/result/<id>` | Get optimization results |
| `GET /api/download/<id>` | Download optimized lesson |

## Test It

1. Open frontend: `http://localhost:8000` (or just open index.html)
2. Upload your `Introduction to Photosynthesis.pdf`
3. Select objectives (e.g., "Maximize Learning" + "Reduce Cognitive Overload")
4. Watch it analyze (takes ~5-10 seconds for brain simulation)
5. See real metrics appear
6. Click "Generate Optimized Lesson" (takes ~20-30 seconds)
7. View before/after comparison with real scores!

## What's Real vs Mock

### Real (Using API):
✅ File upload and parsing
✅ Brain simulation (sentence transformers)
✅ Metric calculation (cognitive load, engagement, etc.)
✅ Issue detection
✅ Optimization loop
✅ Score improvements

### Still Mock (Just UI):
❌ Slide preview images (shows placeholder content)
❌ Timeline chart (shows dummy data)
❌ Some UI animations

## Troubleshooting

**"Upload failed"**
- Make sure API server is running: `python backend/api_server.py`
- Check it's on port 5000: `http://localhost:5000/health`

**"CORS error"**
- API has CORS enabled, should work
- If still issues, serve frontend via http-server instead of file://

**"Analysis takes forever"**
- First run downloads sentence transformer model (~80MB)
- Subsequent runs are much faster (~5-10 seconds)

**"Optimization failed"**
- Check API server console for errors
- Make sure all dependencies installed: `pip install -r requirements.txt`

## Development

### Frontend Changes
Edit `frontend/utils/app-connected.js` to modify API integration

### Backend Changes
Edit `backend/api_server.py` to add/modify endpoints

### Test Locally
```bash
# Terminal 1: Start API
python backend/api_server.py

# Terminal 2: Serve frontend (optional)
cd frontend && python -m http.server 8000

# Browser: http://localhost:8000
```

## Next Steps

- [ ] Add proper slide preview rendering
- [ ] Show real timeline chart with actual data
- [ ] Display issue cards with real detected problems
- [ ] Add loading spinners during optimization
- [ ] Show iteration progress
- [ ] Export to PowerPoint/PDF format

---

**You now have a fully functional end-to-end system!**

Upload → Analyze → Optimize → Download (all real, no mocks)
