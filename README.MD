# Curriculearn

**AI-Powered Curriculum Optimization Through Cognitive Simulation**

Curriculearn automatically analyzes and improves educational content by simulating brain responses and using Claude AI to generate content-specific recommendations. Upload a lesson, get instant feedback, and receive optimized versions that maximize learning outcomes.

---

## 🎯 Features

### **Brain-Based Analysis**
- Simulates cognitive responses using sentence transformers
- Measures engagement, cognitive load, concept flow, and retention
- Identifies specific problem segments with detailed diagnostics

### **Claude-Powered Optimization**
- Content-aware recommendations (not generic templates!)
- Generates real educational content (analogies, examples, transitions)
- Context-specific explanations tied to your lesson material
- Automatically creates improved lesson variants

### **Production-Ready System**
- Full-stack web application with React/Next.js frontend
- REST API backend with Flask
- Persistent storage (lessons survive restarts)
- Real-time updates and live scoring

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- Anthropic API key (for Claude agents)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/jshaha/Curriculearn-.git
cd Curriculearn-

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend-next
npm install
cd ..
```

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
# Required: Anthropic API key for Claude agents
ANTHROPIC_API_KEY=your-api-key-here

# Optional: Enable Claude agents (recommended)
USE_CLAUDE_AGENTS=true

# Optional: Claude model configuration
CLAUDE_MODEL=claude-sonnet-4-6
CLAUDE_TEMPERATURE=0.3
CLAUDE_FALLBACK_ENABLED=true
```

### 3. Start the Backend

```bash
python start_server.py
```

Backend will start on http://localhost:5001

### 4. Start the Frontend

```bash
cd frontend-next
npm run dev
```

Frontend will start on http://localhost:3000

### 5. Upload & Optimize!

1. Open http://localhost:3000
2. Navigate to a class
3. Upload a lesson PDF or document
4. View analysis with brain-based metrics
5. Click "Optimize" to get Claude-powered improvements

---

## 📚 Architecture

### Backend (Python/Flask)

```
backend/
├── api_server.py                    # REST API endpoints
├── neurocompiler/
│   ├── agents/
│   │   ├── claude/                  # Claude-powered agents
│   │   │   ├── diagnostician.py     # Finds issues in lessons
│   │   │   ├── curriculum_editor.py # Generates improvements
│   │   │   ├── prompts/             # System prompts
│   │   │   └── tools/               # Agent tools
│   │   ├── educational_diagnostician.py  # Deterministic fallback
│   │   ├── curriculum_editor.py     # Deterministic fallback
│   │   └── lesson_optimizer.py      # Optimization loop
│   └── schemas.py                   # Data models
└── src/
    ├── agents/
    │   ├── brain_simulator.py       # Sentence transformer brain sim
    │   ├── metric_translator.py     # Converts brain states to metrics
    │   └── curriculum_parser.py     # Parses PDFs/documents
    └── adapters/
        └── brain_simulator_adapter.py # Adapter for optimization loop
```

### Frontend (Next.js/React/TypeScript)

```
frontend-next/
├── app/                             # Next.js app router
│   └── class/[id]/                  # Class pages
│       ├── page.tsx                 # Brain visualization & upload
│       └── document/[docId]/        # Document analysis
├── components/
│   ├── DocumentAnalysis.tsx         # Metrics & recommendations
│   ├── CurriculumScore.tsx          # Overall score display
│   ├── MaterialUpload.tsx           # File upload
│   └── MetricsComparison.tsx        # Before/after comparison
├── lib/
│   ├── api.ts                       # Backend API client
│   ├── storage.ts                   # LocalStorage persistence
│   └── metrics.ts                   # Score calculations
└── three/                           # 3D brain visualization
```

---

## 🧠 How It Works

### 1. **Brain Simulation**
Uses `all-MiniLM-L6-v2` sentence transformer to generate semantic embeddings for each lesson segment. These 384-dimensional vectors represent cognitive activation patterns.

### 2. **Metric Translation**
Analyzes brain states to compute:
- **Learning Score** (0-100): Overall lesson quality
- **Engagement**: Topic diversity and variety
- **Cognitive Load**: Mental effort required (optimal: 40-60)
- **Concept Flow**: Smoothness of transitions
- **Retention**: Concept reinforcement through repetition
- **Novelty**: Introduction of new ideas
- **Information Density**: Rate of concept introduction

### 3. **Claude Diagnostician**
Examines metrics and lesson content to identify issues:
- Cognitive overload (too much info at once)
- Poor concept flow (abrupt transitions)
- Low retention (insufficient reinforcement)
- Low multimodal support (text-only)
- Novelty spikes (new concepts without preparation)

**Example Diagnosis:**
```
Issue: cognitive_overload (high severity)
Segment: "Chloroplast Structure"

Explanation: "This segment introduces 8 biochemistry terms
(thylakoid, stroma, NADPH, etc.) in a single dense paragraph,
overwhelming learners who just learned basic photosynthesis."

Recommendations:
- Split into two segments: (1) "Chloroplasts as Solar Panels"
  (big picture), (2) "Light Reactions in Thylakoids" (details)
- Remove jargon like "chemiosmosis" for middle school audience
```

### 4. **Claude Curriculum Editor**
Generates concrete improvements:
- Splits dense sections with real content
- Adds analogies specific to the subject matter
- Inserts transitions that connect concepts explicitly
- Creates retrieval questions that test understanding
- Simplifies explanations while preserving core ideas

**Example Edit:**
```
Original: "Chloroplasts contain thylakoids where photosystem II..."

Generated Analogy:
"Think of a chloroplast as a tiny solar-powered kitchen.
Sunlight is the electricity, water and CO2 are the ingredients,
and glucose is the finished meal. Just as a kitchen transforms
ingredients into food using energy, chloroplasts transform simple
molecules into sugar using light energy."
```

### 5. **Optimization Loop**
1. Analyze lesson → Get metrics
2. Claude diagnoses issues
3. Claude generates 2 fix candidates
4. Re-simulate each candidate
5. Select best-scoring version
6. Return optimized lesson

**Performance:** ~30-40 seconds per optimization

---

## 📊 API Reference

### POST `/api/upload`
Upload a lesson file (PDF, TXT, etc.)

**Body:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "lesson_id": "uuid",
  "title": "Introduction to Photosynthesis",
  "segments_count": 5,
  "message": "File uploaded and parsed successfully"
}
```

### POST `/api/analyze/<lesson_id>`
Analyze lesson and compute metrics

**Response:**
```json
{
  "lesson_id": "uuid",
  "metrics": {
    "learning_score": 75.3,
    "engagement": 81.2,
    "cognitive_load": 58.7,
    "concept_flow": 72.4,
    "retention": 65.1,
    ...
  },
  "issues": [
    {
      "id": "diag_1",
      "segment_id": "seg_3",
      "issue_type": "cognitive_overload",
      "severity": "high",
      "explanation": "...",
      "recommended_actions": ["...", "..."]
    }
  ]
}
```

### POST `/api/optimize/<lesson_id>`
Run optimization loop with Claude agents

**Body (optional):**
```json
{
  "max_iterations": 1,
  "max_candidates": 2
}
```

**Response:**
```json
{
  "result_id": "uuid",
  "lesson_id": "uuid",
  "original_score": 65.2,
  "optimized_score": 78.9,
  "improvement": 13.7,
  "iterations": 1
}
```

---

## 🧪 Testing

### Test Suite
```bash
# Run comprehensive Claude agents test
python test_claude_agents.py
```

Tests:
- ✅ Claude Diagnostician with real lesson content
- ✅ Claude Editor generating improvements
- ✅ Full optimization pipeline
- ✅ API integration and fallback behavior

### Manual Testing
```bash
# Start backend
python start_server.py

# In another terminal, test API
curl -X POST -F "file=@your-lesson.pdf" http://localhost:5001/api/upload
curl -X POST http://localhost:5001/api/analyze/<lesson_id>
curl -X POST http://localhost:5001/api/optimize/<lesson_id>
```

---

## 🎨 Key Technologies

### Backend
- **Flask** - REST API framework
- **Anthropic Claude** - AI-powered diagnostics & content generation
- **sentence-transformers** - Brain simulation via embeddings
- **PyPDF2** - Document parsing
- **NumPy/SciPy** - Metric calculations

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Three.js** - 3D brain visualization
- **Tailwind CSS** - Styling
- **LocalStorage** - Client-side persistence

---

## 🔧 Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...           # Your Anthropic API key

# Optional - Claude Agents
USE_CLAUDE_AGENTS=true                  # Enable AI-powered agents
CLAUDE_MODEL=claude-sonnet-4-6          # Model to use
CLAUDE_TEMPERATURE=0.3                  # Creativity (0-1)
CLAUDE_FALLBACK_ENABLED=true            # Use deterministic on error

# Optional - Frontend
NEXT_PUBLIC_API_URL=http://localhost:5001  # Backend URL
```

### Persistent Storage

Lessons and results are automatically saved to:
- `backend/data/lessons_db.json`
- `backend/data/results_db.json`

Data persists across backend restarts. Files are `.gitignore`d for privacy.

---

## 📈 Scoring System

### Learning Score Formula
```
Learning Score = 0.30 × Engagement
               + 0.25 × Optimal Cognitive Load
               + 0.25 × Concept Flow
               + 0.15 × Retention
               + 0.05 × Information Density
               + 20 (baseline boost)
```

### Score Interpretation
- **85-100**: Excellent - Well-structured, engaging content
- **70-84**: Good - Minor improvements possible
- **55-69**: Needs Improvement - Several issues to address
- **40-54**: Poor - Major restructuring recommended
- **<40**: Critical - Fundamental problems with content

### Cognitive Load (Optimal: 40-60)
- **<40**: Too easy, may not challenge learners
- **40-60**: Optimal - Right level of difficulty
- **60-75**: Acceptable - Slightly challenging
- **>75**: Overload - Too much information

---

## 🤝 Contributing

### Development Setup
```bash
# Install dev dependencies
pip install -r requirements.txt
cd frontend-next && npm install

# Run in development mode
python start_server.py  # Backend with auto-reload
npm run dev             # Frontend with hot reload
```

### Project Guidelines
- Backend: Follow PEP 8 style guide
- Frontend: Use TypeScript strict mode
- Commits: Include Co-Authored-By for AI assistance
- Testing: Add tests for new agents/metrics

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Anthropic Claude** for content-aware AI recommendations
- **sentence-transformers** for efficient semantic embeddings
- **TRIBE** (inspiration for brain simulation approach)

---

## 📞 Support

- **Issues**: https://github.com/jshaha/Curriculearn-/issues
- **Documentation**: See `/docs` directory
- **API Docs**: Run backend and visit `/health` endpoint

---

Built with ❤️ using real brain science and AI
