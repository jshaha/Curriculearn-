"use client"

import Link from "next/link"
import { Plus, BookOpen, Users, MapPin, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClassFormDialog } from "@/components/class-form-dialog"
import { usePlanner } from "@/components/planner-provider"
import { CLASS_COLORS, getWeekStartISO, addDaysISO } from "@/lib/planner-data"
import { cn } from "@/lib/utils"

export function Dashboard() {
  const { classes, lessons } = usePlanner()

  const weekStart = getWeekStartISO(0)
  const weekEnd = addDaysISO(weekStart, 4)
  const lessonsThisWeek = lessons.filter(
    (l) => l.date >= weekStart && l.date <= weekEnd,
  ).length

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Good morning</p>
          <h1 className="text-pretty text-2xl font-semibold tracking-tight sm:text-3xl">
            Your classes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {classes.length} classes · {lessonsThisWeek} lessons planned this
            week
          </p>
        </div>
        <ClassFormDialog
          trigger={
            <Button className="mt-4 gap-2 sm:mt-0">
              <Plus className="h-4 w-4" />
              New class
            </Button>
          }
        />
      </div>

      {classes.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center justify-center gap-3 border-dashed p-12 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium">No classes yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first class to start planning lessons.
            </p>
          </div>
          <ClassFormDialog
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New class
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => {
            const palette = CLASS_COLORS[c.color]
            const count = lessons.filter((l) => l.classId === c.id).length
            return (
              <Link key={c.id} href={`/class/${c.id}`} className="group">
                <Card
                  className={cn(
                    "relative h-full overflow-hidden p-5 transition hover:shadow-md hover:ring-1",
                    palette.ring,
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-x-0 top-0 h-1",
                      palette.dot,
                    )}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        palette.soft,
                        palette.text,
                      )}
                    >
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="font-normal">
                      {c.gradeLevel}
                    </Badge>
                  </div>
                  <h2 className="mt-4 text-pretty font-semibold leading-snug">
                    {c.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">{c.subject}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {c.studentCount} students
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {c.room}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {count} lessons
                    </span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
