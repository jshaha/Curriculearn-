# Agent Interface Specification

This document defines the data contracts between agents for NeuroCompiler.

## Agent 2: Brain Simulator

**Responsibility:** Generate brain-like representations of lesson content

### Input Format
```python
{
    'sections': [
        "Lesson segment 1 text...",
        "Lesson segment 2 text...",
        # OR
        {'content': "Lesson segment text...", 'metadata': {...}},
        ...
    ],
    'metadata': {  # Optional
        'lesson_title': str,
        'subject': str,
        ...
    }
}
```

### Output Format
```python
{
    'embeddings': np.ndarray,  # Shape: (num_segments, 384)
                              # Each row is a 384-dim semantic embedding
    'timestamps': [0, 1, 2, ...],  # Time indices for each segment
    'num_features': 384,  # Embedding dimension
    'num_segments': int,  # Number of lesson segments
    'segment_texts': [str, ...],  # Original text segments
    'representation_type': 'semantic_embeddings',
    'model_name': 'all-MiniLM-L6-v2'
}
```

**Key Points:**
- `embeddings` is the "brain representation" (like TRIBE's voxels, but semantic features)
- Each row represents one lesson segment's cognitive state
- Each column is a semantic feature (like a voxel represents a brain region)

---

## Agent 3: Metric Translator

**Responsibility:** Convert brain representations into educational metrics

### Input Format
Receives the output from Agent 2 (brain states dictionary)

### Output Format
```python
{
    # Aggregate Metrics (0-100 scale)
    'learning_score': 72.3,        # Overall learning effectiveness
    'cognitive_load': 84.2,        # Higher = more load (BAD)
    'engagement': 76.5,            # Higher = more engaging (GOOD)
    'concept_flow': 58.1,          # Higher = smoother transitions (GOOD)
    'retention': 46.3,             # Higher = better reinforcement (GOOD)
    'novelty': 71.2,               # Higher = more novel concepts (NEUTRAL)
    'information_density': 65.4,   # Higher = more info per segment (NEUTRAL)

    # Temporal Trajectories (for visualization)
    'temporal_metrics': {
        'cognitive_load_trajectory': [45.2, 67.8, 89.3, ...],  # Per transition
        'novelty_trajectory': [52.1, 61.2, ...],
        'segment_indices': [1, 2, 3, ...]
    },

    # Problem Detection
    'problem_segments': [
        {
            'segment_index': 5,
            'type': 'cognitive_overload',  # or 'abrupt_transition'
            'severity': 'high',  # or 'medium', 'low'
            'score': 89.3,
            'description': 'Segment 5 introduces too much new information',
            'recommendation': 'Break this segment into smaller parts or add scaffolding',
            'text': 'Original segment text...'
        },
        ...
    ],

    # Metadata
    'num_segments': 10,
    'timestamps': [0, 1, 2, ...]
}
```

---

## For Agent 4+ Developers

### What You Receive
Agent 4 (Educational Diagnostician) receives the metrics dictionary from Agent 3.

### Key Metrics to Use

1. **learning_score** (0-100)
   - Overall lesson quality
   - Target: > 70 is good, > 80 is excellent

2. **cognitive_load** (0-100, LOWER IS BETTER)
   - > 70 = High load, likely problems
   - 50-70 = Moderate load
   - < 50 = Low load, good pacing

3. **engagement** (0-100, HIGHER IS BETTER)
   - > 70 = Good engagement
   - < 50 = Boring or repetitive

4. **concept_flow** (0-100, HIGHER IS BETTER)
   - > 70 = Smooth transitions
   - < 50 = Disjointed concepts

5. **retention** (0-100, HIGHER IS BETTER)
   - > 60 = Good reinforcement
   - < 40 = Concepts not reinforced

### Problem Segments
Pre-identified issues for Agent 4 to diagnose:

```python
for problem in metrics['problem_segments']:
    segment_idx = problem['segment_index']
    issue_type = problem['type']  # 'cognitive_overload' or 'abrupt_transition'
    severity = problem['severity']  # 'high', 'medium', 'low'
    recommendation = problem['recommendation']

    # Agent 4: Elaborate on the diagnosis
    # Agent 5: Implement the fix
    # Agent 6: Verify improvement
```

### Example Usage in Agent 4
```python
def diagnose_lesson(metrics):
    """Agent 4: Educational Diagnostician"""

    issues = []

    # Check overall cognitive load
    if metrics['cognitive_load'] > 70:
        issues.append({
            'type': 'overall_pacing',
            'description': 'Lesson moves too quickly overall',
            'recommendation': 'Add more examples and gradual scaffolding'
        })

    # Check specific problem segments
    for problem in metrics['problem_segments']:
        if problem['severity'] == 'high':
            issues.append({
                'type': problem['type'],
                'segment': problem['segment_index'],
                'description': problem['description'],
                'recommendation': problem['recommendation']
            })

    # Check retention
    if metrics['retention'] < 40:
        issues.append({
            'type': 'insufficient_reinforcement',
            'description': 'Key concepts are not reinforced',
            'recommendation': 'Add retrieval practice and concept reviews'
        })

    return issues
```

### Example Usage in Agent 5
```python
def edit_lesson(original_lesson, diagnoses):
    """Agent 5: Curriculum Editor"""

    edits = []

    for diagnosis in diagnoses:
        if diagnosis['type'] == 'cognitive_overload':
            # Split the dense segment
            segment_idx = diagnosis['segment']
            edits.append({
                'action': 'split_segment',
                'segment': segment_idx,
                'into': 2  # Split into 2 parts
            })

        elif diagnosis['type'] == 'abrupt_transition':
            # Add bridging content
            segment_idx = diagnosis['segment']
            edits.append({
                'action': 'insert_transition',
                'before_segment': segment_idx,
                'content': generate_transition(...)
            })

        elif diagnosis['type'] == 'insufficient_reinforcement':
            # Add review questions
            edits.append({
                'action': 'insert_review',
                'at_segment': len(original_lesson) // 2,
                'content': generate_review(...)
            })

    return apply_edits(original_lesson, edits)
```

### Example Usage in Agent 6
```python
def optimize_lesson(original_lesson, max_iterations=5):
    """Agent 6: Optimizer"""

    best_lesson = original_lesson
    best_score = evaluate_lesson(original_lesson)['learning_score']

    for i in range(max_iterations):
        # Generate candidate improvements
        diagnoses = agent_4.diagnose(best_lesson)
        candidate = agent_5.edit(best_lesson, diagnoses)

        # Evaluate candidate
        metrics = evaluate_lesson(candidate)

        # Keep if better
        if metrics['learning_score'] > best_score:
            best_lesson = candidate
            best_score = metrics['learning_score']
            print(f"Iteration {i}: Score improved to {best_score:.1f}")
        else:
            print(f"Iteration {i}: No improvement")
            break

    return best_lesson, best_score


def evaluate_lesson(lesson_segments):
    """Helper: Run full pipeline"""
    brain_states = brain_sim.simulate_from_text_list(lesson_segments)
    metrics = metric_translator.translate(brain_states)
    return metrics
```

---

## Testing Your Agent

When developing Agent 4+, you can test with this minimal example:

```python
from agents import BrainSimulator, MetricTranslator

# Setup
brain_sim = BrainSimulator()
metric_translator = MetricTranslator()

# Test lesson
lesson = [
    "Introduction to the topic",
    "Main concept 1",
    "Main concept 2",
    # ... your test content
]

# Get metrics
brain_states = brain_sim.simulate_from_text_list(lesson)
metrics = metric_translator.translate(brain_states)

# Now test your agent
your_agent_output = your_agent_function(metrics)
```

---

## Optimization Target

The goal is to maximize the `learning_score`, which is computed as:

```
Learning Score = 0.35 × Engagement
               - 0.30 × Cognitive Load  (negative weight!)
               + 0.20 × Concept Flow
               + 0.10 × Retention
               + 0.05 × Information Density
```

**What this means:**
- Increasing engagement helps most (35% weight)
- Reducing cognitive load is very important (30% weight, negative)
- Smooth concept flow matters (20% weight)
- Retention support is valuable (10% weight)
- Information density has minor impact (5% weight)

**Optimization Strategy:**
1. Fix high cognitive load first (biggest negative impact)
2. Improve engagement (biggest positive impact)
3. Smooth out concept flow
4. Add reinforcement for retention
