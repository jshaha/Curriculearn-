# Agent Pipeline: What Each Agent Outputs

## Complete Data Flow

```
Raw File → [Agent 1] → Sections → [Agent 2] → Embeddings → [Agent 3] → Metrics
→ [Agent 4] → Diagnoses → [Agent 5] → Candidates → [Agent 6] → Optimized Lesson
```

---

## 🔵 Agent 1: Curriculum Parser

**Purpose**: Extract text from lesson files
**Input**: Raw file (PDF, PPTX, DOCX, TXT)
**Output**: Parsed sections with metadata

### Output Format:
```python
{
  'sections': [
    "Python is a high-level programming language...",
    "Variables store data. You can create them...",
    "Functions are reusable blocks of code..."
  ],
  'metadata': {
    'filename': 'lesson.txt',
    'page_count': 1,
    'format': 'txt'
  }
}
```

**Converts to**: `StructuredLesson` object
```python
StructuredLesson(
  id="lesson_123",
  title="Python Basics",
  segments=[
    LessonSegment(id="seg_1", content="...", concepts=[], modality="text"),
    LessonSegment(id="seg_2", content="...", concepts=[], modality="text")
  ]
)
```

---

## 🧠 Agent 2: Brain Simulator

**Purpose**: Create semantic embeddings of lesson content
**Input**: List of text segments
**Output**: Neural embeddings (384-dimensional vectors)

### Output Format:
```python
{
  'embeddings': numpy.array([
    [-0.0377, 0.0142, -0.0147, ...],  # Segment 1 (384 dims)
    [0.0234, -0.0891, 0.1023, ...],   # Segment 2 (384 dims)
    ...
  ]),
  'model_name': 'all-MiniLM-L6-v2',
  'num_segments': 5,
  'num_features': 384,
  'timestamps': [0.0, 1.0, 2.0, 3.0, 4.0]
}
```

**What it means**: Each segment is converted to a 384-number vector that represents its semantic meaning. Similar concepts have similar vectors.

---

## 📊 Agent 3: Metric Translator

**Purpose**: Convert brain embeddings to educational metrics
**Input**: Brain states (embeddings)
**Output**: Educational metrics (0-100 scale)

### Output Format:
```python
{
  'learning_score': 9.1,  # Overall quality (0-100)

  # Global metrics (averaged across lesson)
  'engagement': 0.7,
  'cognitive_load': 100.0,
  'concept_flow': 28.2,
  'retention': 30.0,
  'novelty': 100.0,
  'information_density': 4.9,

  # Per-segment metrics (temporal evolution)
  'temporal_metrics': {
    'engagement': [50.0, 50.0, 50.0, 50.0, 50.0],
    'cognitive_load': [50.0, 50.0, 50.0, 50.0, 50.0],
    'concept_flow': [50.0, 50.0, 50.0, 50.0, 50.0],
    'retention': [50.0, 50.0, 50.0, 50.0, 50.0]
  },

  'problem_segments': [
    "Segment 1: introduces too much new information",
    "Segment 2: introduces too much new information"
  ]
}
```

**Converted to**: `MetricReport` (backend schema)
```python
MetricReport(
  learning_score=9.1,
  global_metrics=MetricScores(
    engagement=0.7,
    cognitive_load=100.0,
    concept_flow=28.2,
    retention=30.0,
    ...
  ),
  segment_metrics=[
    SegmentMetric(segment_id="seg_1", metrics=MetricScores(...)),
    SegmentMetric(segment_id="seg_2", metrics=MetricScores(...))
  ]
)
```

---

## 🔍 Agent 4: Educational Diagnostician

**Purpose**: Detect educational issues based on metrics
**Input**: Lesson + MetricReport
**Output**: List of diagnosed issues with priorities

### Output Format:
```python
DiagnosisReport(
  diagnoses=[
    Diagnosis(
      id="diag_001",
      segment_id="segment_1",
      issue_type="low_retention",
      severity="high",
      priority=1,
      explanation="The lesson does not sufficiently revisit or reinforce earlier concepts.",
      recommended_actions=["add_retrieval_question", "add_recap"],
      affected_metrics={'retention': 30.0, 'reinforcement': 20.0}
    ),
    Diagnosis(
      id="diag_002",
      segment_id="segment_2",
      issue_type="low_retention",
      severity="medium",
      priority=2,
      explanation="...",
      recommended_actions=["add_retrieval_question"],
      affected_metrics={'retention': 30.0}
    )
  ]
)
```

**Issue Types Detected**:
- `cognitive_overload`: Too much information at once
- `poor_concept_flow`: Abrupt transitions
- `low_retention`: No reinforcement of concepts
- `low_multimodal_support`: Only one teaching channel
- `novelty_spike`: New idea appears suddenly

---

## ✏️ Agent 5: Curriculum Editor

**Purpose**: Generate candidate lesson improvements
**Input**: Lesson + DiagnosisReport
**Output**: List of edited lesson variants

### Output Format:
```python
[
  EditedLessonCandidate(
    candidate_id="candidate_1_segment_1_add_retrieval_question",
    lesson=StructuredLesson(...),  # Modified lesson
    edit_plan=EditPlan(
      edits=[
        EditOperation(
          id="edit_001",
          action="add_retrieval_question",
          target_segment_id="segment_1",
          rationale="Low retention detected",
          expected_metric_impact={'retention': +20.0, 'reinforcement': +30.0},
          before_segment=LessonSegment(...),
          inserted_segment_ids=["segment_1_retrieval"]
        )
      ]
    )
  ),
  EditedLessonCandidate(...),  # Candidate 2
  EditedLessonCandidate(...)   # Candidate 3
]
```

**Edit Actions Available**:
1. `split_section` - Divide dense content into intuition + detail
2. `simplify_explanation` - Rephrase complex text
3. `add_analogy` - Insert domain-specific analogy
4. `add_example` - Add real-world example
5. `add_retrieval_question` - Add spaced repetition check
6. `add_transition` - Bridge concept gaps

**Example Edit**:
```
BEFORE:
  Segment 1: "Python is a high-level programming language..."

AFTER (add_retrieval_question):
  Segment 1: "Python is a high-level programming language..."
  Segment 1_retrieval: "Quick check: What makes Python different from other languages?"
```

---

## 🏆 Agent 6: Lesson Optimizer

**Purpose**: Find the best lesson through iterative search
**Input**: Original lesson + Simulator
**Output**: Optimization result with best lesson found

### Output Format:
```python
OptimizationResult(
  original_lesson=StructuredLesson(...),
  best_lesson=StructuredLesson(...),  # Improved version

  original_score=9.1,
  best_score=13.0,

  iterations=2,  # Number of optimization rounds
  edit_history=[
    EditPlan(...),  # Iteration 1 accepted edit
    EditPlan(...)   # Iteration 2 accepted edit
  ],

  iteration_history=[
    OptimizationIteration(
      iteration=1,
      diagnoses=DiagnosisReport(...),
      candidates=[
        CandidateEvaluation(
          candidate_id="no-op",
          score=9.1,
          score_delta=0.0
        ),
        CandidateEvaluation(
          candidate_id="candidate_1_segment_1_add_retrieval_question",
          score=11.2,
          score_delta=+2.1,  # ✓ SELECTED
          edit_plan=EditPlan(...)
        ),
        CandidateEvaluation(
          candidate_id="candidate_2_segment_2_add_retrieval_question",
          score=10.4,
          score_delta=+1.2
        )
      ],
      selected_candidate_id="candidate_1_segment_1_add_retrieval_question"
    ),
    OptimizationIteration(
      iteration=2,
      ...
    )
  ],

  original_metrics=MetricReport(...),
  best_metrics=MetricReport(...)
)
```

### Optimization Process:
```
Iteration 1:
  1. Diagnose current lesson → Found 4 issues
  2. Generate 3 candidates → Each addresses top issue
  3. Evaluate each candidate:
     - no-op:         9.1 (Δ+0.0)
     - candidate_1:  11.2 (Δ+2.1) ✓ BEST
     - candidate_2:  10.4 (Δ+1.2)
  4. Select best → candidate_1 becomes new current lesson

Iteration 2:
  1. Diagnose new lesson → Found 4 issues
  2. Generate 3 candidates
  3. Evaluate each:
     - no-op:         11.2 (Δ+0.0)
     - candidate_1:   13.0 (Δ+1.8) ✓ BEST
     - candidate_2:   13.0 (Δ+1.8) (tie)
  4. Select best → candidate_1 accepted

Result: 9.1 → 13.0 (+3.9 points improvement)
```

---

## 🎨 Agent 7: Visualization Generator (Optional)

**Purpose**: Generate AI images/diagrams for lesson segments
**Input**: Optimized lesson
**Output**: Visual assets per segment

### Output Format:
```python
{
  'segment_1': [
    LessonVisualization(
      id="vis_001",
      segment_id="segment_1",
      type=VisualType.DIAGRAM,
      image_data="data:image/png;base64,iVBORw0KG...",  # Base64 PNG
      alt_text="Diagram showing Python syntax structure",
      prompt="Create a diagram showing Python's simple syntax..."
    )
  ],
  'segment_2': [
    LessonVisualization(
      id="vis_002",
      segment_id="segment_2",
      type=VisualType.ILLUSTRATION,
      image_data="data:image/png;base64,iVBORw0KG...",
      alt_text="Illustration of variables storing data",
      prompt="Create an illustration showing how variables store data..."
    )
  ]
}
```

**Visual Types**:
- `DIAGRAM`: Workflows, processes, architectures
- `CONCEPT_MAP`: Relationships between ideas
- `CHART`: Data visualization, comparisons
- `ILLUSTRATION`: Abstract concepts made concrete
- `METAPHOR`: Visual analogies

---

## Summary: What Gets Returned to User

### Via API (`POST /api/optimize/<lesson_id>`):
```json
{
  "result_id": "uuid-123",
  "lesson_id": "lesson-456",
  "original_score": 9.1,
  "optimized_score": 13.0,
  "improvement": 3.9,
  "iterations": 2,
  "message": "Optimization complete"
}
```

### Via `GET /api/result/<result_id>`:
```json
{
  "result_id": "uuid-123",
  "original_score": 9.1,
  "optimized_score": 13.0,
  "improvement": 3.9,
  "iterations": 2,
  "original_lesson": {
    "title": "Python Basics",
    "segments": [...]
  },
  "optimized_lesson": {
    "title": "Python Basics",
    "segments": [
      {"id": "segment_1", "content": "..."},
      {"id": "segment_1_retrieval", "content": "Quick check: ..."},
      {"id": "segment_2", "content": "..."}
    ]
  }
}
```

### Downloaded JSON File:
```json
{
  "title": "Python Basics",
  "learning_score": 13.0,
  "improvement": 3.9,
  "segments": [
    {
      "title": "Introduction",
      "content": "Python is a high-level programming language...",
      "concepts": ["python"]
    },
    {
      "title": "Retrieval Check",
      "content": "Quick check: What makes Python different?",
      "concepts": ["python"]
    }
  ]
}
```

---

## Key Takeaways

1. **Each agent has a specific role** in the pipeline
2. **Data flows sequentially** from parsing → optimization
3. **Real neural processing** happens in Agents 2-3
4. **Deterministic diagnosis** in Agent 4
5. **Iterative search** in Agent 6 ensures quality
6. **All changes are tracked** in edit_history and iteration_history
7. **Results are fully explainable** - you can see why each edit was made
