import json
from pathlib import Path

from neurocompiler.adapters.mock_simulator import MockSimulator
from neurocompiler.adapters.external_simulator import ExternalSimulatorClient
from neurocompiler.agents.optimizer import LessonOptimizer
from neurocompiler.schemas import EditOperation, EditPlan, LessonSegment, MetricReport, MetricScores, SegmentMetric, StructuredLesson


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
    assert result.iteration_history[0].candidates[0].candidate_id == "iter_1_noop"
    assert result.iteration_history[0].candidates[0].score_delta == 0.0
    assert result.original_metrics and result.best_metrics
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


class _CountingSimulator:
    def __init__(self):
        self.wrapped = MockSimulator()
        self.calls = 0

    def simulate(self, lesson):
        self.calls += 1
        return self.wrapped.simulate(lesson)


def test_optimizer_reuses_winning_metrics_without_extra_simulation():
    simulator = _CountingSimulator()
    result = LessonOptimizer().optimize(_sample_lesson(), simulator)
    evaluated_edits = sum(len(iteration.candidates) - 1 for iteration in result.iteration_history)
    assert simulator.calls == 1 + evaluated_edits


class _ScoreSimulator:
    def __init__(self, candidate_score):
        self.candidate_score = candidate_score

    def simulate(self, lesson):
        metrics = MetricScores(engagement=60, cognitive_load=90, concept_flow=60, retention=60,
            novelty=50, information_density=60, reinforcement=60, multimodal_support=60)
        is_original = len(lesson.segments) == 1 and lesson.segments[0].content == "Original content"
        return MetricReport(global_metrics=metrics, learning_score=50 if is_original else self.candidate_score,
            segment_metrics=[SegmentMetric(segment_id=segment.id, metrics=metrics) for segment in lesson.segments])


def _single_dense_lesson():
    return StructuredLesson(id="one", title="One", learning_goals=["Learn"], segments=[
        LessonSegment(id="s1", title="Dense", content="Original content", concepts=["a", "b", "c", "d"])
    ])


def test_optimizer_rejects_tiny_improvement_below_threshold():
    result = LessonOptimizer().optimize(_single_dense_lesson(), _ScoreSimulator(50.5), max_iterations=1)
    assert result.best_score == 50
    assert result.edit_history == []
    assert result.iteration_history[0].selected_candidate_id is None


def test_optimizer_accepts_improvement_above_threshold_and_tracks_target_delta():
    result = LessonOptimizer().optimize(_single_dense_lesson(), _ScoreSimulator(52), max_iterations=1)
    assert result.best_score == 52
    selected = next(item for item in result.iteration_history[0].candidates if item.candidate_id == result.iteration_history[0].selected_candidate_id)
    assert selected.target_segment_id == "s1"
    assert selected.target_segment_score_before is not None
    assert selected.target_segment_score_after is not None


def test_split_candidate_tracks_average_score_of_new_segments():
    result = LessonOptimizer().optimize(_sample_lesson(), MockSimulator(), max_iterations=1)
    split = next(item for item in result.iteration_history[0].candidates if item.edit_plan.edits and item.edit_plan.edits[0].action == "split_section")
    assert split.target_segment_score_before is not None
    assert split.target_segment_score_after is not None
    assert split.target_segment_score_delta is not None


def test_external_simulator_placeholder_is_explicit():
    try:
        ExternalSimulatorClient("https://partner.example").simulate(_sample_lesson())
    except NotImplementedError:
        pass
    else:
        raise AssertionError("External simulator placeholder must not silently evaluate a lesson")


def test_optimizer_respects_added_segment_budget():
    lesson = _sample_lesson()
    result = LessonOptimizer().optimize(lesson, MockSimulator(), max_added_segments=0)
    assert len(result.best_lesson.segments) <= len(lesson.segments)
