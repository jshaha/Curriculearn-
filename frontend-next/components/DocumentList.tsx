"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getDocuments, deleteDocument, type DocumentMetadata } from "@/lib/storage";
import type { AnalysisMetrics } from "@/lib/api";
import type { SectionId } from "@/content/siteContent";

interface DocumentListProps {
  classId: string;
  sectionId: SectionId;
}

// Map section IDs to metric keys
const SECTION_METRIC_MAP: Record<SectionId, keyof AnalysisMetrics> = {
  learning: "learning_score",
  cognitive: "cognitive_load",
  engagement: "engagement",
  flow: "concept_flow",
  retention: "retention",
};

export const DocumentList = ({ classId, sectionId }: DocumentListProps) => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadDocuments();

    // Listen for storage changes (when new documents are uploaded)
    const handleStorageChange = () => {
      loadDocuments();
    };

    // Listen for both cross-window and same-window storage changes
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("curriculearn-storage-change", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("curriculearn-storage-change", handleStorageChange);
    };
  }, [classId]);

  const loadDocuments = () => {
    const docs = getDocuments(classId);
    const completedDocs = docs.filter((doc) =>
      (doc.status === "complete" || doc.status === "optimized") && doc.metrics
    );

    // Sort by the metric for this section
    const metricKey = SECTION_METRIC_MAP[sectionId];
    const sortedDocs = completedDocs.sort((a, b) => {
      const aValue = a.metrics?.[metricKey] || 0;
      const bValue = b.metrics?.[metricKey] || 0;
      return bValue - aValue; // Descending order
    });

    setDocuments(sortedDocs);
  };

  const handleDelete = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteDocument(classId, docId);
      loadDocuments();
    }
  };

  if (!mounted) {
    return null;
  }

  if (documents.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-6 pb-24 pt-12 sm:px-10">
        <div className="mx-auto max-w-[760px]">
          <div className="rounded-sm border border-fg/10 bg-fg/[0.02] px-8 py-12 text-center">
            <div className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-fg/50">
              No materials uploaded yet
            </div>
            <div className="mt-2 text-[0.85rem] text-fg/70">
              Upload course materials from the class page to see optimization scores here.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const metricKey = SECTION_METRIC_MAP[sectionId];
  const metricLabels: Record<SectionId, string> = {
    learning: "Learning",
    cognitive: "Cognitive Load",
    engagement: "Engagement",
    flow: "Concept Flow",
    retention: "Retention",
  };
  const metricLabel = metricLabels[sectionId];

  // Calculate average score for this metric
  const avgScore = documents.length > 0
    ? Math.round(documents.reduce((sum, doc) => sum + (doc.metrics?.[metricKey] || 0), 0) / documents.length)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 pb-24 pt-12 sm:px-10">
      <div className="mx-auto max-w-[900px]">
        {/* Header with Average Score */}
        <div className="mb-8 flex items-end justify-between border-b border-fg/10 pb-6">
          <div>
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-fg/40">
              {metricLabel} Analysis
            </div>
            <div className="mt-1 font-mono text-[0.8rem] text-fg/60">
              {documents.length} document{documents.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-fg/40">
              Average
            </div>
            <div className={`font-mono text-2xl font-semibold ${getScoreColor(avgScore)}`}>
              {avgScore}
            </div>
          </div>
        </div>

        {/* Document Score Cards */}
        <div className="flex flex-col gap-3">
          {documents.map((doc, index) => {
            const score = doc.metrics?.[metricKey] || 0;
            const scorePercent = Math.round(score);

            return (
              <Link
                key={doc.id}
                href={`/class/${classId}/document/${doc.id}?section=${sectionId}`}
                className={cn(
                  "group relative flex items-center gap-6 overflow-hidden rounded-sm border border-fg/10 bg-bg px-6 py-5 transition-all duration-300",
                  "hover:border-fg/20 hover:bg-fg/[0.02] hover:shadow-lg hover:shadow-fg/5",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                  "animate-fade-in"
                )}
                style={{
                  ["--animation-delay" as string]: `${index * 50}ms`,
                }}
              >
                {/* Featured Score */}
                <div className="flex-shrink-0">
                  <div className={`font-mono text-3xl font-bold ${getScoreColor(scorePercent)}`}>
                    {scorePercent}
                  </div>
                  <div className="font-mono text-[0.55rem] uppercase tracking-[0.15em] text-fg/40">
                    / 100
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="truncate text-[0.85rem] font-medium text-fg/90 transition-colors group-hover:text-accent">
                      {doc.filename}
                    </div>
                    <div className="ml-4 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-fg/40">
                      {metricLabel}
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-fg/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getScoreBgColor(scorePercent)}`}
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="font-mono text-[0.6rem] text-fg/40">
                      Learning: {Math.round(doc.metrics?.learning_score || 0)}
                    </div>
                    <div className="font-mono text-[0.6rem] text-fg/40">
                      Engagement: {Math.round(doc.metrics?.engagement || 0)}
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, doc.id)}
                  className="flex-shrink-0 rounded-sm border border-fg/10 bg-bg p-2 opacity-0 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                  title="Delete document"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>

                {/* Hover indicator */}
                <div className="absolute bottom-0 left-0 h-px w-full bg-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
          animation-delay: var(--animation-delay, 0ms);
          opacity: 0;
        }
      `}</style>
    </div>
  );
};
