"use client";

import { useEffect } from "react";
import type { SectionId } from "@/content/siteContent";
import { sectionPages } from "@/content/sections";
import { useScrollMotion } from "@/hooks/useScrollMotion";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { SectionBrainHeader } from "@/three/SectionBrainHeader";
import { DocumentList } from "@/components/DocumentList";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTransitionProvider } from "@/components/TransitionProvider";

interface SectionPageClientProps {
  sectionId: SectionId;
}

export const SectionPageClient = ({ sectionId }: SectionPageClientProps): JSX.Element => {
  const section = sectionPages[sectionId];
  const prefersReducedMotion = usePrefersReducedMotion();
  const { progress, velocity } = useScrollMotion(1600);
  const isAboutSection = section.id === "retention";
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId") || "1";
  const { clearSectionTransition } = useTransitionProvider();

  useEffect(() => {
    clearSectionTransition();
  }, [clearSectionTransition]);

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Header */}
      <header className="mx-auto min-h-[72px] w-full max-w-[1440px] px-6 pt-6 sm:min-h-[80px] sm:px-10 sm:pt-8">
        <div className="flex w-full items-start justify-between">
          <div className="flex flex-col gap-2">
            <Link
              href={`/class/${classId}`}
              className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-fg/60 transition-colors duration-150 hover:text-accent"
            >
              ← Back to Class
            </Link>
            <div className="font-mono text-[0.78rem] uppercase tracking-[0.24em] text-fg/82">
              {section.title}
            </div>
          </div>
        </div>
      </header>

      {/* Brain Hero */}
      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-10">
        <div
          className={`mx-auto w-full ${
            isAboutSection ? "max-w-[700px]" : "max-w-[760px]"
          }`}
        >
          <div
            className={
              isAboutSection
                ? "h-[280px] sm:h-[320px] lg:h-[360px]"
                : "h-[260px] sm:h-[300px] lg:h-[340px]"
            }
          >
            <SectionBrainHeader
              sectionId={section.id}
              scrollProgress={progress}
              scrollVelocity={velocity}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </div>
      </div>

      {/* Document List */}
      <DocumentList classId={classId} sectionId={sectionId} />
    </div>
  );
};
