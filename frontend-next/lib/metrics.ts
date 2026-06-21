import type { AnalysisMetrics } from './api';

// Metric keys as const array for type-safe iteration
export const METRIC_KEYS = [
  'engagement',
  'cognitive_load',
  'concept_flow',
  'retention',
  'novelty',
  'information_density',
  'reinforcement',
  'multimodal_support',
] as const;

export type MetricKey = typeof METRIC_KEYS[number];

// Deterministic fallback when backend doesn't return full metrics
export function buildFallbackOptimizedMetrics(
  original: AnalysisMetrics,
  optimizedScore: number
): AnalysisMetrics {
  return {
    learning_score: optimizedScore,
    engagement: Math.min(100, Math.round(original.engagement * 1.15)),
    cognitive_load: Math.max(0, Math.round(original.cognitive_load * 0.9)),
    concept_flow: Math.min(100, Math.round(original.concept_flow * 1.12)),
    retention: Math.min(100, Math.round(original.retention * 1.18)),
    reinforcement: Math.min(100, Math.round(original.reinforcement * 1.1)),
    multimodal_support: Math.min(100, Math.round(original.multimodal_support * 1.05)),
    // Novelty: move toward optimal 65
    novelty: Math.round(original.novelty + (65 - original.novelty) * 0.3),
    // Information density: reduce if too high
    information_density:
      original.information_density > 80
        ? Math.round(original.information_density * 0.93)
        : original.information_density,
  };
}

// Delta calculation with improvement detection
export function calculateDelta(
  optimized: number,
  original: number,
  lowerIsBetter: boolean
): { delta: number; isImprovement: boolean; displayDelta: string } {
  const delta = optimized - original;
  const isImprovement = lowerIsBetter ? delta < 0 : delta > 0;
  const displayDelta = delta > 0 ? `+${Math.round(delta)}` : `${Math.round(delta)}`;
  return { delta, isImprovement, displayDelta };
}

// Get score color as hex
export function getScoreColor(score: number): string {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

// Get score color as Tailwind class
export function getScoreColorClass(score: number): string {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

// Metric metadata for UI
export const METRIC_METADATA: Record<
  MetricKey,
  {
    label: string;
    lowerIsBetter: boolean;
  }
> = {
  engagement: { label: 'Engagement', lowerIsBetter: false },
  cognitive_load: { label: 'Cognitive Load', lowerIsBetter: true },
  concept_flow: { label: 'Concept Flow', lowerIsBetter: false },
  retention: { label: 'Retention', lowerIsBetter: false },
  novelty: { label: 'Novelty', lowerIsBetter: false },
  information_density: { label: 'Information Density', lowerIsBetter: false },
  reinforcement: { label: 'Reinforcement', lowerIsBetter: false },
  multimodal_support: { label: 'Multimodal Support', lowerIsBetter: false },
};
