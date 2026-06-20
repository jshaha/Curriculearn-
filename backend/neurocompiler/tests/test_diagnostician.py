from neurocompiler.agents.diagnostician import EducationalDiagnostician
from neurocompiler.schemas import LessonSegment, MetricReport, MetricScores, SegmentMetric, StructuredLesson


def _report(**updates):
    values = dict(engagement=60, cognitive_load=40, concept_flow=70, retention=70,
                  novelty=50, information_density=40, reinforcement=60, multimodal_support=70)
    values.update(updates)
    scores = MetricScores(**values)
    return MetricReport(global_metrics=scores, learning_score=60, segment_metrics=[SegmentMetric(segment_id="s1", metrics=scores)])


LESSON = StructuredLesson(id="lesson", title="Test", learning_goals=["Learn"], segments=[
    LessonSegment(id="s1", title="Section", content="Content")
])


def _issues(**updates):
    return {item.issue_type for item in EducationalDiagnostician().diagnose(LESSON, _report(**updates)).diagnoses}


def test_detects_each_required_issue():
    assert "cognitive_overload" in _issues(cognitive_load=90)
    assert "poor_concept_flow" in _issues(concept_flow=30)
    assert "low_retention" in _issues(retention=30)
    assert "low_retention" in _issues(reinforcement=20)
    assert "low_multimodal_support" in _issues(multimodal_support=20)
    assert "novelty_spike" in _issues(novelty=95, concept_flow=40)


def test_diagnoses_are_priority_sorted():
    report = _report(cognitive_load=90, concept_flow=30, retention=20, novelty=95, multimodal_support=20)
    diagnoses = EducationalDiagnostician().diagnose(LESSON, report).diagnoses
    assert [item.priority for item in diagnoses] == list(range(1, len(diagnoses) + 1))
    assert diagnoses[0].issue_type == "cognitive_overload"


def test_unknown_segment_id_fails_by_default_and_can_be_skipped():
    bad_report = MetricReport(global_metrics=_report().global_metrics, learning_score=60,
        segment_metrics=[SegmentMetric(segment_id="slide-1", metrics=_report().global_metrics)])
    diagnostician = EducationalDiagnostician()
    try:
        diagnostician.diagnose(LESSON, bad_report)
    except ValueError as error:
        assert "slide-1" in str(error)
    else:
        raise AssertionError("Expected unknown segment ID to fail in strict mode")
    non_strict = diagnostician.diagnose(LESSON, bad_report, strict=False)
    assert non_strict.diagnoses == []
    assert non_strict.warnings


def test_empty_segment_metrics_fails_cleanly():
    report = MetricReport(global_metrics=_report().global_metrics, learning_score=60, segment_metrics=[])
    try:
        EducationalDiagnostician().diagnose(LESSON, report)
    except ValueError as error:
        assert "at least one segment metric" in str(error)
    else:
        raise AssertionError("Expected an empty metric report to fail")


def test_empty_lesson_segments_fail_cleanly():
    empty_lesson = StructuredLesson(id="empty", title="Empty", learning_goals=["Learn"], segments=[])
    try:
        EducationalDiagnostician().diagnose(empty_lesson, _report())
    except ValueError as error:
        assert "at least one segment" in str(error)
    else:
        raise AssertionError("Expected an empty lesson to fail")
