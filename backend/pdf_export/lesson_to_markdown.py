"""Convert optimizer agent output into Markdown.

Self-contained, dependency-free module. Mirrors the frontend converter in
`frontend-next/lib/lessonMarkdown.ts` so server- and client-side exports match.

The optimizer emits a StructuredLesson (see backend/neurocompiler/schemas.py):
    lesson.title       -> # H1
    segment.title      -> ## H2
    segment.content    -> paragraph
    segment.concepts[] -> "**Key concepts:** `a` `b`" line

Accepts either:
  * an OptimizationResult / StructuredLesson pydantic object, or
  * a plain dict shaped like /api/result's `optimized_lesson`
    or /api/download's stripped payload.
"""

from __future__ import annotations

from typing import Any, Dict, List


def _as_dict(lesson: Any) -> Dict[str, Any]:
    """Normalize a pydantic lesson (or result) or dict into a plain dict."""
    # OptimizationResult -> use its best_lesson
    if hasattr(lesson, "best_lesson"):
        result = lesson
        data = result.best_lesson.model_dump()
        data["learning_score"] = getattr(result, "best_score", None)
        improvement = getattr(result, "best_score", 0) - getattr(result, "original_score", 0)
        data["improvement"] = improvement
        return data
    if hasattr(lesson, "model_dump"):  # StructuredLesson
        return lesson.model_dump()

    data = dict(lesson)
    # Dict form of an OptimizationResult (e.g. optimization_result.json).
    if "best_lesson" in data:
        best = dict(data["best_lesson"])
        if "best_score" in data:
            best.setdefault("learning_score", data["best_score"])
        if "improvement" in data:
            best.setdefault("improvement", data["improvement"])
        elif "best_score" in data and "original_score" in data:
            best.setdefault("improvement", data["best_score"] - data["original_score"])
        return best
    return data


def lesson_to_markdown(lesson: Any) -> str:
    """Return clean Markdown for a lesson / optimization result."""
    data = _as_dict(lesson)
    lines: List[str] = [f"# {data.get('title') or 'Optimized Lesson'}"]

    meta: List[str] = []
    score = data.get("learning_score")
    if isinstance(score, (int, float)):
        meta.append(f"Learning score: {round(score)}/100")
    improvement = data.get("improvement")
    if isinstance(improvement, (int, float)) and improvement > 0:
        meta.append(f"Improvement: +{round(improvement)} points")
    if meta:
        lines += ["", f"_{' · '.join(meta)}_"]

    for seg in data.get("segments", []):
        lines += ["", f"## {seg.get('title') or 'Untitled section'}", "",
                  (seg.get("content") or "").strip()]
        concepts = seg.get("concepts") or []
        if concepts:
            tags = " ".join(f"`{c}`" for c in concepts)
            lines += ["", f"**Key concepts:** {tags}"]

    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    import json
    import sys

    if len(sys.argv) < 2:
        print("Usage: python lesson_to_markdown.py <lesson_or_result.json>")
        sys.exit(1)
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        print(lesson_to_markdown(json.load(f)))
