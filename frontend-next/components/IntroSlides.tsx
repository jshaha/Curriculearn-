"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SEEN_KEY = "curriculearn-intro-seen";
// Dispatch this event (see openIntro) to reopen the slides from anywhere.
const OPEN_EVENT = "curriculearn-open-intro";

export const openIntro = (): void => {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
};

const PIPELINE = [
  { step: "Parse", detail: "Split the PDF, slides, or doc into lesson segments" },
  { step: "Simulate", detail: "Embed each segment as a 384-dim semantic “brain state”" },
  { step: "Score", detail: "Turn how those states move into learning metrics" },
  { step: "Diagnose", detail: "Claude pinpoints overload, abrupt jumps, weak recall" },
  { step: "Rewrite", detail: "Claude drafts targeted edits to the weak segments" },
  { step: "Verify", detail: "Re-simulate each rewrite and keep it only if it scores higher" },
];

const METRICS = [
  { name: "Cognitive load", dir: "lower is better", detail: "How much new, complex material lands at once" },
  { name: "Engagement", dir: "higher", detail: "How varied and alive the content is versus flat" },
  { name: "Concept flow", dir: "higher", detail: "Whether each idea builds on the last or jumps abruptly" },
  { name: "Retention", dir: "higher", detail: "Whether earlier concepts get revisited and reinforced" },
];

interface Slide {
  eyebrow: string;
  title: string;
  body: ReactNode;
}

const SLIDES: Slide[] = [
  {
    eyebrow: "The problem",
    title: "Teachers find out a lesson didn't land after they've taught it.",
    body: (
      <div className="space-y-4">
        <p>
          A slide that crams in five new terms, or a jump between topics with no bridge, loses
          students. Today you only learn that from blank faces and quiz scores.
        </p>
        <p>
          <span className="text-fg">Curriculearn asks the question earlier:</span> where exactly
          does this lesson overload or lose a student, and what change would fix it? It answers
          before the lesson is ever taught.
        </p>
      </div>
    ),
  },
  {
    eyebrow: "How it works",
    title: "A simulate → diagnose → rewrite → verify loop.",
    body: (
      <ol className="grid gap-2.5 sm:grid-cols-2">
        {PIPELINE.map((p, i) => (
          <li key={p.step} className="flex gap-3 rounded-md border border-fg/10 bg-fg/[0.02] p-3">
            <span className="font-mono text-[0.7rem] text-accent">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-fg">{p.step}</div>
              <div className="mt-0.5 text-[0.82rem] leading-snug text-fg/60">{p.detail}</div>
            </div>
          </li>
        ))}
      </ol>
    ),
  },
  {
    eyebrow: "What gets measured",
    title: "Four signals roll up into one learning score.",
    body: (
      <div className="space-y-4">
        <ul className="space-y-2.5">
          {METRICS.map((m) => (
            <li key={m.name} className="flex flex-col gap-0.5 border-l-2 border-accent/50 pl-3 sm:flex-row sm:items-baseline sm:gap-3">
              <span className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-fg sm:w-36 sm:flex-shrink-0">{m.name}</span>
              <span className="text-[0.85rem] text-fg/60">{m.detail}</span>
            </li>
          ))}
        </ul>
        <p className="text-[0.8rem] text-fg/45">
          The “brain” here is a lightweight proxy: sentence embeddings stand in for neural
          response models, which keeps it fast enough to run in a loop. Each segment also
          lights up regions of the 3D brain view.
        </p>
      </div>
    ),
  },
  {
    eyebrow: "Try it",
    title: "Upload a lesson and watch it get optimized.",
    body: (
      <div className="space-y-4">
        <ol className="space-y-2 text-[0.92rem]">
          <li><span className="mr-2 font-mono text-accent">1</span>Open any demo class.</li>
          <li><span className="mr-2 font-mono text-accent">2</span>Click <span className="text-fg">Upload Material</span> and pick a PDF, PPTX, DOCX, or TXT lesson, or click <span className="text-fg">try a sample lesson</span>.</li>
          <li><span className="mr-2 font-mono text-accent">3</span>When the analysis opens, review the diagnosed issues, then hit <span className="text-fg">Optimize</span> to see before/after scores and the edits that were kept.</li>
          <li><span className="mr-2 font-mono text-accent">4</span>Back on the class page, click a metric under the brain to explore it across all of the class's lessons.</li>
        </ol>
        <p className="text-[0.8rem] text-fg/45">
          You're signed in as a private guest, so your uploads are visible only to you. The backend
          runs on a free server that sleeps when idle, so the first request can take an extra
          30–60 seconds while it wakes up.
        </p>
      </div>
    ),
  },
];

export function IntroSlides() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
    const reopen = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage unavailable; slides will just show again next visit */
    }
  }, []);

  const isLast = index === SLIDES.length - 1;
  const next = useCallback(() => (isLast ? close() : setIndex((i) => i + 1)), [isLast, close]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, next, prev]);

  const slide = SLIDES[index];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="About Curriculearn"
            className="relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-fg/12 bg-[#0d0e11] text-fg shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-[2px] bg-fg/10">
              <div
                className="h-full bg-accent transition-[width] duration-300"
                style={{ width: `${((index + 1) / SLIDES.length) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between px-6 pt-5 sm:px-10">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.26em] text-fg/45">
                Curriculearn · {index + 1}/{SLIDES.length}
              </span>
              <button
                onClick={close}
                className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-fg/45 transition-colors hover:text-fg"
              >
                Skip
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-6 sm:px-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-3 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-accent">
                    {slide.eyebrow}
                  </div>
                  <h2 className="mb-6 text-[1.6rem] font-light leading-tight tracking-tight sm:text-[2rem]">
                    {slide.title}
                  </h2>
                  <div className="text-[0.95rem] leading-relaxed text-fg/70">{slide.body}</div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between gap-4 px-6 pb-6 pt-6 sm:px-10">
              <div className="flex gap-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-accent" : "w-1.5 bg-fg/25 hover:bg-fg/45"}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {index > 0 && (
                  <button
                    onClick={prev}
                    className="px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-fg/60 transition-colors hover:text-fg"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="rounded-md bg-accent px-5 py-2.5 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-90"
                >
                  {isLast ? "Start exploring" : "Next"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
