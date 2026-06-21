"use client";

import { useState } from "react";
import type { AnalysisMetrics } from "@/lib/api";
import type { AccordionEntry } from "@/content/editorialTypes";
import { AccordionList } from "@/components/AccordionList";
import { api } from "@/lib/api";
import { updateDocument } from "@/lib/storage";
import { buildFallbackOptimizedMetrics, getScoreColor } from "@/lib/metrics";
import { MetricsComparison } from "@/components/MetricsComparison";

interface DocumentAccordionProps {
  metrics: AnalysisMetrics;
  optimizedMetrics?: AnalysisMetrics;
  filename: string;
  lessonId: string;
  documentId: string;
  classId: string;
  onOptimized?: (optimizedMetrics: AnalysisMetrics) => void;
}


const getScoreLabel = (score: number): string => {
  if (score >= 85) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Needs Work";
  return "Critical";
};

const getMetricIcon = (key: string): string => {
  const icons: Record<string, string> = {
    engagement: "🎯",
    cognitive_load: "🧠",
    concept_flow: "🔄",
    retention: "💾",
    information_density: "📊",
    reinforcement: "💪",
    multimodal_support: "🎨",
    novelty: "✨"
  };
  return icons[key] || "📌";
};

const transformMetricsToAccordion = (metrics: AnalysisMetrics): AccordionEntry[] => {
  const metricDefs = [
    {
      key: "engagement",
      icon: "🎯",
      role: "Engagement Analysis",
      org: "Student Interaction Metrics",
      value: metrics.engagement,
      description: "Measures how well the content captures and maintains student attention through interactive elements and compelling examples.",
      recommendations: [
        "- Add real-world examples that students can relate to",
        "- Include thought-provoking questions throughout the material",
        "- Incorporate interactive elements like quizzes or discussions",
        "- Use storytelling techniques to make concepts more memorable"
      ]
    },
    {
      key: "cognitive_load",
      icon: "🧠",
      role: "Cognitive Load Assessment",
      org: "Mental Processing Requirements",
      value: metrics.cognitive_load,
      description: "Evaluates the mental effort required to process and understand the content. Optimal load challenges students without overwhelming them.",
      recommendations: [
        "- Break complex concepts into smaller, digestible chunks",
        "- Add clear transitions between related topics",
        "- Use visual aids to reduce text-heavy explanations",
        "- Provide scaffolding for difficult concepts"
      ]
    },
    {
      key: "concept_flow",
      icon: "🔄",
      role: "Concept Flow Mapping",
      org: "Learning Progression Structure",
      value: metrics.concept_flow,
      description: "Analyzes how smoothly concepts build upon each other and how well the learning journey is structured.",
      recommendations: [
        "- Add transitional content between major topics",
        "- Explicitly reference previous concepts when introducing new ones",
        "- Create a clear narrative arc through the material",
        "- Use concept mapping to visualize relationships"
      ]
    },
    {
      key: "retention",
      icon: "💾",
      role: "Retention Optimization",
      org: "Long-term Memory Formation",
      value: metrics.retention,
      description: "Measures how well the content is structured to support long-term memory retention and recall.",
      recommendations: [
        "- Incorporate spaced repetition of key concepts",
        "- Add summary sections after major topics",
        "- Include retrieval practice opportunities",
        "- Use mnemonic devices for important information"
      ]
    },
    {
      key: "information_density",
      icon: "📊",
      role: "Information Density Balance",
      org: "Content Pacing Analysis",
      value: metrics.information_density,
      description: "Evaluates how densely information is packed and whether there's adequate breathing room for processing.",
      recommendations: [
        "- Add examples to illustrate dense concepts",
        "- Include practice exercises between theory sections",
        "- Use white space and visual breaks effectively",
        "- Balance detail with clarity"
      ]
    },
    {
      key: "reinforcement",
      icon: "💪",
      role: "Concept Reinforcement",
      org: "Practice & Application",
      value: metrics.reinforcement,
      description: "Assesses how well key concepts are reinforced through practice, examples, and application opportunities.",
      recommendations: [
        "- Add practice problems with varying difficulty",
        "- Include case studies that apply concepts",
        "- Provide worked examples before practice",
        "- Create opportunities for concept application"
      ]
    },
    {
      key: "multimodal_support",
      icon: "🎨",
      role: "Multimodal Learning Support",
      org: "Diverse Learning Pathways",
      value: metrics.multimodal_support,
      description: "Evaluates how well the content supports different learning styles through varied presentation modes.",
      recommendations: [
        "- Add diagrams and visual representations",
        "- Include audio or video supplements where appropriate",
        "- Provide both text and visual explanations",
        "- Support kinesthetic learning through hands-on activities"
      ]
    },
    {
      key: "novelty",
      icon: "✨",
      role: "Novelty & Connection",
      org: "New Concept Integration",
      value: metrics.novelty,
      description: "Measures the balance between introducing new ideas and connecting them to familiar concepts.",
      recommendations: [
        "- Use analogies to connect new concepts to known ones",
        "- Provide context before introducing novel ideas",
        "- Build bridges between familiar and unfamiliar territory",
        "- Scaffold learning from concrete to abstract"
      ]
    }
  ];

  return metricDefs.map(def => {
    const score = def.value;
    const shouldImprove = score < 70;
    const tags = [
      `Score: ${Math.round(score)}/100`,
      getScoreLabel(score),
      shouldImprove ? "Needs Attention" : "On Track"
    ];

    return {
      id: `metric-${def.key}`,
      role: `${def.icon} ${def.role}`,
      org: def.org,
      dates: `${Math.round(score)}/100`,
      tags,
      summary: def.description,
      body: shouldImprove ? ["This metric indicates room for improvement. Consider the following optimization strategies:"] : ["This metric is performing well. Continue these effective practices:"],
      sections: shouldImprove ? {
        whatIBuilt: def.recommendations
      } : undefined,
      media: {
        type: "placeholder" as const,
        alt: `${def.icon} ${def.role}`
      }
    };
  });
};

export const DocumentAccordion = ({
  metrics,
  optimizedMetrics,
  filename,
  lessonId,
  documentId,
  classId,
  onOptimized
}: DocumentAccordionProps): JSX.Element => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimizeError(null);

    try {
      updateDocument(classId, documentId, { status: "optimizing" });
      const result = await api.optimize(lessonId);

      // Use backend metrics if available, otherwise fallback
      const optimized = result.optimized_metrics
        ?? buildFallbackOptimizedMetrics(metrics, result.optimized_score);

      updateDocument(classId, documentId, {
        status: "optimized",
        optimizedMetrics: optimized,
        optimizationResultId: result.result_id,
      });

      onOptimized?.(optimized);
    } catch (error) {
      console.error("Optimization failed:", error);
      setOptimizeError(error instanceof Error ? error.message : "Optimization failed");
      updateDocument(classId, documentId, { status: "complete" });
    } finally {
      setIsOptimizing(false);
    }
  };

  const hasOptimized = !!optimizedMetrics;
  const accordionItems = transformMetricsToAccordion(optimizedMetrics ?? metrics);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 pb-20 sm:px-10">
      {/* Header Section */}
      <div className="mb-12 mt-10">
        <h2 className="mb-4 text-[2.5rem] font-bold tracking-[-0.03em] text-fg sm:text-[3rem]">
          Learning Analytics<span className="text-accent">.</span>
        </h2>
        <p className="max-w-[70ch] text-[1.1rem] leading-relaxed text-fg/70">
          Comprehensive analysis of educational content across eight neural metrics.
          Each dimension reveals opportunities for optimization.
        </p>
      </div>

      {optimizedMetrics ? (
        <>
          {/* Side-by-side comparison */}
          <div className="mb-14">
            <MetricsComparison
              originalMetrics={metrics}
              optimizedMetrics={optimizedMetrics}
              filename={filename}
            />
          </div>

          {/* Scroll Hint */}
          <div className="mb-8 text-center">
            <a
              href="#metrics"
              className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-fg/50 transition-colors hover:text-accent"
            >
              <span>↓</span>
              View Detailed Metrics
            </a>
          </div>

          {/* Accordion Section */}
          <div id="metrics" className="pt-4">
            <div className="mb-7">
              <h3 className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-fg/55">
                Neural Metric Breakdown
              </h3>
            </div>
            <AccordionList items={accordionItems} sectionKey="document-metrics" />
          </div>
        </>
      ) : (
        <>
          {/* Overall Score Card */}
          <div className="mb-14">
            <div className="relative overflow-hidden rounded-[22px] border border-fg/12 bg-gradient-to-br from-bg via-[#0d0e11] to-bg p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
              <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
                <div
                  className="h-full w-full"
                  style={{
                    background: `radial-gradient(circle at 30% 50%, ${getScoreColor(metrics.learning_score)}40 0%, transparent 50%)`,
                  }}
                />
              </div>

              <div className="relative z-10 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.28em] text-fg/50">
                    Overall Learning Score
                  </div>
                  <div className="mb-5 flex items-baseline gap-4">
                    <div
                      className="font-mono text-[5.5rem] font-bold leading-none tracking-tight"
                      style={{ color: getScoreColor(metrics.learning_score) }}
                    >
                      {Math.round(metrics.learning_score)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="font-mono text-[1.1rem] font-medium text-fg/30">/ 100</div>
                    </div>
                  </div>
                  <div
                    className="inline-block rounded-sm px-4 py-2 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.2em]"
                    style={{
                      backgroundColor: `${getScoreColor(metrics.learning_score)}15`,
                      color: getScoreColor(metrics.learning_score),
                    }}
                  >
                    {getScoreLabel(metrics.learning_score)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Optimize Button */}
          <div className="mb-8">
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="group relative overflow-hidden rounded-sm border border-accent/30 bg-gradient-to-r from-accent/10 to-accent/5 px-8 py-4 font-mono text-[0.8rem] font-semibold uppercase tracking-[0.2em] text-accent transition-all duration-300 hover:border-accent/50 hover:from-accent/15 hover:to-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
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
            </button>
            {optimizeError && (
              <div className="mt-3 font-mono text-[0.7rem] text-red-500">
                Error: {optimizeError}
              </div>
            )}
          </div>

          {/* Scroll Hint */}
          <div className="mb-8 text-center">
            <a
              href="#metrics"
              className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-fg/50 transition-colors hover:text-accent"
            >
              <span>↓</span>
              View Detailed Metrics
            </a>
          </div>

          {/* Accordion Section */}
          <div id="metrics" className="pt-4">
            <div className="mb-7">
              <h3 className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-fg/55">
                Neural Metric Breakdown
              </h3>
            </div>
            <AccordionList items={accordionItems} sectionKey="document-metrics" />
          </div>
        </>
      )}
    </div>
  );
};
