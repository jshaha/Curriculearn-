"use client"

import { Sparkles, Check, X, RotateCcw, Bot } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { usePlanner } from "@/components/planner-provider"
import {
  SUGGESTION_TARGET_LABELS,
  type AgentSuggestion,
} from "@/lib/planner-data"
import { cn } from "@/lib/utils"

export function AgentSuggestions({
  lessonId,
  suggestions,
}: {
  lessonId: string
  suggestions: AgentSuggestion[]
}) {
  const { setSuggestionStatus } = usePlanner()
  const pending = suggestions.filter((s) => s.status === "pending")
  const resolved = suggestions.filter((s) => s.status !== "pending")

  return (
    <section aria-label="Agent suggestions">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Agent suggestions
          {pending.length > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
              {pending.length}
            </span>
          )}
        </h4>
      </div>

      {suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-5 text-center">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            No feedback yet. Your evaluation agent will post suggested changes
            here after reviewing the slides.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {[...pending, ...resolved].map((s) => (
            <li
              key={s.id}
              className={cn(
                "rounded-lg border p-2.5",
                s.status === "pending"
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-muted/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-pretty text-sm font-medium leading-snug",
                      s.status === "dismissed" &&
                        "text-muted-foreground line-through",
                    )}
                  >
                    {s.title}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                    {SUGGESTION_TARGET_LABELS[s.target]}
                  </span>
                </div>
                {s.status === "applied" && (
                  <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-chart-4">
                    <Check className="h-3.5 w-3.5" />
                    Applied
                  </span>
                )}
                {s.status === "dismissed" && (
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    Dismissed
                  </span>
                )}
              </div>

              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {s.detail}
              </p>

              {s.status === "pending" ? (
                <div className="mt-2.5 flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => {
                      setSuggestionStatus(lessonId, s.id, "applied")
                      toast.success("Suggestion applied")
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Apply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs text-muted-foreground"
                    onClick={() => {
                      setSuggestionStatus(lessonId, s.id, "dismissed")
                      toast("Suggestion dismissed")
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                    Dismiss
                  </Button>
                </div>
              ) : (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1.5 px-2 text-xs text-muted-foreground"
                    onClick={() =>
                      setSuggestionStatus(lessonId, s.id, "pending")
                    }
                  >
                    <RotateCcw className="h-3 w-3" />
                    Undo
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
