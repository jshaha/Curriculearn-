"""
SIMPLIFIED AGENT PIPELINE WALKTHROUGH
======================================
Shows what each agent outputs in a clear, visual format.
"""

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'src'))
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from neurocompiler.schemas import StructuredLesson, LessonSegment
from neurocompiler.agents import EducationalDiagnostician, CurriculumEditor, LessonOptimizer
from src.adapters.brain_simulator_adapter import BrainSimulatorAdapter


def hr(char="=", width=80):
    print(char * width)


def section_title(title):
    print(f"\n{'='*80}")
    print(f" {title}")
    print(f"{'='*80}\n")


# Create sample lesson
lesson = StructuredLesson(
    id="python_basics",
    title="Python Programming Basics",
    learning_goals=["Understand Python fundamentals"],
    segments=[
        LessonSegment(
            id="segment_1",
            title="Introduction",
            content="Python is a high-level programming language known for its simple syntax.",
            concepts=["python"],
            modality="text"
        ),
        LessonSegment(
            id="segment_2",
            title="Variables",
            content="Variables store data. You can create them like: x = 5 or name = 'Alice'.",
            concepts=["variables"],
            modality="text"
        ),
        LessonSegment(
            id="segment_3",
            title="Functions",
            content="Functions are reusable blocks of code defined with the def keyword.",
            concepts=["functions"],
            modality="text"
        ),
        LessonSegment(
            id="segment_4",
            title="Lists",
            content="Lists store multiple items in order: numbers = [1, 2, 3, 4, 5].",
            concepts=["lists"],
            modality="text"
        ),
        LessonSegment(
            id="segment_5",
            title="Loops",
            content="Loops repeat actions. For loops iterate over sequences.",
            concepts=["loops"],
            modality="text"
        ),
    ]
)

section_title("STEP 1-3: BRAIN SIMULATION & METRIC ANALYSIS")
print("Agents 2 + 3 wrapped in BrainSimulatorAdapter")
print("Input:  Lesson with 5 segments")
print("Output: MetricReport with educational metrics\n")

adapter = BrainSimulatorAdapter()
metric_report = adapter.simulate(lesson)

print("\n📊 METRICS OUTPUT:")
print(f"  Learning Score: {metric_report.learning_score:.1f}/100")
print(f"\n  Global Metrics:")
print(f"    Engagement:     {metric_report.global_metrics.engagement:.1f}")
print(f"    Cognitive Load: {metric_report.global_metrics.cognitive_load:.1f}")
print(f"    Concept Flow:   {metric_report.global_metrics.concept_flow:.1f}")
print(f"    Retention:      {metric_report.global_metrics.retention:.1f}")

print(f"\n  Per-Segment Metrics:")
for seg_metric in metric_report.segment_metrics:
    print(f"\n    {seg_metric.segment_id}:")
    m = seg_metric.metrics
    print(f"      Engagement:     {m.engagement:.1f}")
    print(f"      Cognitive Load: {m.cognitive_load:.1f}")
    print(f"      Concept Flow:   {m.concept_flow:.1f}")
    print(f"      Retention:      {m.retention:.1f}")

# ============================================================================
section_title("STEP 4: DIAGNOSTICIAN - DETECT ISSUES")
print("Input:  Lesson + MetricReport")
print("Output: DiagnosisReport\n")

diagnostician = EducationalDiagnostician()
diagnosis_report = diagnostician.diagnose(lesson, metric_report)

print(f"📋 DIAGNOSES OUTPUT:")
print(f"  Issues Found: {len(diagnosis_report.diagnoses)}\n")

if diagnosis_report.diagnoses:
    for i, diag in enumerate(diagnosis_report.diagnoses[:5], 1):  # Show first 5
        print(f"  {i}. {diag.issue_type} at {diag.segment_id}")
        print(f"     Severity: {diag.severity} | Priority: {diag.priority}")
        print(f"     {diag.explanation}")
        print(f"     Recommended: {', '.join(diag.recommended_actions[:2])}")
        print()
else:
    print("  ✓ No issues detected!")

# ============================================================================
section_title("STEP 5: CURRICULUM EDITOR - GENERATE FIXES")
print("Input:  Lesson + DiagnosisReport")
print("Output: List of EditedLessonCandidates\n")

if diagnosis_report.diagnoses:
    editor = CurriculumEditor()
    candidates = editor.generate_candidates(lesson, diagnosis_report, max_candidates=3)

    print(f"✏️  EDIT CANDIDATES OUTPUT:")
    print(f"  Generated: {len(candidates)} candidate variants\n")

    for i, candidate in enumerate(candidates, 1):
        print(f"  Candidate {i}: {candidate.candidate_id}")
        for edit_op in candidate.edit_plan.edits:
            print(f"    Action: {edit_op.action}")
            print(f"    Target: {edit_op.target_segment_id}")
            print(f"    Expected Impact: {edit_op.expected_metric_impact}")

            if edit_op.action == "split_section" and edit_op.new_segments:
                print(f"    Creates {len(edit_op.new_segments)} new segments:")
                for new_seg in edit_op.new_segments:
                    print(f"      - {new_seg.id}: {new_seg.content[:50]}...")
            else:
                # Show modified content
                modified_seg = next(
                    (s for s in candidate.lesson.segments if s.id == edit_op.target_segment_id),
                    None
                )
                if modified_seg:
                    print(f"    Modified: {modified_seg.content[:70]}...")
        print()
else:
    candidates = []
    print("No candidates generated (no issues to fix)")

# ============================================================================
section_title("STEP 6: OPTIMIZER - FIND BEST LESSON")
print("Input:  Original lesson + Simulator")
print("Output: OptimizationResult\n")
print("Process:")
print("  1. Diagnose current lesson")
print("  2. Generate candidate edits")
print("  3. Evaluate each with brain simulator")
print("  4. Select best performer")
print("  5. Repeat until no improvement\n")

optimizer = LessonOptimizer(diagnostician=diagnostician, editor=editor)
result = optimizer.optimize(
    lesson=lesson,
    simulator=adapter,
    max_iterations=2,
    max_candidates=3,
    min_improvement=1.0
)

print(f"🏆 OPTIMIZATION RESULT:")
print(f"\n  Original Score: {result.original_score:.1f}/100")
print(f"  Final Score:    {result.best_score:.1f}/100")
print(f"  Improvement:    {result.best_score - result.original_score:+.1f} points")
print(f"  Iterations:     {result.iterations}")
print(f"  Edits Applied:  {len(result.edit_history)}")

print(f"\n  Iteration Details:")
for iteration in result.iteration_history:
    print(f"\n  Iteration {iteration.iteration}:")
    print(f"    Diagnoses: {len(iteration.diagnoses.diagnoses)} issues found")
    print(f"    Tested: {len(iteration.candidates)} candidates")

    # Show scores
    for cand in iteration.candidates:
        symbol = "✓" if cand.candidate_id == iteration.selected_candidate_id else " "
        action = cand.edit_plan.edits[0].action if cand.edit_plan.edits else "no-op"
        print(f"      {symbol} {action:25s} Score: {cand.score:.1f} (Δ{cand.score_delta:+.1f})")

    if iteration.selected_candidate_id:
        print(f"    → Selected: {iteration.selected_candidate_id}")
    else:
        print(f"    → No improvement, stopped")

print(f"\n  Final Lesson:")
print(f"    Segments: {len(result.best_lesson.segments)}")
for i, seg in enumerate(result.best_lesson.segments, 1):
    print(f"      {i}. {seg.id}")

# ============================================================================
section_title("COMPLETE DATA FLOW SUMMARY")

print("""
┌─────────────────────────────────────────────────────────────────────────┐
│ AGENT PIPELINE DATA FLOW                                                │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  Raw Lesson File     │  ← User uploads PDF/PPTX/DOCX/TXT
│  (PDF, DOCX, TXT)    │
└──────────┬───────────┘
           │
           ↓ [Agent 1: CurriculumParser]
           │
┌──────────┴───────────┐
│  Parsed Sections     │  ← List of text segments + metadata
│  ['section 1', ...]  │
└──────────┬───────────┘
           │
           ↓ Convert to StructuredLesson
           │
┌──────────┴───────────┐
│  StructuredLesson    │  ← Lesson object with LessonSegments
│  {id, title, segs}   │
└──────────┬───────────┘
           │
           ↓ [Agent 2: BrainSimulator]
           │
┌──────────┴───────────┐
│  Brain States        │  ← 384-dim embeddings per segment
│  numpy(5, 384)       │
└──────────┬───────────┘
           │
           ↓ [Agent 3: MetricTranslator]
           │
┌──────────┴───────────┐
│  MetricReport        │  ← 8 educational metrics (0-100 scale)
│  {score: 15.0, ...}  │  ← Per-segment + global metrics
└──────────┬───────────┘
           │
           ↓ [Agent 4: Diagnostician]
           │
┌──────────┴───────────┐
│  DiagnosisReport     │  ← List of issues with priorities
│  [Issue1, Issue2...] │  ← "cognitive_overload", "low_retention"
└──────────┬───────────┘
           │
           ↓ [Agent 5: CurriculumEditor]
           │
┌──────────┴───────────┐
│  Candidate Lessons   │  ← 3 edited lesson variants
│  [Variant1, V2, V3]  │  ← Each with edit_plan
└──────────┬───────────┘
           │
           ↓ [Agent 6: Optimizer] (iterative loop)
           │  ├─ Evaluate each candidate
           │  ├─ Select best
           │  └─ Repeat until no improvement
           │
┌──────────┴───────────┐
│  OptimizationResult  │  ← Best lesson found
│  {best_lesson, ...}  │  ← Original vs optimized comparison
└──────────────────────┘

KEY DATA STRUCTURES:
  • StructuredLesson: {id, title, segments[], learning_goals[]}
  • LessonSegment: {id, title, content, concepts[], modality}
  • MetricReport: {learning_score, global_metrics, segment_metrics[]}
  • Diagnosis: {segment_id, issue_type, severity, priority, actions[]}
  • EditOperation: {action, target, rationale, expected_impact}
  • OptimizationResult: {original, best, iterations, edit_history[]}
""")

hr()
print(" END OF WALKTHROUGH")
hr()
