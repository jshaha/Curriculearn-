// API client for backend communication

export interface AnalysisMetrics {
  learning_score: number;
  engagement: number;
  cognitive_load: number;
  concept_flow: number;
  retention: number;
  novelty: number;
  information_density: number;
  reinforcement: number;
  multimodal_support: number;
}

export interface OptimizeResult {
  result_id: string;
  optimized_score: number;
  optimized_content?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = {
  async analyze(lessonId: string): Promise<AnalysisMetrics> {
    const response = await fetch(`${API_BASE}/analyze/${lessonId}`);
    if (!response.ok) throw new Error("Analysis failed");
    return response.json();
  },

  async optimize(lessonId: string): Promise<OptimizeResult> {
    const response = await fetch(`${API_BASE}/optimize/${lessonId}`, {
      method: "POST"
    });
    if (!response.ok) throw new Error("Optimization failed");
    return response.json();
  }
};
