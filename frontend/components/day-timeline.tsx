"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LessonFormDialog } from "@/components/lesson-form-dialog"
import { TimelineLessonCard } from "@/components/timeline-lesson-card"
import {
  WEEKDAYS,
  addDaysISO,
  formatLongDate,
  type Lesson,
} from "@/lib/planner-data"
import { cn } from "@/lib/utils"

type Props = {
  classId: string
  weekStart: string
  lessons: Lesson[]
  todayISO: string
}

export function DayTimeline({ classId, weekStart, lessons, todayISO }: Props) {
  return (
    <div className="space-y-4">
      {WEEKDAYS.map((_, i) => {
        const dayISO = addDaysISO(weekStart, i)
        const dayLessons = lessons.filter((l) => l.date === dayISO)
        const isToday = dayISO === todayISO
        return (
          <div key={dayISO} className="flex gap-4">
            <div className="flex w-28 shrink-0 flex-col pt-1">
              <span
                className={cn(
                  "text-sm font-semibold",
                  isToday && "text-primary",
                )}
              >
                {formatLongDate(dayISO).split(",")[0]}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatLongDate(dayISO).split(",").slice(1).join(",").trim()}
              </span>
              {isToday && (
                <span className="mt-1 w-fit rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Today
                </span>
              )}
            </div>

            <div className="flex-1 space-y-3 border-l border-border pb-2 pl-4">
              {dayLessons.length === 0 && (
                <LessonFormDialog
                  classId={classId}
                  defaultDate={dayISO}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 border border-dashed border-border text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add lesson
                    </Button>
                  }
                />
              )}

              {dayLessons.map((lesson) => (
                <TimelineLessonCard
                  key={lesson.id}
                  classId={classId}
                  lesson={lesson}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
