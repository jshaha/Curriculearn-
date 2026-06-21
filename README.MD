# Curriculearn

**AI-powered curriculum optimization using science-backed, simulated cognitive response.**

CurricuLearn takes a lesson — a PDF, a PowerPoint, a Word doc, or plain text — and answers a question teachers normally can't answer until they're already standing in front of a class: *where, exactly, does this lesson lose a student's mind?*

It does this by converting each lesson segment into a semantic "brain state," scoring that state against five learning metrics, automatically diagnosing the weak points, rewriting them, and re-scoring — in a loop — until the lesson's predicted learning score stops improving.

---

## Table of contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Walkthrough: four ways to use this repo](#walkthrough-four-ways-to-use-this-repo)
- [The metrics, explained](#the-metrics-explained)
- [The agent pipeline, in detail](#the-agent-pipeline-in-detail)
- [Deterministic vs. Claude-powered agents](#deterministic-vs-claude-powered-agents)
- [Testing](#testing)
- [Deployment](#deployment)
- [Known gaps and rough edges](#known-gaps-and-rough-edges)
- [License](#license)

---

## What it does

```
Lesson file  →  Brain Simulation  →  Learning Metrics  →  Diagnosis  →  AI Rewrite  →  Re-simulate  →  Improved Lesson
```

Instead of generating lesson content from scratch, CurricuLearn takes a lesson you already have and **optimizes it against a model of how a student's mind would move through it** — flagging cognitive overload, abrupt topic jumps, missing reinforcement, and low engagement stretches, then rewriting those specific spots and checking whether the rewrite actually helped before keeping it.

## Architecture

```
                         ┌──────────────────────────────┐
                         │   Lesson file (.pdf/.pptx/    │
                         │   .docx/.txt/raw text)        │
                         └───────────────┬──────────────┘
                                         ↓
                         Agent 1 — Curriculum Parser
                         extracts + segments lesson text
                                         ↓
                         Agent 2 — Brain Simulator
                         384-dim semantic embedding per segment
                                         ↓
                         Agent 3 — Metric Translator
                         engagement / cognitive load / concept flow /
                         retention / learning score + flagged segments
                                         ↓
                         Agent 4 — Educational Diagnostician
                         turns metrics into prioritized diagnoses
                                         ↓
                         Agent 5 — Curriculum Editor
                         generates a rewritten lesson candidate
                                         ↓
                         Agent 6 — Optimizer
                  ┌──────── re-simulate candidate, keep if score improves ────────┐
                  │                                                              │
                  └───────────────────────  loop until convergence  ─────────────┘
                                         ↓
                         Agent 7 — Visualization Generator (optional)
                         generates supporting diagrams for weak segments
                                         ↓
                         Optimized lesson + before/after metrics + edit history
```

The REST API (`backend/api_server.py`) wraps this whole pipeline; the Next.js frontend (`frontend-next/`) calls that API and renders the result as a 3D brain visualization with per-section breakdowns of learning, cognitive load, engagement, concept flow, and retention.

## Repository structure

```
Curriculearn-/
├── src/                                 # "Brain simulation" half of the pipeline
│   ├── agents/
│   │   ├── curriculum_parser.py         # Agent 1
│   │   ├── brain_simulator.py           # Agent 2
│   │   └── metric_translator.py         # Agent 3
│   └── adapters/
│       └── brain_simulator_adapter.py   # Bridges src/ agents into backend/ schema
│
├── backend/                             # API + optimization loop
│   ├── api_server.py                    # Flask REST API (the main entry point)
│   ├── start_server.py-equivalent paths handled by /start_server.py at repo root
│   └── neurocompiler/                   # Installable package (pyproject.toml)
│       ├── agents/
│       │   ├── diagnostician.py         # Agent 4 (deterministic)
│       │   ├── curriculum_editor.py     # Agent 5 (deterministic)
│       │   ├── optimizer.py             # Agent 6
│       │   ├── visualization_generator.py  # Agent 7
│       │   └── claude/                  # Claude-powered Agent 4 & 5 variants
│       ├── adapters/                    # Simulator interface + MockSimulator
│       ├── schemas.py                   # Pydantic data contracts (StructuredLesson, MetricReport, etc.)
│       ├── scoring.py                   # Learning score weighting
│       ├── cli.py                       # Local demo CLI (mock-simulator backed)
│       ├── data/                        # Sample lessons + sample metric reports
│       └── tests/                       # pytest suite for the backend package
│
├── frontend-next/                       # Active frontend (Next.js + Three.js)
│   ├── app/                             # class list → /class/[id] brain view
│   ├── three/                           # 3D brain scene, point cloud, region data
│   ├── content/sections.ts              # Maps brain sections → the 5 metrics
│   └── STRUCTURE.md                     # Frontend's own structure notes
│
├── frontend-new/                        # Earlier, simpler prototype UI (not deployed)
│
├── examples/                            # Standalone runnable demos
│   ├── basic_pipeline.py
│   ├── full_pipeline_demo.py
│   ├── photosynthesis_demo.py
│   └── test_parser.py
│
├── test_files/                          # Sample lessons with intentionally seeded issues
│   ├── photosynthesis_lesson.html
│   ├── bayes_theorem_lesson.html
│   └── sample_lesson.txt
│
├── docs/
│   ├── PRODUCT_SPEC.md                  # Original product vision
│   ├── AGENT_INTERFACE_SPEC.md          # Inter-agent data contract
│   ├── FRONTEND_DESIGN.md / FRONTEND_IMPLEMENTATION.md
│   ├── VISUALIZATION_AGENT.md
│   └── PARTNER_INTEGRATION_TODO.md
│
├── archived_old_code/                   # Legacy prototype frontend + early scripts (reference only)
│
├── run_full_optimization.py             # Root-level script: real end-to-end pipeline run
├── start_server.py                      # Convenience launcher for the API server
├── Introduction to Photosynthesis - Lesson Plan.pdf   # Sample input file
├── optimization_result.json             # A committed sample output from a real run
├── requirements.txt                     # Python dependencies
├── pyproject.toml                       # Packaging config for backend/curriculearn
└── render.yaml                          # Render.com deployment config (backend + frontend)
```

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 20+ (only needed if you're running `frontend-next`)
- ~80MB free for the sentence-transformer model (downloaded automatically on first run)

### Install backend dependencies

```bash
pip install -r requirements.txt
```

This installs Flask, the sentence-transformers/torch stack (Agent 2), document parsers (Agent 1), and the Anthropic SDK (for the optional Claude-powered Agents 4/5).

To also install the `neurocompiler` backend package itself (needed for the test suite and CLI):

```bash
pip install -e ".[dev]"
```

### Environment variables

Create a `.env` file in the repo root if you want the optional integrations. Everything below is optional — the core pipeline (Agents 1–3 and 6, with deterministic Agents 4–5) runs with no API keys at all.

| Variable | Used for | Required? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude-powered Diagnostician & Curriculum Editor | No — falls back to deterministic agents |
| `USE_CLAUDE_AGENTS` | Set to `true` to opt into the Claude-powered agents | No (defaults to `false`) |
| `CLAUDE_MODEL` | Override the Claude model used (defaults to `claude-sonnet-4-6`) | No |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` / `REPLICATE_API_TOKEN` | Agent 7 image generation backend | No — uses placeholders without a key |
| `NEXT_PUBLIC_API_URL` | Tells `frontend-next` where the backend API is running | Yes, if running the frontend against a non-local backend |

## Walkthrough: four ways to use this repo

### Option A — Run the full app locally (backend + frontend)

This is the closest thing to "running the product."

```bash
# Terminal 1 — start the API server
python start_server.py
# → API running at http://localhost:5001

# Terminal 2 — start the frontend
cd frontend-next
npm install
npm run dev
# → Frontend running at http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:5001` in `frontend-next/.env.local` so the frontend can reach the API.

What you can do from there:
1. Upload a lesson (try `Introduction to Photosynthesis - Lesson Plan.pdf` in the repo root, or anything in `test_files/`).
2. Trigger analysis — this runs the real brain simulator (Agents 2–3) and returns the five metrics plus flagged segments.
3. Trigger optimization — this runs the full Agent 4 → 5 → 6 loop and returns an improved lesson with a before/after score.
4. View the result as a 3D brain visualization, with each metric mapped to a brain "section."

### Option B — Run the real end-to-end pipeline from the command line

No server, no frontend — just the pipeline, printed to your terminal:

```bash
python run_full_optimization.py
```

By default this runs against a built-in sample photosynthesis lesson and uses the **real** brain simulator (not the mock). To run it against your own file:

```python
from run_full_optimization import run_full_optimization
run_full_optimization(lesson_file_path="test_files/sample_lesson.txt", max_iterations=2)
```

A sample run committed in this repo (`optimization_result.json`) shows a real lesson improving from a learning score of **55.8 → 57.4** over the optimization loop — your numbers will vary by lesson and iteration count.

### Option C — Use the agents directly in Python

For experimenting with just the brain simulation / metrics layer, without the optimization loop:

```python
from src.agents import CurriculumParser, BrainSimulator, MetricTranslator

# Agent 1: parse any lesson file into segments
parser = CurriculumParser()
lesson = parser.parse("test_files/sample_lesson.txt")

# Agent 2: generate brain-state embeddings
brain_sim = BrainSimulator()
brain_states = brain_sim.simulate(lesson)

# Agent 3: translate embeddings into educational metrics
metric_translator = MetricTranslator()
metrics = metric_translator.translate(brain_states)

print(f"Learning Score: {metrics['learning_score']:.1f}/100")
print(f"Cognitive Load: {metrics['cognitive_load']:.1f}/100")
print(f"Engagement:     {metrics['engagement']:.1f}/100")
print(f"Concept Flow:   {metrics['concept_flow']:.1f}/100")
print(f"Retention:      {metrics['retention']:.1f}/100")

for problem in metrics["problem_segments"]:
    print(f"⚠ Segment {problem['segment_index']}: {problem['description']}")
```

Or run the pre-built demos:

```bash
cd examples
python basic_pipeline.py          # minimal example
python full_pipeline_demo.py      # Agents 1–3, file in → metrics out
python photosynthesis_demo.py     # the example from the original product spec
```

### Option D — Mock-backed CLI (no ML dependencies, fast)

`neurocompiler.cli` is a lightweight demo path that runs the diagnosis → edit → optimize loop against a **mock** simulator (text heuristics, not real embeddings) — useful for testing the optimization logic itself without downloading the sentence-transformer model:

```bash
python -m neurocompiler.cli optimize \
  --lesson backend/neurocompiler/data/sample_lesson.json \
  --out optimized_output.json
```

The output JSON includes the original and optimized scores, full per-segment metrics, the diagnosis report, and a list of every edit the optimizer made and why.

## The metrics, explained

All metrics are normalized 0–100.

| Metric | Better direction | What it measures | How it's computed |
|---|---|---|---|
| **Learning Score** | Higher | Overall predicted lesson quality — the composite the optimizer maximizes | Weighted blend: +35% engagement, −30% cognitive load, +20% concept flow, +10% retention, +5% multimodal support |
| **Cognitive Load** | Lower | How much new information/complexity hits the learner at once | Rate of change between consecutive segment embeddings (cosine distance) |
| **Engagement** | Higher | How cognitively "alive" a stretch of content is, vs. flat/disengaging | Variance in the representational (embedding) space |
| **Concept Flow** | Higher | Whether ideas build naturally on one another vs. jumping abruptly | Similarity between consecutive segment embeddings |
| **Retention** | Higher | Whether earlier concepts get reinforced rather than abandoned | Detection of concept reactivation across the lesson |
| Novelty | Neutral | How much genuinely new material a segment introduces | Distance from prior concept centroids |
| Information Density | Neutral | How much representational change is packed per unit of content | Same embedding-change signal as cognitive load, on a different timescale |
| Reinforcement | Higher | Direct measure of concept revisiting | Used by the deterministic diagnostician |
| Multimodal Support | Higher | Whether text, visuals, and examples reinforce each other | Currently a lighter-weight heuristic; biggest opportunity for the Visualization agent to improve |

## The agent pipeline, in detail

**Agent 1 — Curriculum Parser** (`src/agents/curriculum_parser.py`)
Extracts and segments lesson content from PDF, PPTX, DOCX, plain text, or raw pasted text (e.g. a transcript). Handles noise filtering and gives a human-readable preview of the parsed sections.

**Agent 2 — Brain Simulator** (`src/agents/brain_simulator.py`)
Generates a 384-dimension sentence-transformer embedding per lesson segment. This stands in for a full cognitive/voxel-based brain model (the product spec originally referenced TRIBE, a 50,000+ voxel model) — semantic embeddings are used instead because they're functionally comparable for *relative* optimization purposes, run on CPU, and need no external API.

**Agent 3 — Metric Translator** (`src/agents/metric_translator.py`)
Converts the embedding trajectory into the metrics above, flags specific problem segments (e.g. "cognitive overload," "abrupt transition," "no reinforcement"), and produces temporal trajectories for charting.

**Agent 4 — Educational Diagnostician** (`backend/neurocompiler/agents/diagnostician.py`, or `agents/claude/diagnostician.py`)
Takes the metrics + flagged segments and turns them into structured, prioritized diagnoses with an explanation and recommended actions per issue.

**Agent 5 — Curriculum Editor** (`backend/neurocompiler/agents/curriculum_editor.py`, or `agents/claude/curriculum_editor.py`)
Acts on diagnoses: reorders segments, inserts analogies or worked examples, splits overloaded sections, adds retrieval-practice questions, or rewrites explanations.

**Agent 6 — Optimizer** (`backend/neurocompiler/agents/optimizer.py`)
Runs the simulate → diagnose → edit → re-simulate loop for a configurable number of iterations, generates multiple candidate edits per round, and keeps whichever candidate produces the best learning score. Returns the full iteration and edit history for transparency.

**Agent 7 — Visualization Generator** (`backend/neurocompiler/agents/visualization_generator.py`)
Generates supporting diagrams/illustrations for weak segments using an external image model (Gemini by default, with OpenAI and Replicate also supported). Runs with placeholder output if no image-model API key is set.

## Deterministic vs. Claude-powered agents

Agents 4 and 5 each ship in two forms:

- **Deterministic** (`diagnostician.py`, `curriculum_editor.py`): rule-based, template-driven. No API key needed, fast, fully offline.
- **Claude-powered** (`agents/claude/diagnostician.py`, `agents/claude/curriculum_editor.py`): uses the Claude API with tool use for more nuanced, context-aware diagnoses and rewrites.

Toggle between them with the `USE_CLAUDE_AGENTS` environment variable (see [Environment variables](#environment-variables)). If `USE_CLAUDE_AGENTS=true` but no `ANTHROPIC_API_KEY` is set, the server falls back to the deterministic agents automatically — it won't fail to start.

## Testing

```bash
# Backend package test suite (schemas, diagnostician, editor, optimizer, CLI, packaging)
pytest backend/neurocompiler/tests/

# Top-level integration / smoke tests
python test_pipeline.py          # Agents 2+3 sanity check
python test_adapter.py           # Brain simulator ↔ backend schema adapter
python test_integration.py       # Real simulator wired into the optimization loop
python test_visualizations.py    # Agent 7 visualization generation
python test_claude_agents.py     # Claude-powered Agents 4/5 vs. deterministic, side by side
```

## Deployment

`render.yaml` defines a two-service deployment on Render:

- **`curriculearn-api`** — the Flask backend, run via `gunicorn`, free tier (spins down after 15 minutes of inactivity). `USE_CLAUDE_AGENTS` defaults to `false`; add `ANTHROPIC_API_KEY` manually in the Render dashboard to enable Claude-powered agents in production.
- **`curriculearn-frontend`** — `frontend-next`, built and served via `npm run build` / `npm start`. Requires `NEXT_PUBLIC_API_URL` to be set to the deployed backend's URL once it's live.

## Known gaps and rough edges

Being direct about the current state, since the old README overclaimed completeness in some places and underclaimed it in others:

- `neurocompiler.cli` still defaults to `MockSimulator` (text heuristics), not the real brain simulator — the real simulator is wired up in `run_full_optimization.py` and `backend/api_server.py`, but not yet in the CLI.
- `frontend-new/` is a separate, simpler prototype UI that is **not** connected to the backend and is not part of the Render deployment. `frontend-next/` is the active, deployed frontend.
- `archived_old_code/` (including an earlier vanilla-JS frontend) is kept for reference only — it predates the current adapter-based architecture and shouldn't be used as a starting point.
- Multimodal support and reinforcement scoring are lighter-weight heuristics relative to the other three core metrics; this is the most likely area to improve next.
- Several markdown files in the repo root (`STATUS.md`, `INTEGRATION_STATUS.md`, `INTEGRATION_GUIDE.md`, `QUICKSTART.md`, `AGENT1_COMPLETE.md`, `BRAIN_INTEGRATION_PLAN.md`) describe earlier in-progress states of the project and are now historical — this README is the current source of truth.

## License

MIT