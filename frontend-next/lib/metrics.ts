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

// Used only if the backend response lacks per-metric results. Carries the
// original metrics over unchanged (with the real optimized score) rather than
// estimating improvements the simulator never measured.
export function buildFallbackOptimizedMetrics(
  original: AnalysisMetrics,
  optimizedScore: number
): AnalysisMetrics {
  return { ...original, learning_score: optimizedScore };
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
