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

export interface Diagnosis {
  id: string;
  segment_id: string;
  issue_type: string;
  severity: "low" | "medium" | "high";
  explanation: string;
  recommended_actions: string[];
  priority: number;
  metric_evidence: Record<string, number>;
}

export interface OptimizeResult {
  result_id?: string;
  lesson_id?: string;
  original_score: number;
  optimized_score: number;
  improvement: number;
  iterations: number;
  // Optional full metrics from backend
  optimized_metrics?: AnalysisMetrics;
  original_metrics?: AnalysisMetrics;
}

// Parsed lesson content returned by the backend. The frontend owns this and
// passes it back on analyze/optimize, so the backend stays stateless.
export interface LessonContent {
  id: string;
  title: string;
  learning_goals: string[];
  segments: unknown[];
}

export interface UploadResult {
  title: string;
  content: LessonContent;
  segments_count: number;
}

export interface AnalyzeResult {
  metrics: AnalysisMetrics;
  issues: Diagnosis[];
}

// Render injects the backend host (e.g. "curriculearn-api.onrender.com") via
// `fromService`, which has no protocol — prepend https:// when one is missing.
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5001";
const WITH_PROTOCOL = /^https?:\/\//.test(RAW_API_BASE) ? RAW_API_BASE : `https://${RAW_API_BASE}`;
// Strip any trailing slash(es) so `${API_BASE}/api/upload` can't become a
// "//api/upload" double slash (which 404s and drops the CORS headers).
const API_BASE = WITH_PROTOCOL.replace(/\/+$/, "");

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

  async analyze(content: LessonContent): Promise<AnalyzeResult> {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ lesson: content })
    });
    if (!response.ok) throw new Error("Analysis failed");
    return response.json();
  },

  async optimize(content: LessonContent): Promise<OptimizeResult> {
    const response = await fetch(`${API_BASE}/api/optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ lesson: content })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Optimization failed: ${response.status} - ${errorText}`);
    }
    return response.json();
  }
};
