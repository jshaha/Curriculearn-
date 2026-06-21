export type MetricId =
  | "learning_score"
  | "cognitive_load"
  | "engagement"
  | "concept_flow"
  | "retention"

export const METRICS: MetricId[] = [
  "learning_score",
  "cognitive_load",
  "engagement",
  "concept_flow",
  "retention",
]

export const METRIC_LABELS: Record<MetricId, string> = {
  learning_score: "LEARNING SCORE",
  cognitive_load: "COGNITIVE LOAD",
  engagement: "ENGAGEMENT",
  concept_flow: "CONCEPT FLOW",
  retention: "RETENTION",
}
