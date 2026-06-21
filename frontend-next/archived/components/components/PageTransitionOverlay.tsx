"use client";

import { AnimatePresence, motion } from "framer-motion";

import { useTransitionProvider } from "@/components/TransitionProvider";

export const PageTransitionOverlay = (): JSX.Element => {
  const { isTransitioning } = useTransitionProvider();

  return (
    <AnimatePresence>
      {isTransitioning ? (
        <motion.div
          key="page-transition-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-0 z-[120] bg-bg/70"
          aria-hidden="true"
        />
      ) : null}
    </AnimatePresence>
  );
};
