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

## Partner Agent 1–3 Integration Contract

The Agent 4–6 optimizer expects the upstream pipeline to return a valid `MetricReport` for the same `StructuredLesson` it receives. The partner pipeline must:

1. Accept or reference the exact `StructuredLesson` JSON used by the optimizer.
2. Preserve every `segment_id` exactly and return one `SegmentMetric` per lesson segment when possible.
3. Normalize all `MetricScores` fields to 0–100: engagement, cognitive load, concept flow, retention, novelty, information density, reinforcement, and multimodal support.
4. Include a top-level `learning_score` and valid JSON matching the `MetricReport` schema.
5. Include confidence and warnings when output is uncertain.

Agent 4 raises an error for mismatched segment IDs by default. This is intentional: silently associating brain-model output with the wrong lesson section would make diagnoses unreliable. See [partner_metric_report_sample.json](backend/neurocompiler/data/partner_metric_report_sample.json) for a complete handoff example and [PARTNER_INTEGRATION_TODO.md](docs/PARTNER_INTEGRATION_TODO.md) for the questions to resolve before live integration.

`JsonMetricSimulator` is useful for loading a static precomputed report and testing diagnosis against partner output. True optimization of edited candidates requires the upstream simulator to evaluate each newly edited lesson and return a fresh `MetricReport`.

## Limitations

`MockSimulator` is a development-time text heuristic, not the scientific brain model. Its scores are useful for exercising the pipeline and demoing behavior, not for making educational or scientific claims. Current edits are template-based, and source-file rendering (PDF/PPTX) is intentionally out of scope.
