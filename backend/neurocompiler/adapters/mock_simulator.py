"""A transparent heuristic simulator for end-to-end development and demos."""

from statistics import mean
from typing import List

from neurocompiler.scoring import compute_learning_score
from neurocompiler.schemas import MetricReport, MetricScores, SegmentMetric, StructuredLesson


def _clamp(value: float) -> float:
    return round(max(0.0, min(100.0, value)), 2)


class MockSimulator:
    """Scores text patterns only; it can be replaced by any SimulatorProtocol backend."""

    def simulate(self, lesson: StructuredLesson) -> MetricReport:
        segment_metrics: List[SegmentMetric] = []
        previous_concepts = set()
        for segment in lesson.segments:
            content = segment.content.lower()
            words = len(segment.content.split())
            concepts = len(segment.concepts)
            retrieval = any(token in content for token in ("quick check", "question", "recall", "without looking"))
            analogy = any(token in content for token in ("analogy", "think of", "like a"))
            example = "example" in content
            bridge = any(token in content for token in ("before we", "connect", "transition", "bridge"))
            overlap = len(previous_concepts.intersection(segment.concepts))
            dense = max(0, concepts - 3) * 10 + max(0, words - 45) * 0.45

            scores = MetricScores(
                engagement=_clamp(65 - dense * 0.22 + retrieval * 10 + analogy * 6 + example * 5),
                cognitive_load=_clamp(31 + concepts * 11 + max(0, words - 35) * 0.55 - retrieval * 4 - analogy * 6),
                concept_flow=_clamp(67 - dense * 0.55 + bridge * 25 + analogy * 8 + example * 5 + overlap * 4),
                retention=_clamp(38 + retrieval * 50 + ("recap" in content) * 20),
                novelty=_clamp(48 + max(0, concepts - overlap) * 9 + bridge * -10),
                information_density=_clamp(25 + concepts * 10 + max(0, words - 30) * 0.6 - retrieval * 8 - analogy * 6),
                reinforcement=_clamp(24 + retrieval * 62 + ("recap" in content) * 25),
                multimodal_support=_clamp(32 + analogy * 50 + example * 38 + (segment.modality == "mixed") * 8),
            )
            segment_metrics.append(SegmentMetric(segment_id=segment.id, metrics=scores))
            previous_concepts.update(segment.concepts)

        metric_names = MetricScores.model_fields.keys()
        global_metrics = MetricScores(**{
            name: _clamp(mean(getattr(item.metrics, name) for item in segment_metrics))
            for name in metric_names
        })
        return MetricReport(
            global_metrics=global_metrics,
            learning_score=compute_learning_score(global_metrics),
            segment_metrics=segment_metrics,
        )
