"""Regression coverage for packaging and accidental one-line/syntax breakage."""

import py_compile
from pathlib import Path


ROOT = Path(__file__).parents[1]
CORE_FILES = [
    ROOT / "schemas.py",
    ROOT / "scoring.py",
    ROOT / "cli.py",
    ROOT / "agents" / "diagnostician.py",
    ROOT / "agents" / "curriculum_editor.py",
    ROOT / "agents" / "optimizer.py",
    ROOT / "adapters" / "simulator.py",
    ROOT / "adapters" / "mock_simulator.py",
    ROOT / "adapters" / "json_metric_simulator.py",
]


def test_all_core_python_modules_compile():
    for path in CORE_FILES:
        py_compile.compile(str(path), doraise=True)


def test_core_pipeline_imports_from_repo_root():
    from neurocompiler.adapters.mock_simulator import MockSimulator
    from neurocompiler.agents.curriculum_editor import CurriculumEditor
    from neurocompiler.agents.diagnostician import EducationalDiagnostician
    from neurocompiler.agents.optimizer import LessonOptimizer
    from neurocompiler.schemas import MetricReport, StructuredLesson

    assert all((
        MockSimulator,
        CurriculumEditor,
        EducationalDiagnostician,
        LessonOptimizer,
        MetricReport,
        StructuredLesson,
    ))
