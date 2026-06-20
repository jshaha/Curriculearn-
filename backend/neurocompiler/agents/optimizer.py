"""Agent 6: bounded search across edited lesson candidates."""

from neurocompiler.adapters.simulator import SimulatorProtocol
from neurocompiler.agents.curriculum_editor import CurriculumEditor
from neurocompiler.agents.diagnostician import EducationalDiagnostician
from neurocompiler.schemas import OptimizationResult, StructuredLesson


class LessonOptimizer:
    def __init__(self, diagnostician=None, editor=None):
        self.diagnostician = diagnostician or EducationalDiagnostician()
        self.editor = editor or CurriculumEditor()

    def optimize(self, lesson: StructuredLesson, simulator: SimulatorProtocol,
                 max_iterations: int = 2, max_candidates: int = 3) -> OptimizationResult:
        original_metrics = simulator.simulate(lesson)
        current_lesson, current_metrics = lesson, original_metrics
        best_lesson, best_score = lesson, original_metrics.learning_score
        edit_history = []
        actual_iterations = 0

        for _ in range(max_iterations):
            diagnoses = self.diagnostician.diagnose(current_lesson, current_metrics)
            if not diagnoses.diagnoses:
                break
            candidates = self.editor.generate_candidates(current_lesson, diagnoses, max_candidates)
            if not candidates:
                break
            actual_iterations += 1
            round_winner = None
            round_score = best_score
            for candidate in candidates:
                candidate_score = simulator.simulate(candidate.lesson).learning_score
                if candidate_score > round_score:
                    round_winner, round_score = candidate, candidate_score
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
        )
