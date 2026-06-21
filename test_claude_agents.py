"""
COMPREHENSIVE CLAUDE AGENTS TEST

Tests the complete pipeline with Claude-powered agents:
1. Parse a sample lesson
2. Run brain simulation
3. Use Claude Diagnostician to find issues
4. Use Claude Editor to generate fixes
5. Run full optimization loop
6. Compare with deterministic agents

Run this to verify everything works!
"""

import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment before any imports
load_dotenv()

# Add paths
sys.path.insert(0, str(Path(__file__).parent / 'src'))
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from neurocompiler.schemas import StructuredLesson, LessonSegment
from neurocompiler.agents import LessonOptimizer
from src.adapters.brain_simulator_adapter import BrainSimulatorAdapter

# Import both agent types
from neurocompiler.agents import EducationalDiagnostician, CurriculumEditor
from neurocompiler.agents.claude import ClaudeDiagnostician, ClaudeCurriculumEditor


def create_test_lesson():
    """Create a lesson with known issues for testing."""
    return StructuredLesson(
        id="test_photosynthesis",
        title="Introduction to Photosynthesis",
        learning_goals=["Understand how plants make food using sunlight"],
        target_audience="Middle school science students",
        segments=[
            LessonSegment(
                id="slide_1",
                title="What is photosynthesis?",
                content="Photosynthesis is how plants make food.",
                concepts=["photosynthesis"],
                modality="text"
            ),
            LessonSegment(
                id="slide_2",
                title="Plants need sunlight",
                content="Plants use sunlight to create energy.",
                concepts=["sunlight", "energy"],
                modality="text"
            ),
            LessonSegment(
                id="slide_3",
                title="Complex overload section",
                content="Chlorophyll captures photons in thylakoid membranes where photosystem II initiates electron transport chains while simultaneously splitting water molecules to release oxygen and generate ATP through chemiosmosis involving proton gradients across thylakoid membranes before electrons reach photosystem I which reduces NADP+ to NADPH for use in the Calvin cycle where carbon dioxide is fixed into glucose through a complex series of reactions.",
                concepts=["chlorophyll", "photons", "ATP", "carbon fixation", "glucose", "light reactions", "Calvin cycle", "NADPH"],
                modality="text"
            ),
            LessonSegment(
                id="slide_4",
                title="The equation",
                content="The chemical equation is 6CO2 + 6H2O + light → C6H12O6 + 6O2.",
                concepts=["chemical equation"],
                modality="text"
            ),
        ]
    )


def test_claude_diagnostician():
    """Test 1: Claude Diagnostician"""
    print("\n" + "="*70)
    print(" TEST 1: CLAUDE DIAGNOSTICIAN")
    print("="*70)

    lesson = create_test_lesson()
    simulator = BrainSimulatorAdapter()

    print("\n🧠 Running brain simulation...")
    metric_report = simulator.simulate(lesson)
    print(f"✓ Learning Score: {metric_report.learning_score:.1f}/100")
    print(f"✓ Cognitive Load: {metric_report.global_metrics.cognitive_load:.1f}/100")

    # Test deterministic diagnostician
    print("\n📊 Running deterministic diagnostician...")
    det_diagnostician = EducationalDiagnostician()
    det_report = det_diagnostician.diagnose(lesson, metric_report)
    print(f"✓ Found {len(det_report.diagnoses)} issues (deterministic)")

    # Test Claude diagnostician
    print("\n🤖 Running Claude diagnostician...")
    claude_diagnostician = ClaudeDiagnostician()

    if not claude_diagnostician.is_available:
        print("❌ Claude API not available!")
        print("   Check ANTHROPIC_API_KEY in .env file")
        return False

    print(f"✓ Claude API available (model: {claude_diagnostician.config.model})")

    try:
        claude_report = claude_diagnostician.diagnose(lesson, metric_report)
        print(f"✓ Found {len(claude_report.diagnoses)} issues (Claude-powered)")

        # Show comparison
        print(f"\n📋 Diagnosis Comparison:")
        print(f"   Deterministic: {len(det_report.diagnoses)} issues")
        print(f"   Claude:        {len(claude_report.diagnoses)} issues")

        if claude_report.diagnoses:
            print(f"\n   Sample Claude diagnosis:")
            diag = claude_report.diagnoses[0]
            print(f"      Issue: {diag.issue_type}")
            print(f"      Severity: {diag.severity}")
            print(f"      Explanation: {diag.explanation[:100]}...")

        return True

    except Exception as e:
        print(f"❌ Claude diagnostician failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_claude_editor():
    """Test 2: Claude Curriculum Editor"""
    print("\n" + "="*70)
    print(" TEST 2: CLAUDE CURRICULUM EDITOR")
    print("="*70)

    lesson = create_test_lesson()
    simulator = BrainSimulatorAdapter()

    print("\n🧠 Running brain simulation...")
    metric_report = simulator.simulate(lesson)

    print("\n🤖 Running Claude diagnostician...")
    claude_diagnostician = ClaudeDiagnostician()
    diagnosis_report = claude_diagnostician.diagnose(lesson, metric_report)
    print(f"✓ Found {len(diagnosis_report.diagnoses)} issues")

    # Test deterministic editor
    print("\n📝 Testing deterministic editor...")
    det_editor = CurriculumEditor()
    det_candidates = det_editor.generate_candidates(lesson, diagnosis_report, max_candidates=2)
    print(f"✓ Generated {len(det_candidates)} candidates (deterministic)")

    # Test Claude editor
    print("\n🤖 Testing Claude editor...")
    claude_editor = ClaudeCurriculumEditor()

    if not claude_editor.is_available:
        print("❌ Claude API not available!")
        return False

    try:
        claude_candidates = claude_editor.generate_candidates(lesson, diagnosis_report, max_candidates=2)
        print(f"✓ Generated {len(claude_candidates)} candidates (Claude-powered)")

        # Show comparison
        print(f"\n📋 Editor Comparison:")
        print(f"   Deterministic: {len(det_candidates)} candidates")
        print(f"   Claude:        {len(claude_candidates)} candidates")

        if claude_candidates:
            print(f"\n   Sample Claude edit:")
            candidate = claude_candidates[0]
            print(f"      Candidate ID: {candidate.candidate_id}")
            print(f"      Number of edits: {len(candidate.edit_plan.edits)}")
            if candidate.edit_plan.edits:
                edit = candidate.edit_plan.edits[0]
                print(f"      First edit action: {edit.action}")
                print(f"      Rationale: {edit.rationale[:100]}...")

        return True

    except Exception as e:
        print(f"❌ Claude editor failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_full_optimization():
    """Test 3: Full Optimization Loop with Claude Agents"""
    print("\n" + "="*70)
    print(" TEST 3: FULL OPTIMIZATION WITH CLAUDE AGENTS")
    print("="*70)

    lesson = create_test_lesson()
    simulator = BrainSimulatorAdapter()

    # Create optimizer with Claude agents
    print("\n⚙️  Initializing Claude-powered optimizer...")
    claude_diagnostician = ClaudeDiagnostician()
    claude_editor = ClaudeCurriculumEditor()

    if not claude_diagnostician.is_available or not claude_editor.is_available:
        print("❌ Claude API not available!")
        return False

    optimizer = LessonOptimizer(
        diagnostician=claude_diagnostician,
        editor=claude_editor
    )

    print(f"✓ Using Claude Diagnostician")
    print(f"✓ Using Claude Curriculum Editor")
    print(f"✓ Model: {claude_diagnostician.config.model}")

    print("\n🚀 Running optimization loop...")
    print("   Max iterations: 1")
    print("   Max candidates per iteration: 2")
    print("   (Reduced for faster testing)")

    try:
        result = optimizer.optimize(
            lesson=lesson,
            simulator=simulator,
            max_iterations=1,
            max_candidates=2
        )

        score_delta = result.best_score - result.original_score

        print("\n" + "="*70)
        print(" OPTIMIZATION COMPLETE!")
        print("="*70)

        print(f"\n📊 RESULTS:")
        print(f"   Original Score: {result.original_score:.1f}/100")
        print(f"   Best Score:     {result.best_score:.1f}/100")
        print(f"   Improvement:    {score_delta:+.1f} points")
        print(f"   Iterations:     {result.iterations}")

        # Show details
        if result.iteration_history:
            iteration = result.iteration_history[0]
            print(f"\n📋 Iteration Details:")
            print(f"   Diagnoses found: {len(iteration.diagnoses.diagnoses)}")
            print(f"   Candidates tested: {len(iteration.candidates)}")
            if iteration.selected_candidate_id:
                print(f"   Selected: {iteration.selected_candidate_id}")

        # Show final lesson
        print(f"\n📝 Optimized Lesson:")
        print(f"   Segments: {len(result.best_lesson.segments)}")
        for i, seg in enumerate(result.best_lesson.segments[:2]):
            print(f"\n   {i+1}. {seg.title}")
            print(f"      {seg.content[:80]}...")

        # Save results
        output_file = "claude_optimization_result.json"
        with open(output_file, 'w') as f:
            json.dump({
                "original_score": result.original_score,
                "best_score": result.best_score,
                "improvement": score_delta,
                "iterations": result.iterations,
                "model": claude_diagnostician.config.model,
                "best_lesson": {
                    "title": result.best_lesson.title,
                    "segments": [
                        {
                            "id": seg.id,
                            "title": seg.title,
                            "content": seg.content,
                        }
                        for seg in result.best_lesson.segments
                    ]
                }
            }, f, indent=2)

        print(f"\n💾 Results saved to {output_file}")

        return True

    except Exception as e:
        print(f"❌ Optimization failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("="*70)
    print(" CLAUDE AGENTS COMPREHENSIVE TEST SUITE")
    print(" Testing: Diagnostician, Editor, Full Optimization")
    print("="*70)

    # Check environment
    import os
    api_key = os.getenv("ANTHROPIC_API_KEY")

    print(f"\n🔑 Environment Check:")
    print(f"   ANTHROPIC_API_KEY: {'✓ Set' if api_key else '✗ Not set'}")
    print(f"   USE_CLAUDE_AGENTS: {os.getenv('USE_CLAUDE_AGENTS', 'not set')}")

    if not api_key:
        print("\n❌ ERROR: ANTHROPIC_API_KEY not found in environment!")
        print("   Make sure .env file exists with your API key")
        return

    print(f"   Key preview: {api_key[:20]}...")

    # Run tests
    results = []

    results.append(("Diagnostician", test_claude_diagnostician()))
    results.append(("Editor", test_claude_editor()))
    results.append(("Full Optimization", test_full_optimization()))

    # Summary
    print("\n" + "="*70)
    print(" TEST SUMMARY")
    print("="*70)

    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"   {status}: {test_name}")

    all_passed = all(result for _, result in results)

    if all_passed:
        print("\n🎉 All tests passed! Your Claude agents are working correctly!")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")

    print("="*70)


if __name__ == "__main__":
    main()
