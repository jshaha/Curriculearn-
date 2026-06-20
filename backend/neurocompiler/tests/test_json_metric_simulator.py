import json
from pathlib import Path

import pytest

from neurocompiler.adapters.json_metric_simulator import JsonMetricSimulator
from neurocompiler.schemas import LessonSegment, StructuredLesson


def _sample_lesson():
    path = Path(__file__).parents[1] / "data" / "sample_lesson.json"
    return StructuredLesson.model_validate_json(path.read_text())


def test_json_metric_simulator_loads_precomputed_report():
    report_path = Path(__file__).parents[1] / "data" / "sample_metric_report.json"
    report = JsonMetricSimulator(report_path).simulate(_sample_lesson())
    assert report.model_name is None
    assert len(report.segment_metrics) == 6


def test_json_metric_simulator_catches_segment_id_mismatch(tmp_path):
    report_path = Path(__file__).parents[1] / "data" / "sample_metric_report.json"
    payload = json.loads(report_path.read_text())
    payload["segment_metrics"][0]["segment_id"] = "slide-1"
    bad_path = tmp_path / "bad_report.json"
    bad_path.write_text(json.dumps(payload))
    with pytest.raises(ValueError, match="do not match"):
        JsonMetricSimulator(bad_path).simulate(_sample_lesson())
