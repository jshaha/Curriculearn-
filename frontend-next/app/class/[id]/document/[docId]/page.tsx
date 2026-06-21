"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getDocument, type DocumentMetadata } from "@/lib/storage";
import { DocumentAnalysis } from "@/components/DocumentAnalysis";
import { SectionBrainHeader } from "@/three/SectionBrainHeader";
import { useScrollMotion } from "@/hooks/useScrollMotion";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useTransitionProvider } from "@/components/TransitionProvider";
import type { AnalysisMetrics } from "@/lib/api";

export default function DocumentPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id, docId } = use(params);
  const searchParams = useSearchParams();
  const [document, setDocument] = useState<DocumentMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const prefersReducedMotion = usePrefersReducedMotion();
  const { progress, velocity } = useScrollMotion(1600);
  const { clearSectionTransition } = useTransitionProvider();

  // Get section from URL params (default to learning if not specified)
  const sectionId = (searchParams.get("section") || "learning") as any;

  useEffect(() => {
    const doc = getDocument(id, docId);
    setDocument(doc);
    setIsLoading(false);
    clearSectionTransition();
  }, [id, docId, clearSectionTransition]);

  const handleOptimized = (optimizedMetrics: AnalysisMetrics) => {
    setDocument(prev => prev ? {
      ...prev,
      optimizedMetrics,
      status: "optimized"
    } : null);
  };

  if (isLoading) {
    return (
      <main className="flex h-screen items-center justify-center bg-bg text-fg">
        <div className="text-center">
          <div className="font-mono text-[0.8rem] uppercase tracking-[0.2em] text-fg/60">
            Loading...
          </div>
        </div>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="flex h-screen items-center justify-center bg-bg text-fg">
        <div className="text-center">
          <div className="font-mono text-[0.8rem] uppercase tracking-[0.2em] text-fg/60">
            Document not found
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Header */}
      <header className="mx-auto min-h-[72px] w-full max-w-[1440px] px-6 pt-6 sm:min-h-[80px] sm:px-10 sm:pt-8">
        <div className="flex w-full items-start justify-between">
          <div className="flex flex-col gap-2">
            <Link
              href={`/class/${id}`}
              className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-fg/60 transition-colors duration-150 hover:text-accent"
            >
              ← Back to Class
            </Link>
            <div className="font-mono text-[0.78rem] uppercase tracking-[0.24em] text-fg/82">
              {document.filename}
            </div>
          </div>

          {/* Overall score display */}
          {document.metrics && (
            <div className="text-right">
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-fg/40">
                Learning
              </div>
              <div className="mt-1 font-mono text-[1.1rem] font-medium text-accent">
                {Math.round(document.metrics.learning_score)}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Brain Hero */}
      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-10">
        <div className="mx-auto w-full max-w-[760px]">
          <div className="h-[260px] sm:h-[300px] lg:h-[340px]">
            <SectionBrainHeader
              sectionId={sectionId}
              scrollProgress={progress}
              scrollVelocity={velocity}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </div>
      </div>

      {/* Document Analysis */}
      {document.metrics ? (
        <DocumentAnalysis
          metrics={document.metrics}
          optimizedMetrics={document.optimizedMetrics}
          filename={document.filename}
          lessonId={document.lessonId}
          documentId={document.id}
          classId={id}
          diagnoses={document.diagnoses}
          onOptimized={handleOptimized}
        />
      ) : (
        <div className="mx-auto w-full max-w-[1440px] px-6 py-12 sm:px-10">
          <div className="text-center">
            <div className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-fg/50">
              No analysis data available
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
