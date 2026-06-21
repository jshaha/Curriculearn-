"""Test the brain simulator adapter."""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from neurocompiler.schemas import StructuredLesson, LessonSegment
from src.adapters import BrainSimulatorAdapter


def test_adapter():
    """Test the adapter with a simple lesson."""
    print("Creating test lesson...")

    # Create test lesson
    lesson = StructuredLesson(
        id="test_001",
        title="Introduction to Photosynthesis",
        learning_goals=["Understand photosynthesis basics"],
        segments=[
            LessonSegment(
                id="seg_1",
                title="Introduction",
                content="Photosynthesis is how plants convert sunlight into energy.",
                concepts=["photosynthesis", "introduction"]
            ),
            LessonSegment(
                id="seg_2",
                title="Cognitive Overload Example",
                content="Now let's discuss chlorophyll, ATP, NADPH, carbon fixation, light reactions, dark reactions, thylakoids, stroma, photosystem I, photosystem II, and the Calvin cycle all at once.",
                concepts=["chlorophyll", "ATP", "NADPH", "carbon_fixation"]
            ),
            LessonSegment(
                id="seg_3",
                title="Simple Explanation",
                content="Think of plants as solar panels that convert light to sugar.",
                concepts=["analogy", "simple"]
            ),
            LessonSegment(
                id="seg_4",
                title="Conclusion",
                content="Photosynthesis is essential for life on Earth.",
                concepts=["conclusion"]
            )
        ]
    )

    print(f"\nTesting adapter with lesson: {lesson.title}")
    print(f"Segments: {len(lesson.segments)}")

    # Initialize adapter
    adapter = BrainSimulatorAdapter()

    # Run simulation
    report = adapter.simulate(lesson)

    print("\n" + "="*50)
    print("ADAPTER TEST RESULTS")
    print("="*50)
    print(f"\nLearning Score: {report.learning_score:.1f}/100")
    print(f"\nGlobal Metrics:")
    print(f"  Engagement:      {report.global_metrics.engagement:.1f}")
    print(f"  Cognitive Load:  {report.global_metrics.cognitive_load:.1f}")
    print(f"  Concept Flow:    {report.global_metrics.concept_flow:.1f}")
    print(f"  Retention:       {report.global_metrics.retention:.1f}")
    print(f"\nModel: {report.model_name}")
    print(f"Confidence: {report.confidence:.2f}")
    print(f"\nSegment Metrics: {len(report.segment_metrics)} segments analyzed")

    print("\n✅ Adapter test successful!")
    return report


if __name__ == "__main__":
    test_adapter()
