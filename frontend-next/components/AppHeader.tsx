"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";

import { siteContent } from "@/content/siteContent";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const CopyIcon = ({ state }: { state: "idle" | "copied" | "error" }): JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={cn(
      "h-3.5 w-3.5 transition-colors duration-150",
      "text-fg/46 group-hover:text-accent/86 group-focus-visible:text-accent/86"
    )}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="8.25" y="8.75" width="10.75" height="10.75" rx="2.6" />
    <path d="M6.4 14.15 5.45 7.65A2.25 2.25 0 0 1 7.67 5h7.5c1.04 0 1.96.68 2.24 1.68" />
    <path d="M16.4 6.55 18.55 8.65" />
  </svg>
);

export const AppHeader = ({ className }: { className?: string }): JSX.Element => {
  const setHover = useUIStore((state) => state.setHover);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [copyToast, setCopyToast] = useState<{ x: number; y: number; text: string } | null>(
    null
  );
  const resetTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const emailAddress = "kazuh@berkeley.edu";
  const emailDisplay = "kazuh [at] berkeley [dot] edu";

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const resetCopyState = (delayMs: number) => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setCopyState("idle");
      resetTimerRef.current = null;
    }, delayMs);
  };

  const showCopyToast = (x: number, y: number, text: string) => {
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
    const clampedX = clamp(x, 116, viewportWidth - 116);
    const clampedY = clamp(y, 44, viewportHeight - 12);

    setCopyToast({ x: clampedX, y: clampedY, text });

    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setCopyToast(null);
      toastTimerRef.current = null;
    }, 1200);
  };

  const handleCopyEmail = async (event: MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY, currentTarget } = event;
    const fallbackRect = currentTarget.getBoundingClientRect();
    const x = clientX > 0 ? clientX : fallbackRect.left + fallbackRect.width / 2;
    const y = clientY > 0 ? clientY : fallbackRect.top + 8;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(emailAddress);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = emailAddress;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopyState("copied");
      showCopyToast(x, y, "Copied to clipboard");
      resetCopyState(480);
    } catch {
      setCopyState("error");
      showCopyToast(x, y, "Copy failed");
      resetCopyState(900);
    }
  };

  const renderCopyEmailButton = (compact: boolean) => (
    <button
      type="button"
      onClick={handleCopyEmail}
      aria-label="Copy email address to clipboard"
      className="group relative inline-flex items-center gap-2 normal-case tracking-[0.08em] text-fg/72 transition-colors duration-150 hover:text-accent focus-visible:outline-none focus-visible:text-accent"
    >
      <span>{compact ? "email" : emailDisplay}</span>
      <CopyIcon state={copyState} />
      <span className="sr-only">
        {copyState === "copied"
          ? "Copied to clipboard"
          : copyState === "error"
            ? "Copy failed"
            : "Copy email"}
      </span>
    </button>
  );

  return (
    <header
      className={cn(
        "mx-auto min-h-[72px] w-full max-w-[1440px] px-6 pt-6 sm:min-h-[80px] sm:px-10 sm:pt-8",
        className
      )}
    >
      <div className="hidden w-full items-start justify-between sm:flex">
        <Link
          href="/"
          onClick={() => setHover(null)}
          className="font-mono text-[0.78rem] uppercase tracking-[0.24em] text-fg/82 transition-colors duration-150 hover:text-accent"
        >
          {siteContent.siteConfig.name}
        </Link>

        <nav
          className="flex items-center gap-4 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-fg/72 sm:gap-5"
          aria-label="Social links"
        >
          <a href={siteContent.siteConfig.links.blog} target="_blank" rel="noreferrer" className="transition-colors duration-150 hover:text-accent">
            Blog
          </a>
          <a href={siteContent.siteConfig.links.github} target="_blank" rel="noreferrer" className="transition-colors duration-150 hover:text-accent">
            GitHub
          </a>
          <a href={siteContent.siteConfig.links.linkedin} target="_blank" rel="noreferrer" className="transition-colors duration-150 hover:text-accent">
            LinkedIn
          </a>
          {renderCopyEmailButton(false)}
        </nav>
      </div>

      <div className="flex w-full flex-col gap-2.5 sm:hidden">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            onClick={() => setHover(null)}
            className="font-mono text-[0.78rem] uppercase tracking-[0.24em] text-fg/82 transition-colors duration-150 hover:text-accent"
          >
            {siteContent.siteConfig.name}
          </Link>
          {renderCopyEmailButton(true)}
        </div>
        <nav
          className="flex items-center gap-4 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-fg/72"
          aria-label="Social links"
        >
          <a href={siteContent.siteConfig.links.blog} target="_blank" rel="noreferrer" className="transition-colors duration-150 hover:text-accent">
            Blog
          </a>
          <a href={siteContent.siteConfig.links.github} target="_blank" rel="noreferrer" className="transition-colors duration-150 hover:text-accent">
            GitHub
          </a>
          <a href={siteContent.siteConfig.links.linkedin} target="_blank" rel="noreferrer" className="transition-colors duration-150 hover:text-accent">
            LinkedIn
          </a>
        </nav>
      </div>

      {copyToast ? (
        <div
          className="pointer-events-none fixed z-[70] whitespace-nowrap rounded-md border border-fg/20 bg-bg/92 px-2.5 py-1 font-mono text-[0.6rem] uppercase leading-none tracking-[0.1em] text-fg/86 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-[2px]"
          style={{ left: copyToast.x, top: copyToast.y - 12, transform: "translate(-50%, -100%)" }}
          role="status"
          aria-live="polite"
        >
          {copyToast.text}
        </div>
      ) : null}
    </header>
  );
};
