"""Adapter for precomputed metrics produced by an external simulator pipeline."""

from pathlib import Path

from neurocompiler.schemas import MetricReport, StructuredLesson


class JsonMetricSimulator:
    """Load a static MetricReport JSON artifact for integration and diagnosis testing.

    This adapter is useful when a partner can export metrics but cannot run their
    model locally. A static report only evaluates the lesson it was generated for;
    use a live simulator (or a cycling adapter) for candidate optimization.
    """

    def __init__(self, metric_report_path: str | Path, *, strict_segment_ids: bool = True):
        self.metric_report_path = Path(metric_report_path)
        self.strict_segment_ids = strict_segment_ids

    def simulate(self, lesson: StructuredLesson) -> MetricReport:
        report = MetricReport.model_validate_json(self.metric_report_path.read_text(encoding="utf-8"))
        if self.strict_segment_ids:
            lesson_ids = {segment.id for segment in lesson.segments}
            report_ids = {item.segment_id for item in report.segment_metrics}
            if report_ids != lesson_ids:
                unknown = sorted(report_ids - lesson_ids)
                missing = sorted(lesson_ids - report_ids)
                raise ValueError(
                    "Precomputed MetricReport segment IDs do not match the lesson. "
                    f"Unknown: {unknown}; missing: {missing}."
                )
        return report
