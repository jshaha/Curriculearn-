"use client";

import { use } from "react";
import Link from "next/link";
import { BrainScene } from "@/three/BrainScene";
import { EdgeNav } from "@/components/EdgeNav";
import { MaterialUpload } from "@/components/MaterialUpload";
import { CurriculumScore } from "@/components/CurriculumScore";
import { sectionPageOrder } from "@/content/sections";
import type { SectionId } from "@/content/siteContent";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTransitionProvider } from "@/components/TransitionProvider";
import { useUIStore } from "@/lib/store";
import { preloadBrainSharedData } from "@/three/brainShared";
import { logNavigationEvent } from "@/lib/webgl-diagnostics";

const CLASS_NAMES: Record<string, string> = {
  "1": "Cognitive Science",
  "2": "AP Psychology",
  "3": "Neuroscience Lab",
  "4": "Behavioral Economics",
  "5": "Memory & Learning",
  "6": "Advanced Psychology",
};

export default function ClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const className = CLASS_NAMES[id] || "Class";
  const router = useRouter();
  const navigationTimeoutRef = useRef<number | null>(null);
  const prefetchedRoutesRef = useRef<Set<SectionId>>(new Set());
  const [navigatingSectionId, setNavigatingSectionId] = useState<SectionId | null>(null);

  const hoveredSectionId = useUIStore((state) => state.hoveredSectionId);
  const setHover = useUIStore((state) => state.setHover);
  const { isTransitioning, startSectionTransition, clearSectionTransition } = useTransitionProvider();

  useEffect(() => {
    console.log(`[ClassPage] MOUNTED for class ${id}`);
    void preloadBrainSharedData();

    // Clear any lingering transition state when returning to class page
    clearSectionTransition();
    setNavigatingSectionId(null);
  }, [id, clearSectionTransition]);

  useEffect(() => {
    return () => {
      console.log(`[ClassPage] UNMOUNTED for class ${id}`);
    };
  }, [id]);

  const handleSectionSelect = (sectionId: SectionId) => {
    if (navigatingSectionId) {
      return;
    }

    logNavigationEvent(`class/${id}`, sectionId);
    startSectionTransition(sectionId);
    setHover(sectionId);
    setNavigatingSectionId(sectionId);
    void preloadBrainSharedData();

    navigationTimeoutRef.current = window.setTimeout(() => {
      router.push(`/${sectionId}?classId=${id}`);
    }, 70);
  };

  const handleHover = (sectionId: SectionId | null) => {
    setHover(sectionId);
    if (!sectionId || prefetchedRoutesRef.current.has(sectionId)) {
      return;
    }
    prefetchedRoutesRef.current.add(sectionId);
    router.prefetch(`/${sectionId}`);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-bg text-fg">
      <div
        className={`absolute inset-0 transition-opacity duration-100 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <BrainScene
          key={`class-${id}`}
          navigationSectionId={navigatingSectionId}
          mobileMode={false}
        />
      </div>

      <div>
        <div className="absolute inset-x-0 top-0 z-30">
          <header className="mx-auto min-h-[72px] w-full max-w-[1440px] px-6 pt-6 sm:min-h-[80px] sm:px-10 sm:pt-8">
            <div className="flex w-full items-start justify-between">
              <div className="flex flex-col gap-2">
                <Link
                  href="/"
                  className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-fg/60 transition-colors duration-150 hover:text-accent"
                >
                  ← Back to Home
                </Link>
                <div className="font-mono text-[0.78rem] uppercase tracking-[0.24em] text-fg/82">
                  {className}
                </div>
              </div>

              {/* Curriculum Score & Upload - Top Right */}
              <div className="flex flex-col items-center gap-4">
                <CurriculumScore classId={id} />
                <MaterialUpload
                  classId={id}
                  className={className}
                  onUploadComplete={(fileId, analysis) => {
                    console.log("Upload complete:", fileId, analysis);
                  }}
                />
              </div>
            </div>
          </header>
        </div>

        <EdgeNav
          hoveredSectionId={hoveredSectionId ?? navigatingSectionId}
          selectedSectionId={navigatingSectionId}
          onHover={handleHover}
          onSelect={handleSectionSelect}
        />
      </div>
    </main>
  );
}
