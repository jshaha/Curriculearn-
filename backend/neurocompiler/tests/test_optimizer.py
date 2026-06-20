import json
from pathlib import Path

from neurocompiler.adapters.mock_simulator import MockSimulator
from neurocompiler.agents.optimizer import LessonOptimizer
from neurocompiler.schemas import LessonSegment, StructuredLesson


def _sample_lesson():
    path = Path(__file__).parents[1] / "data" / "sample_lesson.json"
    return StructuredLesson.model_validate(json.loads(path.read_text()))


def test_mock_optimizer_returns_an_improved_valid_result():
    result = LessonOptimizer().optimize(_sample_lesson(), MockSimulator())
    assert result.best_score > result.original_score
    assert result.iterations >= 1
    assert result.edit_history
    assert result.iteration_history
    assert result.iteration_history[0].candidates
    assert result.iteration_history[0].selected_candidate_id
    assert all(isinstance(item.score_delta, float) for item in result.iteration_history[0].candidates)
    assert result.best_lesson.id == "photosynthesis_intro"


def test_optimizer_stops_when_no_diagnoses_are_found():
    lesson = StructuredLesson(id="good", title="Good", learning_goals=["Learn"], segments=[
        LessonSegment(id="s1", title="Recall", content="Quick check: what is the main idea? Analogy: think of idea like a map. Before we continue, connect idea to the next idea.", concepts=["idea"], modality="mixed")
    ])
    result = LessonOptimizer().optimize(lesson, MockSimulator())
    assert result.iterations == 0
    assert result.edit_history == []


def test_optimizer_respects_total_segment_budget():
    lesson = _sample_lesson()
    result = LessonOptimizer().optimize(lesson, MockSimulator(), max_total_segments=len(lesson.segments))
    assert len(result.best_lesson.segments) <= len(lesson.segments)


def test_mock_metrics_are_normalized():
    report = MockSimulator().simulate(_sample_lesson())
    for value in report.global_metrics.model_dump().values():
        assert 0 <= value <= 100
