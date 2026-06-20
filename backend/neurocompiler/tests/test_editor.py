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


def test_one_overload_diagnosis_generates_diverse_candidates_within_limit():
    candidates = CurriculumEditor().generate_candidates(
        LESSON,
        DiagnosisReport(diagnoses=[Diagnosis(id="d", segment_id="s1", issue_type="cognitive_overload",
            severity="high", explanation="Fix it", metric_evidence={}, recommended_actions=[], priority=1)]),
        max_candidates=3,
    )
    assert [candidate.edit_plan.edits[0].action for candidate in candidates] == [
        "split_section", "simplify_explanation", "add_example",
    ]
    assert len({candidate.candidate_id for candidate in candidates}) == 3
    for candidate in candidates:
        ids = [segment.id for segment in candidate.lesson.segments]
        assert len(ids) == len(set(ids))
        operation = candidate.edit_plan.edits[0]
        assert operation.source_diagnosis_id == "d"
        assert operation.expected_metric_impact


def test_non_biology_analogy_is_not_solar_panel_based():
    math_lesson = StructuredLesson(id="math", title="Algebra functions", learning_goals=["Understand functions"], segments=[
        LessonSegment(id="m1", title="Functions", content="A function maps one value to another.", concepts=["function"])
    ])
    diagnosis = Diagnosis(id="d", segment_id="m1", issue_type="low_multimodal_support", severity="medium",
        explanation="Add support", metric_evidence={}, recommended_actions=[], priority=1)
    candidate = CurriculumEditor().generate_candidates(math_lesson, DiagnosisReport(diagnoses=[diagnosis]))[0]
    content = candidate.lesson.segments[1].content.lower()
    assert "map" in content
    assert "solar panel" not in content


def test_max_candidates_is_respected():
    diagnosis = Diagnosis(id="d", segment_id="s1", issue_type="cognitive_overload", severity="high",
        explanation="Fix it", metric_evidence={}, recommended_actions=[], priority=1)
    candidates = CurriculumEditor().generate_candidates(LESSON, DiagnosisReport(diagnoses=[diagnosis]), max_candidates=2)
    assert len(candidates) == 2
