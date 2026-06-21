"""Claude-powered curriculum editor (Agent 5)."""

from copy import deepcopy
from typing import Any, Dict, List, Optional

from neurocompiler.schemas import (
    Diagnosis,
    DiagnosisReport,
    EditOperation,
    EditPlan,
    EditedLessonCandidate,
    LessonSegment,
    StructuredLesson,
)

from .base import ClaudeAgentBase
from .config import ClaudeConfig
from .prompts.editor_prompt import EDITOR_SYSTEM_PROMPT
from .tools.editor_tools import EDITOR_TOOLS


class ClaudeCurriculumEditor(ClaudeAgentBase):
    """Claude-powered curriculum editor using tool-based editing.

    Generates substantive, content-aware edits compared to the template-based
    CurriculumEditor. Falls back to deterministic editing when Claude API
    is unavailable.
    """

    # Expected metric impacts by action type
    _METRIC_IMPACTS = {
        "split_section": {"cognitive_load": -18, "information_density": -15, "concept_flow": 8},
        "add_analogy": {"multimodal_support": 20, "concept_flow": 5},
        "add_example": {"multimodal_support": 14, "concept_flow": 5},
        "add_transition": {"concept_flow": 20, "novelty": -12},
        "add_retrieval_question": {"retention": 20, "reinforcement": 30},
        "add_recap": {"retention": 15, "reinforcement": 25},
        "simplify_explanation": {"cognitive_load": -12, "information_density": -10},
    }

    def __init__(self, config: Optional[ClaudeConfig] = None):
        super().__init__(config)
        self._fallback_editor = None

    @property
    def fallback_editor(self):
        """Lazy-load the fallback deterministic editor."""
        if self._fallback_editor is None:
            from neurocompiler.agents.curriculum_editor import CurriculumEditor
            self._fallback_editor = CurriculumEditor()
        return self._fallback_editor

    def get_tools(self) -> List[Dict[str, Any]]:
        return EDITOR_TOOLS

    def get_system_prompt(self) -> str:
        return EDITOR_SYSTEM_PROMPT

    def generate_candidates(
        self,
        lesson: StructuredLesson,
        diagnosis_report: DiagnosisReport,
        max_candidates: int = 3,
    ) -> List[EditedLessonCandidate]:
        """Generate edit candidates addressing diagnosed issues.

        This method has the same signature as CurriculumEditor.generate_candidates()
        for drop-in replacement.

        Args:
            lesson: The structured lesson to edit
            diagnosis_report: Diagnoses from the diagnostician
            max_candidates: Maximum number of candidates to generate

        Returns:
            List of EditedLessonCandidate with edits
        """
        if not diagnosis_report.diagnoses:
            return []

        # Try Claude-powered editing
        if self.is_available:
            try:
                return self._generate_with_claude(lesson, diagnosis_report, max_candidates)
            except Exception as e:
                print(f"Claude editing failed: {e}")
                if self.config.fallback_enabled:
                    print("Falling back to deterministic editor")
                else:
                    raise

        # Fallback to deterministic editor
        return self.fallback_editor.generate_candidates(lesson, diagnosis_report, max_candidates)

    def _generate_with_claude(
        self,
        lesson: StructuredLesson,
        diagnosis_report: DiagnosisReport,
        max_candidates: int,
    ) -> List[EditedLessonCandidate]:
        """Generate candidates using Claude's tool-based approach."""
        # Build context for tool handlers
        context = {
            "lesson": lesson,
            "diagnosis_report": diagnosis_report,
            "segment_map": {seg.id: seg for seg in lesson.segments},
            "diagnosis_map": {d.id: d for d in diagnosis_report.diagnoses},
            "candidates": [],
            "current_candidate": None,
            "max_candidates": max_candidates,
        }

        # Build user message
        user_message = self._build_user_message(lesson, diagnosis_report, max_candidates)

        # Run agentic loop
        self.run_agentic_loop(user_message, context, max_turns=20)

        return context["candidates"]

    def _build_user_message(
        self,
        lesson: StructuredLesson,
        diagnosis_report: DiagnosisReport,
        max_candidates: int,
    ) -> str:
        """Build the initial user message with task description."""
        diagnoses_overview = []
        for d in sorted(diagnosis_report.diagnoses, key=lambda x: x.priority):
            diagnoses_overview.append(
                f"- [{d.priority}] {d.id}: {d.issue_type} ({d.severity}) in segment '{d.segment_id}'"
            )

        return f"""Create up to {max_candidates} edit candidates for this lesson.

## Lesson: {lesson.title}
**Target Audience**: {lesson.target_audience or 'Not specified'}
**Learning Goals**: {', '.join(lesson.learning_goals) or 'Not specified'}

## Diagnoses (by priority)
{chr(10).join(diagnoses_overview)}

## Instructions
1. Review the highest-priority diagnoses first
2. For each candidate, create edits that address one or more issues
3. Write substantive educational content (not placeholders)
4. Call finalize_candidate after completing each candidate's edits
5. Create diverse candidates that take different approaches when possible

Start by examining the highest-priority diagnosis and the affected segment."""

    def handle_tool_call(
        self, tool_name: str, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle tool calls from Claude."""
        if tool_name == "get_diagnosis_details":
            return self._handle_get_diagnosis(tool_input, context)
        elif tool_name == "get_segment_content":
            return self._handle_get_segment(tool_input, context)
        elif tool_name == "get_lesson_context":
            return self._handle_get_lesson_context(tool_input, context)
        elif tool_name == "create_split_section_edit":
            return self._handle_split_section(tool_input, context)
        elif tool_name == "create_insert_segment_edit":
            return self._handle_insert_segment(tool_input, context)
        elif tool_name == "create_modify_segment_edit":
            return self._handle_modify_segment(tool_input, context)
        elif tool_name == "finalize_candidate":
            return self._handle_finalize_candidate(tool_input, context)
        else:
            return {"error": f"Unknown tool: {tool_name}"}

    def _handle_get_diagnosis(
        self, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Return details about a diagnosis."""
        diagnosis_id = tool_input["diagnosis_id"]
        diagnosis = context["diagnosis_map"].get(diagnosis_id)

        if diagnosis is None:
            return {"error": f"Diagnosis '{diagnosis_id}' not found"}

        return {
            "id": diagnosis.id,
            "segment_id": diagnosis.segment_id,
            "issue_type": diagnosis.issue_type,
            "severity": diagnosis.severity,
            "explanation": diagnosis.explanation,
            "metric_evidence": diagnosis.metric_evidence,
            "recommended_actions": diagnosis.recommended_actions,
            "priority": diagnosis.priority,
        }

    def _handle_get_segment(
        self, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Return content for a segment."""
        segment_id = tool_input["segment_id"]
        segment = context["segment_map"].get(segment_id)

        if segment is None:
            return {"error": f"Segment '{segment_id}' not found"}

        return {
            "id": segment.id,
            "title": segment.title,
            "content": segment.content,
            "concepts": segment.concepts,
            "modality": segment.modality,
        }

    def _handle_get_lesson_context(
        self, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Return lesson metadata."""
        lesson = context["lesson"]
        return {
            "id": lesson.id,
            "title": lesson.title,
            "learning_goals": lesson.learning_goals,
            "target_audience": lesson.target_audience,
            "segments": [
                {"id": s.id, "title": s.title, "concepts": s.concepts}
                for s in lesson.segments
            ],
        }

    def _handle_split_section(
        self, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a split section edit."""
        self._ensure_current_candidate(context)

        target_id = tool_input["target_segment_id"]
        original = context["segment_map"].get(target_id)
        if original is None:
            return {"error": f"Segment '{target_id}' not found"}

        lesson = context["lesson"]

        # Create the two new segments
        first_id = self._unique_id(lesson, f"{target_id}_a")
        second_id = self._unique_id(lesson, f"{target_id}_b")

        first = LessonSegment(
            id=first_id,
            title=tool_input["first_segment_title"],
            content=tool_input["first_segment_content"],
            concepts=tool_input["first_segment_concepts"],
            modality=original.modality,
        )
        second = LessonSegment(
            id=second_id,
            title=tool_input["second_segment_title"],
            content=tool_input["second_segment_content"],
            concepts=tool_input["second_segment_concepts"],
            modality=original.modality,
        )

        # Create edit operation
        operation = EditOperation(
            id=f"edit_{target_id}_split",
            target_segment_id=target_id,
            action="split_section",
            rationale=tool_input["rationale"],
            new_segments=[first, second],
            before_segment=original,
            removed_segment_ids=[target_id],
            inserted_segment_ids=[first_id, second_id],
            expected_metric_impact=self._METRIC_IMPACTS["split_section"],
        )

        # Apply to lesson
        segments = deepcopy(lesson.segments)
        idx = self._index(segments, target_id)
        segments[idx:idx + 1] = [first, second]
        edited_lesson = lesson.model_copy(update={"segments": segments})

        # Store in current candidate
        context["current_candidate"]["lesson"] = edited_lesson
        context["current_candidate"]["edits"].append(operation)
        context["lesson"] = edited_lesson  # Update for subsequent edits
        context["segment_map"] = {s.id: s for s in edited_lesson.segments}

        return {
            "status": "created",
            "edit_id": operation.id,
            "first_segment_id": first_id,
            "second_segment_id": second_id,
        }

    def _handle_insert_segment(
        self, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create an insert segment edit."""
        self._ensure_current_candidate(context)

        target_id = tool_input["target_segment_id"]
        original = context["segment_map"].get(target_id)
        if original is None:
            return {"error": f"Segment '{target_id}' not found"}

        lesson = context["lesson"]
        insert_type = tool_input["insert_type"]

        # Create new segment
        new_id = self._unique_id(lesson, f"{target_id}_{insert_type}")
        new_segment = LessonSegment(
            id=new_id,
            title=tool_input["new_segment_title"],
            content=tool_input["new_segment_content"],
            concepts=tool_input["new_segment_concepts"],
            modality="text" if insert_type == "retrieval_question" else "mixed",
        )

        # Map insert_type to action name
        action_name = f"add_{insert_type}"
        if insert_type == "retrieval_question":
            action_name = "add_retrieval_question"

        # Create edit operation
        operation = EditOperation(
            id=f"edit_{target_id}_{insert_type}",
            target_segment_id=target_id,
            action=action_name,
            rationale=tool_input["rationale"],
            new_segments=[new_segment],
            inserted_after_segment_id=target_id,
            before_segment=original,
            inserted_segment_ids=[new_id],
            expected_metric_impact=self._METRIC_IMPACTS.get(action_name, {}),
        )

        # Apply to lesson
        segments = deepcopy(lesson.segments)
        idx = self._index(segments, target_id)
        segments.insert(idx + 1, new_segment)
        edited_lesson = lesson.model_copy(update={"segments": segments})

        # Store in current candidate
        context["current_candidate"]["lesson"] = edited_lesson
        context["current_candidate"]["edits"].append(operation)
        context["lesson"] = edited_lesson
        context["segment_map"] = {s.id: s for s in edited_lesson.segments}

        return {
            "status": "created",
            "edit_id": operation.id,
            "new_segment_id": new_id,
        }

    def _handle_modify_segment(
        self, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a modify segment edit."""
        self._ensure_current_candidate(context)

        target_id = tool_input["target_segment_id"]
        original = context["segment_map"].get(target_id)
        if original is None:
            return {"error": f"Segment '{target_id}' not found"}

        lesson = context["lesson"]

        # Create modified segment
        modified = original.model_copy(update={
            "content": tool_input["new_content"],
        })

        # Create edit operation
        operation = EditOperation(
            id=f"edit_{target_id}_simplify",
            target_segment_id=target_id,
            action="simplify_explanation",
            rationale=tool_input["rationale"],
            new_segments=[modified],
            before_segment=original,
            expected_metric_impact=self._METRIC_IMPACTS["simplify_explanation"],
        )

        # Apply to lesson
        segments = deepcopy(lesson.segments)
        idx = self._index(segments, target_id)
        segments[idx] = modified
        edited_lesson = lesson.model_copy(update={"segments": segments})

        # Store in current candidate
        context["current_candidate"]["lesson"] = edited_lesson
        context["current_candidate"]["edits"].append(operation)
        context["lesson"] = edited_lesson
        context["segment_map"] = {s.id: s for s in edited_lesson.segments}

        return {
            "status": "created",
            "edit_id": operation.id,
        }

    def _handle_finalize_candidate(
        self, tool_input: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Finalize the current candidate."""
        if context["current_candidate"] is None:
            return {"error": "No edits have been created for this candidate"}

        candidate_num = len(context["candidates"]) + 1
        cc = context["current_candidate"]

        if not cc["edits"]:
            return {"error": "Candidate has no edits"}

        # Determine candidate ID from first edit
        first_edit = cc["edits"][0]
        candidate_id = f"candidate_{candidate_num}_{first_edit.target_segment_id}_{first_edit.action}"

        candidate = EditedLessonCandidate(
            candidate_id=candidate_id,
            lesson=cc["lesson"],
            edit_plan=EditPlan(edits=cc["edits"]),
        )

        context["candidates"].append(candidate)
        context["current_candidate"] = None

        # Reset lesson to original for next candidate
        context["lesson"] = context["candidates"][0].lesson if context["candidates"] else context["lesson"]
        # Actually we should track the original lesson separately
        # For now, candidates build independently

        at_max = len(context["candidates"]) >= context["max_candidates"]

        return {
            "status": "finalized",
            "candidate_id": candidate_id,
            "total_candidates": len(context["candidates"]),
            "summary": tool_input.get("summary", ""),
            "_terminal": at_max,  # Stop if we've reached max candidates
        }

    def _ensure_current_candidate(self, context: Dict[str, Any]) -> None:
        """Ensure there's a current candidate being built."""
        if context["current_candidate"] is None:
            # Reset lesson to original for new candidate
            original_lesson = context.get("original_lesson")
            if original_lesson is None:
                # Store original on first use
                context["original_lesson"] = context["lesson"]
                original_lesson = context["lesson"]
            else:
                # Reset to original for new candidate
                context["lesson"] = original_lesson
                context["segment_map"] = {s.id: s for s in original_lesson.segments}

            context["current_candidate"] = {
                "lesson": deepcopy(original_lesson),
                "edits": [],
            }

    @staticmethod
    def _index(segments: List[LessonSegment], segment_id: str) -> int:
        """Find index of segment by ID."""
        return next(i for i, s in enumerate(segments) if s.id == segment_id)

    @staticmethod
    def _unique_id(lesson: StructuredLesson, base: str) -> str:
        """Generate a unique segment ID."""
        existing = {s.id for s in lesson.segments}
        if base not in existing:
            return base
        suffix = 2
        while f"{base}_{suffix}" in existing:
            suffix += 1
        return f"{base}_{suffix}"
