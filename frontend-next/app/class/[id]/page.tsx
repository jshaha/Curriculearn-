"use client";

import { use } from "react";
import Link from "next/link";
import { BrainScene } from "@/three/BrainScene";
import { EdgeNav } from "@/components/EdgeNav";
import { sectionPageOrder } from "@/content/sections";
import type { SectionId } from "@/content/siteContent";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTransitionProvider } from "@/components/TransitionProvider";
import { useUIStore } from "@/lib/store";
import { preloadBrainSharedData } from "@/three/brainShared";

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
  const { isTransitioning, startSectionTransition } = useTransitionProvider();

  useEffect(() => {
    void preloadBrainSharedData();
    sectionPageOrder.forEach((sectionId) => {
      router.prefetch(`/${sectionId}`);
      prefetchedRoutesRef.current.add(sectionId);
    });
  }, [router]);

  const handleSectionSelect = (sectionId: SectionId) => {
    if (navigatingSectionId) {
      return;
    }

    startSectionTransition(sectionId);
    setHover(sectionId);
    setNavigatingSectionId(sectionId);
    void preloadBrainSharedData();

    navigationTimeoutRef.current = window.setTimeout(() => {
      router.push(`/${sectionId}`);
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
          navigationSectionId={navigatingSectionId}
          mobileMode={false}
        />
      </div>

      <div>
        <div className="absolute inset-x-0 top-0 z-30">
          <header className="mx-auto min-h-[72px] w-full max-w-[1440px] px-6 pt-6 sm:min-h-[80px] sm:px-10 sm:pt-8">
            <div className="flex w-full items-start justify-between">
              <Link
                href="/"
                className="font-mono text-[0.78rem] uppercase tracking-[0.24em] text-fg/82 transition-colors duration-150 hover:text-accent"
              >
                {className}
              </Link>
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
