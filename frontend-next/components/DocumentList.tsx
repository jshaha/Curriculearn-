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

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [classId]);

  const loadDocuments = () => {
    const docs = getDocuments(classId);
    const completedDocs = docs.filter((doc) => doc.status === "complete" && doc.metrics);

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
  const metricLabel = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 pb-24 pt-12 sm:px-10">
      <div className="mx-auto max-w-[760px]">
        {/* Header */}
        <div className="mb-8 border-b border-fg/10 pb-4">
          <div className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-fg/50">
            Course Materials
          </div>
          <div className="mt-1 text-[0.85rem] text-fg/70">
            Sorted by {metricLabel} optimization score
          </div>
        </div>

        {/* Document Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {documents.map((doc, index) => {
            const score = doc.metrics?.[metricKey] || 0;
            const scorePercent = Math.round(score);

            return (
              <Link
                key={doc.id}
                href={`/class/${classId}/document/${doc.id}?section=${sectionId}`}
                className={cn(
                  "group relative overflow-hidden rounded-sm border border-fg/10 bg-bg p-6 transition-all duration-300",
                  "hover:border-fg/20 hover:bg-fg/[0.02] hover:shadow-lg hover:shadow-fg/5",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: "fadeIn 0.5s ease-out forwards",
                  opacity: 0,
                }}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, doc.id)}
                  className="absolute left-2 top-2 z-10 rounded-sm border border-fg/10 bg-bg p-1.5 opacity-0 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                  title="Delete document"
                >
                  <svg
                    className="h-3.5 w-3.5"
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

                {/* Score indicator */}
                <div className="absolute right-0 top-0 flex h-16 w-16 items-center justify-center">
                  <div className="relative">
                    {/* Background circle */}
                    <svg className="h-14 w-14 -rotate-90 transform">
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-fg/10"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 24}`}
                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - scorePercent / 100)}`}
                        className="text-accent transition-all duration-500 group-hover:text-accent/80"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-[0.7rem] font-medium text-fg/90">
                        {scorePercent}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document info */}
                <div className="pr-16">
                  <div className="mb-2 truncate text-[0.9rem] font-medium text-fg/90 transition-colors group-hover:text-accent">
                    {doc.filename}
                  </div>
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-fg/50">
                    {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Bottom metrics */}
                <div className="mt-4 flex gap-4 border-t border-fg/5 pt-4">
                  <div>
                    <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-fg/40">
                      Overall
                    </div>
                    <div className="mt-0.5 font-mono text-[0.75rem] text-fg/80">
                      {Math.round(doc.metrics?.learning_score || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-fg/40">
                      Engagement
                    </div>
                    <div className="mt-0.5 font-mono text-[0.75rem] text-fg/80">
                      {Math.round(doc.metrics?.engagement || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-fg/40">
                      Retention
                    </div>
                    <div className="mt-0.5 font-mono text-[0.75rem] text-fg/80">
                      {Math.round(doc.metrics?.retention || 0)}
                    </div>
                  </div>
                </div>

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
      `}</style>
    </div>
  );
};
