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
  lesson_id: string;
  original_score: number;
  optimized_score: number;
  improvement: number;
  iterations: number;
}

export interface UploadResult {
  lesson_id: string;
  title: string;
  segments_count: number;
  message: string;
}

export interface AnalyzeResult {
  lesson_id: string;
  metrics: AnalysisMetrics;
  issues: any[];
  message: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export const api = {
  async upload(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) throw new Error("Upload failed");
    return response.json();
  },
  async analyze(lessonId: string): Promise<AnalyzeResult> {
    const response = await fetch(`${API_BASE}/api/analyze/${lessonId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    if (!response.ok) throw new Error("Analysis failed");
    return response.json();
  },

  async optimize(lessonId: string): Promise<OptimizeResult> {
    const response = await fetch(`${API_BASE}/api/optimize/${lessonId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Optimization failed: ${response.status} - ${errorText}`);
    }
    return response.json();
  }
};
