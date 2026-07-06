"use client";

import { useRef, useState } from "react";
import Markdown from "react-markdown";

import {
  buildPrintDocument,
  fetchOptimizedLesson,
  lessonToMarkdown
} from "@/lib/lessonMarkdown";

type Source = "result" | "manual";

const SAMPLE = `# Optimized Lesson

_Load an optimized result by its id, or paste your own Markdown here._

## How this works

Type or edit Markdown on the left. The preview updates live on the right.
When it looks right, click **Export to PDF** and choose "Save as PDF" in the
print dialog.

**Key concepts:** \`markdown\` \`pdf\`
`;

export default function ExportPage() {
  const [source, setSource] = useState<Source>("result");
  const [resultId, setResultId] = useState("");
  const [markdown, setMarkdown] = useState(SAMPLE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("Lesson");

  const previewRef = useRef<HTMLDivElement>(null);

  async function loadResult() {
    setError(null);
    if (!resultId.trim()) {
      setError("Enter a result_id first.");
      return;
    }
    setLoading(true);
    try {
      const lesson = await fetchOptimizedLesson(resultId);
      setMarkdown(lessonToMarkdown(lesson));
      setTitle(lesson.title || "Lesson");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load result.");
    } finally {
      setLoading(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setMarkdown(text);
    setTitle(file.name.replace(/\.(md|markdown|txt)$/i, "") || "Lesson");
    setError(null);
  }

  function exportPdf() {
    // Reuse the already-rendered preview HTML so the PDF matches the preview
    // exactly. Falls back gracefully if the preview node isn't mounted.
    const bodyHtml = previewRef.current?.innerHTML ?? "";
    const derivedTitle =
      markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || title || "Lesson";

    const win = window.open("", "_blank");
    if (!win) {
      setError(
        "Pop-up blocked. Allow pop-ups for this site, then click Export again."
      );
      return;
    }
    win.document.write(buildPrintDocument(derivedTitle, bodyHtml));
    win.document.close();
    win.focus();
    // Give the new document a tick to lay out before invoking print.
    win.onload = () => {
      win.print();
    };
    // Fallback for browsers that fire load synchronously on written docs.
    setTimeout(() => {
      try {
        win.print();
      } catch {
        /* already printed */
      }
    }, 400);
  }

  const tabBtn = (s: Source, label: string) =>
    `px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
      source === s
        ? "bg-[#1a1a1a] text-[#FF8A1A] border-b-2 border-[#FF8A1A]"
        : "text-[#888] hover:text-[#ededed]"
    }`;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold">
            Export lesson to <span className="text-[#FF8A1A]">PDF</span>
          </h1>
          <p className="mt-2 max-w-2xl text-[#888]">
            Pull an optimized lesson straight from the agents, or paste your own
            Markdown. Edit freely, then export a clean PDF.
          </p>
        </header>

        {/* Source picker */}
        <div className="mb-4 flex gap-2 border-b border-[#222]">
          <button className={tabBtn("result", "result")} onClick={() => setSource("result")}>
            From optimized result
          </button>
          <button className={tabBtn("manual", "manual")} onClick={() => setSource("manual")}>
            Paste / upload Markdown
          </button>
        </div>

        {source === "result" ? (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <input
              value={resultId}
              onChange={(e) => setResultId(e.target.value)}
              placeholder="result_id (returned by /api/optimize)"
              className="min-w-[320px] flex-1 rounded-md border border-[#333] bg-[#111] px-3 py-2 text-sm outline-none focus:border-[#FF8A1A]"
            />
            <button
              onClick={loadResult}
              disabled={loading}
              className="rounded-md bg-[#FF8A1A] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load result"}
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#333] bg-[#111] px-4 py-2 text-sm hover:border-[#FF8A1A]">
              <input
                type="file"
                accept=".md,.markdown,.txt"
                onChange={onFile}
                className="hidden"
              />
              Upload a .md file
            </label>
            <span className="ml-3 text-sm text-[#888]">
              or just type in the editor below.
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-[#5a2020] bg-[#2a1010] px-4 py-3 text-sm text-[#ff9a9a]">
            {error}
          </div>
        )}

        {/* Editor + preview */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="flex flex-col">
            <div className="mb-2 text-xs uppercase tracking-wide text-[#888]">
              Markdown
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              spellCheck={false}
              className="min-h-[520px] flex-1 resize-y rounded-md border border-[#333] bg-[#0d0d0d] p-4 font-mono text-sm leading-relaxed outline-none focus:border-[#FF8A1A]"
            />
          </section>

          <section className="flex flex-col">
            <div className="mb-2 text-xs uppercase tracking-wide text-[#888]">
              Preview
            </div>
            <div
              ref={previewRef}
              className="markdown-preview min-h-[520px] flex-1 overflow-auto rounded-md border border-[#333] bg-white p-6 text-[#1a1a1a]"
            >
              <Markdown>{markdown}</Markdown>
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={exportPdf}
            className="rounded-md bg-[#FF8A1A] px-6 py-3 text-sm font-semibold text-black hover:brightness-110"
          >
            Export to PDF
          </button>
        </div>
      </div>

      {/* Scoped preview typography — kept inline so it never touches globals.css */}
      <style>{`
        .markdown-preview h1 { font-size: 1.8rem; font-weight: 700; margin: 0 0 .4rem; border-bottom: 3px solid #FF8A1A; padding-bottom: .3rem; }
        .markdown-preview h2 { font-size: 1.3rem; font-weight: 600; color: #b8600f; margin: 1.5rem 0 .4rem; }
        .markdown-preview h3 { font-size: 1.1rem; font-weight: 600; margin: 1.1rem 0 .3rem; }
        .markdown-preview p { margin: .55rem 0; line-height: 1.65; }
        .markdown-preview ul, .markdown-preview ol { margin: .55rem 0 .55rem 1.4rem; }
        .markdown-preview li { margin: .2rem 0; }
        .markdown-preview code { font-family: Menlo, Consolas, monospace; font-size: .85em; background: #f3f3f3; border: 1px solid #e2e2e2; border-radius: 4px; padding: 1px 6px; }
        .markdown-preview em { color: #555; }
        .markdown-preview blockquote { margin: .8rem 0; padding-left: 1rem; border-left: 3px solid #ddd; color: #444; }
      `}</style>
    </main>
  );
}
