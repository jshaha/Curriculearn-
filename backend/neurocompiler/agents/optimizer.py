"""Agent 6: bounded search across edited lesson candidates."""

from neurocompiler.adapters.simulator import SimulatorProtocol
from neurocompiler.agents.curriculum_editor import CurriculumEditor
from neurocompiler.agents.diagnostician import EducationalDiagnostician
from neurocompiler.schemas import (
    CandidateEvaluation, OptimizationIteration, OptimizationResult, StructuredLesson,
)


class LessonOptimizer:
    def __init__(self, diagnostician=None, editor=None):
        self.diagnostician = diagnostician or EducationalDiagnostician()
        self.editor = editor or CurriculumEditor()

    def optimize(self, lesson: StructuredLesson, simulator: SimulatorProtocol,
                 max_iterations: int = 2, max_candidates: int = 3,
                 max_added_segments: int = 3, max_total_segments: int = 12) -> OptimizationResult:
        if max_added_segments < 0 or max_total_segments < 1:
            raise ValueError("Optimization segment budgets must be non-negative and non-zero.")
        original_metrics = simulator.simulate(lesson)
        original_segment_count = len(lesson.segments)
        current_lesson, current_metrics = lesson, original_metrics
        best_lesson, best_score = lesson, original_metrics.learning_score
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
            round_score = current_metrics.learning_score
            evaluations = []
            for candidate in candidates:
                candidate_metrics = simulator.simulate(candidate.lesson)
                candidate_score = candidate_metrics.learning_score
                evaluations.append(CandidateEvaluation(
                    candidate_id=candidate.candidate_id, edit_plan=candidate.edit_plan,
                    score=candidate_score,
                    score_delta=round(candidate_score - current_metrics.learning_score, 2),
                    metric_report=candidate_metrics,
                ))
                if candidate_score > round_score:
                    round_winner, round_score = candidate, candidate_score
            iteration_record = OptimizationIteration(
                iteration=iteration_number, diagnoses=diagnoses, candidates=evaluations,
                selected_candidate_id=round_winner.candidate_id if round_winner else None,
            )
            iteration_history.append(iteration_record)
            if round_winner is None:
                break
            best_lesson, best_score = round_winner.lesson, round_score
            edit_history.append(round_winner.edit_plan)
            current_lesson = round_winner.lesson
            current_metrics = simulator.simulate(current_lesson)

        return OptimizationResult(
            original_lesson=lesson, best_lesson=best_lesson,
            original_score=original_metrics.learning_score, best_score=best_score,
            iterations=actual_iterations, edit_history=edit_history,
            iteration_history=iteration_history,
        )
