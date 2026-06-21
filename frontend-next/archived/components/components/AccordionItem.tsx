"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { AccordionEntry } from "@/content/sections";
import { MediaSlot } from "@/components/MediaSlot";

interface AccordionItemProps {
  item: AccordionEntry;
  isOpen: boolean;
  onToggle: () => void;
  controlsId: string;
}

const subsectionLabel: Record<"context" | "whatIBuilt" | "results", string> = {
  context: "Context",
  whatIBuilt: "What I did",
  results: "Results"
};

export const AccordionItem = ({
  item,
  isOpen,
  onToggle,
  controlsId
}: AccordionItemProps): JSX.Element => {
  const shownTags = (item.tags ?? []);

  return (
    <article className="rounded-[22px] bg-fg/[0.015] px-4 py-4 transition-colors duration-150 hover:bg-fg/[0.025] sm:px-5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={controlsId}
        className="group grid w-full gap-5 text-left sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:items-start"
      >
        <div className="w-full max-w-[112px]">
          <MediaSlot media={item.media} label={item.role} />
          <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted">
            {item.dates}
          </p>
        </div>

        <div className="min-w-0">
          <h3 className="text-[1.28rem] font-medium tracking-[-0.03em] text-fg sm:text-[1.48rem]">
            {item.role}
          </h3>
          <p className="mt-1 text-[1rem] text-fg/64">{item.org}</p>

          {shownTags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {shownTags.map((tag) => (
                <span
                  key={`${item.id}-${tag}`}
                  className="rounded-full border border-fg/10 px-3 py-1.5 font-mono text-[0.56rem] uppercase tracking-[0.13em] text-fg/56"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-start gap-2 text-fg/46 sm:justify-end">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] transition-colors duration-150 group-hover:text-accent">
            {isOpen ? "Close" : "Open"}
          </span>
          <span
            className={`inline-block text-sm transition-transform duration-200 ${
              isOpen ? "rotate-180 text-accent" : "text-fg/46"
            }`}
            aria-hidden="true"
          >
            ˅
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={controlsId}
            key={`${item.id}-content`}
            initial={{ height: 0, opacity: 0, y: 2 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="ml-0 mt-6 max-w-[70ch] space-y-5 text-[1.01rem] leading-[1.75] text-fg/78 sm:ml-[132px]">
              <p>{item.summary}</p>

              {item.body.map((paragraph, index) => (
                <p key={`${item.id}-body-${index}`}>{paragraph}</p>
              ))}

              {item.sections
                ? (Object.keys(item.sections) as Array<keyof typeof subsectionLabel>).map((key) => {
                    const paragraphs = item.sections?.[key] ?? [];
                    if (paragraphs.length === 0) {
                      return null;
                    }

                    const bulletCandidates = paragraphs.map((paragraph) => {
                      const normalized = paragraph.trim();
                      if (normalized.startsWith("- ")) {
                        return normalized.slice(2).trim();
                      }
                      return null;
                    });
                    const isBulletSection =
                      bulletCandidates.length > 0 &&
                      bulletCandidates.every((candidate) => candidate !== null);

                    return (
                      <section key={`${item.id}-${key}`} className="space-y-3">
                        <h4 className="text-[1.02rem] font-medium tracking-[-0.02em] text-fg">
                          {subsectionLabel[key]}
                        </h4>
                        {isBulletSection ? (
                          <ul className="list-disc space-y-2 pl-5">
                            {bulletCandidates.map((bullet, index) => (
                              <li key={`${item.id}-${key}-bullet-${index}`}>{bullet}</li>
                            ))}
                          </ul>
                        ) : (
                          paragraphs.map((paragraph, index) => (
                            <p key={`${item.id}-${key}-${index}`}>{paragraph}</p>
                          ))
                        )}
                      </section>
                    );
                  })
                : null}

              {item.impactBullets && item.impactBullets.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 text-fg/72">
                  {item.impactBullets.slice(0, 3).map((bullet) => (
                    <li key={`${item.id}-${bullet}`}>{bullet}</li>
                  ))}
                </ul>
              ) : null}

              {/* <div className="max-w-[240px] pt-1 sm:max-w-[280px]">
                <MediaSlot media={item.media} label={item.role} />
              </div> */}

              {item.links && item.links.length > 0 ? (
                <div className="flex flex-wrap gap-4 text-[0.94rem]">
                  {item.links.map((link) => (
                    <a
                      key={`${item.id}-${link.href}`}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-fg/18 underline-offset-4 transition-colors duration-150 hover:text-accent hover:decoration-accent"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : null}

              {item.note ? <p className="text-sm leading-relaxed text-muted">{item.note}</p> : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
};
