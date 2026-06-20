"""Template-based structured curriculum edits (Agent 5)."""

from copy import deepcopy
from typing import Callable, Dict, List

from neurocompiler.schemas import (
    Diagnosis, DiagnosisReport, EditOperation, EditPlan, EditedLessonCandidate,
    LessonSegment, StructuredLesson,
)


class CurriculumEditor:
    """Generate small, explainable lesson variants without rendering source files."""

    _ACTIONS_BY_ISSUE = {
        "cognitive_overload": ["split_section", "simplify_explanation", "add_example"],
        "poor_concept_flow": ["add_transition"],
        "low_retention": ["add_retrieval_question"],
        "low_multimodal_support": ["add_analogy", "add_example"],
        "novelty_spike": ["add_transition", "add_example"],
    }
    ANALOGY_TEMPLATES = {
        "biology": "Think of {concept} like a living factory: inputs come in, processes happen inside, and useful outputs are produced.",
        "computer_science": "Think of {concept} like a pipeline: information enters, each step transforms it, and the final output depends on the order of operations.",
        "math": "Think of {concept} like a map: it shows how one quantity or idea connects to another.",
        "default": "Think of {concept} like a system with inputs, a process, and outputs. Understanding the parts separately makes the whole idea easier to follow.",
    }

    def generate_candidates(self, lesson: StructuredLesson, diagnosis_report: DiagnosisReport,
                            max_candidates: int = 3) -> List[EditedLessonCandidate]:
        candidates: List[EditedLessonCandidate] = []
        seen = set()
        for diagnosis in diagnosis_report.diagnoses:
            for action in self._ACTIONS_BY_ISSUE[diagnosis.issue_type]:
                key = (diagnosis.segment_id, action)
                if key in seen:
                    continue
                seen.add(key)
                candidates.append(self._apply(lesson, diagnosis, action, len(candidates) + 1))
                if len(candidates) >= max_candidates:
                    return candidates
        return candidates

    def _apply(self, lesson: StructuredLesson, diagnosis: Diagnosis, action: str,
               number: int) -> EditedLessonCandidate:
        handlers: Dict[str, Callable] = {
            "split_section": self._split_section,
            "simplify_explanation": self._simplify_explanation,
            "add_analogy": self._add_analogy,
            "add_example": self._add_example,
            "add_retrieval_question": self._add_retrieval_question,
            "add_transition": self._add_transition,
        }
        edited_lesson, operation = handlers[action](lesson, diagnosis)
        return EditedLessonCandidate(
            candidate_id=f"candidate_{number}_{diagnosis.segment_id}_{action}",
            lesson=edited_lesson, edit_plan=EditPlan(edits=[operation]),
        )

    def _split_section(self, lesson: StructuredLesson, diagnosis: Diagnosis):
        original = self._target(lesson, diagnosis.segment_id)
        midpoint = max(1, (len(original.concepts) + 1) // 2)
        first_concepts, second_concepts = original.concepts[:midpoint], original.concepts[midpoint:]
        summary = ", ".join(first_concepts) or "the main idea"
        first = original.model_copy(update={
            "id": self._unique_id(lesson, f"{original.id}_a"),
            "title": f"{original.title}: intuition",
            "content": f"Start with the big idea: {summary}. Focus on why it matters before adding detail.",
            "concepts": first_concepts,
        })
        detail = ", ".join(second_concepts) or "the supporting detail"
        second = original.model_copy(update={
            "id": self._unique_id(lesson, f"{original.id}_b"),
            "title": f"{original.title}: core idea",
            "content": f"Now add the core detail: {detail}. {original.content}",
            "concepts": second_concepts,
        })
        segments = deepcopy(lesson.segments)
        index = self._index(segments, original.id)
        segments[index:index + 1] = [first, second]
        edited = lesson.model_copy(update={"segments": segments})
        return edited, EditOperation(
            id=f"edit_{original.id}_split", target_segment_id=original.id, action="split_section",
            rationale=diagnosis.explanation, new_segments=[first, second],
        )

    def _simplify_explanation(self, lesson: StructuredLesson, diagnosis: Diagnosis):
        original = self._target(lesson, diagnosis.segment_id)
        simplified = original.model_copy(update={
            "content": f"Let's break this into the main idea first: {', '.join(original.concepts) or original.title}. Then connect the details one at a time.",
        })
        return self._replace(lesson, original.id, simplified), EditOperation(
            id=f"edit_{original.id}_simplify", target_segment_id=original.id, action="simplify_explanation",
            rationale=diagnosis.explanation, new_segments=[simplified],
        )

    def _add_analogy(self, lesson: StructuredLesson, diagnosis: Diagnosis):
        original = self._target(lesson, diagnosis.segment_id)
        concept = original.concepts[0] if original.concepts else original.title
        domain = self._infer_domain(lesson, original)
        new = LessonSegment(id=self._unique_id(lesson, f"{original.id}_analogy"),
            title=f"Analogy for {concept}", modality="mixed", concepts=[concept],
            content=f"Analogy: {self.ANALOGY_TEMPLATES[domain].format(concept=concept)}")
        return self._insert_after(lesson, original.id, new), EditOperation(
            id=f"edit_{original.id}_analogy", target_segment_id=original.id, action="add_analogy",
            rationale=diagnosis.explanation, new_segments=[new], inserted_after_segment_id=original.id,
        )

    def _add_example(self, lesson: StructuredLesson, diagnosis: Diagnosis):
        original = self._target(lesson, diagnosis.segment_id)
        concept = original.concepts[0] if original.concepts else original.title
        new = LessonSegment(id=self._unique_id(lesson, f"{original.id}_example"),
            title=f"Example: {concept}", modality="mixed", concepts=[concept],
            content=f"Example: Apply {concept} to a familiar real-world situation and explain what changes.")
        return self._insert_after(lesson, original.id, new), EditOperation(
            id=f"edit_{original.id}_example", target_segment_id=original.id, action="add_example",
            rationale=diagnosis.explanation, new_segments=[new], inserted_after_segment_id=original.id,
        )

    def _add_retrieval_question(self, lesson: StructuredLesson, diagnosis: Diagnosis):
        original = self._target(lesson, diagnosis.segment_id)
        concept = original.concepts[0] if original.concepts else original.title
        new = LessonSegment(id=self._unique_id(lesson, f"{original.id}_retrieval"),
            title="Quick check", modality="text", concepts=[concept],
            content=f"Quick check: Without looking back, what role does {concept} play? Explain it in one sentence.")
        return self._insert_after(lesson, original.id, new), EditOperation(
            id=f"edit_{original.id}_retrieval", target_segment_id=original.id, action="add_retrieval_question",
            rationale=diagnosis.explanation, new_segments=[new], inserted_after_segment_id=original.id,
        )

    def _add_transition(self, lesson: StructuredLesson, diagnosis: Diagnosis):
        original = self._target(lesson, diagnosis.segment_id)
        original_index = self._index(lesson.segments, original.id)
        previous = lesson.segments[original_index - 1] if original_index else None
        prior_concept = previous.concepts[0] if previous and previous.concepts else "the previous idea"
        next_concept = original.concepts[0] if original.concepts else original.title
        new = LessonSegment(id=self._unique_id(lesson, f"{original.id}_transition"),
            title=f"Bridge to {original.title}", modality="text", concepts=[next_concept],
            content=f"Before we introduce {next_concept}, connect it to {prior_concept}. This transition shows why {next_concept} follows.")
        segments = deepcopy(lesson.segments)
        segments.insert(self._index(segments, original.id), new)
        edited = lesson.model_copy(update={"segments": segments})
        return edited, EditOperation(
            id=f"edit_{original.id}_transition", target_segment_id=original.id, action="add_transition",
            rationale=diagnosis.explanation, new_segments=[new],
        )

    def _target(self, lesson: StructuredLesson, segment_id: str) -> LessonSegment:
        return next(segment for segment in lesson.segments if segment.id == segment_id)

    @staticmethod
    def _index(segments: List[LessonSegment], segment_id: str) -> int:
        return next(index for index, segment in enumerate(segments) if segment.id == segment_id)

    def _replace(self, lesson: StructuredLesson, segment_id: str, replacement: LessonSegment) -> StructuredLesson:
        segments = deepcopy(lesson.segments)
        segments[self._index(segments, segment_id)] = replacement
        return lesson.model_copy(update={"segments": segments})

    def _insert_after(self, lesson: StructuredLesson, segment_id: str, new: LessonSegment) -> StructuredLesson:
        segments = deepcopy(lesson.segments)
        segments.insert(self._index(segments, segment_id) + 1, new)
        return lesson.model_copy(update={"segments": segments})

    @staticmethod
    def _unique_id(lesson: StructuredLesson, base: str) -> str:
        existing = {segment.id for segment in lesson.segments}
        if base not in existing:
            return base
        suffix = 2
        while f"{base}_{suffix}" in existing:
            suffix += 1
        return f"{base}_{suffix}"

    @staticmethod
    def _infer_domain(lesson: StructuredLesson, segment: LessonSegment) -> str:
        text = " ".join([lesson.title, *lesson.learning_goals, *segment.concepts]).lower()
        if any(word in text for word in ("cell", "plant", "biology", "photosynthesis", "organism", "genetic")):
            return "biology"
        if any(word in text for word in ("code", "program", "algorithm", "computer", "software", "data structure")):
            return "computer_science"
        if any(word in text for word in ("math", "equation", "theorem", "function", "algebra", "geometry")):
            return "math"
        return "default"
