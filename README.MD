# Curriculearn / NeuroCompiler

Curriculearn uses a brain-inspired simulation signal to estimate how lesson content may affect cognitive response patterns, then uses an agentic optimization loop to diagnose bottlenecks and generate improved lesson variants.

The current backend is model-agnostic: `MockSimulator` makes the workflow runnable today, while a partner's brain or voxel-output system can replace it later through the simulator adapter. A simulation provides a predicted cognitive-response signal; it does not prove that a lesson is better.

## Architecture

```text
Structured lesson → Simulator → Metric report → Diagnostician (Agent 4)
                                         ↓
Optimizer (Agent 6) ← Curriculum editor (Agent 5) ← Diagnoses
```

- Agent 4 detects overload, weak concept flow, low retention, weak multimodal support, and novelty spikes.
- Agent 5 produces structured JSON lesson variants; it does not render `.pptx` files.
- Agent 6 evaluates a bounded set of candidates, selects improvements, and retains a complete iteration trace.

## Optimization loop

Curriculearn does not currently use autonomous LLM agents debating with each other. It uses a controlled optimization loop:

```text
diagnose → generate candidates → simulate → score → select → repeat
```

The diagnostician identifies bottlenecks, the editor proposes bounded structured edits, and the optimizer performs greedy discrete search over those alternatives. `MockSimulator` supports fast local development and control-loop demos. `JsonMetricSimulator` loads precomputed partner metrics for diagnosis and integration testing. `ExternalSimulatorClient` is the future boundary where newly edited lessons can be evaluated by a partner’s real brain-model service.

## Setup

```bash
git clone <repo-url>
cd Curriculearn-
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest
```

## Run the demo

```bash
python -m neurocompiler.cli optimize \
  --lesson backend/neurocompiler/data/sample_lesson.json \
  --out backend/neurocompiler/data/optimized_lesson.json
```

The output includes `original_score`, `best_score`, `score_delta`, `best_lesson`, initial `diagnoses`, `edit_history`, and `iteration_history` (including every candidate score and the selected candidate).

## Partner integration contract

Implement the `SimulatorProtocol` in `backend/neurocompiler/adapters/simulator.py`. Its `simulate(lesson)` method returns a `MetricReport` with normalized 0–100 global and per-segment metrics. Every `segment_id` must exactly match a `StructuredLesson` segment ID; Agent 4 validates this strictly by default.

`MetricReport` and `SegmentMetric` also accept optional model name/version, confidence, warnings, timings, and raw artifact paths. This enables a brain-model or voxel-output pipeline to preserve provenance without coupling this package to TRIBE or another specific backend.

For precomputed partner output, `JsonMetricSimulator` loads a `MetricReport` JSON artifact and validates its segment IDs against the lesson. It is intended for integration and diagnosis testing; candidate optimization needs a simulator that can score each changed lesson.

## Limitations

`MockSimulator` is a development-time text heuristic, not the scientific brain model. Its scores are useful for exercising the pipeline and demoing behavior, not for making educational or scientific claims. Current edits are template-based, and source-file rendering (PDF/PPTX) is intentionally out of scope.
