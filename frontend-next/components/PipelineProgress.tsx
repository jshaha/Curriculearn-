"use client";

import { useEffect, useState } from "react";

export interface PipelineStage {
  label: string;
  // Seconds after start at which this stage is shown as active. The backend
  // runs as one request, so stages are paced from typical timings rather than
  // reported live; the last stage stays active until the request finishes.
  startsAt: number;
}

export const ANALYZE_STAGES: PipelineStage[] = [
  { label: "Parsing lesson into segments", startsAt: 0 },
  { label: "Simulating brain response per segment", startsAt: 4 },
  { label: "Scoring learning metrics", startsAt: 8 },
  { label: "Claude diagnosing weak spots", startsAt: 11 },
];

export const OPTIMIZE_STAGES: PipelineStage[] = [
  { label: "Re-simulating the original lesson", startsAt: 0 },
  { label: "Diagnosing the highest-impact issues", startsAt: 3 },
  { label: "Claude drafting candidate rewrites", startsAt: 30 },
  { label: "Re-simulating candidates and keeping the best", startsAt: 70 },
];

interface PipelineProgressProps {
  stages: PipelineStage[];
  note?: string;
}

export const PipelineProgress = ({ stages, note }: PipelineProgressProps): JSX.Element => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = window.setInterval(() => setElapsed((Date.now() - start) / 1000), 500);
    return () => window.clearInterval(timer);
  }, []);

  const activeIndex = stages.reduce((idx, stage, i) => (elapsed >= stage.startsAt ? i : idx), 0);

  return (
    <div className="rounded-lg border border-fg/12 bg-[#0d0e11]/90 p-5 backdrop-blur-xl">
      <ol className="space-y-2.5">
        {stages.map((stage, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={stage.label} className="flex items-center gap-3 font-mono text-[0.7rem]">
              {done ? (
                <span className="flex h-3.5 w-3.5 items-center justify-center text-accent">✓</span>
              ) : active ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-fg/20" />
              )}
              <span className={done ? "text-fg/45" : active ? "text-fg/90" : "text-fg/30"}>{stage.label}</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex items-center justify-between gap-4 border-t border-fg/10 pt-3 font-mono text-[0.62rem] text-fg/40">
        <span>{note}</span>
        <span className="tabular-nums">{Math.floor(elapsed)}s</span>
      </div>
    </div>
  );
};
