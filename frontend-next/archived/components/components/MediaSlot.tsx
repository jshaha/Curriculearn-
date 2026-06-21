import Image from "next/image";

import type { AccordionMedia } from "@/content/sections";
import { cn } from "@/lib/utils";

interface MediaSlotProps {
  media?: AccordionMedia;
  label: string;
  className?: string;
}

export const MediaSlot = ({ media, label, className }: MediaSlotProps): JSX.Element => {
  const type = media?.type ?? "placeholder";

  if ((type === "image" || type === "gif") && media?.src) {
    return (
      <div className={cn("relative aspect-square overflow-hidden rounded-[5px] border border-fg/12 bg-fg/[0.02]", className)}>
        <Image
          src={media.src}
          alt={media.alt ?? `${label} media`}
          fill
          sizes="(max-width: 768px) 28vw, 110px"
          className="object-cover"
          unoptimized={type === "gif"}
        />
      </div>
    );
  }

  if (type === "video" && media?.src) {
    return (
      <div className={cn("relative aspect-square overflow-hidden rounded-[5px] border border-fg/12 bg-fg/[0.02]", className)}>
        <video
          src={media.src}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
          aria-label={media.alt ?? `${label} media`}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-[5px] border border-fg/12 bg-fg/[0.015] p-4",
        className
      )}
      aria-label={`${label} placeholder media`}
    >
      <div className="absolute inset-0 opacity-[0.08]">
        <div className="h-px w-full bg-fg/70" style={{ marginTop: "30%" }} />
        <div className="h-px w-full bg-fg/70" style={{ marginTop: "24%" }} />
      </div>
      <div className="relative flex h-full flex-col justify-end gap-2">
        <div className="h-px w-3/5 bg-fg/24" />
        <div className="h-px w-1/2 bg-fg/20" />
        <span className="font-mono text-[0.56rem] uppercase tracking-[0.18em] text-fg/42">
          Redacted
        </span>
      </div>
    </div>
  );
};
