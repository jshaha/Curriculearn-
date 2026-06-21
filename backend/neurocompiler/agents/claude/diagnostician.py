"""Claude-powered educational diagnostician (Agent 4)."""

from typing import Any, Dict, List, Optional

from neurocompiler.schemas import (
    Diagnosis,
    DiagnosisReport,
    MetricReport,
    StructuredLesson,
)

from .base import ClaudeAgentBase
from .config import ClaudeConfig
from .prompts.diagnostician_prompt import DIAGNOSTICIAN_SYSTEM_PROMPT
from .tools.diagnostician_tools import DIAGNOSTICIAN_TOOLS


class ClaudeDiagnostician(ClaudeAgentBase):
    """Claude-powered educational diagnostician using tool-based analysis.

    Provides richer, more contextual diagnoses compared to the deterministic
    EducationalDiagnostician. Falls back to deterministic analysis when
    Claude API is unavailable.
    """

    # Priority ranking for issue types
    _TYPE_RANK = {
        "cognitive_overload": 1,
        "poor_concept_flow": 2,
        "low_retention": 3,
        "novelty_spike": 4,
        "low_multimodal_support": 5,
    }

    def __init__(self, config: Optional[ClaudeConfig] = None):
        super().__init__(config)
        self._fallback_diagnostician = None

    @property
    def fallback_diagnostician(self):
        """Lazy-load the fallback deterministic diagnostician."""
        if self._fallback_diagnostician is None:
            from neurocompiler.agents.diagnostician import EducationalDiagnostician
            self._fallback_diagnostician = EducationalDiagnostician()
        return self._fallback_diagnostician

    def get_tools(self) -> List[Dict[str, Any]]:
        return DIAGNOSTICIAN_TOOLS

    def get_system_prompt(self) -> str:
        return DIAGNOSTICIAN_SYSTEM_PROMPT

    def diagnose(
        self,
        lesson: StructuredLesson,
        metric_report: MetricReport,
        strict: bool = True,
    ) -> DiagnosisReport:
        """Analyze a lesson and produce a diagnosis report.

        This method has the same signature as EducationalDiagnostician.diagnose()
        for drop-in replacement.

        Args:
            lesson: The structured lesson to analyze
            metric_report: Metrics from brain simulation
            strict: If True, raise on unknown segment IDs

        Returns:
            DiagnosisReport with prioritized diagnoses
        """
        # Validate inputs (same as deterministic version)
        lesson_ids = {segment.id for segment in lesson.segments}
        if not lesson_ids:
            raise ValueError("StructuredLesson must contain at least one segment.")
        if not metric_report.segment_metrics:
            raise ValueError("MetricReport must contain at least one segment metric.")

        unknown_ids = sorted(
            {item.segment_id for item in metric_report.segment_metrics} - lesson_ids
        )
        if unknown_ids and strict:
            raise ValueError(
                f"MetricReport contains unknown segment_ids: {unknown_ids}. "
                f"Valid segment_ids include: {sorted(lesson_ids)}"
            )

        warnings = []
        if unknown_ids:
            warnings.append(f"Skipped metrics for unknown segment_ids: {unknown_ids}")

        # Try Claude-powered analysis
        if self.is_available:
            try:
                return self._diagnose_with_claude(lesson, metric_report, warnings)
            except Exception as e:
                print(f"Claude diagnosis failed: {e}")
                if self.config.fallback_enabled:
                    print("Falling back to deterministic diagnostician")
                else:
                    raise

        # Fallback to deterministic diagnostician
        return self.fallback_diagnostician.diagnose(lesson, metric_report, strict)

    def _diagnose_with_claude(
        self,
        lesson: StructuredLesson,
        metric_report: MetricReport,
        warnings: List[str],
    ) -> DiagnosisReport:
        """Run Claude-powered diagnosis using tools."""
        # Build context for tool handlers
        context = {
            "lesson": lesson,
            "metric_report": metric_report,
            "segment_map": {seg.id: seg for seg in lesson.segments},
            "metrics_map": {sm.segment_id: sm.metrics for sm in metric_report.segment_metrics},
            "diagnoses": [],
            "warnings": warnings,
        }

        # Build the user message with lesson overview
        user_message = self._build_user_message(lesson, metric_report)

        # Run agentic loop
        self.run_agentic_loop(user_message, context, max_turns=15)

        # Build final report from collected diagnoses
        diagnoses = context["diagnoses"]
        diagnoses.sort(key=lambda d: self._sort_key(d))
        for priority, diagnosis in enumerate(diagnoses, start=1):
            diagnosis.priority = priority

        return DiagnosisReport(diagnoses=diagnoses, warnings=context["warnings"])

    def _build_user_message(
        self, lesson: StructuredLesson, metric_report: MetricReport
    ) -> str:
        """Build the initial user message with lesson overview."""
        segments_overview = []
        for segment in lesson.segments:
            segments_overview.append(
                f"- {segment.id}: \"{segment.title}\" (concepts: {', '.join(segment.concepts) or 'none listed'})"
            )

        global_metrics = metric_report.global_metrics
        return f"""Analyze this lesson for educational issues:

## Lesson Overview
**Title**: {lesson.title}
**Learning Goals**: {', '.join(lesson.learning_goals) or 'Not specified'}
**Target Audience**: {lesson.target_audience or 'Not specified'}

## Segments
{chr(10).join(segments_overview)}

## Global Metrics
- Learning Score: {metric_report.learning_score:.1f}/100
- Engagement: {global_metrics.engagement:.1f}
- Cognitive Load: {global_metrics.cognitive_load:.1f}
- Concept Flow: {global_metrics.concept_flow:.1f}
- Retention: {global_metrics.retention:.1f}
- Novelty: {global_metrics.novelty:.1f}
- Information Density: {global_metrics.information_density:.1f}
- Reinforcement: {global_metrics.reinforcement:.1f}
- Multimodal Support: {global_metrics.multimodal_support:.1f}

Please analyze each segment's metrics and identify educational issues. Start by examining segments that may have problems based on the global metrics."""

    def handle_tool_call(
        self, tool_name: str, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle tool calls from Claude."""
        if tool_name == "get_segment_metrics":
            return self._handle_get_segment_metrics(tool_input, context)
        elif tool_name == "get_segment_content":
            return self._handle_get_segment_content(tool_input, context)
        elif tool_name == "get_adjacent_segments":
            return self._handle_get_adjacent_segments(tool_input, context)
        elif tool_name == "record_diagnosis":
            return self._handle_record_diagnosis(tool_input, context)
        elif tool_name == "finalize_diagnosis_report":
            return self._handle_finalize(tool_input, context)
        else:
            return {"error": f"Unknown tool: {tool_name}"}

    def _handle_get_segment_metrics(
        self, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Return metrics for a segment."""
        segment_id = tool_input["segment_id"]
        metrics = context["metrics_map"].get(segment_id)

        if metrics is None:
            return {"error": f"No metrics found for segment '{segment_id}'"}

        return {
            "segment_id": segment_id,
            "metrics": {
                "engagement": metrics.engagement,
                "cognitive_load": metrics.cognitive_load,
                "concept_flow": metrics.concept_flow,
                "retention": metrics.retention,
                "novelty": metrics.novelty,
                "information_density": metrics.information_density,
                "reinforcement": metrics.reinforcement,
                "multimodal_support": metrics.multimodal_support,
            }
        }

    def _handle_get_segment_content(
        self, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Return content for a segment."""
        segment_id = tool_input["segment_id"]
        segment = context["segment_map"].get(segment_id)

        if segment is None:
            return {"error": f"Segment '{segment_id}' not found"}

        return {
            "segment_id": segment_id,
            "title": segment.title,
            "content": segment.content,
            "concepts": segment.concepts,
            "modality": segment.modality,
        }

    def _handle_get_adjacent_segments(
        self, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Return previous and next segments."""
        segment_id = tool_input["segment_id"]
        segments = context["lesson"].segments
        segment_ids = [s.id for s in segments]

        if segment_id not in segment_ids:
            return {"error": f"Segment '{segment_id}' not found"}

        idx = segment_ids.index(segment_id)
        result = {"segment_id": segment_id, "previous": None, "next": None}

        if idx > 0:
            prev = segments[idx - 1]
            result["previous"] = {
                "id": prev.id,
                "title": prev.title,
                "concepts": prev.concepts,
            }

        if idx < len(segments) - 1:
            next_seg = segments[idx + 1]
            result["next"] = {
                "id": next_seg.id,
                "title": next_seg.title,
                "concepts": next_seg.concepts,
            }

        return result

    def _handle_record_diagnosis(
        self, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Record a diagnosis."""
        segment_id = tool_input["segment_id"]
        issue_type = tool_input["issue_type"]

        # Create diagnosis object
        diagnosis = Diagnosis(
            id=f"{segment_id}:{issue_type}",
            segment_id=segment_id,
            issue_type=issue_type,
            severity=tool_input["severity"],
            explanation=tool_input["explanation"],
            metric_evidence=tool_input["metric_evidence"],
            recommended_actions=tool_input["recommended_actions"],
            priority=1,  # Will be reassigned during finalization
        )

        context["diagnoses"].append(diagnosis)

        return {
            "status": "recorded",
            "diagnosis_id": diagnosis.id,
            "total_diagnoses": len(context["diagnoses"]),
        }

    def _handle_finalize(
        self, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Finalize the diagnosis report."""
        summary = tool_input.get("summary", "")
        if summary:
            context["warnings"].append(f"Analysis summary: {summary}")

        return {
            "status": "finalized",
            "total_diagnoses": len(context["diagnoses"]),
            "_terminal": True,  # Signal to stop the agentic loop
        }

    def _sort_key(self, diagnosis: Diagnosis) -> tuple:
        """Sort key for prioritizing diagnoses."""
        high_rank = (
            self._TYPE_RANK[diagnosis.issue_type]
            if diagnosis.severity == "high"
            else 10
        )
        return (high_rank, self._TYPE_RANK[diagnosis.issue_type], diagnosis.segment_id)
