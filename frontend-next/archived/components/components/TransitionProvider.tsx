"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useEffect } from "react";
import type { ReactNode } from "react";

import type { SectionId } from "@/content/siteContent";
import { preloadBrainSharedData } from "@/three/brainShared";

export interface BrainPose {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  scale: number;
}

interface TransitionContextValue {
  transitioningSectionId: SectionId | null;
  isTransitioning: boolean;
  startSectionTransition: (sectionId: SectionId) => void;
  finishSectionTransition: () => void;
  clearSectionTransition: () => void;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

export const TransitionProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [transitioningSectionId, setTransitioningSectionId] =
    useState<SectionId | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    void preloadBrainSharedData();
  }, []);

  const startSectionTransition = useCallback((sectionId: SectionId) => {
    setTransitioningSectionId(sectionId);
    setIsTransitioning(true);
  }, []);

  const finishSectionTransition = useCallback(() => {
    setIsTransitioning(false);
    window.setTimeout(() => {
      setTransitioningSectionId(null);
    }, 120);
  }, []);

  const clearSectionTransition = useCallback(() => {
    setIsTransitioning(false);
    setTransitioningSectionId(null);
  }, []);

  const value = useMemo(
    () => ({
      transitioningSectionId,
      isTransitioning,
      startSectionTransition,
      finishSectionTransition,
      clearSectionTransition
    }),
    [clearSectionTransition, finishSectionTransition, isTransitioning, startSectionTransition, transitioningSectionId]
  );

  return <TransitionContext.Provider value={value}>{children}</TransitionContext.Provider>;
};

export const useTransitionProvider = (): TransitionContextValue => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("useTransitionProvider must be used within TransitionProvider");
  }
  return context;
};
