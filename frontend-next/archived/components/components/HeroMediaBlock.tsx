"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { HeroMedia } from "@/content/editorialTypes";
import { cn } from "@/lib/utils";

const aspectClassMap: Record<NonNullable<HeroMedia["aspect"]>, string> = {
  landscape: "aspect-[16/9]",
  portrait: "aspect-[4/5]",
  square: "aspect-square",
  ultrawide: "aspect-[2.2/1]"
};

export const HeroMediaBlock = ({
  media,
  className
}: {
  media: HeroMedia;
  className?: string;
}): JSX.Element => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const aspectClass = aspectClassMap[media.aspect ?? "landscape"];
  const isZoomable = media.type === "image" || media.type === "gif";

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isLightboxOpen]);

  const mediaContent =
    media.type === "video" ? (
      <video
        className="h-full w-full object-cover"
        src={media.src}
        poster={media.poster}
        autoPlay
        muted
        loop
        playsInline
        aria-label={media.alt}
      />
    ) : media.type === "gif" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={media.src} alt={media.alt} className="h-full w-full object-cover" />
    ) : (
      <Image src={media.src} alt={media.alt} fill sizes="(max-width: 1024px) 100vw, 960px" className="object-cover" priority />
    );

  return (
    <>
      {isZoomable ? (
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className={cn(
            "group relative block w-full overflow-hidden rounded-[5px] border border-fg/[0.08] bg-fg/[0.03] text-left shadow-[0_24px_80px_rgba(0,0,0,0.24)] transition-colors duration-150 hover:border-fg/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/70",
            aspectClass,
            className
          )}
          aria-label="Expand project image"
        >
          {mediaContent}
          <span className="pointer-events-none absolute right-4 top-4 rounded border border-fg/22 bg-bg/70 px-2 py-1 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-fg/72 backdrop-blur-[2px] transition-colors duration-150 group-hover:border-accent/55 group-hover:text-accent">
            Expand
          </span>
        </button>
      ) : (
        <div
          className={cn(
            "relative overflow-hidden rounded-[5px] border border-fg/[0.08] bg-fg/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.24)]",
            aspectClass,
            className
          )}
        >
          {mediaContent}
        </div>
      )}

      {isLightboxOpen && isZoomable ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/84 p-4 backdrop-blur-[2px] sm:p-8"
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded project image"
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-5 top-5 rounded-md border border-fg/28 bg-bg/65 px-2.5 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-fg/86 transition-colors duration-150 hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/70"
          >
            Close
          </button>

          <div
            className="relative max-h-[92vh] w-full max-w-[min(96vw,1500px)]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media.src}
              alt={media.alt}
              className="max-h-[92vh] w-full rounded-[5px] border border-fg/14 object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
};
