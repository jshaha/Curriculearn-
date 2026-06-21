"use client"

import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import { Brain, Sparkles, Loader2, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  BRAIN_REGIONS,
  CLASS_METRICS,
  type BrainRegionActivation,
  type ClassMetricKey,
} from "@/lib/planner-data"
import { cn } from "@/lib/utils"

// Three.js must be imported client-side only — dynamic import with ssr:false
const BrainMap3D = dynamic(
  () => import("./brain-map-3d").then((m) => ({ default: m.BrainMap3D })),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video w-full items-center justify-center">
        <Brain className="h-5 w-5 animate-pulse text-indigo-400" />
      </div>
    ),
  },
)

const HIGHLIGHT_THRESHOLD = 0.55

type MetricStyle = {
  text: string
  border: string
  bg: string
  dot: string
}

const METRIC_STYLES: Record<ClassMetricKey, MetricStyle> = {
  learning: { text: "text-chart-1", border: "border-chart-1", bg: "bg-chart-1/10", dot: "bg-chart-1" },
  engagement: { text: "text-chart-5", border: "border-chart-5", bg: "bg-chart-5/10", dot: "bg-chart-5" },
  focus: { text: "text-chart-2", border: "border-chart-2", bg: "bg-chart-2/10", dot: "bg-chart-2" },
  retention: { text: "text-chart-4", border: "border-chart-4", bg: "bg-chart-4/10", dot: "bg-chart-4" },
}

/** Tiny deterministic PRNG + hash so each class gets stable-but-different
 *  placeholder numbers instead of every class showing identical scores. */
function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return h
}
function seededRandom(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Demo placeholder scores. The backend will eventually compute these by
 * averaging real Tribe V2 readings across a class's lessons — for now we
 * seed a plausible-looking number per class so the UI has something real
 * to show and hover/optimize against.
 */
function placeholderScores(classId: string): Record<ClassMetricKey, number> {
  const rng = seededRandom(hashString(classId))
  const out = {} as Record<ClassMetricKey, number>
  for (const metric of CLASS_METRICS) {
    out[metric.key] = Math.round(52 + rng() * 28)
  }
  return out
}

export function ClassBrainOverview({ classId }: { classId: string }) {
  const [scores, setScores] = useState<Record<ClassMetricKey, number>>(() =>
    placeholderScores(classId),
  )
  const [hovered, setHovered] = useState<ClassMetricKey | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizedOnce, setOptimizedOnce] = useState(false)

  // Region intensities driving the 3-D brain: hovering a metric isolates
  // its associated regions; with nothing hovered, blend all four metrics
  // into a single "average brain state" view.
  const regionData: BrainRegionActivation[] = useMemo(() => {
    if (hovered) {
      const metric = CLASS_METRICS.find((m) => m.key === hovered)!
      return BRAIN_REGIONS.map((region) => ({
        region,
        intensity: metric.regions.includes(region)
          ? Math.max(0.78, scores[hovered] / 100)
          : 0.04,
      }))
    }
    const sums: Record<string, number[]> = {}
    for (const metric of CLASS_METRICS) {
      for (const region of metric.regions) {
        sums[region] = sums[region] ?? []
        sums[region].push(scores[metric.key] / 100)
      }
    }
    return BRAIN_REGIONS.map((region) => {
      const vals = sums[region]
      const avg = vals?.length
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : 0.1
      return { region, intensity: avg }
    })
  }, [hovered, scores])

  async function handleOptimize() {
    setOptimizing(true)
    try {
      // TODO: replace with a real call to the backend's optimize endpoint
      // once it's available — it should return updated metric scores
      // (and ideally updated per-lesson suggestions) for this class. This
      // simulates a plausible improvement so the flow can be demoed end
      // to end before that's wired up.
      await new Promise((resolve) => setTimeout(resolve, 1100))
      setScores((prev) => {
        const next = { ...prev }
        for (const metric of CLASS_METRICS) {
          const bump = 6 + Math.random() * 12
          next[metric.key] = Math.min(97, Math.round(prev[metric.key] + bump))
        }
        return next
      })
      setOptimizedOnce(true)
      toast.success("Lesson plans optimized — projected scores updated")
    } finally {
      setOptimizing(false)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Brain className="h-4.5 w-4.5 text-primary" />
            Class brain activity
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Averaged across this class&apos;s lessons. Hover a metric to see
            which regions drive it.
          </p>
        </div>
        <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
          Preview data — connect Tribe V2 for live readings
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
        {/* 3-D brain canvas */}
        <div className="overflow-hidden rounded-xl border border-indigo-950/60 bg-[#09080f]">
          <div className="aspect-video w-full">
            <BrainMap3D data={regionData} highlightThreshold={HIGHLIGHT_THRESHOLD} />
          </div>
        </div>

        {/* Metric list */}
        <div className="flex flex-col gap-2">
          {CLASS_METRICS.map((metric) => {
            const style = METRIC_STYLES[metric.key]
            const isHovered = hovered === metric.key
            return (
              <button
                key={metric.key}
                type="button"
                onMouseEnter={() => setHovered(metric.key)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(metric.key)}
                onBlur={() => setHovered(null)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition",
                  isHovered
                    ? cn(style.border, style.bg)
                    : "border-border bg-background hover:border-muted-foreground/30",
                )}
              >
                <span className="flex min-w-0 items-start gap-2">
                  <span
                    className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", style.dot)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {metric.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {metric.description}
                    </span>
                  </span>
                </span>
                <span className={cn("shrink-0 text-lg font-semibold tabular-nums", style.text)}>
                  {scores[metric.key]}
                </span>
              </button>
            )
          })}

          <Button
            onClick={handleOptimize}
            disabled={optimizing}
            className="mt-2 gap-2"
          >
            {optimizing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : optimizedOnce ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {optimizing
              ? "Optimizing…"
              : optimizedOnce
                ? "Optimize again"
                : "Optimize"}
          </Button>
          {optimizedOnce && !optimizing && (
            <p className="text-center text-[11px] text-muted-foreground">
              Scores above reflect the latest optimization pass.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
