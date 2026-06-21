"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/AppHeader";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/Breadcrumbs";
import { useTransitionProvider } from "@/components/TransitionProvider";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface EditorialLayoutProps {
  breadcrumbs?: BreadcrumbItem[];
  backHref?: string;
  backLabel?: string;
  meta?: ReactNode;
  title: string;
  dek?: string;
  chips?: string[];
  hero?: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
  contentId?: string;
}

export const EditorialLayout = ({
  breadcrumbs,
  backHref,
  backLabel = "Back",
  meta,
  title,
  dek,
  chips,
  hero,
  intro,
  children,
  className,
  contentId
}: EditorialLayoutProps): JSX.Element => {
  const { finishSectionTransition } = useTransitionProvider();
  const setHover = useUIStore((state) => state.setHover);

  useEffect(() => {
    finishSectionTransition();
  }, [finishSectionTransition]);

  return (
    <div className={cn("min-h-screen bg-bg text-fg", className)}>
      <AppHeader />

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-[1240px] px-6 pb-24 pt-2 sm:px-10 sm:pt-4"
      >
        <div className="mx-auto w-full max-w-[820px]">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <Breadcrumbs items={breadcrumbs} />
          ) : backHref ? (
            <div className="mb-8">
              <Link
                href={backHref}
                onClick={() => {
                  if (backHref === "/") {
                    setHover(null);
                  }
                }}
                className="inline-flex rounded-[10px] border border-fg/16 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-fg/72 transition-colors duration-150 hover:border-accent hover:text-accent"
              >
                {backLabel}
              </Link>
            </div>
          ) : null}

          {meta ? <div className="mb-6">{meta}</div> : null}

          <section>
            <h1 className="max-w-[12ch] text-[clamp(3.8rem,11vw,6.9rem)] font-semibold leading-[0.9] tracking-[-0.06em] text-fg">
              {title}
              <span className="text-accent">.</span>
            </h1>
            {dek ? (
              <p className="mt-6 max-w-[68ch] text-[1.02rem] leading-[1.78] text-fg/74 sm:text-[1.1rem]">
                {dek}
              </p>
            ) : null}
            {chips && chips.length > 0 ? (
              <div className="mt-7 flex flex-wrap gap-2.5">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-fg/10 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-fg/58"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          {hero ? <section className="mt-12 sm:mt-14">{hero}</section> : null}
          {intro ? <section className="mt-10 sm:mt-12">{intro}</section> : null}
          <section id={contentId} className="mt-14 sm:mt-16">
            {children}
          </section>
        </div>
      </motion.main>
    </div>
  );
};
