"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Rows3,
  Plus,
  Users,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WeekCalendar } from "@/components/week-calendar"
import { DayTimeline } from "@/components/day-timeline"
import { LessonFormDialog } from "@/components/lesson-form-dialog"
import { ClassFormDialog } from "@/components/class-form-dialog"
import { usePlanner } from "@/components/planner-provider"
import {
  CLASS_COLORS,
  getWeekStartISO,
  addDaysISO,
  formatDayLabel,
  toISODate,
} from "@/lib/planner-data"
import { cn } from "@/lib/utils"

type View = "calendar" | "timeline"

export function ClassDetail({ classId }: { classId: string }) {
  const { getClass, lessonsForClass, deleteClass } = usePlanner()
  const [weekOffset, setWeekOffset] = useState(0)
  const [view, setView] = useState<View>("calendar")

  const classRecord = getClass(classId)
  const todayISO = toISODate(new Date())
  const weekStart = getWeekStartISO(weekOffset)
  const weekEnd = addDaysISO(weekStart, 4)

  const allLessons = useMemo(
    () => lessonsForClass(classId),
    [lessonsForClass, classId],
  )
  const weekLessons = allLessons.filter(
    (l) => l.date >= weekStart && l.date <= weekEnd,
  )

  if (!classRecord) {
    notFound()
  }

  const palette = CLASS_COLORS[classRecord.color]

  function handleDeleteClass() {
    deleteClass(classId)
    toast.success("Class deleted")
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All classes
      </Link>

      {/* Class header */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={cn("mt-1.5 h-10 w-1.5 rounded-full", palette.dot)}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-pretty text-2xl font-semibold tracking-tight">
                {classRecord.name}
              </h1>
              <Badge variant="secondary" className="font-normal">
                {classRecord.gradeLevel}
              </Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{classRecord.subject}</span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {classRecord.studentCount} students
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {classRecord.room}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LessonFormDialog
            classId={classId}
            defaultDate={todayISO}
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New lesson
              </Button>
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Class options"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <ClassFormDialog
                editClass={classRecord}
                trigger={
                  <DropdownMenuItem
                    closeOnClick={false}
                    onClick={(e) => e.preventDefault()}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit class
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDeleteClass}
                render={
                  <Link href="/">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete class
                  </Link>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-44 text-center">
            <p className="text-sm font-medium">
              {weekOffset === 0
                ? "This week"
                : weekOffset === 1
                  ? "Next week"
                  : weekOffset === -1
                    ? "Last week"
                    : `Week of ${formatDayLabel(weekStart)}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDayLabel(weekStart)} – {formatDayLabel(weekEnd)}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {weekOffset !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(0)}
            >
              Today
            </Button>
          )}
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList>
            <TabsTrigger value="calendar" className="gap-1.5">
              <CalendarRange className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5">
              <Rows3 className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* View */}
      <div className="mt-5">
        {view === "calendar" ? (
          <WeekCalendar
            classId={classId}
            weekStart={weekStart}
            lessons={weekLessons}
            todayISO={todayISO}
          />
        ) : (
          <DayTimeline
            classId={classId}
            weekStart={weekStart}
            lessons={weekLessons}
            todayISO={todayISO}
          />
        )}
      </div>
    </main>
  )
}
