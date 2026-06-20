# NeuroCompiler - Quick Start Guide

## ✅ What's Done (Your Part)

**Agent 2: Brain Simulator** - Generates semantic embeddings (384-dim vectors) for each lesson segment
**Agent 3: Metric Translator** - Converts embeddings into educational metrics

Both agents are working and tested!

## 🚀 Try It Now

```bash
# Test the pipeline
python test_pipeline.py

# Run the photosynthesis demo (from product spec)
cd examples
python photosynthesis_demo.py

# Run basic pipeline example
python basic_pipeline.py
```

## 📊 What the System Does

1. **Takes a lesson** (list of text segments)
2. **Generates brain-like representations** using sentence embeddings
3. **Computes educational metrics**:
   - Learning Score (0-100)
   - Cognitive Load (lower is better)
   - Engagement (higher is better)
   - Concept Flow (higher is better)
   - Retention Support (higher is better)
4. **Detects problems automatically**:
   - Cognitive overload segments
   - Abrupt transitions
   - Missing reinforcement

## 📁 Project Structure

```
curriculearn/
├── src/agents/
│   ├── brain_simulator.py       ✅ Agent 2 (DONE)
│   └── metric_translator.py     ✅ Agent 3 (DONE)
├── examples/
│   ├── basic_pipeline.py        ✅ Simple demo
│   └── photosynthesis_demo.py   ✅ Product spec demo
├── docs/
│   ├── PRODUCT_SPEC.md          📋 Original spec
│   └── AGENT_INTERFACE_SPEC.md  📋 For your friend (Agent 4+)
├── test_pipeline.py             ✅ Quick test
└── requirements.txt             ✅ Dependencies
```

## 🤝 For Your Friend (Agent 4-6 Developer)

Share with them:
1. **`docs/AGENT_INTERFACE_SPEC.md`** - Complete interface documentation
2. This example of what they'll receive:

```python
# What Agent 3 outputs (what Agent 4 receives):
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
            'severity': 'high',
            'description': 'Segment 5 introduces too much new information',
            'recommendation': 'Break this segment into smaller parts'
        },
        # ... more problems
    ]
}

# Agent 4: Analyze these metrics and elaborate diagnoses
# Agent 5: Generate fixes (rewrite segments, add scaffolding, etc.)
# Agent 6: Run optimization loop to maximize learning_score
```

## 🔧 How to Use in Your Pipeline

```python
from src.agents import BrainSimulator, MetricTranslator

# Initialize (do this once)
brain_sim = BrainSimulator()
metric_translator = MetricTranslator()

# For each lesson to analyze:
def evaluate_lesson(lesson_segments):
    """
    Args:
        lesson_segments: List of strings (slides/paragraphs)

    Returns:
        metrics: Dict with educational metrics
    """
    # Agent 2: Generate brain states
    brain_states = brain_sim.simulate_from_text_list(lesson_segments)

    # Agent 3: Convert to metrics
    metrics = metric_translator.translate(brain_states)

    return metrics

# Example usage
lesson = [
    "Intro to topic",
    "Main concept 1",
    "Main concept 2",
    # ...
]

metrics = evaluate_lesson(lesson)
print(f"Learning Score: {metrics['learning_score']:.1f}/100")

# Pass metrics to Agent 4 for diagnosis
# diagnoses = agent_4.diagnose(metrics)
# improved_lesson = agent_5.edit(lesson, diagnoses)
# optimized_lesson = agent_6.optimize(improved_lesson)
```

## 💡 Key Points

### No API Keys Needed
- Everything runs locally
- Uses open-source sentence transformer model
- No external API calls after initial model download

### Fast
- First run: ~10 seconds (downloads 80MB model)
- Subsequent runs: ~2 seconds per lesson
- Model is cached at `~/.cache/huggingface/`

### The "Brain Simulation"
Instead of actual TRIBE voxels (50,000+ brain regions), we use:
- **384 semantic features** from sentence embeddings
- Each feature captures a different aspect of meaning
- Functionally equivalent for optimization purposes
- Much faster and more practical for hackathon

### Metrics Explained
- **Learning Score**: Overall quality (higher = better)
- **Cognitive Load**: How hard the brain works (lower = better)
- **Engagement**: Richness of content (higher = better)
- **Concept Flow**: Smoothness of transitions (higher = better)
- **Retention**: Reinforcement of concepts (higher = better)

## 🎯 Next Steps for Hackathon

### You (Agent 1-3):
- ✅ Agent 2: Brain Simulator (DONE)
- ✅ Agent 3: Metric Translator (DONE)
- ⏳ Agent 1: Document Parser (parse PDFs/PowerPoints into text segments)

### Your Friend (Agent 4-6):
- ⏳ Agent 4: Educational Diagnostician
- ⏳ Agent 5: Curriculum Editor
- ⏳ Agent 6: Optimizer Loop

### Integration:
- ⏳ Connect all agents end-to-end
- ⏳ Build frontend interface
- ⏳ Demo with real lesson files

## 🐛 Troubleshooting

**Model download fails:**
- Check internet connection
- Model auto-downloads from HuggingFace (no auth needed)

**"Module not found" error:**
```bash
pip install -r requirements.txt
```

**Slow performance:**
- First run downloads model (~10 sec)
- Subsequent runs use cache (~2 sec)
- If still slow, reduce lesson length for testing

## 📞 Questions?

Check the files:
- `docs/AGENT_INTERFACE_SPEC.md` - Detailed technical specs
- `docs/PRODUCT_SPEC.md` - Product vision
- `examples/` - Working code examples

Good luck with the hackathon! 🚀
