import json
from pathlib import Path

from neurocompiler.schemas import (
    CandidateEvaluation, DiagnosisReport, EditPlan, MetricReport, OptimizationIteration,
    OptimizationResult, StructuredLesson,
)


DATA_DIR = Path(__file__).parents[1] / "data"


def test_sample_lesson_validates():
    lesson = StructuredLesson.model_validate(json.loads((DATA_DIR / "sample_lesson.json").read_text()))
    assert len(lesson.segments) == 6


def test_sample_metric_report_validates_and_matches_lesson_segments():
    lesson = StructuredLesson.model_validate_json((DATA_DIR / "sample_lesson.json").read_text())
    report = MetricReport.model_validate_json((DATA_DIR / "sample_metric_report.json").read_text())
    lesson_ids = {segment.id for segment in lesson.segments}
    assert {item.segment_id for item in report.segment_metrics} == lesson_ids


def test_optional_integration_metadata_and_iteration_history_validate():
    lesson = StructuredLesson.model_validate_json((DATA_DIR / "sample_lesson.json").read_text())
    report = MetricReport.model_validate_json((DATA_DIR / "sample_metric_report.json").read_text())
    enriched = report.model_copy(update={
        "model_name": "partner-simulator", "model_version": "0.2", "confidence": 0.9,
        "warnings": ["partial temporal coverage"],
        "segment_metrics": [report.segment_metrics[0].model_copy(update={"confidence": 0.8, "raw_embedding_path": "artifacts/s1.npy"})],
    })
    evaluation = CandidateEvaluation(candidate_id="c1", edit_plan=EditPlan(edits=[]), score=50,
        score_delta=1.5, metric_report=enriched)
    history = OptimizationIteration(iteration=1, diagnoses=DiagnosisReport(diagnoses=[]), candidates=[evaluation])
    result = OptimizationResult(original_lesson=lesson, best_lesson=lesson, original_score=48,
        best_score=50, iterations=1, edit_history=[], iteration_history=[history])
    assert result.iteration_history[0].candidates[0].metric_report.confidence == 0.9
