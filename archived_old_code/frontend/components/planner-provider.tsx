"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  demoClasses,
  demoLessons,
  type BrainActivationData,
  type ClassRecord,
  type EvaluationStatus,
  type Lesson,
  type LessonEvaluation,
  type LessonResource,
  type SuggestionStatus,
  type SuggestionTarget,
  type BrainStatus,
} from "@/lib/planner-data"

type PlannerContextValue = {
  classes: ClassRecord[]
  lessons: Lesson[]
  getClass: (id: string) => ClassRecord | undefined
  lessonsForClass: (classId: string) => Lesson[]
  addClass: (data: Omit<ClassRecord, "id">) => ClassRecord
  updateClass: (id: string, data: Partial<Omit<ClassRecord, "id">>) => void
  deleteClass: (id: string) => void
  addLesson: (
    data: Omit<Lesson, "id" | "resources" | "suggestions" | "brainRegions"> &
      Partial<Pick<Lesson, "resources" | "suggestions" | "brainRegions">>,
  ) => Lesson
  updateLesson: (id: string, data: Partial<Omit<Lesson, "id">>) => void
  deleteLesson: (id: string) => void
  /** Attach a slide deck or other resource to a lesson. */
  addResource: (
    lessonId: string,
    data: Omit<LessonResource, "id" | "addedAt">,
  ) => void
  /** Remove a resource from a lesson. */
  removeResource: (lessonId: string, resourceId: string) => void
  /** Apply or dismiss an agent suggestion for a lesson. */
  setSuggestionStatus: (
    lessonId: string,
    suggestionId: string,
    status: SuggestionStatus,
  ) => void
  /** Track whether an evaluation request is in flight for a lesson. */
  setEvaluationStatus: (lessonId: string, status: EvaluationStatus) => void
  /**
   * Apply a backend evaluation result: stores the score/summary on the
   * lesson and replaces its suggestions with the freshly returned ones
   * (each starting at "pending").
   */
  applyEvaluation: (
    lessonId: string,
    evaluation: LessonEvaluation,
    suggestions: { title: string; detail: string; target: SuggestionTarget }[],
  ) => void
  /** Track whether a brain-activation request is in flight for a lesson. */
  setBrainStatus: (lessonId: string, status: BrainStatus) => void
  /** Apply a Tribe V2 (or stub) brain-activation result to a lesson. */
  applyBrainActivation: (lessonId: string, data: BrainActivationData) => void
}

const PlannerContext = createContext<PlannerContextValue | null>(null)

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<ClassRecord[]>(demoClasses)
  const [lessons, setLessons] = useState<Lesson[]>(demoLessons)

  const value = useMemo<PlannerContextValue>(
    () => ({
      classes,
      lessons,
      getClass: (id) => classes.find((c) => c.id === id),
      lessonsForClass: (classId) =>
        lessons
          .filter((l) => l.classId === classId)
          .sort((a, b) => a.date.localeCompare(b.date)),
      addClass: (data) => {
        const record: ClassRecord = { ...data, id: makeId("c") }
        setClasses((prev) => [...prev, record])
        return record
      },
      updateClass: (id, data) =>
        setClasses((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...data } : c)),
        ),
      deleteClass: (id) => {
        setClasses((prev) => prev.filter((c) => c.id !== id))
        setLessons((prev) => prev.filter((l) => l.classId !== id))
      },
      addLesson: (data) => {
        const record: Lesson = {
          resources: [],
          suggestions: [],
          brainRegions: [],
          ...data,
          id: makeId("l"),
        }
        setLessons((prev) => [...prev, record])
        return record
      },
      updateLesson: (id, data) =>
        setLessons((prev) =>
          prev.map((l) => (l.id === id ? { ...l, ...data } : l)),
        ),
      deleteLesson: (id) =>
        setLessons((prev) => prev.filter((l) => l.id !== id)),
      addResource: (lessonId, data) =>
        setLessons((prev) =>
          prev.map((l) =>
            l.id === lessonId
              ? {
                  ...l,
                  resources: [
                    ...l.resources,
                    {
                      ...data,
                      id: makeId("r"),
                      addedAt: new Date().toISOString(),
                    },
                  ],
                }
              : l,
          ),
        ),
      removeResource: (lessonId, resourceId) =>
        setLessons((prev) =>
          prev.map((l) =>
            l.id === lessonId
              ? {
                  ...l,
                  resources: l.resources.filter((r) => r.id !== resourceId),
                }
              : l,
          ),
        ),
      setSuggestionStatus: (lessonId, suggestionId, status) =>
        setLessons((prev) =>
          prev.map((l) =>
            l.id === lessonId
              ? {
                  ...l,
                  suggestions: l.suggestions.map((s) =>
                    s.id === suggestionId ? { ...s, status } : s,
                  ),
                }
              : l,
          ),
        ),
      setEvaluationStatus: (lessonId, status) =>
        setLessons((prev) =>
          prev.map((l) =>
            l.id === lessonId ? { ...l, evaluationStatus: status } : l,
          ),
        ),
      applyEvaluation: (lessonId, evaluation, suggestions) =>
        setLessons((prev) =>
          prev.map((l) =>
            l.id === lessonId
              ? {
                  ...l,
                  evaluation,
                  evaluationStatus: "idle",
                  suggestions: suggestions.map((s) => ({
                    ...s,
                    id: makeId("s"),
                    status: "pending" as const,
                    createdAt: evaluation.evaluatedAt,
                  })),
                }
              : l,
          ),
        ),
      setBrainStatus: (lessonId, status) =>
        setLessons((prev) =>
          prev.map((l) =>
            l.id === lessonId ? { ...l, brainStatus: status } : l,
          ),
        ),
      applyBrainActivation: (lessonId, data) =>
        setLessons((prev) =>
          prev.map((l) =>
            l.id === lessonId
              ? {
                  ...l,
                  brainActivation: data,
                  brainStatus: "idle",
                  brainRegions: data.regions
                    .filter((r) => r.intensity >= 0.55)
                    .map((r) => r.region),
                }
              : l,
          ),
        ),
    }),
    [classes, lessons],
  )

  return (
    <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
  )
}

export function usePlanner() {
  const ctx = useContext(PlannerContext)
  if (!ctx) {
    throw new Error("usePlanner must be used within a PlannerProvider")
  }
  return ctx
}
