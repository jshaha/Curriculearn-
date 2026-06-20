"""Learning-score objective used consistently by simulator adapters and Agent 6."""

from .schemas import MetricScores


def compute_learning_score(metrics: MetricScores) -> float:
    """Return the normalized curriculum objective score (0--100)."""
    return round(
        0.35 * metrics.engagement
        + 0.30 * (100 - metrics.cognitive_load)
        + 0.20 * metrics.concept_flow
        + 0.10 * metrics.reinforcement
        + 0.05 * metrics.multimodal_support,
        2,
    )
