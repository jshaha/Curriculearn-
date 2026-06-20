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
    assert {"original_score", "best_score", "score_delta", "best_lesson", "edit_history", "iteration_history"} <= payload.keys()
    assert payload["iteration_history"]
