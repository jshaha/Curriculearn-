"""
Adapter to connect BrainSimulator + MetricTranslator to backend optimizer.

This adapter implements the SimulatorProtocol expected by the backend agents,
wrapping the real brain simulation (sentence transformers) and metric translation.
"""

from typing import List
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from neurocompiler.schemas import (
    StructuredLesson,
    LessonSegment,
    MetricReport,
    MetricScores,
    SegmentMetric
)

from ..agents import BrainSimulator, MetricTranslator


class BrainSimulatorAdapter:
    """
    Adapter that wraps BrainSimulator + MetricTranslator to implement SimulatorProtocol.

    This allows the backend agents (Diagnostician, Editor, Optimizer) to use
    the real sentence-transformer-based brain simulation instead of mock heuristics.
    """

    def __init__(self):
        """Initialize brain simulator and metric translator."""
        print("Initializing BrainSimulatorAdapter...")
        self.brain_sim = BrainSimulator()
        self.metric_translator = MetricTranslator()
        print("Adapter ready.")

    def simulate(self, lesson: StructuredLesson) -> MetricReport:
        """
        Evaluate a structured lesson and return metrics.

        Args:
            lesson: StructuredLesson from backend schema

        Returns:
            MetricReport with global and per-segment metrics
        """
        print(f"\n=== Simulating lesson: {lesson.title} ===")
        print(f"Segments: {len(lesson.segments)}")

        # Extract text segments from StructuredLesson
        text_segments = [seg.content for seg in lesson.segments]

        # Run brain simulation (sentence transformer embeddings)
        brain_states = self.brain_sim.simulate_from_text_list(text_segments)

        # Translate brain states to educational metrics
        metrics_dict = self.metric_translator.translate(brain_states)

        # Convert to backend schema format
        metric_report = self._convert_to_metric_report(
            metrics_dict,
            lesson,
            brain_states
        )

        print(f"Learning Score: {metric_report.learning_score:.1f}/100")
        print(f"Cognitive Load: {metric_report.global_metrics.cognitive_load:.1f}")
        print(f"Engagement: {metric_report.global_metrics.engagement:.1f}")

        return metric_report

    def _convert_to_metric_report(
        self,
        metrics_dict: dict,
        lesson: StructuredLesson,
        brain_states: dict
    ) -> MetricReport:
        """
        Convert metric translator output to backend MetricReport schema.

        Args:
            metrics_dict: Output from MetricTranslator
            lesson: Original lesson structure
            brain_states: Brain simulation output

        Returns:
            MetricReport matching backend schema
        """
        # Extract global metrics
        global_metrics = MetricScores(
            engagement=metrics_dict.get('engagement', 50.0),
            cognitive_load=metrics_dict.get('cognitive_load', 50.0),
            concept_flow=metrics_dict.get('concept_flow', 50.0),
            retention=metrics_dict.get('retention', 50.0),
            novelty=metrics_dict.get('novelty', 50.0),
            information_density=metrics_dict.get('information_density', 50.0),
            reinforcement=metrics_dict.get('reinforcement', 50.0),
            multimodal_support=metrics_dict.get('multimodal_support', 50.0)
        )

        # Create per-segment metrics
        segment_metrics: List[SegmentMetric] = []

        # If we have per-segment metrics, use them
        if 'segment_metrics' in metrics_dict:
            for i, seg_metrics in enumerate(metrics_dict['segment_metrics']):
                if i < len(lesson.segments):
                    segment_id = lesson.segments[i].id

                    segment_metric = SegmentMetric(
                        segment_id=segment_id,
                        metrics=MetricScores(
                            engagement=seg_metrics.get('engagement', 50.0),
                            cognitive_load=seg_metrics.get('cognitive_load', 50.0),
                            concept_flow=seg_metrics.get('concept_flow', 50.0),
                            retention=seg_metrics.get('retention', 50.0),
                            novelty=seg_metrics.get('novelty', 50.0),
                            information_density=seg_metrics.get('information_density', 50.0),
                            reinforcement=seg_metrics.get('reinforcement', 50.0),
                            multimodal_support=seg_metrics.get('multimodal_support', 50.0)
                        ),
                        confidence=0.85  # Reasonable confidence for sentence transformers
                    )
                    segment_metrics.append(segment_metric)
        else:
            # Fallback: use global metrics for all segments
            for segment in lesson.segments:
                segment_metric = SegmentMetric(
                    segment_id=segment.id,
                    metrics=global_metrics,
                    confidence=0.85
                )
                segment_metrics.append(segment_metric)

        # Create final report
        report = MetricReport(
            global_metrics=global_metrics,
            learning_score=metrics_dict.get('learning_score', 50.0),
            segment_metrics=segment_metrics,
            model_name=brain_states.get('model_name', 'all-MiniLM-L6-v2'),
            model_version='sentence-transformers',
            confidence=0.85,
            warnings=[]
        )

        return report


# Convenience function for quick testing
def test_adapter():
    """Test the adapter with a simple lesson."""
    from neurocompiler.schemas import StructuredLesson, LessonSegment

    # Create test lesson
    lesson = StructuredLesson(
        id="test_001",
        title="Test Lesson",
        learning_goals=["Understand concepts"],
        segments=[
            LessonSegment(
                id="seg_1",
                title="Introduction",
                content="This is an introduction to the topic.",
                concepts=["introduction"]
            ),
            LessonSegment(
                id="seg_2",
                title="Main Content",
                content="Here we introduce many complex concepts simultaneously: quantum mechanics, relativity, string theory, dark matter, and the multiverse.",
                concepts=["quantum", "relativity", "string theory"]
            ),
            LessonSegment(
                id="seg_3",
                title="Conclusion",
                content="In conclusion, we've learned about the topic.",
                concepts=["conclusion"]
            )
        ]
    )

    # Test adapter
    adapter = BrainSimulatorAdapter()
    report = adapter.simulate(lesson)

    print("\n=== Test Results ===")
    print(f"Learning Score: {report.learning_score:.1f}")
    print(f"Global Metrics:")
    print(f"  Engagement: {report.global_metrics.engagement:.1f}")
    print(f"  Cognitive Load: {report.global_metrics.cognitive_load:.1f}")
    print(f"  Concept Flow: {report.global_metrics.concept_flow:.1f}")
    print(f"\nSegment Metrics: {len(report.segment_metrics)} segments")

    return report


if __name__ == "__main__":
    test_adapter()
