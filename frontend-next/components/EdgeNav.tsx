"use client";

import { Fragment } from "react";

import type { SectionId } from "@/content/siteContent";
import { sectionMeta } from "@/content/sections";
import { cn } from "@/lib/utils";

interface EdgeNavProps {
  hoveredSectionId: SectionId | null;
  selectedSectionId: SectionId | null;
  onHover: (sectionId: SectionId | null) => void;
  onSelect: (sectionId: SectionId) => void;
}

export const EdgeNav = ({
  hoveredSectionId,
  selectedSectionId,
  onHover,
  onSelect
}: EdgeNavProps): JSX.Element => {
  return (
    <nav
      className="pointer-events-none absolute inset-0 z-30 flex items-end justify-center pb-10"
      aria-label="Primary sections"
    >
      <div className="pointer-events-auto flex items-center">
        {sectionMeta.map((section, index) => {
          const isActive =
            hoveredSectionId === section.id || selectedSectionId === section.id;

          return (
            <Fragment key={section.id}>
              {index > 0 && (
                <div className="mx-8 h-3.5 w-px bg-white/30" aria-hidden="true" />
              )}
              <button
                type="button"
                aria-label={`Open ${section.title}`}
                className="relative px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.2em] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                onMouseEnter={() => onHover(section.id)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(section.id)}
                onBlur={() => onHover(null)}
                onClick={() => onSelect(section.id)}
              >
                <span className="relative inline-block px-0.5 py-0">
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
                      "relative z-10 transition-colors duration-300",
                      isActive ? "text-black" : "text-white"
                    )}
                  >
                    {section.title}
                  </span>
                </span>
              </button>
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
};
