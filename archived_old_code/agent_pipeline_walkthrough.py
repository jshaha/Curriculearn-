"""
COMPLETE AGENT PIPELINE WALKTHROUGH
====================================
This script demonstrates what each agent outputs at every step.
"""

import sys
import json
from pathlib import Path

# Add paths
sys.path.insert(0, str(Path(__file__).parent / 'src'))
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from neurocompiler.schemas import StructuredLesson, LessonSegment
from neurocompiler.agents import EducationalDiagnostician, CurriculumEditor, LessonOptimizer
from src.agents import CurriculumParser, BrainSimulator, MetricTranslator
from src.adapters.brain_simulator_adapter import BrainSimulatorAdapter


def print_separator(title, char="="):
    """Print a nice separator with title"""
    print(f"\n{char * 80}")
    print(f" {title}")
    print(f"{char * 80}\n")


def print_json(data, indent=2):
    """Pretty print JSON data"""
    print(json.dumps(data, indent=indent, default=str))


def walkthrough():
    """Step-by-step walkthrough of the entire pipeline"""

    print_separator("AGENT PIPELINE WALKTHROUGH", "=")
    print("This demonstrates what each agent outputs at every step.\n")

    # ============================================================================
    # AGENT 1: CURRICULUM PARSER
    # ============================================================================
    print_separator("AGENT 1: CURRICULUM PARSER", "-")
    print("INPUT:  Raw lesson file (PDF, PPTX, DOCX, or TXT)")
    print("OUTPUT: Parsed sections with metadata\n")

    # Create a simple test lesson instead of parsing a file
    print("For this demo, we'll use a simple lesson about Python programming:\n")

    raw_lesson = """
Python Programming Basics

Python is a high-level programming language known for its simple syntax.

Variables store data. You can create them like: x = 5 or name = "Alice".

Functions are reusable blocks of code defined with the def keyword.

Lists store multiple items in order: numbers = [1, 2, 3, 4, 5].

Loops repeat actions. For loops iterate over sequences.
""".strip()

    print(f"Raw Text:\n{raw_lesson}\n")

    # Simulate parsing (normally would use CurriculumParser)
    sections = [
        "Python is a high-level programming language known for its simple syntax.",
        "Variables store data. You can create them like: x = 5 or name = \"Alice\".",
        "Functions are reusable blocks of code defined with the def keyword.",
        "Lists store multiple items in order: numbers = [1, 2, 3, 4, 5].",
        "Loops repeat actions. For loops iterate over sequences."
    ]

    print("AGENT 1 OUTPUT (Parsed Sections):")
    for i, section in enumerate(sections, 1):
        print(f"  Section {i}: {section}")

    # Convert to StructuredLesson format
    lesson = StructuredLesson(
        id="python_basics",
        title="Python Programming Basics",
        learning_goals=["Understand Python fundamentals"],
        segments=[
            LessonSegment(
                id=f"segment_{i}",
                title=f"Section {i}",
                content=text,
                concepts=[],
                modality="text"
            )
            for i, text in enumerate(sections, 1)
        ]
    )

    print(f"\nStructured Lesson Created:")
    print(f"  ID: {lesson.id}")
    print(f"  Title: {lesson.title}")
    print(f"  Segments: {len(lesson.segments)}")

    # ============================================================================
    # AGENT 2: BRAIN SIMULATOR
    # ============================================================================
    print_separator("AGENT 2: BRAIN SIMULATOR", "-")
    print("INPUT:  Structured lesson segments (text)")
    print("OUTPUT: Neural embeddings (384-dimensional vectors)\n")

    print("Initializing brain simulator...")
    brain_sim = BrainSimulator()

    # Extract text segments
    text_segments = [seg.content for seg in lesson.segments]

    print(f"\nProcessing {len(text_segments)} text segments through sentence transformer...")
    brain_states = brain_sim.simulate_from_text_list(text_segments)

    print("\nAGENT 2 OUTPUT (Brain States):")
    print(f"  Model: {brain_states['model_name']}")
    print(f"  Embeddings shape: {brain_states['embeddings'].shape}")
    print(f"  Embedding dimension: {brain_states['num_features']}")
    print(f"  Number of segments: {brain_states['num_segments']}")

    print(f"\n  Sample embedding (first 10 values of segment 1):")
    print(f"    {brain_states['embeddings'][0][:10]}")

    print(f"\n  These are semantic representations of each segment's meaning.")
    print(f"  Similar concepts will have similar embeddings.\n")

    # ============================================================================
    # AGENT 3: METRIC TRANSLATOR
    # ============================================================================
    print_separator("AGENT 3: METRIC TRANSLATOR", "-")
    print("INPUT:  Neural embeddings (brain states)")
    print("OUTPUT: Educational metrics (0-100 scale)\n")

    print("Translating brain states to educational metrics...")
    metric_translator = MetricTranslator()
    metrics_dict = metric_translator.translate(brain_states)

    print("\nAGENT 3 OUTPUT (Educational Metrics):")
    print(f"\n  Overall Learning Score: {metrics_dict['learning_score']:.1f}/100")

    print(f"\n  Global Metrics:")
    print(f"    Engagement:          {metrics_dict['engagement']:.1f}/100")
    print(f"    Cognitive Load:      {metrics_dict['cognitive_load']:.1f}/100")
    print(f"    Concept Flow:        {metrics_dict['concept_flow']:.1f}/100")
    print(f"    Retention:           {metrics_dict['retention']:.1f}/100")
    print(f"    Novelty:             {metrics_dict['novelty']:.1f}/100")
    print(f"    Information Density: {metrics_dict['information_density']:.1f}/100")
    print(f"    Reinforcement:       {metrics_dict['reinforcement']:.1f}/100")
    print(f"    Multimodal Support:  {metrics_dict['multimodal_support']:.1f}/100")

    print(f"\n  Per-Segment Metrics (temporal evolution):")
    temporal = metrics_dict['temporal_metrics']
    for i in range(len(text_segments)):
        print(f"\n    Segment {i+1}:")
        print(f"      Engagement:     {temporal['engagement'][i]:.1f}")
        print(f"      Cognitive Load: {temporal['cognitive_load'][i]:.1f}")
        print(f"      Concept Flow:   {temporal['concept_flow'][i]:.1f}")
        print(f"      Retention:      {temporal['retention'][i]:.1f}")

    # ============================================================================
    # Use Adapter to get full MetricReport
    # ============================================================================
    print_separator("ADAPTER: Converting to Backend Format", "-")
    print("The BrainSimulatorAdapter wraps Agents 2+3 for backend use\n")

    adapter = BrainSimulatorAdapter()
    metric_report = adapter.simulate(lesson)

    print("MetricReport created with:")
    print(f"  Learning Score: {metric_report.learning_score:.1f}")
    print(f"  Segment Metrics: {len(metric_report.segment_metrics)} segments")
    print(f"  Model: {metric_report.model_name}")

    # ============================================================================
    # AGENT 4: EDUCATIONAL DIAGNOSTICIAN
    # ============================================================================
    print_separator("AGENT 4: EDUCATIONAL DIAGNOSTICIAN", "-")
    print("INPUT:  Lesson + MetricReport")
    print("OUTPUT: Diagnoses (educational issues detected)\n")

    diagnostician = EducationalDiagnostician()
    diagnosis_report = diagnostician.diagnose(lesson, metric_report)

    print(f"AGENT 4 OUTPUT (Diagnoses):")
    print(f"\n  Total Issues Found: {len(diagnosis_report.diagnoses)}")

    if diagnosis_report.diagnoses:
        print(f"\n  Detailed Diagnoses:")
        for i, diag in enumerate(diagnosis_report.diagnoses, 1):
            print(f"\n    {i}. Issue ID: {diag.id}")
            print(f"       Segment: {diag.segment_id}")
            print(f"       Type: {diag.issue_type}")
            print(f"       Severity: {diag.severity}")
            print(f"       Priority: {diag.priority}")
            print(f"       Explanation: {diag.explanation}")
            print(f"       Recommended Actions: {', '.join(diag.recommended_actions)}")
            print(f"       Affected Metrics: {diag.affected_metrics}")
    else:
        print("\n  ✓ No issues detected! This is a well-structured lesson.")

    # ============================================================================
    # AGENT 5: CURRICULUM EDITOR
    # ============================================================================
    print_separator("AGENT 5: CURRICULUM EDITOR", "-")
    print("INPUT:  Original lesson + Diagnoses")
    print("OUTPUT: Candidate lesson variants (with edit plans)\n")

    if diagnosis_report.diagnoses:
        editor = CurriculumEditor()
        candidates = editor.generate_candidates(
            lesson=lesson,
            diagnosis_report=diagnosis_report,
            max_candidates=3
        )

        print(f"AGENT 5 OUTPUT (Candidate Edits):")
        print(f"\n  Generated {len(candidates)} candidate lesson variants")

        for i, candidate in enumerate(candidates, 1):
            print(f"\n  Candidate {i}: {candidate.candidate_id}")
            print(f"    Edit Plan:")
            for edit_op in candidate.edit_plan.edits:
                print(f"      Action: {edit_op.action}")
                print(f"      Target: {edit_op.target_segment_id}")
                print(f"      Rationale: {edit_op.rationale}")
                print(f"      Expected Impact: {edit_op.expected_metric_impact}")

                if edit_op.action == "split_section" and edit_op.new_segments:
                    print(f"      New Segments Created: {len(edit_op.new_segments)}")
                    for new_seg in edit_op.new_segments:
                        print(f"        - {new_seg.id}: {new_seg.title}")
                        print(f"          Content: {new_seg.content[:80]}...")
                elif edit_op.action in ["add_analogy", "add_example", "add_retrieval_question", "add_transition"]:
                    # Find the modified segment
                    modified_seg = next(
                        (s for s in candidate.lesson.segments if s.id == edit_op.target_segment_id),
                        None
                    )
                    if modified_seg:
                        original_seg = next(
                            (s for s in lesson.segments if s.id == edit_op.target_segment_id),
                            None
                        )
                        print(f"      Modified Content:")
                        print(f"        BEFORE: {original_seg.content[:80]}...")
                        print(f"        AFTER:  {modified_seg.content[:80]}...")

            print(f"    Resulting Lesson:")
            print(f"      Total Segments: {len(candidate.lesson.segments)}")
    else:
        print("No edits generated (no issues to fix)")
        candidates = []

    # ============================================================================
    # AGENT 6: LESSON OPTIMIZER
    # ============================================================================
    print_separator("AGENT 6: LESSON OPTIMIZER", "-")
    print("INPUT:  Original lesson + Simulator")
    print("OUTPUT: OptimizationResult (best lesson found)\n")

    print("Running iterative optimization loop...")
    print("  - Diagnoses issues")
    print("  - Generates candidates")
    print("  - Evaluates each with real brain simulator")
    print("  - Selects best performer")
    print("  - Repeats until no improvement\n")

    optimizer = LessonOptimizer(diagnostician=diagnostician, editor=editor)
    result = optimizer.optimize(
        lesson=lesson,
        simulator=adapter,
        max_iterations=2,
        max_candidates=3,
        min_improvement=1.0
    )

    print("AGENT 6 OUTPUT (Optimization Result):")
    print(f"\n  Original Score: {result.original_score:.1f}/100")
    print(f"  Best Score:     {result.best_score:.1f}/100")
    print(f"  Improvement:    {result.best_score - result.original_score:+.1f} points")
    print(f"  Iterations Run: {result.iterations}")
    print(f"  Edits Applied:  {len(result.edit_history)}")

    print(f"\n  Iteration History:")
    for iteration in result.iteration_history:
        print(f"\n    Iteration {iteration.iteration}:")
        print(f"      Diagnoses: {len(iteration.diagnoses.diagnoses)} issues")
        print(f"      Candidates Tested: {len(iteration.candidates)}")

        print(f"\n      Candidate Evaluation:")
        for cand in iteration.candidates:
            symbol = "✓" if cand.candidate_id == iteration.selected_candidate_id else " "
            print(f"        {symbol} {cand.candidate_id}")
            print(f"          Score: {cand.score:.1f} (Δ{cand.score_delta:+.1f})")
            if cand.edit_plan.edits:
                print(f"          Edit: {cand.edit_plan.edits[0].action}")

        if iteration.selected_candidate_id:
            print(f"\n      ✓ Selected: {iteration.selected_candidate_id}")
        else:
            print(f"\n      ✗ No improvement found, stopped optimization")

    print(f"\n  Best Lesson Structure:")
    print(f"    Title: {result.best_lesson.title}")
    print(f"    Segments: {len(result.best_lesson.segments)}")
    for i, seg in enumerate(result.best_lesson.segments, 1):
        print(f"      {i}. {seg.id}: {seg.title}")
        print(f"         {seg.content[:60]}...")

    print(f"\n  Original vs Optimized Metrics:")
    print(f"    Engagement:     {result.original_metrics.global_metrics.engagement:.1f} → {result.best_metrics.global_metrics.engagement:.1f}")
    print(f"    Cognitive Load: {result.original_metrics.global_metrics.cognitive_load:.1f} → {result.best_metrics.global_metrics.cognitive_load:.1f}")
    print(f"    Concept Flow:   {result.original_metrics.global_metrics.concept_flow:.1f} → {result.best_metrics.global_metrics.concept_flow:.1f}")
    print(f"    Retention:      {result.original_metrics.global_metrics.retention:.1f} → {result.best_metrics.global_metrics.retention:.1f}")

    # ============================================================================
    # SUMMARY
    # ============================================================================
    print_separator("PIPELINE SUMMARY", "=")

    print("COMPLETE DATA FLOW:\n")
    print("1. CURRICULUM PARSER")
    print("   Input:  Raw file (PDF/PPTX/DOCX/TXT)")
    print("   Output: List of text segments with metadata")
    print()
    print("2. BRAIN SIMULATOR")
    print("   Input:  Text segments")
    print("   Output: 384-dim semantic embeddings per segment")
    print()
    print("3. METRIC TRANSLATOR")
    print("   Input:  Semantic embeddings")
    print("   Output: 8 educational metrics (0-100 scale)")
    print()
    print("4. DIAGNOSTICIAN")
    print("   Input:  Lesson + Metrics")
    print("   Output: List of diagnosed issues with priorities")
    print()
    print("5. CURRICULUM EDITOR")
    print("   Input:  Lesson + Diagnoses")
    print("   Output: 3 candidate lesson variants with edit plans")
    print()
    print("6. OPTIMIZER")
    print("   Input:  Original lesson + Simulator")
    print("   Output: Best lesson found after iterative search")
    print()
    print("7. VISUALIZATION GENERATOR (optional)")
    print("   Input:  Optimized lesson")
    print("   Output: AI-generated images/diagrams per segment")

    print_separator("END OF WALKTHROUGH", "=")

    return result


if __name__ == "__main__":
    result = walkthrough()
