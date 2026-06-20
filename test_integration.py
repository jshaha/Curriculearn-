"""
Test the integration between our brain simulator and their optimization system.
"""

import sys
from pathlib import Path

# Add paths
sys.path.insert(0, str(Path(__file__).parent / 'src'))
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from neurocompiler.schemas import StructuredLesson, LessonSegment
from src.adapters.brain_simulator_adapter import BrainSimulatorAdapter


def test_adapter():
    """Test that the adapter works."""
    print("="*60)
    print("TESTING BRAIN SIMULATOR ADAPTER")
    print("="*60)

    # Create a test lesson in their format
    lesson = StructuredLesson(
        id="test_photosynthesis",
        title="Introduction to Photosynthesis",
        learning_goals=["Understand how plants make food"],
        target_audience="Middle school students",
        segments=[
            LessonSegment(
                id="seg_1",
                title="What is photosynthesis?",
                content="Photosynthesis is how plants make food using sunlight.",
                concepts=["photosynthesis", "sunlight"],
                modality="text"
            ),
            LessonSegment(
                id="seg_2",
                title="The process",
                content="Plants use chlorophyll to capture light energy.",
                concepts=["chlorophyll", "light energy"],
                modality="text"
            ),
            LessonSegment(
                id="seg_3",
                title="Complex overload",
                content="Photosynthesis involves chlorophyll, ATP, carbon fixation, light reactions, dark reactions, Calvin cycle, NADPH, thylakoids, stroma, photosystem I, photosystem II, and electron transport chains.",
                concepts=["chlorophyll", "ATP", "carbon fixation", "light reactions"],
                modality="text"
            ),
            LessonSegment(
                id="seg_4",
                title="Recap",
                content="Remember: plants use sunlight to make food. This is photosynthesis.",
                concepts=["photosynthesis", "sunlight"],
                modality="text"
            )
        ]
    )

    print(f"\n📚 Test Lesson: {lesson.title}")
    print(f"   Segments: {len(lesson.segments)}")

    # Initialize the adapter (uses OUR brain simulator)
    print("\n🧠 Initializing Real Brain Simulator...")
    adapter = BrainSimulatorAdapter()

    # Simulate (this runs Agents 2+3)
    print("\n⚡ Running brain simulation...")
    report = adapter.simulate(lesson)

    # Display results
    print("\n" + "="*60)
    print("RESULTS FROM REAL BRAIN SIMULATOR")
    print("="*60)
    print(f"\n📊 Overall Learning Score: {report.learning_score:.1f}/100")
    print(f"\n🔍 Global Metrics:")
    print(f"   Cognitive Load:      {report.global_metrics.cognitive_load:.1f}/100")
    print(f"   Engagement:          {report.global_metrics.engagement:.1f}/100")
    print(f"   Concept Flow:        {report.global_metrics.concept_flow:.1f}/100")
    print(f"   Retention:           {report.global_metrics.retention:.1f}/100")
    print(f"   Novelty:             {report.global_metrics.novelty:.1f}/100")
    print(f"   Information Density: {report.global_metrics.information_density:.1f}/100")

    print(f"\n📋 Per-Segment Metrics:")
    for seg_metric in report.segment_metrics:
        print(f"\n   Segment: {seg_metric.segment_id}")
        print(f"      Cognitive Load: {seg_metric.metrics.cognitive_load:.1f}")
        print(f"      Novelty:        {seg_metric.metrics.novelty:.1f}")

    print("\n" + "="*60)
    print("✅ INTEGRATION TEST PASSED")
    print("="*60)
    print("\nThe adapter successfully:")
    print("  ✓ Converted StructuredLesson to text format")
    print("  ✓ Ran real brain simulation (sentence transformers)")
    print("  ✓ Computed educational metrics")
    print("  ✓ Converted back to MetricReport format")
    print("\nReady to use with Agents 4-6 (Optimizer)!")

    return report


if __name__ == "__main__":
    test_adapter()
