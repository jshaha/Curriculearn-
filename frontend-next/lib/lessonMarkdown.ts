// Converts optimized-lesson agent output into Markdown, and Markdown into a
// print-ready HTML document. New, self-contained module — safe to add without
// touching the existing API client or pages.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/** A single lesson segment as emitted by the optimizer agents. */
export interface LessonSegment {
  id?: string;
  title: string;
  content: string;
  concepts?: string[];
}

/** A lesson shape accepted by the converter. Matches both `/api/result`
 *  (optimized_lesson) and `/api/download` (stripped) payloads. */
export interface LessonLike {
  title: string;
  segments: LessonSegment[];
  learning_score?: number;
  improvement?: number;
}

/** Full payload returned by GET /api/result/<result_id>. */
export interface ResultPayload {
  result_id: string;
  original_score: number;
  optimized_score: number;
  improvement: number;
  iterations: number;
  original_lesson: LessonLike;
  optimized_lesson: LessonLike;
}

/** Fetch an optimization result and return its OPTIMIZED lesson, decorated with
 *  the scores so they can appear in the exported document. */
export async function fetchOptimizedLesson(resultId: string): Promise<LessonLike> {
  const res = await fetch(`${API_BASE}/api/result/${resultId.trim()}`);
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? `No result found for id "${resultId}". Optimize a lesson first, then paste its result_id here.`
        : `Failed to load result (${res.status}).`
    );
  }
  const data = (await res.json()) as ResultPayload;
  return {
    title: data.optimized_lesson.title,
    segments: data.optimized_lesson.segments,
    learning_score: data.optimized_score,
    improvement: data.improvement
  };
}

/** Convert a lesson object into clean Markdown. This is the canonical mapping
 *  from agent output → document:
 *    lesson.title       -> # H1
 *    score/improvement  -> italic metadata line
 *    segment.title      -> ## H2
 *    segment.content    -> paragraph (already plain prose)
 *    segment.concepts[] -> "**Key concepts:** `a` `b`" line
 */
export function lessonToMarkdown(lesson: LessonLike): string {
  const lines: string[] = [];
  lines.push(`# ${lesson.title || "Optimized Lesson"}`);

  const meta: string[] = [];
  if (typeof lesson.learning_score === "number") {
    meta.push(`Learning score: ${Math.round(lesson.learning_score)}/100`);
  }
  if (typeof lesson.improvement === "number" && lesson.improvement > 0) {
    meta.push(`Improvement: +${Math.round(lesson.improvement)} points`);
  }
  if (meta.length) {
    lines.push("");
    lines.push(`_${meta.join(" · ")}_`);
  }

  for (const seg of lesson.segments || []) {
    lines.push("");
    lines.push(`## ${seg.title || "Untitled section"}`);
    lines.push("");
    lines.push((seg.content || "").trim());
    if (seg.concepts && seg.concepts.length) {
      const tags = seg.concepts.map((c) => `\`${c}\``).join(" ");
      lines.push("");
      lines.push(`**Key concepts:** ${tags}`);
    }
  }

  return lines.join("\n") + "\n";
}

/** Escape text for safe interpolation into the print HTML title. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Wrap already-rendered markdown HTML in a full, print-styled document.
 *  Opened in a new window so the browser's "Save as PDF" produces a clean,
 *  paginated file — no external assets, no dependency on app globals. */
export function buildPrintDocument(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title || "Lesson")}</title>
<style>
  @page { margin: 20mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, "Times New Roman", serif;
    color: #1a1a1a;
    line-height: 1.65;
    max-width: 760px;
    margin: 0 auto;
    padding: 24px;
  }
  h1 {
    font-size: 2rem;
    line-height: 1.2;
    margin: 0 0 0.4rem;
    color: #111;
    border-bottom: 3px solid #FF8A1A;
    padding-bottom: 0.4rem;
  }
  h2 {
    font-size: 1.35rem;
    margin: 2rem 0 0.5rem;
    color: #b8600f;
  }
  h3 { font-size: 1.1rem; margin: 1.4rem 0 0.4rem; }
  p { margin: 0.6rem 0; }
  ul, ol { margin: 0.6rem 0 0.6rem 1.4rem; }
  code {
    font-family: "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 0.85em;
    background: #f3f3f3;
    border: 1px solid #e2e2e2;
    border-radius: 4px;
    padding: 1px 6px;
  }
  em { color: #555; }
  strong { color: #111; }
  blockquote {
    margin: 0.8rem 0;
    padding-left: 1rem;
    border-left: 3px solid #ddd;
    color: #444;
  }
  @media print {
    body { padding: 0; }
    h2 { break-after: avoid; }
    p, li { break-inside: avoid; }
  }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
