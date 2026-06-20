# NeuroCompiler

AI-Powered Curriculum Optimization Using Brain Response Simulation

## Overview

NeuroCompiler automatically rewrites lessons to maximize predicted learning outcomes by simulating cognitive responses and iteratively optimizing content.

## Quick Start

### Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

On first run, the sentence transformer model (~80MB) will be downloaded automatically.

### Basic Usage

```python
from src.agents import BrainSimulator, MetricTranslator

# Initialize agents
brain_sim = BrainSimulator()
metric_translator = MetricTranslator()

# Your lesson content
lesson = [
    "Introduction to photosynthesis",
    "Plants convert light into energy",
    # ... more segments
]

# Run the pipeline
brain_states = brain_sim.simulate_from_text_list(lesson)
metrics = metric_translator.translate(brain_states)

# View results
print(f"Learning Score: {metrics['learning_score']:.1f}/100")
print(f"Cognitive Load: {metrics['cognitive_load']:.1f}/100")
print(f"Engagement: {metrics['engagement']:.1f}/100")
```

### Run Examples

```bash
# Basic pipeline demo
cd examples
python basic_pipeline.py

# Photosynthesis comparison (from product spec)
python photosynthesis_demo.py
```

## Architecture

### Completed Agents

✅ **Agent 2: Brain Simulator** (`src/agents/brain_simulator.py`)
- Uses sentence transformers to generate semantic embeddings
- Lightweight alternative to TRIBE
- Outputs 384-dimensional representations per lesson segment

✅ **Agent 3: Metric Translator** (`src/agents/metric_translator.py`)
- Converts brain states into educational metrics
- Computes: cognitive load, engagement, concept flow, retention, novelty
- Detects problem segments automatically

### In Progress (Your Friend's Part)

🚧 **Agent 1: Curriculum Parser**
- Extract lesson structure from PDFs, PowerPoints, etc.
- Output format: `{'sections': [text segments...]}`

🚧 **Agent 4: Educational Diagnostician**
- Analyze metrics from Agent 3
- Identify learning bottlenecks
- Prioritize improvements

🚧 **Agent 5: Curriculum Editor**
- Implement fixes based on diagnoses
- Rewrite segments, add scaffolding, insert examples

🚧 **Agent 6: Optimizer**
- Coordinate the optimization loop
- Generate and test multiple candidates
- Return best-performing lesson

## Data Flow

```
Agent 1 (Parser)
    ↓ lesson structure
Agent 2 (Brain Simulator) ← YOU ARE HERE
    ↓ brain states (embeddings)
Agent 3 (Metric Translator) ← YOU ARE HERE
    ↓ educational metrics
Agent 4 (Diagnostician) ← YOUR FRIEND
    ↓ diagnoses
Agent 5 (Editor) ← YOUR FRIEND
    ↓ improved lesson
Agent 6 (Optimizer) ← YOUR FRIEND
    ↓ optimal lesson
```

## For Agent 4+ Developers

See `docs/AGENT_INTERFACE_SPEC.md` for detailed interface specifications.

### What You'll Receive

```python
metrics = {
    'learning_score': 72.3,
    'cognitive_load': 84.2,
    'engagement': 76.5,
    'concept_flow': 58.1,
    'retention': 46.3,
    'problem_segments': [
        {
            'segment_index': 5,
            'type': 'cognitive_overload',
            'description': '...',
            'recommendation': '...'
        },
        ...
    ],
    ...
}
```

### Optimization Goal

Maximize `learning_score`:
- Increase engagement (35% weight)
- Decrease cognitive load (30% weight, negative)
- Improve concept flow (20% weight)
- Add retention support (10% weight)

## Technical Details

### Why Sentence Transformers Instead of TRIBE?

**TRIBE:**
- 50,000+ voxels (brain regions)
- Requires significant compute
- Too large for hackathon timeline

**Our Approach:**
- 384 semantic features (embedding dimensions)
- Runs on CPU in <1 second
- Each dimension represents a cognitive/semantic feature
- Functionally equivalent for optimization purposes

### How Metrics Are Computed

- **Cognitive Load**: Rate of embedding change (cosine distance)
- **Engagement**: Variance in representational space
- **Concept Flow**: Similarity between consecutive embeddings
- **Retention**: Detection of concept reactivation
- **Novelty**: Distance from previous concept centroids

See `src/agents/metric_translator.py` for implementation details.

## Project Structure

```
curriculearn/
├── src/
│   └── agents/
│       ├── brain_simulator.py      # Agent 2 ✅
│       └── metric_translator.py    # Agent 3 ✅
├── examples/
│   ├── basic_pipeline.py           # Simple demo
│   └── photosynthesis_demo.py      # Spec example
├── docs/
│   ├── PRODUCT_SPEC.md             # Full product spec
│   └── AGENT_INTERFACE_SPEC.md     # For Agent 4+ devs
├── tests/                          # Unit tests (TODO)
└── requirements.txt                # Dependencies
```

## Next Steps

1. ✅ Agent 2: Brain Simulator (DONE)
2. ✅ Agent 3: Metric Translator (DONE)
3. 🚧 Agent 1: Curriculum Parser (in progress)
4. 🚧 Agent 4-6: Optimization loop (in progress)
5. ⏳ Frontend interface
6. ⏳ End-to-end integration

## License

MIT
