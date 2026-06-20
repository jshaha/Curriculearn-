# Integration Guide: Combining Both Systems

## What You Built vs. What Your Friend Built

### Your System (src/agents/)
**Agents 1-3: Real Brain Simulation**

✅ **Agent 1: Curriculum Parser** (`src/agents/curriculum_parser.py`)
- Parses PDF, PowerPoint, Word, Text files
- Outputs: List of text segments

✅ **Agent 2: Brain Simulator** (`src/agents/brain_simulator.py`)
- Uses sentence transformers (real semantic embeddings)
- Generates 384-dimensional brain state representations
- Scientifically grounded approach

✅ **Agent 3: Metric Translator** (`src/agents/metric_translator.py`)
- Converts embeddings → educational metrics
- Computes cognitive load, engagement, concept flow, etc.
- Detects problem segments

### Your Friend's System (backend/neurocompiler/)
**Agents 4-6: Optimization Loop**

✅ **Agent 4: Diagnostician** (`backend/neurocompiler/agents/diagnostician.py`)
- Analyzes metrics from simulator
- Generates prioritized diagnoses
- Identifies 5 types of issues:
  - Cognitive overload
  - Poor concept flow
  - Low retention
  - Low multimodal support
  - Novelty spikes

✅ **Agent 5: Curriculum Editor** (`backend/neurocompiler/agents/curriculum_editor.py`)
- Generates lesson variants based on diagnoses
- Template-based edits:
  - Split sections
  - Add analogies
  - Add examples
  - Add transitions
  - Add retrieval questions
  - Simplify explanations

✅ **Agent 6: Optimizer** (`backend/neurocompiler/agents/optimizer.py`)
- Runs optimization loop
- Evaluates candidates
- Selects best improvements
- Tracks iteration history

✅ **Mock Simulator** (`backend/neurocompiler/adapters/mock_simulator.py`)
- Text-based heuristics
- Used for development/testing
- **YOUR REAL BRAIN SIMULATOR SHOULD REPLACE THIS**

---

## Key Differences

### Data Structures

**Your System:**
```python
# Simple text list
lesson = {
    'sections': [
        "Lesson segment text 1...",
        "Lesson segment text 2...",
        ...
    ]
}
```

**Their System:**
```python
# Structured lesson with metadata
lesson = StructuredLesson(
    id="lesson_id",
    title="Lesson Title",
    segments=[
        LessonSegment(
            id="segment_1",
            title="Segment Title",
            content="Segment text...",
            concepts=["concept1", "concept2"],
            modality="slide"
        ),
        ...
    ]
)
```

### Metrics Format

**Your System:**
```python
{
    'learning_score': 72.3,
    'cognitive_load': 84.2,
    'engagement': 76.5,
    'concept_flow': 58.1,
    'retention': 46.3,
    'problem_segments': [...]
}
```

**Their System:**
```python
MetricReport(
    learning_score=72.3,
    global_metrics=MetricScores(
        cognitive_load=84.2,
        engagement=76.5,
        concept_flow=58.1,
        retention=46.3,
        reinforcement=50.0,
        novelty=70.0,
        information_density=65.0,
        multimodal_support=40.0
    ),
    segment_metrics=[
        SegmentMetric(
            segment_id="segment_1",
            metrics=MetricScores(...)
        ),
        ...
    ]
)
```

---

## Integration Strategy

### Option 1: Adapter Pattern (Recommended)

Create an adapter that connects your brain simulator to their optimizer:

```python
# NEW FILE: src/adapters/brain_simulator_adapter.py

from backend.neurocompiler.adapters.simulator import SimulatorProtocol
from backend.neurocompiler.schemas import MetricReport, MetricScores, SegmentMetric, StructuredLesson
from src.agents import BrainSimulator, MetricTranslator


class RealBrainSimulatorAdapter(SimulatorProtocol):
    """Adapter that uses your REAL brain simulator instead of MockSimulator"""

    def __init__(self):
        self.brain_sim = BrainSimulator()
        self.metric_translator = MetricTranslator()

    def simulate(self, lesson: StructuredLesson) -> MetricReport:
        """
        Takes their StructuredLesson format and returns their MetricReport format,
        but uses YOUR real brain simulation under the hood
        """
        # Convert their format to yours
        text_segments = [segment.content for segment in lesson.segments]

        # Use YOUR brain simulator
        brain_states = self.brain_sim.simulate_from_text_list(text_segments)
        metrics = self.metric_translator.translate(brain_states)

        # Convert back to their format
        return self._convert_to_metric_report(lesson, metrics)

    def _convert_to_metric_report(self, lesson: StructuredLesson, our_metrics: dict) -> MetricReport:
        """Convert our metrics format to their MetricReport format"""

        # Global metrics
        global_metrics = MetricScores(
            cognitive_load=our_metrics['cognitive_load'],
            engagement=our_metrics['engagement'],
            concept_flow=our_metrics['concept_flow'],
            retention=our_metrics['retention'],
            reinforcement=our_metrics.get('retention', 50.0),  # Use retention as proxy
            novelty=our_metrics['novelty'],
            information_density=our_metrics['information_density'],
            multimodal_support=50.0  # Default value (we don't compute this)
        )

        # Per-segment metrics
        segment_metrics = []
        temporal = our_metrics.get('temporal_metrics', {})
        load_trajectory = temporal.get('cognitive_load_trajectory', [])
        novelty_trajectory = temporal.get('novelty_trajectory', [])

        for i, segment in enumerate(lesson.segments):
            # Use temporal metrics if available, otherwise use global
            segment_load = load_trajectory[i] if i < len(load_trajectory) else global_metrics.cognitive_load
            segment_novelty = novelty_trajectory[i] if i < len(novelty_trajectory) else global_metrics.novelty

            segment_metrics.append(SegmentMetric(
                segment_id=segment.id,
                metrics=MetricScores(
                    cognitive_load=segment_load,
                    engagement=global_metrics.engagement,
                    concept_flow=global_metrics.concept_flow,
                    retention=global_metrics.retention,
                    reinforcement=global_metrics.reinforcement,
                    novelty=segment_novelty,
                    information_density=global_metrics.information_density,
                    multimodal_support=global_metrics.multimodal_support
                )
            ))

        return MetricReport(
            learning_score=our_metrics['learning_score'],
            global_metrics=global_metrics,
            segment_metrics=segment_metrics
        )
```

### Option 2: Unified Pipeline

Create a single pipeline that uses both systems:

```python
# NEW FILE: examples/unified_pipeline.py

from pathlib import Path
from backend.neurocompiler.agents import EducationalDiagnostician, CurriculumEditor, LessonOptimizer
from backend.neurocompiler.schemas import StructuredLesson, LessonSegment
from src.agents import CurriculumParser
from src.adapters.brain_simulator_adapter import RealBrainSimulatorAdapter


def optimize_lesson_file(file_path: str, max_iterations: int = 3):
    """
    Complete pipeline: Parse file → Optimize with real brain simulation
    """

    # Step 1: Parse the file (YOUR Agent 1)
    parser = CurriculumParser()
    parsed_content = parser.parse(file_path)

    # Step 2: Convert to their StructuredLesson format
    segments = []
    for i, text in enumerate(parsed_content['sections']):
        segments.append(LessonSegment(
            id=f"segment_{i+1}",
            title=f"Section {i+1}",
            content=text,
            concepts=[],  # Could extract concepts using NLP
            modality="text"
        ))

    lesson = StructuredLesson(
        id=Path(file_path).stem,
        title=parsed_content['metadata']['filename'],
        segments=segments
    )

    # Step 3: Use YOUR real brain simulator (not their mock)
    simulator = RealBrainSimulatorAdapter()

    # Step 4: Run THEIR optimization loop (Agents 4-6)
    optimizer = LessonOptimizer()
    result = optimizer.optimize(
        lesson=lesson,
        simulator=simulator,
        max_iterations=max_iterations,
        max_candidates=3
    )

    # Step 5: Show results
    print(f"\n{'='*60}")
    print(f"OPTIMIZATION COMPLETE")
    print(f"{'='*60}")
    print(f"Original Score: {result.original_score:.1f}/100")
    print(f"Best Score:     {result.best_score:.1f}/100")
    print(f"Improvement:    +{result.score_delta:.1f} points")
    print(f"Iterations:     {result.iterations}")
    print(f"Edits Applied:  {len(result.edit_history)}")

    return result


if __name__ == "__main__":
    # Test with your sample lesson
    result = optimize_lesson_file("test_files/sample_lesson.txt")
```

---

## Integration Steps

### 1. Create the Adapter
```bash
mkdir -p src/adapters
# Create brain_simulator_adapter.py with code from Option 1 above
```

### 2. Install Their Dependencies
```bash
pip install -e ".[dev]"  # From their pyproject.toml
```

### 3. Test the Integration
```python
from src.adapters.brain_simulator_adapter import RealBrainSimulatorAdapter
from backend.neurocompiler.schemas import StructuredLesson, LessonSegment

# Create a test lesson
lesson = StructuredLesson(
    id="test",
    title="Test Lesson",
    segments=[
        LessonSegment(
            id="seg1",
            title="Intro",
            content="Plants use photosynthesis to make food",
            concepts=["photosynthesis"],
            modality="text"
        )
    ]
)

# Use YOUR brain simulator through the adapter
adapter = RealBrainSimulatorAdapter()
metrics = adapter.simulate(lesson)

print(f"Learning Score: {metrics.learning_score}")
print(f"Cognitive Load: {metrics.global_metrics.cognitive_load}")
```

### 4. Run Full Optimization
```python
from backend.neurocompiler.agents import LessonOptimizer
from src.adapters.brain_simulator_adapter import RealBrainSimulatorAdapter

# Their agents + YOUR brain simulator
simulator = RealBrainSimulatorAdapter()
optimizer = LessonOptimizer()

result = optimizer.optimize(lesson, simulator, max_iterations=3)
print(f"Improved from {result.original_score} to {result.best_score}")
```

---

## Benefits of Integration

### You Get:
- ✅ Complete optimization loop (Agents 4-6)
- ✅ Structured editing system
- ✅ Iteration tracking
- ✅ CLI interface
- ✅ Test suite

### They Get:
- ✅ Real brain simulation (not text heuristics)
- ✅ Scientifically grounded metrics
- ✅ Sentence transformer embeddings
- ✅ Document parsing (PDF, PowerPoint, etc.)

### Together:
- ✅ Full end-to-end pipeline
- ✅ Real brain simulation + optimization loop
- ✅ Parse any file → Optimize → Get improved lesson
- ✅ Production-ready system

---

## Next Steps

1. **Create the adapter** (`src/adapters/brain_simulator_adapter.py`)
2. **Test the adapter** with a simple lesson
3. **Run the unified pipeline** on your sample lesson
4. **Compare results**: Mock simulator vs. Real brain simulator
5. **Demo the full system** for the hackathon

---

## Important Notes

- **Their MockSimulator is intentionally simple** - it's meant to be replaced by YOUR brain simulator
- **Data format conversion is straightforward** - just map between the two schemas
- **Both systems are modular** - easy to swap components
- **Keep both systems** - yours for research, theirs for production optimization

Good luck integrating! 🚀
