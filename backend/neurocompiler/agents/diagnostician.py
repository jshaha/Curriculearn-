"""Deterministic educational bottleneck detection (Agent 4)."""

from typing import List

from neurocompiler.schemas import Diagnosis, DiagnosisReport, MetricReport, StructuredLesson


class EducationalDiagnostician:
    """Translate per-segment metrics into prioritized, explainable diagnoses."""

    _TYPE_RANK = {
        "cognitive_overload": 1,
        "poor_concept_flow": 2,
        "low_retention": 3,
        "novelty_spike": 4,
        "low_multimodal_support": 5,
    }

    def diagnose(self, lesson: StructuredLesson, metric_report: MetricReport,
                 strict: bool = True) -> DiagnosisReport:
        lesson_ids = {segment.id for segment in lesson.segments}
        if not lesson_ids:
            raise ValueError("StructuredLesson must contain at least one segment.")
        if not metric_report.segment_metrics:
            raise ValueError("MetricReport must contain at least one segment metric.")
        unknown_ids = sorted({item.segment_id for item in metric_report.segment_metrics} - lesson_ids)
        if unknown_ids and strict:
            raise ValueError(
                f"MetricReport contains unknown segment_ids: {unknown_ids}. "
                f"Valid segment_ids include: {sorted(lesson_ids)}"
            )
        warnings = []
        if unknown_ids:
            warnings.append(f"Skipped metrics for unknown segment_ids: {unknown_ids}")
        diagnoses: List[Diagnosis] = []
        for segment_metric in metric_report.segment_metrics:
            if segment_metric.segment_id not in lesson_ids:
                continue
            metrics = segment_metric.metrics
            segment_id = segment_metric.segment_id
            if metrics.cognitive_load > 75 or metrics.information_density > 75:
                diagnoses.append(self._diagnosis(
                    segment_id, "cognitive_overload",
                    "high" if metrics.cognitive_load > 85 or metrics.information_density > 85 else "medium",
                    "This segment may be too dense or may introduce too much information too quickly.",
                    {"cognitive_load": metrics.cognitive_load, "information_density": metrics.information_density},
                    ["split_section", "simplify_explanation", "add_example"],
                ))
            if metrics.concept_flow < 50:
                diagnoses.append(self._diagnosis(
                    segment_id, "poor_concept_flow", "high" if metrics.concept_flow < 35 else "medium",
                    "The transition into this section may be abrupt or the concepts may not build naturally.",
                    {"concept_flow": metrics.concept_flow},
                    ["add_bridge_explanation", "add_transition", "reorder_section", "add_intuition_first"],
                ))
            if metrics.retention < 50 or metrics.reinforcement < 40:
                diagnoses.append(self._diagnosis(
                    segment_id, "low_retention",
                    "high" if metrics.retention < 35 or metrics.reinforcement < 25 else "medium",
                    "The lesson does not sufficiently revisit or reinforce earlier concepts.",
                    {"retention": metrics.retention, "reinforcement": metrics.reinforcement},
                    ["add_retrieval_question", "add_recap", "insert_check_for_understanding"],
                ))
            if metrics.multimodal_support < 45:
                diagnoses.append(self._diagnosis(
                    segment_id, "low_multimodal_support", "high" if metrics.multimodal_support < 30 else "medium",
                    "This concept is mostly taught through one channel and may benefit from a visual, analogy, or concrete example.",
                    {"multimodal_support": metrics.multimodal_support},
                    ["add_visual", "add_analogy", "add_concrete_example"],
                ))
            if metrics.novelty > 85 and metrics.concept_flow < 60:
                diagnoses.append(self._diagnosis(
                    segment_id, "novelty_spike",
                    "high" if metrics.novelty > 92 and metrics.concept_flow < 45 else "medium",
                    "A new idea appears suddenly without enough setup.",
                    {"novelty": metrics.novelty, "concept_flow": metrics.concept_flow},
                    ["add_prerequisite_explanation", "add_transition", "move_section_later"],
                ))

        diagnoses.sort(key=lambda diagnosis: self._sort_key(diagnosis))
        for priority, diagnosis in enumerate(diagnoses, start=1):
            diagnosis.priority = priority
        return DiagnosisReport(diagnoses=diagnoses, warnings=warnings)

    def _diagnosis(self, segment_id: str, issue_type: str, severity: str, explanation: str,
                   evidence: dict, actions: List[str]) -> Diagnosis:
        return Diagnosis(
            id=f"{segment_id}:{issue_type}", segment_id=segment_id, issue_type=issue_type,
            severity=severity, explanation=explanation, metric_evidence=evidence,
            recommended_actions=actions, priority=1,
        )

    def _sort_key(self, diagnosis: Diagnosis) -> tuple:
        # High-severity core issues take precedence; novelty and multimodal follow.
        high_rank = self._TYPE_RANK[diagnosis.issue_type] if diagnosis.severity == "high" else 10
        return (high_rank, self._TYPE_RANK[diagnosis.issue_type], diagnosis.segment_id)
