"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LessonFormDialog } from "@/components/lesson-form-dialog"
import { LessonStatusBadge } from "@/components/lesson-status-badge"
import {
  WEEKDAYS,
  addDaysISO,
  formatDayLabel,
  type Lesson,
} from "@/lib/planner-data"
import { cn } from "@/lib/utils"

type Props = {
  classId: string
  weekStart: string
  lessons: Lesson[]
  todayISO: string
}

export function WeekCalendar({
  classId,
  weekStart,
  lessons,
  todayISO,
}: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {WEEKDAYS.map((label, i) => {
        const dayISO = addDaysISO(weekStart, i)
        const dayLessons = lessons.filter((l) => l.date === dayISO)
        const isToday = dayISO === todayISO
        return (
          <div
            key={label}
            className={cn(
              "flex flex-col rounded-xl border border-border bg-card p-3",
              isToday && "ring-2 ring-primary/40",
            )}
          >
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isToday && "text-primary",
                  )}
                >
                  {label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDayLabel(dayISO)}
                </p>
              </div>
              {isToday && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Today
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2">
              {dayLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/class/${classId}/lesson/${lesson.id}`}
                  className="rounded-lg border border-border bg-background p-2.5 text-left transition hover:border-primary/40 hover:shadow-sm"
                >
                  <p className="text-pretty text-sm font-medium leading-snug">
                    {lesson.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {lesson.summary}
                  </p>
                  <div className="mt-2">
                    <LessonStatusBadge status={lesson.status} />
                  </div>
                </Link>
              ))}

              <LessonFormDialog
                classId={classId}
                defaultDate={dayISO}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-center gap-1 border border-dashed border-border text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                }
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
