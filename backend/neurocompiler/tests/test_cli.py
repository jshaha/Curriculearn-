import json
import sys
from pathlib import Path

from neurocompiler import cli


def test_cli_writes_demo_ready_json(tmp_path, monkeypatch):
    lesson = Path(__file__).parents[1] / "data" / "sample_lesson.json"
    output = tmp_path / "optimized.json"
    monkeypatch.setattr(sys, "argv", ["neurocompiler", "optimize", "--lesson", str(lesson), "--out", str(output)])
    cli.main()
    payload = json.loads(output.read_text())
    assert {
        "original_score", "best_score", "score_delta", "original_metrics", "best_metrics",
        "best_lesson", "edit_history", "iteration_history", "num_candidates_evaluated",
        "winning_edits_summary",
    } <= payload.keys()
    assert payload["iteration_history"]
    assert payload["num_candidates_evaluated"] >= len(payload["iteration_history"])
