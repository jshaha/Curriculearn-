"use client";

import Image from "next/image";

import type { EditorialMedia } from "@/content/editorialTypes";
import { cn } from "@/lib/utils";

interface ItemMediaProps {
  media?: EditorialMedia;
  title: string;
  className?: string;
  sizes?: string;
  roundedClassName?: string;
}

const aspectClassMap: Record<"square" | "landscape" | "portrait", string> = {
  square: "aspect-square",
  landscape: "aspect-[4/3]",
  portrait: "aspect-[3/4]"
};

export const ItemMedia = ({
  media,
  title,
  className,
  sizes = "(max-width: 768px) 100vw, 180px",
  roundedClassName = "rounded-[5px]"
}: ItemMediaProps): JSX.Element => {
  const mediaKind = media?.kind ?? "none";
  const aspect = media?.aspect ?? "landscape";
  const src = media?.src;
  const alt = media?.alt ?? `${title} media`;
  const placeholderMonogram = media?.placeholderMonogram ?? title.slice(0, 1);
  const placeholderText = media?.placeholderText ?? "Preview";

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-fg/10 bg-fg/[0.025]",
        roundedClassName,
        aspectClassMap[aspect],
        className
      )}
    >
      {mediaKind === "image" && src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover transition duration-200 ease-out group-hover:contrast-110"
        />
      ) : null}

      {mediaKind === "gif" && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover transition duration-200 ease-out group-hover:contrast-110" />
      ) : null}

      {mediaKind === "video" && src ? (
        <video
          src={src}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          aria-label={alt}
        />
      ) : null}

      {mediaKind === "logo" ? (
        src ? (
          <div className="relative h-full w-full p-5">
            <Image
              src={src}
              alt={alt}
              fill
              sizes={sizes}
              className="object-contain p-5 transition duration-200 ease-out group-hover:contrast-110"
            />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
            <span className="font-mono text-lg uppercase tracking-[0.12em] text-fg/76">
              {placeholderMonogram}
            </span>
            <span className="font-mono text-[0.56rem] uppercase tracking-[0.13em] text-fg/46">
              {placeholderText}
            </span>
          </div>
        )
      ) : null}

      {mediaKind === "none" ? (
        <div className="flex h-full w-full items-center justify-center">
          <span className="font-mono text-[0.56rem] uppercase tracking-[0.14em] text-fg/40">
            {placeholderText}
          </span>
        </div>
      ) : null}
    </div>
  );
};
