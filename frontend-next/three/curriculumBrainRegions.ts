/**
 * Brain Region Mappings for Curriculum Analysis
 *
 * Maps educational cognitive functions to brain regions.
 * Each region lights up based on how the curriculum activates that cognitive function.
 */

export type CurriculumBrainRegion =
  | "reasoning"
  | "memory"
  | "language"
  | "visual"
  | "attention"
  | "emotion";

export interface BrainRegionData {
  id: CurriculumBrainRegion;
  label: string;
  function: string;
  description: string;
  position: [number, number, number]; // 3D coordinates on brain mesh
  metricMapping: string; // Which metric from our system maps to this
}

/**
 * Brain regions mapped to educational cognitive functions
 */
export const CURRICULUM_BRAIN_REGIONS: Record<CurriculumBrainRegion, BrainRegionData> = {
  reasoning: {
    id: "reasoning",
    label: "Prefrontal Cortex",
    function: "Reasoning & Problem Solving",
    description: "Activated when students process complex concepts and logic",
    position: [0.25, 0.35, 0.15],
    metricMapping: "cognitive_load"
  },

  memory: {
    id: "memory",
    label: "Hippocampus",
    function: "Memory Formation",
    description: "Active when information is being encoded and recalled",
    position: [-0.05, -0.15, -0.05],
    metricMapping: "retention"
  },

  language: {
    id: "language",
    label: "Language Centers",
    function: "Language Processing",
    description: "Processes reading, comprehension, and verbal concepts",
    position: [0.35, 0.05, 0.25],
    metricMapping: "concept_flow"
  },

  visual: {
    id: "visual",
    label: "Visual Cortex",
    function: "Visual Processing",
    description: "Activated by diagrams, charts, and visual learning",
    position: [-0.3, -0.25, -0.15],
    metricMapping: "multimodal_support"
  },

  attention: {
    id: "attention",
    label: "Parietal Lobe",
    function: "Attention & Focus",
    description: "Maintains focus and processes spatial information",
    position: [0.1, 0.25, -0.1],
    metricMapping: "engagement"
  },

  emotion: {
    id: "emotion",
    label: "Limbic System",
    function: "Emotional Response",
    description: "Emotional engagement and motivation",
    position: [0.0, 0.0, 0.0],
    metricMapping: "engagement"
  }
};

/**
 * Get color for brain region based on activation level
 */
export function getRegionColor(activation: number): string {
  // Red = overload (>85%)
  if (activation > 85) return '#FF006E';  // Magenta

  // Orange = high but manageable (70-85%)
  if (activation > 70) return '#FF6B35';  // Orange

  // Yellow = moderate (50-70%)
  if (activation > 50) return '#FFD23F';  // Yellow

  // Cyan = optimal (30-50%)
  if (activation > 30) return '#00F0FF';  // Electric Cyan

  // Purple = low/inactive (<30%)
  return '#6366F1';  // Purple
}

/**
 * Get brain region data from metrics
 */
export function mapMetricsToBrainRegions(metrics: any): Record<CurriculumBrainRegion, number> {
  return {
    reasoning: metrics.cognitive_load || 50,
    memory: metrics.retention || 50,
    language: metrics.concept_flow || 50,
    visual: metrics.multimodal_support || 30,
    attention: metrics.engagement || 50,
    emotion: metrics.engagement || 50
  };
}

/**
 * Get segments that activate this brain region
 */
export function getRegionSegments(
  regionId: CurriculumBrainRegion,
  problemSegments: any[]
): number[] {
  const region = CURRICULUM_BRAIN_REGIONS[regionId];

  // Find segments where this region's metric is problematic
  return problemSegments
    .filter(problem => {
      // Map problem types to regions
      if (regionId === 'reasoning' && problem.type === 'cognitive_overload') return true;
      if (regionId === 'memory' && problem.type === 'low_retention') return true;
      if (regionId === 'language' && problem.type === 'poor_concept_flow') return true;
      return false;
    })
    .map(problem => problem.segment_index);
}

/**
 * Get tooltip data for brain region
 */
export interface RegionTooltipData {
  label: string;
  function: string;
  activation: number;
  status: 'optimal' | 'moderate' | 'high' | 'overload';
  color: string;
  segments: number[];
  recommendation?: string;
}

export function getRegionTooltip(
  regionId: CurriculumBrainRegion,
  activation: number,
  segments: number[]
): RegionTooltipData {
  const region = CURRICULUM_BRAIN_REGIONS[regionId];

  let status: 'optimal' | 'moderate' | 'high' | 'overload';
  let recommendation: string | undefined;

  if (activation > 85) {
    status = 'overload';
    recommendation = `Reduce ${region.function.toLowerCase()} demands in these segments`;
  } else if (activation > 70) {
    status = 'high';
    recommendation = `Consider breaking down complex ${region.function.toLowerCase()} tasks`;
  } else if (activation > 50) {
    status = 'moderate';
  } else {
    status = 'optimal';
  }

  return {
    label: region.label,
    function: region.function,
    activation,
    status,
    color: getRegionColor(activation),
    segments,
    recommendation
  };
}
