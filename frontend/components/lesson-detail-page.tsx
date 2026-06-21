"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { TimelineLessonCard } from "@/components/timeline-lesson-card"
import { usePlanner } from "@/components/planner-provider"
import { formatLongDate } from "@/lib/planner-data"

export function LessonDetailPage({
  classId,
  lessonId,
}: {
  classId: string
  lessonId: string
}) {
  const { getClass, lessons } = usePlanner()
  const classRecord = getClass(classId)
  const lesson = lessons.find(
    (l) => l.id === lessonId && l.classId === classId,
  )

  if (!classRecord || !lesson) {
    notFound()
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href={`/class/${classId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {classRecord.name}
      </Link>

      <p className="mt-4 text-sm font-medium text-primary">
        {formatLongDate(lesson.date)}
      </p>

      <div className="mt-2">
        <TimelineLessonCard classId={classId} lesson={lesson} defaultOpen />
      </div>
    </main>
  )
}
