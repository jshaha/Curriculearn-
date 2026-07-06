# pdf_export — lesson → Markdown → PDF

Self-contained export layer added **without modifying any existing file**, so it
won't collide with concurrent work on the main codebase.

## What it does

The optimizer agents emit a `StructuredLesson` (`title` + `segments[]`, each with
`title`, `content`, `concepts[]`). Nothing in the app turned that into a document —
`/api/download` only returns JSON. This module fills the gap.

- **`lesson_to_markdown.py`** — pure, dependency-free converter. Server-side twin of
  `frontend-next/lib/lessonMarkdown.ts`, so both paths produce identical Markdown.
- **PDF rendering happens client-side** in the new `/export` route (browser
  "Save as PDF"), so no PDF library / system deps are required.

## Try the converter

```bash
python backend/pdf_export/lesson_to_markdown.py optimization_result.json
```

Accepts an `OptimizationResult`, a `StructuredLesson`, `/api/result`'s
`optimized_lesson`, or `/api/download`'s stripped payload.

## Frontend

Open `/export` in the Next app. Load an optimized lesson by its `result_id`
(returned from `POST /api/optimize`) **or** paste/upload your own Markdown, edit,
then **Export to PDF**.

## Optional: add a server-side Markdown endpoint later

When the other Claude is done and you want a server route too, add this to
`backend/api_server.py` (one function, no edits to existing code):

```python
from pdf_export import lesson_to_markdown  # backend/ is already on sys.path

@app.route('/api/export/<result_id>.md', methods=['GET'])
def export_markdown(result_id):
    if result_id not in results_db:
        return jsonify({"error": "Result not found"}), 404
    md = lesson_to_markdown(results_db[result_id]["result"])
    return app.response_class(md, mimetype='text/markdown')
```
