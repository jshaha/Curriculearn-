/**
 * Canonical region names used across the app. The Tribe V2 stub generator
 * (lib/server/tribe-client.ts) and the brain map SVG (components/brain-map-
 * svg.tsx) both key off these names so a real Tribe V2 integration just
 * needs to return regions from this same list (or extend it — unknown
 * region names fall back to a generic "other" marker in the SVG legend).
 */
export const BRAIN_REGIONS = [
  "Frontal lobe",
  "Prefrontal cortex",
  "Parietal lobe",
  "Temporal lobe",
  "Occipital lobe",
  "Cerebellum",
  "Hippocampus",
  "Amygdala",
  "Broca's area",
  "Wernicke's area",
] as const

export type BrainRegionName = (typeof BRAIN_REGIONS)[number]

/**
 * Class-level brain metrics shown on the class overview (averaged across
 * a class's lessons by the backend; today these are demo placeholder
 * scores — see components/class-brain-overview.tsx). Each metric maps to
 * the brain regions that light up when you hover its label.
 */
export type ClassMetricKey = "learning" | "engagement" | "focus" | "retention"

export type ClassMetric = {
  key: ClassMetricKey
  label: string
  description: string
  regions: BrainRegionName[]
}

export const CLASS_METRICS: ClassMetric[] = [
  {
    key: "learning",
    label: "Learning",
    description: "How effectively new material is being encoded and understood.",
    regions: ["Prefrontal cortex", "Hippocampus", "Amygdala"],
  },
  {
    key: "engagement",
    label: "Engagement",
    description: "How attentive and emotionally invested students are, moment to moment.",
    regions: ["Frontal lobe", "Prefrontal cortex", "Amygdala"],
  },
  {
    key: "focus",
    label: "Focus",
    description: "Sustained attention and resistance to distraction during the lesson.",
    regions: ["Frontal lobe", "Parietal lobe"],
  },
  {
    key: "retention",
    label: "Retention",
    description: "How likely today's material is to stick beyond the lesson itself.",
    regions: ["Hippocampus", "Temporal lobe"],
  },
]

export type LessonStatus = "planned" | "in-progress" | "complete"

export type ResourceKind =
  | "slides"
  | "document"
  | "spreadsheet"
  | "image"
  | "video"
  | "link"
  | "other"

/** A teaching resource (slide deck, doc, link, etc.) attached to a lesson. */
export type LessonResource = {
  id: string
  name: string
  kind: ResourceKind
  /** File size in bytes (omitted for links). */
  size?: number
  /** Optional external URL for link-type resources. */
  url?: string
  /** ISO timestamp of when it was added. */
  addedAt: string
}

export type SuggestionStatus = "pending" | "applied" | "dismissed"

/** Which part of the lesson a suggestion targets. */
export type SuggestionTarget =
  | "summary"
  | "objectives"
  | "materials"
  | "homework"
  | "pacing"
  | "slides"
  | "general"

/**
 * Feedback produced by the backend evaluation agent after reviewing a
 * lesson's slides and resources.
 */
export type AgentSuggestion = {
  id: string
  title: string
  detail: string
  target: SuggestionTarget
  status: SuggestionStatus
  /** ISO timestamp from the agent. */
  createdAt: string
}

/**
 * Score + summary returned by POST /api/evaluate-lesson. `suggestions` on
 * the Lesson are populated from the same response; this just holds the
 * headline numbers so the UI can render a badge without digging through
 * the suggestions list.
 */
export type LessonEvaluation = {
  /** 0-100 effectiveness score from the backend evaluator. */
  score: number
  /** One paragraph plain-language summary of the evaluation. */
  summary: string
  /** "ai" if a real model produced this, "heuristic" if it used the
   *  no-API-key fallback scorer. Surfaced in the UI so it's obvious which
   *  one ran. */
  method: "ai" | "heuristic"
  evaluatedAt: string
}

/** Async status for the evaluate-lesson call. */
export type EvaluationStatus = "idle" | "evaluating" | "error"

/** A single brain region's activation level, 0-1, for a given lesson. */
export type BrainRegionActivation = {
  region: string
  intensity: number
}

/**
 * Result of POST /api/brain-activation — i.e. data sourced from Tribe V2
 * (or the stub generator until that integration is wired in).
 */
export type BrainActivationData = {
  regions: BrainRegionActivation[]
  /** "tribe" once real device data is wired in, "stub" for the placeholder
   *  generator that ships today. */
  source: "tribe" | "stub"
  generatedAt: string
}

/** Async status for the brain-activation call. */
export type BrainStatus = "idle" | "loading" | "error"

export type Lesson = {
  id: string
  classId: string
  /** ISO date string: YYYY-MM-DD */
  date: string
  title: string
  summary: string
  objectives: string[]
  materials: string[]
  homework: string
  status: LessonStatus
  /** Uploaded slides and other teaching resources for the day. */
  resources: LessonResource[]
  /** Suggestions/changes returned by the backend evaluation agent. */
  suggestions: AgentSuggestion[]
  /** Brain regions activated by this lesson (powers the brain map). Kept
   *  as a plain list for backward compatibility; prefer `brainActivation`
   *  for intensity-aware rendering. */
  brainRegions: string[]
  /** Score + summary from the most recent backend evaluation, if any. */
  evaluation?: LessonEvaluation
  evaluationStatus?: EvaluationStatus
  /** Per-region intensity data from Tribe V2 (or its stub), if fetched. */
  brainActivation?: BrainActivationData
  brainStatus?: BrainStatus
}

export const RESOURCE_LABELS: Record<ResourceKind, string> = {
  slides: "Slides",
  document: "Document",
  spreadsheet: "Spreadsheet",
  image: "Image",
  video: "Video",
  link: "Link",
  other: "File",
}

export const SUGGESTION_TARGET_LABELS: Record<SuggestionTarget, string> = {
  summary: "Summary",
  objectives: "Objectives",
  materials: "Materials",
  homework: "Homework",
  pacing: "Pacing",
  slides: "Slides",
  general: "General",
}

/** Infers a resource kind from a file name's extension. */
export function inferResourceKind(fileName: string): ResourceKind {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
  if (["ppt", "pptx", "key", "odp"].includes(ext)) return "slides"
  if (["pdf", "doc", "docx", "txt", "md", "rtf", "odt"].includes(ext))
    return "document"
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "spreadsheet"
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"].includes(ext))
    return "image"
  if (["mp4", "mov", "webm", "avi", "mkv"].includes(ext)) return "video"
  return "other"
}

/** Formats a byte count into a short human-readable string. */
export function formatFileSize(bytes?: number): string {
  if (bytes == null) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export type ClassColor = "blue" | "teal" | "amber" | "green" | "rose"

export type ClassRecord = {
  id: string
  name: string
  subject: string
  gradeLevel: string
  room: string
  period: string
  studentCount: number
  color: ClassColor
}

export const CLASS_COLORS: Record<
  ClassColor,
  { dot: string; soft: string; text: string; ring: string }
> = {
  blue: {
    dot: "bg-chart-1",
    soft: "bg-chart-1/10",
    text: "text-chart-1",
    ring: "ring-chart-1/30",
  },
  teal: {
    dot: "bg-chart-2",
    soft: "bg-chart-2/10",
    text: "text-chart-2",
    ring: "ring-chart-2/30",
  },
  amber: {
    dot: "bg-chart-3",
    soft: "bg-chart-3/10",
    text: "text-chart-3",
    ring: "ring-chart-3/30",
  },
  green: {
    dot: "bg-chart-4",
    soft: "bg-chart-4/10",
    text: "text-chart-4",
    ring: "ring-chart-4/30",
  },
  rose: {
    dot: "bg-chart-5",
    soft: "bg-chart-5/10",
    text: "text-chart-5",
    ring: "ring-chart-5/30",
  },
}

export const STATUS_LABELS: Record<LessonStatus, string> = {
  planned: "Planned",
  "in-progress": "In progress",
  complete: "Complete",
}

/** Returns a YYYY-MM-DD string for the Monday of the current week, offset by weeks. */
function mondayOf(base: Date, weekOffset = 0): Date {
  const d = new Date(base)
  const day = d.getDay() // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff + weekOffset * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00")
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

const today = new Date()
const thisMonday = mondayOf(today, 0)

function dayISO(weekOffset: number, dayIndex: number): string {
  return toISODate(
    new Date(
      mondayOf(today, weekOffset).getTime() + dayIndex * 24 * 60 * 60 * 1000,
    ),
  )
}

export const demoClasses: ClassRecord[] = [
  {
    id: "c-bio",
    name: "Biology — Period 2",
    subject: "Biology",
    gradeLevel: "Grade 10",
    room: "Room 204",
    period: "Period 2",
    studentCount: 28,
    color: "green",
  },
  {
    id: "c-alg",
    name: "Algebra II — Period 3",
    subject: "Mathematics",
    gradeLevel: "Grade 11",
    room: "Room 117",
    period: "Period 3",
    studentCount: 31,
    color: "blue",
  },
  {
    id: "c-lit",
    name: "World Literature — Period 5",
    subject: "English",
    gradeLevel: "Grade 12",
    room: "Room 301",
    period: "Period 5",
    studentCount: 24,
    color: "amber",
  },
  {
    id: "c-hist",
    name: "U.S. History — Period 6",
    subject: "History",
    gradeLevel: "Grade 11",
    room: "Room 145",
    period: "Period 6",
    studentCount: 27,
    color: "rose",
  },
]

/** Lesson fields before the resources/suggestions/brain extras are filled in. */
type RawLesson = Omit<Lesson, "resources" | "suggestions" | "brainRegions"> &
  Partial<Pick<Lesson, "resources" | "suggestions" | "brainRegions">>

const rawLessons: RawLesson[] = [
  // Biology
  {
    id: "l1",
    classId: "c-bio",
    date: dayISO(0, 0),
    title: "Cell Structure & Organelles",
    summary:
      "Introduce eukaryotic cell anatomy with a labeling activity. Students identify organelles and their functions.",
    objectives: [
      "Identify major organelles",
      "Explain organelle functions",
    ],
    materials: ["Microscope slides", "Labeling worksheet"],
    homework: "Read Ch. 4.1, complete diagram",
    status: "complete",
    brainRegions: ["Occipital lobe", "Hippocampus", "Prefrontal cortex"],
    resources: [
      {
        id: "r-l1-1",
        name: "Cell Structure.pptx",
        kind: "slides",
        size: 4_200_000,
        addedAt: "2024-01-08T09:00:00.000Z",
      },
      {
        id: "r-l1-2",
        name: "Organelle Labeling.pdf",
        kind: "document",
        size: 820_000,
        addedAt: "2024-01-08T09:02:00.000Z",
      },
    ],
    suggestions: [
      {
        id: "s-l1-1",
        title: "Add a check-for-understanding before the lab",
        detail:
          "Slides jump from the lecture straight into labeling. Insert a 2-minute think-pair-share so students recall organelle names first.",
        target: "pacing",
        status: "pending",
        createdAt: "2024-01-08T12:30:00.000Z",
      },
      {
        id: "s-l1-2",
        title: "Clarify objective wording",
        detail:
          "\"Explain organelle functions\" is broad — scope it to the 6 organelles shown on slide 4 for a measurable outcome.",
        target: "objectives",
        status: "pending",
        createdAt: "2024-01-08T12:30:00.000Z",
      },
    ],
  },
  {
    id: "l2",
    classId: "c-bio",
    date: dayISO(0, 2),
    title: "Cell Membrane & Transport",
    summary:
      "Demonstrate diffusion and osmosis. Lab using dialysis tubing to model selective permeability.",
    objectives: ["Compare passive vs active transport"],
    materials: ["Dialysis tubing", "Iodine solution"],
    homework: "Lab write-up due Friday",
    status: "in-progress",
    brainRegions: ["Parietal lobe", "Cerebellum"],
    resources: [
      {
        id: "r-l2-1",
        name: "Diffusion & Osmosis.key",
        kind: "slides",
        size: 6_100_000,
        addedAt: "2024-01-10T08:30:00.000Z",
      },
    ],
    suggestions: [
      {
        id: "s-l2-1",
        title: "Pre-lab safety slide is missing",
        detail:
          "The deck dives into the iodine procedure without a safety note. Add a slide on handling iodine and goggles before the demo.",
        target: "slides",
        status: "pending",
        createdAt: "2024-01-10T15:00:00.000Z",
      },
    ],
  },
  {
    id: "l3",
    classId: "c-bio",
    date: dayISO(0, 4),
    title: "Photosynthesis Overview",
    summary:
      "Trace the light-dependent and light-independent reactions with a guided diagram walkthrough.",
    objectives: ["Summarize the inputs and outputs of photosynthesis"],
    materials: ["Slide deck", "Guided notes"],
    homework: "Quiz Monday on Ch. 4",
    status: "planned",
    brainRegions: ["Frontal lobe", "Occipital lobe"],
  },
  {
    id: "l4",
    classId: "c-bio",
    date: dayISO(1, 1),
    title: "Cellular Respiration",
    summary:
      "Connect respiration to photosynthesis. Begin glycolysis pathway breakdown.",
    objectives: ["Outline stages of cellular respiration"],
    materials: ["Pathway poster"],
    homework: "Vocabulary set 5",
    status: "planned",
    brainRegions: ["Prefrontal cortex"],
  },
  // Algebra II
  {
    id: "l5",
    classId: "c-alg",
    date: dayISO(0, 0),
    title: "Quadratic Functions Review",
    summary:
      "Warm-up on vertex form, then graph parabolas and identify transformations.",
    objectives: ["Graph quadratics in vertex form"],
    materials: ["Graphing calculators", "Practice set A"],
    homework: "p. 212 #1–15 odd",
    status: "complete",
    brainRegions: ["Parietal lobe", "Prefrontal cortex"],
    resources: [
      {
        id: "r-l5-1",
        name: "Quadratics Review.pptx",
        kind: "slides",
        size: 3_300_000,
        addedAt: "2024-01-08T07:45:00.000Z",
      },
    ],
  },
  {
    id: "l6",
    classId: "c-alg",
    date: dayISO(0, 1),
    title: "Completing the Square",
    summary:
      "Derive the technique step-by-step, then convert standard to vertex form together.",
    objectives: ["Convert standard form to vertex form"],
    materials: ["Worked examples handout"],
    homework: "Worksheet 6.2",
    status: "in-progress",
    brainRegions: ["Parietal lobe"],
    suggestions: [
      {
        id: "s-l6-1",
        title: "Add a worked non-monic example",
        detail:
          "Every example uses a leading coefficient of 1. Add one where a ≠ 1 so students see the factoring-out step.",
        target: "materials",
        status: "pending",
        createdAt: "2024-01-09T16:10:00.000Z",
      },
    ],
  },
  {
    id: "l7",
    classId: "c-alg",
    date: dayISO(0, 3),
    title: "The Quadratic Formula",
    summary:
      "Introduce the discriminant and solve equations with real and complex roots.",
    objectives: ["Apply the quadratic formula", "Interpret the discriminant"],
    materials: ["Formula reference card"],
    homework: "Practice set B",
    status: "planned",
    brainRegions: ["Prefrontal cortex", "Parietal lobe"],
  },
  // World Literature
  {
    id: "l8",
    classId: "c-lit",
    date: dayISO(0, 1),
    title: "Intro to Magical Realism",
    summary:
      "Discuss genre conventions and begin reading excerpts from One Hundred Years of Solitude.",
    objectives: ["Define magical realism", "Identify genre markers in text"],
    materials: ["Excerpt packet"],
    homework: "Annotate pp. 1–20",
    status: "complete",
    brainRegions: ["Temporal lobe", "Broca's area", "Wernicke's area"],
    resources: [
      {
        id: "r-l8-1",
        name: "Magical Realism Intro.pdf",
        kind: "document",
        size: 1_100_000,
        addedAt: "2024-01-09T10:15:00.000Z",
      },
    ],
  },
  {
    id: "l9",
    classId: "c-lit",
    date: dayISO(0, 3),
    title: "Symbolism Seminar",
    summary:
      "Socratic seminar on recurring symbols. Students lead discussion in small groups.",
    objectives: ["Analyze symbolic motifs"],
    materials: ["Discussion prompts"],
    homework: "Draft thesis for essay 2",
    status: "planned",
    brainRegions: ["Temporal lobe", "Prefrontal cortex"],
  },
  // U.S. History
  {
    id: "l10",
    classId: "c-hist",
    date: dayISO(0, 2),
    title: "The Gilded Age",
    summary:
      "Examine industrialization, robber barons, and labor movements through primary sources.",
    objectives: ["Evaluate causes of rapid industrialization"],
    materials: ["Primary source set", "Map handout"],
    homework: "Reading response #3",
    status: "in-progress",
    brainRegions: ["Hippocampus", "Prefrontal cortex"],
  },
  {
    id: "l11",
    classId: "c-hist",
    date: dayISO(0, 4),
    title: "Progressive Era Reforms",
    summary:
      "Connect social problems to reform movements. Begin DBQ preparation.",
    objectives: ["Categorize Progressive reforms"],
    materials: ["DBQ documents"],
    homework: "Outline DBQ argument",
    status: "planned",
    brainRegions: ["Hippocampus"],
  },
]

export const demoLessons: Lesson[] = rawLessons.map((l) => ({
  resources: [],
  suggestions: [],
  brainRegions: [],
  ...l,
}))

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const

export function getWeekStartISO(weekOffset: number): string {
  return toISODate(mondayOf(new Date(), weekOffset))
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function formatLongDate(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

export { thisMonday }
