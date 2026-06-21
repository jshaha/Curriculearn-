"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { EdgeNav } from "@/components/EdgeNav";
import { Header } from "@/components/Header";
import { useTransitionProvider } from "@/components/TransitionProvider";
import { sectionPageOrder, sectionPages } from "@/content/sections";
import { siteContent } from "@/content/siteContent";
import type { SectionId } from "@/content/siteContent";
import { usePrefersReducedMotion, useScrollActivity } from "@/lib/hooks";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BrainScene } from "@/three/BrainScene";
import { preloadBrainSharedData } from "@/three/brainShared";

export const HomeClient = (): JSX.Element => {
  const router = useRouter();
  const navigationTimeoutRef = useRef<number | null>(null);
  const prefetchedRoutesRef = useRef<Set<SectionId>>(new Set());
  const [navigatingSectionId, setNavigatingSectionId] = useState<SectionId | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [touchedSectionId, setTouchedSectionId] = useState<SectionId | null>(null);
  const [hoveredMenuSectionId, setHoveredMenuSectionId] = useState<SectionId | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const emailResetRef = useRef<number | null>(null);

  const hoveredSectionId = useUIStore((state) => state.hoveredSectionId);
  const setHover = useUIStore((state) => state.setHover);
  const setPrefersReducedMotion = useUIStore((state) => state.setPrefersReducedMotion);
  const setScrolling = useUIStore((state) => state.setScrolling);

  const prefersReducedMotion = usePrefersReducedMotion();
  const isScrolling = useScrollActivity(250);
  const { isTransitioning, startSectionTransition } = useTransitionProvider();

  useEffect(() => {
    setPrefersReducedMotion(prefersReducedMotion);
  }, [prefersReducedMotion, setPrefersReducedMotion]);

  useLayoutEffect(() => {
    setHover(null);
    setNavigatingSectionId(null);
  }, [setHover]);

  useEffect(() => {
    setScrolling(isScrolling);
  }, [isScrolling, setScrolling]);

  useEffect(() => {
    const mobileMedia = window.matchMedia("(max-width: 767px)");

    const update = () => {
      setIsMobileViewport(mobileMedia.matches);
    };

    update();
    mobileMedia.addEventListener("change", update);

    return () => {
      mobileMedia.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    void preloadBrainSharedData();
    sectionPageOrder.forEach((sectionId) => {
      router.prefetch(`/${sectionId}`);
      prefetchedRoutesRef.current.add(sectionId);
    });
  }, [router]);

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current !== null) {
        window.clearTimeout(navigationTimeoutRef.current);
      }
      if (emailResetRef.current !== null) {
        window.clearTimeout(emailResetRef.current);
      }
    };
  }, []);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(siteContent.siteConfig.links.email);
      setEmailCopied(true);
      if (emailResetRef.current !== null) window.clearTimeout(emailResetRef.current);
      emailResetRef.current = window.setTimeout(() => setEmailCopied(false), 1500);
    } catch {
      // silently fail
    }
  };

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

  const isMobileInteractionMode = isMobileViewport;

  if (isMobileViewport) {
    return (
      <main className="flex h-screen w-screen flex-col overflow-hidden bg-bg text-fg">
        {/* Top bar */}
        <div className="z-30 flex shrink-0 items-center justify-between pl-6 pr-4 pt-6 pb-2">
          <Link
            href="/"
            className="font-mono text-[0.78rem] uppercase tracking-[0.24em] text-fg/82 transition-colors duration-150 active:text-accent"
          >
            {siteContent.siteConfig.name}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-fg/72"
          >
            <span>Menu</span>
            <svg
              aria-hidden="true"
              width="16"
              height="11"
              viewBox="0 0 16 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <line x1="0" y1="1" x2="16" y2="1" />
              <line x1="0" y1="5.5" x2="16" y2="5.5" />
              <line x1="0" y1="10" x2="10" y2="10" />
            </svg>
          </button>
        </div>

        {/* Brain — centered in remaining space, constrained height */}
        <div
          className={`flex flex-1 items-center justify-center transition-opacity duration-100 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="h-[min(48vh,380px)] w-full">
            <BrainScene navigationSectionId={navigatingSectionId} mobileMode={true} />
          </div>
        </div>

        {/* Bottom center social links */}
        <div className="z-30 flex shrink-0 flex-col items-center gap-1.5 pb-9 pt-4">
          <div className="flex gap-5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-fg/46">
            <a
              href={siteContent.siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className="transition-colors duration-150 active:text-accent"
            >
              GitHub
            </a>
            <a
              href={siteContent.siteConfig.links.linkedin}
              target="_blank"
              rel="noreferrer"
              className="transition-colors duration-150 active:text-accent"
            >
              LinkedIn
            </a>
          </div>
          <button
            type="button"
            onClick={handleCopyEmail}
            className="group inline-flex items-center gap-1.5 font-mono text-[0.62rem] tracking-[0.08em] text-fg/46 transition-colors duration-150 active:text-accent"
          >
            <span>{emailCopied ? "Copied!" : "kazuh [at] berkeley [dot] edu"}</span>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="8.25" y="8.75" width="10.75" height="10.75" rx="2.6" />
              <path d="M6.4 14.15 5.45 7.65A2.25 2.25 0 0 1 7.67 5h7.5c1.04 0 1.96.68 2.24 1.68" />
              <path d="M16.4 6.55 18.55 8.65" />
            </svg>
          </button>
        </div>

        {/* Menu overlay */}
        {menuOpen && (
          <div className="absolute inset-0 z-50 flex flex-col bg-bg px-6 pb-10 pt-6">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.78rem] uppercase tracking-[0.24em] text-fg/82">
                {siteContent.siteConfig.name}
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-fg/72"
              >
                <span>Close</span>
                <span aria-hidden="true" className="text-[1.1rem] leading-none">×</span>
              </button>
            </div>

            {/* Section nav with sweep-on-tap */}
            <nav aria-label="Primary sections" className="mt-14 flex flex-col gap-2.5">
              {sectionPageOrder.map((sectionId) => {
                const isActive =
                  touchedSectionId === sectionId || navigatingSectionId === sectionId || hoveredMenuSectionId === sectionId;
                return (
                  <button
                    key={sectionId}
                    type="button"
                    className="text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/70"
                    onMouseEnter={() => setHoveredMenuSectionId(sectionId)}
                    onMouseLeave={() => setHoveredMenuSectionId(null)}
                    onTouchStart={() => setTouchedSectionId(sectionId)}
                    onTouchEnd={() => setTouchedSectionId(null)}
                    onClick={() => {
                      setMenuOpen(false);
                      handleSectionSelect(sectionId);
                    }}
                  >
                    <span className="relative inline-block px-0.5">
                      <span className="absolute inset-0 overflow-hidden" aria-hidden="true">
                        <span
                          className={cn(
                            "absolute inset-0 bg-accent transition-transform duration-300 ease-out",
                            isActive ? "translate-x-0" : "-translate-x-[110%]"
                          )}
                        />
                      </span>
                      <span
                        className={cn(
                          "relative z-10 font-mono text-[0.68rem] uppercase tracking-[0.2em] transition-colors duration-300",
                          isActive ? "text-black" : "text-fg/82"
                        )}
                      >
                        {sectionPages[sectionId].title}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Social links at bottom of menu */}
            <div className="mt-auto flex flex-col gap-2">
              <div className="flex gap-5 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-fg/56">
                <a
                  href={siteContent.siteConfig.links.github}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-150 active:text-accent"
                >
                  GitHub
                </a>
                <a
                  href={siteContent.siteConfig.links.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors duration-150 active:text-accent"
                >
                  LinkedIn
                </a>
              </div>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="group inline-flex items-center gap-1.5 font-mono text-[0.66rem] tracking-[0.08em] text-fg/56 transition-colors duration-150 active:text-accent"
              >
                <span>{emailCopied ? "Copied!" : "kazuh [at] berkeley [dot] edu"}</span>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="8.25" y="8.75" width="10.75" height="10.75" rx="2.6" />
                  <path d="M6.4 14.15 5.45 7.65A2.25 2.25 0 0 1 7.67 5h7.5c1.04 0 1.96.68 2.24 1.68" />
                  <path d="M16.4 6.55 18.55 8.65" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-bg text-fg">
      <div
        className={`absolute inset-0 transition-opacity duration-100 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <BrainScene
          navigationSectionId={navigatingSectionId}
          mobileMode={isMobileInteractionMode}
        />
      </div>

      <div>
        <Header />

        <EdgeNav
          hoveredSectionId={hoveredSectionId ?? navigatingSectionId}
          selectedSectionId={navigatingSectionId}
          onHover={handleHover}
          onSelect={handleSectionSelect}
        />
      </div>
    </main>
  );
};
