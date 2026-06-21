"use client"

import { useState } from "react"
import {
  BookText,
  ListChecks,
  Backpack,
  Pencil,
  ChevronDown,
  Presentation,
  Sparkles,
  Brain,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LessonFormDialog } from "@/components/lesson-form-dialog"
import { LessonStatusBadge } from "@/components/lesson-status-badge"
import { LessonResources } from "@/components/lesson-resources"
import { AgentSuggestions } from "@/components/agent-suggestions"
import { BrainActivation } from "@/components/brain-activation"
import { type Lesson } from "@/lib/planner-data"
import { cn } from "@/lib/utils"

export function TimelineLessonCard({
  classId,
  lesson,
}: {
  classId: string
  lesson: Lesson
}) {
  const [open, setOpen] = useState(false)
  const pendingSuggestions = lesson.suggestions.filter(
    (s) => s.status === "pending",
  ).length

  return (
    <div className="group rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-pretty font-semibold leading-snug">
            {lesson.title}
          </h3>
          <div className="mt-1.5">
            <LessonStatusBadge status={lesson.status} />
          </div>
        </div>
        <LessonFormDialog
          classId={classId}
          editLesson={lesson}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground"
              aria-label="Edit lesson"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />
      </div>

      {lesson.summary && (
        <p className="mt-2 flex gap-2 text-sm text-muted-foreground">
          <BookText className="mt-0.5 h-4 w-4 shrink-0" />
          {lesson.summary}
        </p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {lesson.objectives.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <ListChecks className="h-3.5 w-3.5 text-primary" />
              Objectives
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {lesson.objectives.map((o) => (
                <li key={o}>• {o}</li>
              ))}
            </ul>
          </div>
        )}
        {lesson.materials.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Backpack className="h-3.5 w-3.5 text-primary" />
              Materials
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {lesson.materials.map((m) => (
                <li key={m}>• {m}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {lesson.homework && (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs">
          <span className="font-medium">Homework: </span>
          <span className="text-muted-foreground">{lesson.homework}</span>
        </p>
      )}

      {/* Resource / agent / brain summary + toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left transition hover:border-primary/40"
        aria-expanded={open}
      >
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Presentation className="h-3.5 w-3.5" />
            {lesson.resources.length} resource
            {lesson.resources.length === 1 ? "" : "s"}
          </span>
          <span
            className={cn(
              "flex items-center gap-1",
              pendingSuggestions > 0 && "font-medium text-primary",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {pendingSuggestions} suggestion
            {pendingSuggestions === 1 ? "" : "s"}
          </span>
          <span className="flex items-center gap-1">
            <Brain className="h-3.5 w-3.5" />
            {lesson.brainRegions.length} region
            {lesson.brainRegions.length === 1 ? "" : "s"}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="mt-3 grid gap-5 border-t border-border pt-4 lg:grid-cols-2">
          <LessonResources
            lessonId={lesson.id}
            resources={lesson.resources}
          />
          <AgentSuggestions
            lessonId={lesson.id}
            suggestions={lesson.suggestions}
          />
          <div className="lg:col-span-2">
            <BrainActivation lesson={lesson} classId={classId} />
          </div>
        </div>
      )}
    </div>
  )
}
