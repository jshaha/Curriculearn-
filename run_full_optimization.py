"""
FULL INTEGRATED OPTIMIZATION PIPELINE

This demonstrates the complete system:
- YOUR Agents 1-3: Parse, Simulate, Translate
- THEIR Agents 4-6: Diagnose, Edit, Optimize

Uses REAL brain simulation instead of MockSimulator!
"""

import sys
import json
from pathlib import Path

# Add paths
sys.path.insert(0, str(Path(__file__).parent / 'src'))
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from neurocompiler.schemas import StructuredLesson, LessonSegment
from neurocompiler.agents import EducationalDiagnostician, CurriculumEditor, LessonOptimizer
from src.agents import CurriculumParser
from src.adapters.brain_simulator_adapter import BrainSimulatorAdapter


def run_full_optimization(lesson_file_path: str = None, max_iterations: int = 2):
    """
    Complete end-to-end optimization pipeline.

    Steps:
    1. Parse lesson file (Agent 1)
    2. Convert to StructuredLesson format
    3. Run optimization loop with REAL brain simulator:
       - Agent 2: Brain Simulator (sentence transformers)
       - Agent 3: Metric Translator
       - Agent 4: Diagnostician
       - Agent 5: Curriculum Editor
       - Agent 6: Optimizer
    4. Display results
    """

    print("="*70)
    print(" NEUROCOMPILER - FULL OPTIMIZATION PIPELINE")
    print(" Real Brain Simulation + Iterative Optimization")
    print("="*70)

    # Step 1: Parse lesson file (if provided) or use sample
    if lesson_file_path:
        print(f"\n📄 STEP 1: Parsing lesson file...")
        print(f"   File: {lesson_file_path}")

        parser = CurriculumParser()
        parsed = parser.parse(lesson_file_path)

        segments = []
        for i, text in enumerate(parsed['sections']):
            segments.append(LessonSegment(
                id=f"segment_{i+1}",
                title=f"Section {i+1}",
                content=text,
                concepts=[],
                modality="text"
            ))

        lesson = StructuredLesson(
            id=Path(lesson_file_path).stem,
            title=parsed['metadata']['filename'],
            learning_goals=[],
            segments=segments
        )
    else:
        # Use sample lesson with known issues
        print(f"\n📄 STEP 1: Using sample lesson (photosynthesis)...")
        lesson = StructuredLesson(
            id="photosynthesis_lesson",
            title="Introduction to Photosynthesis",
            learning_goals=["Understand how plants make food using sunlight"],
            target_audience="Middle school science students",
            segments=[
                LessonSegment(
                    id="slide_1",
                    title="What is photosynthesis?",
                    content="Photosynthesis is how plants make food.",
                    concepts=["photosynthesis"],
                    modality="slide"
                ),
                LessonSegment(
                    id="slide_2",
                    title="Plants need sunlight",
                    content="Plants use sunlight to create energy.",
                    concepts=["sunlight", "energy"],
                    modality="slide"
                ),
                LessonSegment(
                    id="slide_3",
                    title="OVERLOAD: All concepts at once",
                    content="Chlorophyll captures photons, water splits, oxygen leaves, ATP carries energy, carbon fixation uses carbon dioxide, glucose stores energy, light reactions happen in thylakoids, dark reactions in stroma, photosystem I and II, electron transport chains, and NADPH.",
                    concepts=["chlorophyll", "photons", "ATP", "carbon fixation", "glucose", "light reactions"],
                    modality="slide"
                ),
                LessonSegment(
                    id="slide_4",
                    title="The equation",
                    content="The chemical equation is 6CO2 + 6H2O + light → C6H12O6 + 6O2.",
                    concepts=["chemical equation"],
                    modality="slide"
                ),
                LessonSegment(
                    id="slide_5",
                    title="Analogy",
                    content="Think of photosynthesis like a solar panel: it converts light energy into stored energy.",
                    concepts=["analogy"],
                    modality="slide"
                ),
            ]
        )

    print(f"   ✓ Parsed {len(lesson.segments)} segments")

    # Step 2: Initialize brain simulator adapter
    print(f"\n🧠 STEP 2: Initializing REAL Brain Simulator...")
    simulator = BrainSimulatorAdapter()
    print(f"   ✓ Using sentence transformers (not mock heuristics!)")

    # Step 3: Initialize optimizer with all agents
    print(f"\n⚙️  STEP 3: Initializing Optimization Agents...")
    diagnostician = EducationalDiagnostician()
    editor = CurriculumEditor()
    optimizer = LessonOptimizer(diagnostician=diagnostician, editor=editor)
    print(f"   ✓ Agent 4: Diagnostician")
    print(f"   ✓ Agent 5: Curriculum Editor")
    print(f"   ✓ Agent 6: Optimizer")

    # Step 4: Run optimization!
    print(f"\n🚀 STEP 4: Running optimization loop...")
    print(f"   Max iterations: {max_iterations}")
    print(f"   Max candidates per iteration: 3")
    print(f"\n" + "-"*70)

    result = optimizer.optimize(
        lesson=lesson,
        simulator=simulator,
        max_iterations=max_iterations,
        max_candidates=3
    )

    # Step 5: Display results
    print(f"\n" + "="*70)
    print(" OPTIMIZATION COMPLETE!")
    print("="*70)

    score_delta = result.best_score - result.original_score

    print(f"\n📊 RESULTS:")
    print(f"   Original Learning Score: {result.original_score:.1f}/100")
    print(f"   Best Learning Score:     {result.best_score:.1f}/100")
    print(f"   Improvement:             +{score_delta:.1f} points")
    print(f"   Iterations Run:          {result.iterations}")
    print(f"   Total Edits Applied:     {len(result.edit_history)}")

    # Show iteration details
    print(f"\n📈 ITERATION HISTORY:")
    for iteration in result.iteration_history:
        print(f"\n   Iteration {iteration.iteration}:")
        print(f"      Diagnoses: {len(iteration.diagnoses.diagnoses)} issues found")

        # Show top diagnoses
        for i, diag in enumerate(iteration.diagnoses.diagnoses[:3]):
            print(f"         {i+1}. {diag.issue_type} at {diag.segment_id} (severity: {diag.severity})")

        print(f"      Candidates: {len(iteration.candidates)} variants tested")

        # Show candidate scores
        for i, cand in enumerate(iteration.candidates):
            symbol = "✓" if cand.candidate_id == iteration.selected_candidate_id else " "
            print(f"         {symbol} Candidate {i+1}: {cand.score:.1f} (Δ{cand.score_delta:+.1f})")

        if iteration.selected_candidate_id:
            print(f"      Selected: {iteration.selected_candidate_id}")
        else:
            print(f"      No improvement found")

    # Show final lesson
    print(f"\n📝 OPTIMIZED LESSON:")
    print(f"   Title: {result.best_lesson.title}")
    print(f"   Segments: {len(result.best_lesson.segments)}")

    print(f"\n   First 3 segments:")
    for i, segment in enumerate(result.best_lesson.segments[:3]):
        print(f"\n   {i+1}. {segment.title}")
        print(f"      {segment.content[:100]}{'...' if len(segment.content) > 100 else ''}")

    if len(result.best_lesson.segments) > 3:
        print(f"\n   ... and {len(result.best_lesson.segments) - 3} more segments")

    # Save results
    output_file = "optimization_result.json"
    print(f"\n💾 Saving results to {output_file}...")

    with open(output_file, 'w') as f:
        json.dump({
            "original_score": result.original_score,
            "best_score": result.best_score,
            "improvement": score_delta,
            "iterations": result.iterations,
            "best_lesson": {
                "title": result.best_lesson.title,
                "segments": [
                    {
                        "id": seg.id,
                        "title": seg.title,
                        "content": seg.content,
                        "concepts": seg.concepts
                    }
                    for seg in result.best_lesson.segments
                ]
            }
        }, f, indent=2)

    print(f"\n" + "="*70)
    print(" SUCCESS! Your lesson has been optimized using REAL brain simulation!")
    print("="*70)

    return result


if __name__ == "__main__":
    import sys

    # Check if file path provided
    file_path = sys.argv[1] if len(sys.argv) > 1 else None

    # Run optimization
    result = run_full_optimization(
        lesson_file_path=file_path,
        max_iterations=2
    )
