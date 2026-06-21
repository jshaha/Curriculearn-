"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { Brain, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePlanner } from "@/components/planner-provider"
import { fetchBrainActivation } from "@/lib/api-client"
import type { BrainRegionActivation, Lesson } from "@/lib/planner-data"
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
const PLACEHOLDER_INTENSITY = 0.65

function placeholderRegions(regions: string[]): BrainRegionActivation[] {
  return regions.map((region) => ({ region, intensity: PLACEHOLDER_INTENSITY }))
}

export function BrainActivation({
  lesson,
  classId,
}: {
  lesson: Lesson
  classId: string
}) {
  const { setBrainStatus, applyBrainActivation } = usePlanner()
  const [fetchError, setFetchError] = useState(false)

  const status = lesson.brainStatus ?? "idle"
  const data = lesson.brainActivation

  // Use real API data if available, otherwise fall back to the lesson's
  // plain brainRegions list at a uniform placeholder intensity.
  const displayRegions: BrainRegionActivation[] =
    data?.regions ?? placeholderRegions(lesson.brainRegions)

  const isPlaceholder = !data

  async function runFetch() {
    setFetchError(false)
    setBrainStatus(lesson.id, "loading")
    try {
      const result = await fetchBrainActivation({
        lessonId: lesson.id,
        classId,
        date: lesson.date,
        title: lesson.title,
        summary: lesson.summary,
        objectives: lesson.objectives,
        materials: lesson.materials,
      })
      applyBrainActivation(lesson.id, result)
    } catch {
      setBrainStatus(lesson.id, "error")
      setFetchError(true)
    }
  }

  const sortedRegions = [...displayRegions].sort((a, b) => b.intensity - a.intensity)

  return (
    <section aria-label="Brain activation map">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Brain className="h-3.5 w-3.5 text-primary" />
          Brain activation
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground"
          onClick={runFetch}
          disabled={status === "loading"}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", status === "loading" && "animate-spin")}
          />
          {data ? "Refresh" : "Generate"}
        </Button>
      </div>

      {/* 3-D brain canvas */}
      <div className="overflow-hidden rounded-xl border border-indigo-950/60 bg-[#09080f] relative">

        {/* Source badge */}
        <span className="absolute right-3 top-3 z-10 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300 backdrop-blur">
          {isPlaceholder
            ? "Preview regions"
            : data?.source === "tribe"
              ? "Tribe V2 data"
              : "Preview data"}
        </span>

        {/* Loading overlay — sits above the (already-rendered) canvas */}
        {status === "loading" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#09080f]/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <Brain className="h-5 w-5 animate-pulse text-indigo-400" />
              <p className="text-xs text-indigo-300">
                Pulling Tribe V2 readings…
              </p>
            </div>
          </div>
        )}

        {/* The 3-D canvas — always rendered so Three.js stays mounted */}
        <div className="aspect-video w-full">
          {displayRegions.length > 0 ? (
            <BrainMap3D
              data={displayRegions}
              highlightThreshold={HIGHLIGHT_THRESHOLD}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 py-12">
              <Brain className="h-6 w-6 text-indigo-800" />
              <p className="text-xs text-indigo-600">
                No regions mapped yet — edit the lesson to add some.
              </p>
            </div>
          )}
        </div>

        {/* Error banner */}
        {fetchError && (
          <div className="flex items-center gap-1.5 border-t border-indigo-950/60 bg-red-950/40 px-3 py-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
            <p className="text-[11px] text-red-300">
              Couldn&apos;t reach the brain-activation service.
            </p>
          </div>
        )}

        {/* Region list */}
        {sortedRegions.length > 0 && (
          <div className="border-t border-indigo-950/60 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-indigo-500">
              {isPlaceholder ? "Regions for this lesson" : "Most activated regions"}
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {sortedRegions.slice(0, 4).map((r) => (
                <li key={r.region} className="flex items-center gap-2">
                  <span className="w-32 shrink-0 truncate text-xs font-medium text-indigo-200">
                    {r.region}
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-indigo-950">
                    <span
                      className="block h-full rounded-full bg-violet-500 transition-all duration-700"
                      style={{ width: `${Math.round(r.intensity * 100)}%` }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right text-[11px] text-indigo-400">
                    {Math.round(r.intensity * 100)}%
                  </span>
                </li>
              ))}
            </ul>
            {isPlaceholder && (
              <p className="mt-2 text-[11px] text-indigo-600">
                Hit Generate to pull real Tribe V2 readings.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
