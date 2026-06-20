"""Small local demo CLI for the mock-backed optimizer."""

import argparse
import json
from pathlib import Path

from neurocompiler.adapters.mock_simulator import MockSimulator
from neurocompiler.agents.diagnostician import EducationalDiagnostician
from neurocompiler.agents.optimizer import LessonOptimizer
from neurocompiler.schemas import StructuredLesson


def main() -> None:
    parser = argparse.ArgumentParser(description="Optimize a structured lesson with the mock simulator.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    optimize = subparsers.add_parser("optimize")
    optimize.add_argument("--lesson", required=True, type=Path)
    optimize.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    lesson = StructuredLesson.model_validate_json(args.lesson.read_text())
    simulator = MockSimulator()
    result = LessonOptimizer().optimize(lesson, simulator)
    diagnoses = EducationalDiagnostician().diagnose(lesson, simulator.simulate(lesson))
    payload = {
        "original_score": result.original_score,
        "best_score": result.best_score,
        "score_delta": round(result.best_score - result.original_score, 2),
        "best_lesson": result.best_lesson.model_dump(mode="json"),
        "diagnoses": diagnoses.model_dump(mode="json"),
        "edit_history": [plan.model_dump(mode="json") for plan in result.edit_history],
        "iteration_history": [item.model_dump(mode="json") for item in result.iteration_history],
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, indent=2) + "\n")


if __name__ == "__main__":
    main()
