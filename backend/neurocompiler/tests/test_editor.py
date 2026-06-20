from neurocompiler.agents.curriculum_editor import CurriculumEditor
from neurocompiler.schemas import Diagnosis, DiagnosisReport, LessonSegment, StructuredLesson


LESSON = StructuredLesson(id="lesson", title="Test", learning_goals=["Learn"], segments=[
    LessonSegment(id="s1", title="Dense section", content="Lots of details about the topic.", concepts=["a", "b", "c", "d", "e"]),
    LessonSegment(id="s2", title="Next section", content="More content.", concepts=["f"]),
])


def _candidate(issue_type):
    diagnosis = Diagnosis(id="d", segment_id="s1", issue_type=issue_type, severity="high", explanation="Fix it", metric_evidence={}, recommended_actions=[], priority=1)
    return CurriculumEditor().generate_candidates(LESSON, DiagnosisReport(diagnoses=[diagnosis]))[0]


def test_overload_splits_with_unique_valid_segment_ids():
    candidate = _candidate("cognitive_overload")
    assert candidate.edit_plan.edits[0].action == "split_section"
    ids = [segment.id for segment in candidate.lesson.segments]
    assert "s1_a" in ids and "s1_b" in ids and len(ids) == len(set(ids))


def test_retention_adds_retrieval_question():
    candidate = _candidate("low_retention")
    assert "quick check" in candidate.lesson.segments[1].content.lower()


def test_flow_adds_transition_before_target():
    candidate = _candidate("poor_concept_flow")
    assert candidate.lesson.segments[0].id == "s1_transition"


def test_multimodal_adds_analogy():
    candidate = _candidate("low_multimodal_support")
    assert "analogy" in candidate.lesson.segments[1].content.lower()
