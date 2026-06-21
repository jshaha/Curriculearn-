"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { METRICS, METRIC_LABELS, type MetricId } from "./brain/types"

// Three.js must be client-only
const BrainCanvas = dynamic(
  () => import("./brain/BrainCanvas").then((m) => ({ default: m.BrainCanvas })),
  { ssr: false, loading: () => <div className="h-full w-full bg-[#0b0c0f]" /> },
)

export function ClassBrainHero() {
  const [hovered, setHovered] = useState<MetricId | null>(null)

  return (
    /* Break out of the page's max-w container to span full viewport width */
    <div className="relative w-screen left-1/2 -translate-x-1/2 bg-[#0b0c0f]">
      {/* Brain canvas — 16:7 aspect gives a wide cinematic feel */}
      <div className="aspect-[16/7] w-full">
        <BrainCanvas hoveredMetricId={hovered} />
      </div>

      {/* Bottom label bar */}
      <div className="flex items-center justify-center gap-0 border-t border-white/8 py-4">
        {METRICS.map((id, idx) => (
          <div key={id} className="flex items-center">
            {idx > 0 && (
              <span className="mx-5 text-white/20 select-none text-sm">|</span>
            )}
            <button
              type="button"
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "font-mono text-[11px] tracking-[0.18em] uppercase transition-colors duration-200 select-none",
                hovered === id ? "text-white" : "text-white/40 hover:text-white/75",
              )}
            >
              {METRIC_LABELS[id]}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
