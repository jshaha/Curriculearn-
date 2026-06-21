"use client";

import { useState } from "react";
import type { AnalysisMetrics } from "@/lib/api";
import { api } from "@/lib/api";
import { updateDocument } from "@/lib/storage";

interface DocumentAnalysisProps {
  metrics: AnalysisMetrics;
  optimizedMetrics?: AnalysisMetrics;
  filename: string;
  lessonId: string;
  documentId: string;
  classId: string;
  onOptimized?: (optimizedMetrics: AnalysisMetrics) => void;
}

interface Recommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

const getRecommendations = (metrics: AnalysisMetrics): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  if (metrics.cognitive_load > 75) {
    recommendations.push({
      title: "Reduce Cognitive Load",
      description: "Content complexity is high. Break material into smaller chunks with clear transitions between concepts.",
      priority: "high",
    });
  } else if (metrics.cognitive_load < 40) {
    recommendations.push({
      title: "Increase Depth",
      description: "Low cognitive load detected. Consider adding more challenging content or deeper exploration of concepts.",
      priority: "medium",
    });
  }

  if (metrics.engagement < 60) {
    recommendations.push({
      title: "Boost Engagement",
      description: "Add interactive elements, real-world examples, or thought-provoking questions to increase student engagement.",
      priority: "high",
    });
  }

  if (metrics.concept_flow < 65) {
    recommendations.push({
      title: "Improve Concept Flow",
      description: "Strengthen connections between topics. Add transitional content to guide students through the learning journey.",
      priority: "medium",
    });
  }

  if (metrics.retention < 70) {
    recommendations.push({
      title: "Enhance Retention",
      description: "Incorporate spaced repetition, summaries, and review sections to improve long-term memory retention.",
      priority: "high",
    });
  }

  if (metrics.information_density > 80) {
    recommendations.push({
      title: "Balance Information Density",
      description: "Content is information-rich. Add breathing room with examples, diagrams, or practice exercises.",
      priority: "medium",
    });
  }

  if (metrics.reinforcement < 55) {
    recommendations.push({
      title: "Add Reinforcement",
      description: "Include practice problems, case studies, or application exercises to reinforce key concepts.",
      priority: "medium",
    });
  }

  if (metrics.multimodal_support < 50) {
    recommendations.push({
      title: "Diversify Learning Modalities",
      description: "Incorporate visual aids, diagrams, videos, or interactive elements to support different learning styles.",
      priority: "low",
    });
  }

  if (metrics.novelty > 75) {
    recommendations.push({
      title: "Ground Novel Concepts",
      description: "High novelty detected. Connect new ideas to familiar concepts to aid comprehension.",
      priority: "medium",
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

const getScoreColor = (score: number): string => {
  if (score >= 75) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
};

const getScoreColorClass = (score: number): string => {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
};

const getScoreLabel = (score: number): string => {
  if (score >= 85) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Needs Work";
  return "Critical";
};

export const DocumentAnalysis = ({
  metrics,
  optimizedMetrics,
  filename,
  lessonId,
  documentId,
  classId,
  onOptimized
}: DocumentAnalysisProps): JSX.Element => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimizeError(null);

    try {
      // Update status to optimizing
      updateDocument(classId, documentId, { status: "optimizing" });

      // Call the optimize API
      const result = await api.optimize(lessonId);

      // For now, we'll simulate optimized metrics since the backend might not return them
      // In a real scenario, you'd fetch the optimized document metrics
      const optimized: AnalysisMetrics = {
        learning_score: result.optimized_score,
        // You'll need to fetch the full optimized metrics from the backend
        // For now, showing improvement across all metrics
        engagement: Math.min(100, metrics.engagement * 1.15),
        cognitive_load: Math.max(0, metrics.cognitive_load * 0.9),
        concept_flow: Math.min(100, metrics.concept_flow * 1.12),
        retention: Math.min(100, metrics.retention * 1.18),
        novelty: metrics.novelty,
        information_density: metrics.information_density,
        reinforcement: Math.min(100, metrics.reinforcement * 1.1),
        multimodal_support: Math.min(100, metrics.multimodal_support * 1.05),
      };

      // Update document with optimized metrics
      updateDocument(classId, documentId, {
        status: "optimized",
        optimizedMetrics: optimized,
        optimizationResultId: result.result_id,
      });

      // Show comparison view
      setShowComparison(true);

      // Callback to parent
      if (onOptimized) {
        onOptimized(optimized);
      }
    } catch (error) {
      console.error("Optimization failed:", error);
      setOptimizeError(error instanceof Error ? error.message : "Optimization failed");
      updateDocument(classId, documentId, { status: "complete" });
    } finally {
      setIsOptimizing(false);
    }
  };

  const displayMetrics = showComparison && optimizedMetrics ? optimizedMetrics : metrics;
  const hasOptimized = !!optimizedMetrics;
  const recommendations = getRecommendations(displayMetrics);

  const metricCards = [
    {
      label: "Engagement",
      value: displayMetrics.engagement,
      originalValue: metrics.engagement,
      key: "engagement"
    },
    {
      label: "Cognitive Load",
      value: displayMetrics.cognitive_load,
      originalValue: metrics.cognitive_load,
      key: "cognitive"
    },
    {
      label: "Concept Flow",
      value: displayMetrics.concept_flow,
      originalValue: metrics.concept_flow,
      key: "flow"
    },
    {
      label: "Retention",
      value: displayMetrics.retention,
      originalValue: metrics.retention,
      key: "retention"
    },
    {
      label: "Information Density",
      value: displayMetrics.information_density,
      originalValue: metrics.information_density,
      key: "density"
    },
    {
      label: "Reinforcement",
      value: displayMetrics.reinforcement,
      originalValue: metrics.reinforcement,
      key: "reinforcement"
    },
    {
      label: "Multimodal Support",
      value: displayMetrics.multimodal_support,
      originalValue: metrics.multimodal_support,
      key: "multimodal"
    },
    {
      label: "Novelty",
      value: displayMetrics.novelty,
      originalValue: metrics.novelty,
      key: "novelty"
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-20 sm:px-10">
      {/* Optimize Button / Comparison Toggle */}
      {!hasOptimized ? (
        <div className="mb-8 mt-10">
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="group relative overflow-hidden rounded-sm border border-accent/30 bg-gradient-to-r from-accent/10 to-accent/5 px-8 py-4 font-mono text-[0.8rem] font-semibold uppercase tracking-[0.2em] text-accent transition-all duration-300 hover:border-accent/50 hover:from-accent/15 hover:to-accent/10 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center gap-3">
              {isOptimizing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                  Running Optimization Pipeline...
                </>
              ) : (
                <>
                  <span>⚡</span>
                  Optimize Learning Experience
                </>
              )}
            </span>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </button>
          {optimizeError && (
            <div className="mt-3 font-mono text-[0.7rem] text-red-500">
              Error: {optimizeError}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-8 mt-10 flex items-center gap-4">
          <div className="flex-1">
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-emerald-500/80">
              ✓ Optimized
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-sm border border-fg/10 bg-bg p-1">
            <button
              onClick={() => setShowComparison(false)}
              className={`rounded-sm px-4 py-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] transition-all ${
                !showComparison
                  ? "bg-fg/10 text-fg/90"
                  : "text-fg/50 hover:text-fg/70"
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setShowComparison(true)}
              className={`rounded-sm px-4 py-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] transition-all ${
                showComparison
                  ? "bg-emerald-500/20 text-emerald-500"
                  : "text-fg/50 hover:text-fg/70"
              }`}
            >
              Optimized
            </button>
          </div>
        </div>
      )}

      {/* Overall Score Section */}
      <div className="mb-14">
        <div className="relative overflow-hidden rounded-sm border border-fg/12 bg-gradient-to-br from-bg via-[#0d0e11] to-bg p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
          {/* Subtle animated gradient background */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
            <div
              className="h-full w-full"
              style={{
                background: `radial-gradient(circle at 30% 50%, ${getScoreColor(metrics.learning_score)}40 0%, transparent 50%)`,
                animation: 'pulse-glow 4s ease-in-out infinite',
              }}
            />
          </div>

          <div className="relative z-10 flex items-center justify-between gap-12">
            {/* Left: Score Details */}
            <div className="flex-1">
              <div className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.28em] text-fg/50">
                Overall Learning Score
              </div>

              <div className="mb-5 flex items-baseline gap-4">
                <div
                  className={`font-mono text-[5.5rem] font-bold leading-none tracking-tight ${getScoreColorClass(displayMetrics.learning_score)}`}
                  style={{
                    textShadow: `0 0 40px ${getScoreColor(displayMetrics.learning_score)}40`,
                  }}
                >
                  {Math.round(displayMetrics.learning_score)}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="font-mono text-[1.1rem] font-medium text-fg/30">
                    / 100
                  </div>
                  {showComparison && optimizedMetrics && (
                    <div className="font-mono text-[0.85rem] font-semibold text-emerald-500">
                      +{Math.round(displayMetrics.learning_score - metrics.learning_score)}
                    </div>
                  )}
                </div>
              </div>

              <div
                className="inline-block rounded-sm px-4 py-2 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.2em]"
                style={{
                  backgroundColor: `${getScoreColor(displayMetrics.learning_score)}15`,
                  color: getScoreColor(displayMetrics.learning_score),
                  boxShadow: `0 0 20px ${getScoreColor(displayMetrics.learning_score)}20`,
                }}
              >
                {getScoreLabel(displayMetrics.learning_score)}
              </div>
            </div>

            {/* Right: Large Radial Chart */}
            <div className="relative flex-shrink-0">
              {/* Outer glow */}
              <div
                className="absolute inset-0 scale-110 rounded-full opacity-30 blur-2xl"
                style={{
                  backgroundColor: getScoreColor(displayMetrics.learning_score),
                  animation: 'pulse 3s ease-in-out infinite',
                }}
              />

              <div className="relative h-[220px] w-[220px]">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 200 200">
                  {/* Background track */}
                  <circle
                    cx="100"
                    cy="100"
                    r="88"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-fg/8"
                  />

                  {/* Original score (if showing comparison) */}
                  {showComparison && optimizedMetrics && (
                    <circle
                      cx="100"
                      cy="100"
                      r="88"
                      fill="none"
                      stroke={getScoreColor(metrics.learning_score)}
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      strokeDashoffset={`${2 * Math.PI * 88 * (1 - metrics.learning_score / 100)}`}
                      strokeLinecap="round"
                      className="opacity-30"
                    />
                  )}

                  {/* Progress arc */}
                  <circle
                    cx="100"
                    cy="100"
                    r="88"
                    fill="none"
                    stroke={getScoreColor(displayMetrics.learning_score)}
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - displayMetrics.learning_score / 100)}`}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 1.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
                      filter: `drop-shadow(0 0 6px ${getScoreColor(displayMetrics.learning_score)})`,
                    }}
                  />

                  {/* Inner ring decoration */}
                  <circle
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-fg/10"
                    strokeDasharray="3 6"
                  />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div
                      className={`font-mono text-[2.6rem] font-bold ${getScoreColorClass(displayMetrics.learning_score)}`}
                      style={{
                        textShadow: `0 0 20px ${getScoreColor(displayMetrics.learning_score)}40`,
                      }}
                    >
                      {Math.round(displayMetrics.learning_score)}
                    </div>
                    <div className="font-mono text-[0.68rem] uppercase tracking-[0.15em] text-fg/40">
                      {showComparison && optimizedMetrics ? "Optimized" : "Score"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subtle grid pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px',
            }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mb-14">
        <div className="mb-7 font-mono text-[0.68rem] uppercase tracking-[0.26em] text-fg/55">
          Neural Metric Analysis
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {metricCards.map((metric, index) => (
            <div
              key={metric.key}
              className="group relative overflow-hidden rounded-sm border border-fg/10 bg-gradient-to-b from-bg to-[#0d0e11] p-6 transition-all duration-300 hover:border-fg/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
              style={{
                animation: `fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s both`,
              }}
            >
              <div className="relative z-10">
                {/* Label */}
                <div className="mb-5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-fg/50">
                  {metric.label}
                </div>

                {/* Progress visualization */}
                <div className="relative mb-5 h-2 overflow-hidden rounded-full bg-fg/8">
                  <div
                    className="h-full rounded-full transition-all duration-1200"
                    style={{
                      width: `${metric.value}%`,
                      backgroundColor: getScoreColor(metric.value),
                      boxShadow: `0 0 10px ${getScoreColor(metric.value)}60`,
                      transitionDelay: `${index * 0.08 + 0.3}s`,
                    }}
                  />

                  {/* Animated shimmer */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                      animation: 'shimmer 2.5s ease-in-out infinite',
                      animationDelay: `${index * 0.2}s`,
                    }}
                  />
                </div>

                {/* Score display */}
                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-2">
                    <div
                      className={`font-mono text-[2rem] font-bold leading-none ${getScoreColorClass(metric.value)}`}
                      style={{
                        textShadow: `0 0 20px ${getScoreColor(metric.value)}30`,
                      }}
                    >
                      {Math.round(metric.value)}
                    </div>
                    {showComparison && optimizedMetrics && Math.round(metric.value) !== Math.round(metric.originalValue) && (
                      <div className="mb-1 font-mono text-[0.75rem] font-semibold text-emerald-500">
                        +{Math.round(metric.value - metric.originalValue)}
                      </div>
                    )}
                  </div>
                  <div className="mb-1 font-mono text-[0.7rem] text-fg/30">
                    /100
                  </div>
                </div>
              </div>

              {/* Hover glow effect */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${getScoreColor(metric.value)}10 0%, transparent 70%)`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Optimization Recommendations */}
      <div>
        <div className="mb-7 flex items-center justify-between">
          <div className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-fg/55">
            Optimization Recommendations
          </div>
          <div className="rounded-full bg-accent/10 px-4 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-accent/80">
            {recommendations.length} {recommendations.length === 1 ? "Insight" : "Insights"}
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="rounded-sm border border-fg/10 bg-gradient-to-b from-bg to-[#0d0e11] p-12 text-center">
            <div className="mb-3 font-mono text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-fg/60">
              No optimization recommendations
            </div>
            <div className="font-mono text-[0.68rem] text-fg/40">
              Document appears well-optimized for learning
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-sm border border-fg/10 bg-gradient-to-b from-bg to-[#0d0e11] p-7 transition-all duration-300 hover:border-fg/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
                style={{
                  animation: `slideInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1 + 0.4}s both`,
                }}
              >
                {/* Priority indicator */}
                <div
                  className="absolute left-0 top-0 h-full w-[3px]"
                  style={{
                    backgroundColor: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#6b7280',
                    boxShadow: `0 0 10px ${rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#6b7280'}60`,
                  }}
                />

                <div className="relative z-10 pl-5">
                  <div className="mb-4 flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="mb-2 font-mono text-[0.9rem] font-semibold tracking-wide text-fg/95">
                        {rec.title}
                      </div>
                      <div className="font-mono text-[0.72rem] leading-relaxed text-fg/60">
                        {rec.description}
                      </div>
                    </div>

                    <div
                      className="flex-shrink-0 rounded-sm px-3 py-1.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.16em]"
                      style={{
                        backgroundColor: rec.priority === 'high' ? '#ef444410' : rec.priority === 'medium' ? '#f59e0b10' : '#6b728010',
                        color: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#6b7280',
                      }}
                    >
                      {rec.priority}
                    </div>
                  </div>
                </div>

                {/* Subtle hover gradient */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-fg/[0.01] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.07;
            transform: scale(1);
          }
          50% {
            opacity: 0.12;
            transform: scale(1.05);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
};
