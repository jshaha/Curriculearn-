"""A transparent heuristic simulator for end-to-end development and demos.

This is a development-time heuristic, not a scientific brain model. It exists only
to exercise the Agent 4--6 optimization loop until a real simulator adapter is
provided by the brain/voxel pipeline.
"""

from statistics import mean
from typing import List

from neurocompiler.scoring import compute_learning_score
from neurocompiler.schemas import MetricReport, MetricScores, SegmentMetric, StructuredLesson


def _clamp(value: float) -> float:
    return round(max(0.0, min(100.0, value)), 2)


class MockSimulator:
    """Development-only text heuristic that can be replaced by any simulator adapter.

    It intentionally requires edits to be grounded in lesson concepts and limits
    template rewards, so adding arbitrary keywords cannot inflate a score forever.
    """

    def simulate(self, lesson: StructuredLesson) -> MetricReport:
        segment_metrics: List[SegmentMetric] = []
        previous_concepts = set()
        lesson_concepts = {concept.lower() for segment in lesson.segments for concept in segment.concepts}
        template_counts = {"retrieval": 0, "analogy": 0, "example": 0, "transition": 0}
        support_segments = 0
        for segment in lesson.segments:
            content = segment.content.lower()
            words = len(segment.content.split())
            concepts = len(segment.concepts)
            mentioned_concepts = {concept for concept in lesson_concepts if concept and concept in content}
            retrieval = ("?" in segment.content and any(token in content for token in ("quick check", "question", "recall", "without looking"))
                         and bool(mentioned_concepts))
            analogy = any(token in content for token in ("analogy", "think of", "like a")) and bool(mentioned_concepts)
            example = "example" in content and bool(mentioned_concepts)
            neighboring_or_current = {concept.lower() for concept in previous_concepts}
            neighboring_or_current.update(concept.lower() for concept in segment.concepts)
            bridge = (
                any(token in content for token in ("before we", "connect", "transition", "bridge"))
                and bool(mentioned_concepts.intersection(neighboring_or_current))
            )
            active_templates = [name for name, active in {
                "retrieval": retrieval, "analogy": analogy, "example": example, "transition": bridge,
            }.items() if active]
            repeat_penalty = sum(template_counts[name] for name in active_templates) * 5
            for name in active_templates:
                template_counts[name] += 1
            support_segments += bool(active_templates)
            overlap = len(previous_concepts.intersection(segment.concepts))
            dense = max(0, concepts - 3) * 10 + max(0, words - 45) * 0.45 + repeat_penalty
            generic_short = int(bool(active_templates) and words < 12) * 8

            scores = MetricScores(
                engagement=_clamp(65 - dense * 0.22 - generic_short + retrieval * 10 + analogy * 6 + example * 5),
                cognitive_load=_clamp(31 + concepts * 11 + max(0, words - 35) * 0.55 + generic_short - retrieval * 4 - analogy * 6),
                concept_flow=_clamp(67 - dense * 0.55 - generic_short + bridge * 22 + analogy * 8 + example * 5 + overlap * 4),
                retention=_clamp(38 - repeat_penalty + retrieval * 50 + ("recap" in content) * 20),
                novelty=_clamp(48 + max(0, concepts - overlap) * 9 + bridge * -10),
                information_density=_clamp(25 + concepts * 10 + max(0, words - 30) * 0.6 - retrieval * 8 - analogy * 6),
                reinforcement=_clamp(24 - repeat_penalty + retrieval * 62 + ("recap" in content) * 25),
                multimodal_support=_clamp(32 - repeat_penalty + analogy * 45 + example * 34 + (segment.modality == "mixed") * 8),
            )
            segment_metrics.append(SegmentMetric(segment_id=segment.id, metrics=scores))
            previous_concepts.update(segment.concepts)

        metric_names = MetricScores.model_fields.keys()
        global_metrics = MetricScores(**{
            name: _clamp(mean(getattr(item.metrics, name) for item in segment_metrics))
            for name in metric_names
        })
        # Too many support inserts can fragment a lesson even if each is locally useful.
        excess_support = max(0, support_segments - max(2, len(lesson.segments) // 2))
        if excess_support:
            global_metrics = global_metrics.model_copy(update={
                "cognitive_load": _clamp(global_metrics.cognitive_load + excess_support * 5),
                "concept_flow": _clamp(global_metrics.concept_flow - excess_support * 4),
                "engagement": _clamp(global_metrics.engagement - excess_support * 3),
            })
        return MetricReport(
            global_metrics=global_metrics,
            learning_score=compute_learning_score(global_metrics),
            segment_metrics=segment_metrics,
        )
