"""Future integration boundary for a partner-hosted brain-model simulator."""

from neurocompiler.schemas import MetricReport, StructuredLesson


class ExternalSimulatorClient:
    """Placeholder for a service that evaluates newly edited lessons.

    A production adapter can serialize ``StructuredLesson`` to JSON, send it to a
    partner endpoint, and validate the returned ``MetricReport``. Keeping this
    boundary explicit avoids coupling Agents 4--6 to TRIBE or any specific model.
    """

    def __init__(self, endpoint_url: str):
        self.endpoint_url = endpoint_url

    def simulate(self, lesson: StructuredLesson) -> MetricReport:
        raise NotImplementedError(
            "External simulator integration is not implemented yet. "
            "Provide a partner service that returns a MetricReport for each lesson."
        )
