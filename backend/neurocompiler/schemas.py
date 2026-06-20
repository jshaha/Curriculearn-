"""Stable data contracts shared by the curriculum optimization agents."""

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class LessonSegment(BaseModel):
    id: str
    title: str
    content: str
    concepts: List[str] = Field(default_factory=list)
    modality: Literal["text", "slide", "audio", "video", "mixed"] = "text"
    start_time: Optional[float] = None
    end_time: Optional[float] = None


class StructuredLesson(BaseModel):
    id: str
    title: str
    learning_goals: List[str]
    target_audience: Optional[str] = None
    segments: List[LessonSegment]


class MetricScores(BaseModel):
    """All metrics are normalized to 0--100; higher is better except load/density."""

    engagement: float = Field(ge=0, le=100)
    cognitive_load: float = Field(ge=0, le=100)
    concept_flow: float = Field(ge=0, le=100)
    retention: float = Field(ge=0, le=100)
    novelty: float = Field(default=50, ge=0, le=100)
    information_density: float = Field(default=50, ge=0, le=100)
    reinforcement: float = Field(default=50, ge=0, le=100)
    multimodal_support: float = Field(default=50, ge=0, le=100)


class SegmentMetric(BaseModel):
    segment_id: str
    metrics: MetricScores
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    raw_embedding_path: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    warnings: List[str] = Field(default_factory=list)


class MetricReport(BaseModel):
    global_metrics: MetricScores
    learning_score: float = Field(ge=0, le=100)
    segment_metrics: List[SegmentMetric]
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    raw_output_path: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    warnings: List[str] = Field(default_factory=list)


class Diagnosis(BaseModel):
    id: str
    segment_id: str
    issue_type: Literal[
        "cognitive_overload",
        "poor_concept_flow",
        "low_retention",
        "low_multimodal_support",
        "novelty_spike",
    ]
    severity: Literal["low", "medium", "high"]
    explanation: str
    metric_evidence: Dict[str, float]
    recommended_actions: List[str]
    priority: int = Field(ge=1)


class DiagnosisReport(BaseModel):
    diagnoses: List[Diagnosis]
    warnings: List[str] = Field(default_factory=list)


class EditOperation(BaseModel):
    id: str
    target_segment_id: str
    action: str
    rationale: str
    new_segments: Optional[List[LessonSegment]] = None
    inserted_after_segment_id: Optional[str] = None
    source_diagnosis_id: Optional[str] = None
    expected_metric_impact: Dict[str, float] = Field(default_factory=dict)
    before_segment: Optional[LessonSegment] = None
    removed_segment_ids: List[str] = Field(default_factory=list)
    inserted_segment_ids: List[str] = Field(default_factory=list)


class EditPlan(BaseModel):
    edits: List[EditOperation]


class EditedLessonCandidate(BaseModel):
    candidate_id: str
    lesson: StructuredLesson
    edit_plan: EditPlan


class CandidateEvaluation(BaseModel):
    candidate_id: str
    edit_plan: EditPlan
    score: float = Field(ge=0, le=100)
    score_delta: float
    metric_report: MetricReport
    target_segment_id: Optional[str] = None
    target_segment_score_before: Optional[float] = None
    target_segment_score_after: Optional[float] = None
    target_segment_score_delta: Optional[float] = None


class OptimizationIteration(BaseModel):
    iteration: int = Field(ge=1)
    diagnoses: DiagnosisReport
    candidates: List[CandidateEvaluation]
    selected_candidate_id: Optional[str] = None


class OptimizationResult(BaseModel):
    original_lesson: StructuredLesson
    best_lesson: StructuredLesson
    original_score: float = Field(ge=0, le=100)
    best_score: float = Field(ge=0, le=100)
    iterations: int = Field(ge=0)
    edit_history: List[EditPlan]
    iteration_history: List[OptimizationIteration] = Field(default_factory=list)
    original_metrics: Optional[MetricReport] = None
    best_metrics: Optional[MetricReport] = None
