"""Agents 4--6: diagnosis, curriculum editing, and optimization."""

from .curriculum_editor import CurriculumEditor
from .diagnostician import EducationalDiagnostician
from .optimizer import LessonOptimizer

__all__ = ["CurriculumEditor", "EducationalDiagnostician", "LessonOptimizer"]
