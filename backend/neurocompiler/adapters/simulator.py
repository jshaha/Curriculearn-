from typing import Protocol

from neurocompiler.schemas import MetricReport, StructuredLesson


class SimulatorProtocol(Protocol):
    def simulate(self, lesson: StructuredLesson) -> MetricReport:
        """Evaluate a structured lesson and return global and per-segment metrics."""
        ...
