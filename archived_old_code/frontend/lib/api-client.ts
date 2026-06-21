"use client"

import type {
  BrainActivationData,
  LessonEvaluation,
  SuggestionTarget,
} from "@/lib/planner-data"

export type EvaluateLessonInput = {
  lessonId: string
  title: string
  summary: string
  objectives: string[]
  materials: string[]
  homework: string
  files: File[]
}

export type EvaluateLessonResponse = {
  evaluation: LessonEvaluation
  suggestions: {
    title: string
    detail: string
    target: SuggestionTarget
  }[]
}

/**
 * Sends the lesson's text fields plus any newly uploaded files to
 * POST /api/evaluate-lesson and normalizes the response into the shapes
 * the planner context expects.
 */
export async function evaluateLesson(
  input: EvaluateLessonInput,
): Promise<EvaluateLessonResponse> {
  const formData = new FormData()
  formData.set(
    "context",
    JSON.stringify({
      lessonId: input.lessonId,
      title: input.title,
      summary: input.summary,
      objectives: input.objectives,
      materials: input.materials,
      homework: input.homework,
    }),
  )
  for (const file of input.files) {
    formData.append("files", file)
  }

  const res = await fetch("/api/evaluate-lesson", {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Evaluation request failed (${res.status})`)
  }

  const data = await res.json()

  return {
    evaluation: {
      score: data.score,
      summary: data.summary,
      method: data.method,
      evaluatedAt: new Date().toISOString(),
    },
    suggestions: data.suggestions ?? [],
  }
}

export type BrainActivationInput = {
  lessonId: string
  classId: string
  date: string
  title: string
  summary: string
  objectives: string[]
  materials: string[]
}

/**
 * Calls POST /api/brain-activation (backed by Tribe V2, or its stub) for
 * a single lesson.
 */
export async function fetchBrainActivation(
  input: BrainActivationInput,
): Promise<BrainActivationData> {
  const res = await fetch("/api/brain-activation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(
      body?.error ?? `Brain activation request failed (${res.status})`,
    )
  }

  const data = await res.json()

  return {
    regions: data.regions ?? [],
    source: data.source ?? "stub",
    generatedAt: new Date().toISOString(),
  }
}
