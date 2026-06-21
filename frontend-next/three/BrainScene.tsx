"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";

import type { SectionId } from "@/content/siteContent";
import type { BrainPose } from "@/components/TransitionProvider";
import { useUIStore } from "@/lib/store";

import { BrainPoints, type PointerState } from "./BrainPoints";
import { CAMERA_DISTANCE, CAMERA_FOV, FOG_FAR, FOG_NEAR } from "./brainTuning";

interface BrainSceneProps {
  navigationSectionId?: SectionId | null;
  onNavigationPose?: (pose: BrainPose) => void;
  mobileMode?: boolean;
}

export const BrainScene = ({
  navigationSectionId = null,
  onNavigationPose,
  mobileMode = false
}: BrainSceneProps): JSX.Element => {
  const hoveredSectionId = useUIStore((state) => state.hoveredSectionId);
  const isModalOpen = useUIStore((state) => state.isModalOpen);
  const isScrolling = useUIStore((state) => state.isScrolling);
  const prefersReducedMotion = useUIStore((state) => state.prefersReducedMotion);

  const [showDebugAnchors, setShowDebugAnchors] = useState(false);
  const [showSpotLegend, setShowSpotLegend] = useState(false);
  const [showAllSpotsDebug, setShowAllSpotsDebug] = useState(false);
  const [previewRegionStep, setPreviewRegionStep] = useState(0);

  const pointerRef = useRef<PointerState>({ x: 0, y: 0, inside: false });
  const pointerReleaseTimeoutRef = useRef<number | null>(null);

  const camera = useMemo(
    () => ({
      position: [0, 0, CAMERA_DISTANCE] as [number, number, number],
      fov: CAMERA_FOV
    }),
    []
  );

  useEffect(() => {
    if (mobileMode) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = 1 - (event.clientY / window.innerHeight) * 2;
      pointerRef.current.inside = true;
    };

    const onPointerExit = (event: PointerEvent) => {
      if (event.relatedTarget === null) {
        pointerRef.current.inside = false;
        pointerRef.current.x = 0;
        pointerRef.current.y = 0;
      }
    };

    const onBlur = () => {
      pointerRef.current.inside = false;
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerExit);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerExit);
      window.removeEventListener("blur", onBlur);
    };
  }, [mobileMode]);

  useEffect(() => {
    return () => {
      if (pointerReleaseTimeoutRef.current !== null) {
        window.clearTimeout(pointerReleaseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const previewOrder: Array<SectionId | null> = [
      null,
      "experience",
      "projects",
      "leadership",
      "interests",
      "about"
    ];

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === "d") {
        setShowDebugAnchors((current) => !current);
      } else if (key === "r") {
        setPreviewRegionStep((current) => (current + 1) % previewOrder.length);
      } else if (key === "l") {
        setShowSpotLegend((current) => !current);
      } else if (key === "s") {
        setShowAllSpotsDebug((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const previewOrder: Array<SectionId | null> = [
    null,
    "experience",
    "projects",
    "leadership",
    "interests",
    "about"
  ];

  const debugPreviewSectionId = previewOrder[previewRegionStep];

  const updatePointerFromEvent = (
    event: ReactPointerEvent<HTMLDivElement>,
    keepInside: boolean
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      pointerRef.current.inside = false;
      return;
    }

    const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const normalizedY = 1 - ((event.clientY - rect.top) / rect.height) * 2;

    pointerRef.current.x = normalizedX;
    pointerRef.current.y = normalizedY;
    pointerRef.current.inside = keepInside;
  };

  const handleMobilePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!mobileMode) {
      return;
    }

    if (pointerReleaseTimeoutRef.current !== null) {
      window.clearTimeout(pointerReleaseTimeoutRef.current);
      pointerReleaseTimeoutRef.current = null;
    }

    updatePointerFromEvent(event, true);
  };

  const handleMobilePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!mobileMode) {
      return;
    }

    updatePointerFromEvent(event, true);
  };

  const handleMobilePointerRelease = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!mobileMode) {
      return;
    }

    updatePointerFromEvent(event, true);

    if (pointerReleaseTimeoutRef.current !== null) {
      window.clearTimeout(pointerReleaseTimeoutRef.current);
    }

    pointerReleaseTimeoutRef.current = window.setTimeout(() => {
      pointerRef.current.inside = false;
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
      pointerReleaseTimeoutRef.current = null;
    }, 120);
  };

  return (
    <div
      className="relative h-full w-full"
      aria-label="Interactive brain scene"
      onPointerDown={handleMobilePointerDown}
      onPointerMove={handleMobilePointerMove}
      onPointerUp={handleMobilePointerRelease}
      onPointerCancel={handleMobilePointerRelease}
      onPointerLeave={handleMobilePointerRelease}
    >
      <Canvas
        className="h-full w-full"
        camera={camera}
        dpr={[1.25, 2.25]}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#0b0c0f"), 1);
        }}
      >
        <fog attach="fog" args={["#0b0c0f", FOG_NEAR, FOG_FAR]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[2.4, 2.4, 4]} intensity={0.48} />
        <directionalLight position={[-2.6, 1.5, 2.2]} intensity={0.22} />

        <Suspense fallback={null}>
          <BrainPoints
            pointerRef={pointerRef}
            hoveredSectionId={hoveredSectionId}
            navigationSectionId={navigationSectionId}
            onNavigationPose={onNavigationPose}
            mobileMode={mobileMode}
            isModalOpen={isModalOpen}
            isScrolling={isScrolling}
            prefersReducedMotion={prefersReducedMotion}
            debugAnchors={showDebugAnchors && process.env.NODE_ENV === "development"}
            debugPreviewSectionId={
              process.env.NODE_ENV === "development" && showDebugAnchors
                ? debugPreviewSectionId
                : null
            }
            debugShowAllSpots={
              process.env.NODE_ENV === "development" && showAllSpotsDebug
            }
          />
        </Suspense>
      </Canvas>

      {process.env.NODE_ENV === "development" && showDebugAnchors ? (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded border border-accent/40 bg-black/60 px-3 py-2 text-xs text-fg/85">
          <div>Brain debug enabled (press D)</div>
          <div>
            Region preview (press R):{" "}
            {debugPreviewSectionId ? debugPreviewSectionId : "off"}
          </div>
          <div>Spot legend (press L): {showSpotLegend ? "on" : "off"}</div>
          <div>Show all spots (press S): {showAllSpotsDebug ? "on" : "off"}</div>
        </div>
      ) : null}

      {process.env.NODE_ENV === "development" && showSpotLegend ? (
        <div className="pointer-events-none absolute right-4 top-24 rounded border border-fg/20 bg-black/60 px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-fg/90">
          <div className="mb-1 text-muted">Spot mapping</div>
          <div>Experience: front-left</div>
          <div>Projects: front-right</div>
          <div>Leadership: rear-left</div>
          <div>Interests: rear-right</div>
          <div>About: top-mid</div>
        </div>
      ) : null}
    </div>
  );
};
