"""Agent 6: bounded search across edited lesson candidates."""

from neurocompiler.adapters.simulator import SimulatorProtocol
from neurocompiler.agents.curriculum_editor import CurriculumEditor
from neurocompiler.agents.diagnostician import EducationalDiagnostician
from neurocompiler.schemas import (
    CandidateEvaluation, EditPlan, MetricReport, OptimizationIteration, OptimizationResult,
    StructuredLesson,
)
from neurocompiler.scoring import compute_segment_score


class LessonOptimizer:
    def __init__(self, diagnostician=None, editor=None):
        self.diagnostician = diagnostician or EducationalDiagnostician()
        self.editor = editor or CurriculumEditor()

    def optimize(self, lesson: StructuredLesson, simulator: SimulatorProtocol,
                 max_iterations: int = 2, max_candidates: int = 3,
                 max_added_segments: int = 3, max_total_segments: int = 12,
                 min_improvement: float = 1.0) -> OptimizationResult:
        if max_added_segments < 0 or max_total_segments < 1 or min_improvement < 0:
            raise ValueError("Optimization budgets and min_improvement must be non-negative.")
        original_metrics = simulator.simulate(lesson)
        original_segment_count = len(lesson.segments)
        current_lesson, current_metrics = lesson, original_metrics
        best_lesson, best_metrics, best_score = lesson, original_metrics, original_metrics.learning_score
        edit_history = []
        iteration_history = []
        actual_iterations = 0

        for iteration_number in range(1, max_iterations + 1):
            diagnoses = self.diagnostician.diagnose(current_lesson, current_metrics)
            if not diagnoses.diagnoses:
                break
            candidates = self.editor.generate_candidates(current_lesson, diagnoses, max_candidates)
            candidates = [
                candidate for candidate in candidates
                if len(candidate.lesson.segments) <= max_total_segments
                and len(candidate.lesson.segments) <= original_segment_count + max_added_segments
            ]
            if not candidates:
                break
            actual_iterations += 1
            round_winner = None
            round_winner_metrics = None
            round_score = current_metrics.learning_score
            evaluations = [CandidateEvaluation(
                candidate_id=f"iter_{iteration_number}_noop", edit_plan=EditPlan(edits=[]),
                score=current_metrics.learning_score, score_delta=0.0, metric_report=current_metrics,
            )]
            for candidate in candidates:
                candidate_metrics = simulator.simulate(candidate.lesson)
                candidate_score = candidate_metrics.learning_score
                target_scores = self._target_segment_scores(candidate.edit_plan, current_metrics, candidate_metrics)
                evaluations.append(CandidateEvaluation(
                    candidate_id=candidate.candidate_id, edit_plan=candidate.edit_plan,
                    score=candidate_score,
                    score_delta=round(candidate_score - current_metrics.learning_score, 2),
                    metric_report=candidate_metrics,
                    **target_scores,
                ))
                if (candidate_score >= current_metrics.learning_score + min_improvement
                        and candidate_score > round_score):
                    round_winner, round_score = candidate, candidate_score
                    round_winner_metrics = candidate_metrics
            iteration_record = OptimizationIteration(
                iteration=iteration_number, diagnoses=diagnoses, candidates=evaluations,
                selected_candidate_id=round_winner.candidate_id if round_winner else None,
            )
            iteration_history.append(iteration_record)
            if round_winner is None:
                break
            best_lesson, best_score = round_winner.lesson, round_score
            best_metrics = round_winner_metrics
            edit_history.append(round_winner.edit_plan)
            current_lesson = round_winner.lesson
            # Reuse the already evaluated winner; real simulators may be expensive.
            current_metrics = round_winner_metrics

        return OptimizationResult(
            original_lesson=lesson, best_lesson=best_lesson,
            original_score=original_metrics.learning_score, best_score=best_score,
            iterations=actual_iterations, edit_history=edit_history,
            iteration_history=iteration_history,
            original_metrics=original_metrics, best_metrics=best_metrics,
        )

    @staticmethod
    def _target_segment_scores(edit_plan: EditPlan, before: MetricReport,
                               after: MetricReport) -> dict:
        """Compute local target quality, including the average after a split edit."""
        if not edit_plan.edits:
            return {}
        operation = edit_plan.edits[0]
        before_metrics = {item.segment_id: item.metrics for item in before.segment_metrics}
        after_metrics = {item.segment_id: item.metrics for item in after.segment_metrics}
        before_value = before_metrics.get(operation.target_segment_id)
        before_score = compute_segment_score(before_value) if before_value else None

        after_values = []
        if operation.action == "split_section" and operation.new_segments:
            after_values = [
                after_metrics[segment.id] for segment in operation.new_segments
                if segment.id in after_metrics
            ]
        elif operation.target_segment_id in after_metrics:
            after_values = [after_metrics[operation.target_segment_id]]
        after_score = (
            round(sum(compute_segment_score(metrics) for metrics in after_values) / len(after_values), 2)
            if after_values else None
        )
        return {
            "target_segment_id": operation.target_segment_id,
            "target_segment_score_before": before_score,
            "target_segment_score_after": after_score,
            "target_segment_score_delta": (
                round(after_score - before_score, 2)
                if before_score is not None and after_score is not None else None
            ),
        }
