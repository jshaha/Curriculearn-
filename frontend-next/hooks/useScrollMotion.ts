"use client";

import { useEffect, useState } from "react";

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export interface ScrollMotionState {
  y: number;
  progress: number;
  velocity: number;
}

export const useScrollMotion = (maxRangePx = 1600): ScrollMotionState => {
  const [state, setState] = useState<ScrollMotionState>({
    y: 0,
    progress: 0,
    velocity: 0
  });

  useEffect(() => {
    let lastY = window.scrollY;
    let lastTime = performance.now();

    const onScroll = () => {
      const now = performance.now();
      const y = window.scrollY;
      const dt = Math.max(now - lastTime, 8);
      const velocity = (y - lastY) / dt;
      const progress = clamp(y / maxRangePx, 0, 1);

      setState({
        y,
        progress,
        velocity
      });

      lastY = y;
      lastTime = now;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [maxRangePx]);

  return state;
};
