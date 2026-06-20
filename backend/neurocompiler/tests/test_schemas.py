import json
from pathlib import Path

from neurocompiler.schemas import MetricReport, StructuredLesson


DATA_DIR = Path(__file__).parents[1] / "data"


def test_sample_lesson_validates():
    lesson = StructuredLesson.model_validate(json.loads((DATA_DIR / "sample_lesson.json").read_text()))
    assert len(lesson.segments) == 6


def test_sample_metric_report_validates_and_matches_lesson_segments():
    lesson = StructuredLesson.model_validate_json((DATA_DIR / "sample_lesson.json").read_text())
    report = MetricReport.model_validate_json((DATA_DIR / "sample_metric_report.json").read_text())
    lesson_ids = {segment.id for segment in lesson.segments}
    assert {item.segment_id for item in report.segment_metrics} == lesson_ids
