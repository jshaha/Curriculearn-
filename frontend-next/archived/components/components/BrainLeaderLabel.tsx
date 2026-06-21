"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

import type { SectionId } from "@/content/siteContent";
import { sectionMeta } from "@/content/sections";
import { siteContent } from "@/content/siteContent";

import { LABEL_LINE_PX, LABEL_OFFSET_PX } from "@/three/brainTuning";

interface BrainLeaderLabelProps {
  sectionId: SectionId | null;
  anchorRef: RefObject<THREE.Vector3>;
  brainGroupRef: RefObject<THREE.Group>;
  brainRadius: number;
}

const TITLE_BY_SECTION = sectionMeta.reduce(
  (accumulator, section) => {
    accumulator[section.id] = section.title.toUpperCase();
    return accumulator;
  },
  {
    experience: "EXPERIENCE",
    projects: "PROJECTS",
    leadership: "LEADERSHIP",
    interests: "INTERESTS",
    about: "ABOUT"
  } as Record<SectionId, string>
);

const WORLD_POS = new THREE.Vector3();
const NDC_POS = new THREE.Vector3();
const PROBE_WORLD = new THREE.Vector3();
const PROBE_NDC = new THREE.Vector3();
const PROBE_POINTS: ReadonlyArray<[number, number, number]> = [
  [0, 1, 0],
  [0, -1, 0],
  [1, 0, 0],
  [-1, 0, 0],
  [0, 0, 1],
  [0, 0, -1],
  [0.72, 0.72, 0],
  [-0.72, 0.72, 0],
  [0, 0.72, 0.72],
  [0, 0.72, -0.72]
];
const DOT_SIZE_PX = 6;
const DOT_RADIUS_PX = DOT_SIZE_PX / 2;
const LABEL_OUTSIDE_MARGIN_NDC = 0.08;
const LABEL_TOP_CLAMP_NDC = 0.74;
const LABEL_LINE_MAX_MULTIPLIER = 1.9;
const LONG_LINE_SECTIONS = new Set<SectionId>([
  "experience",
  "projects",
  "leadership",
  "interests",
  "about"
]);
const LONG_LINE_EXTRA_MARGIN_NDC = 0.1;
const LONG_LINE_TOP_CLAMP_NDC = 0.84;
const LONG_LINE_MAX_MULTIPLIER = 2.6;
const EXTRA_LONG_LINE_SECTIONS = new Set<SectionId>(["leadership", "interests"]);
const EXTRA_LONG_LINE_MARGIN_NDC = 0.06;
const EXTRA_LONG_LINE_TOP_CLAMP_NDC = 0.9;
const EXTRA_LONG_LINE_MAX_MULTIPLIER = 3.1;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const BrainLeaderLabel = ({
  sectionId,
  anchorRef,
  brainGroupRef,
  brainRadius
}: BrainLeaderLabelProps): JSX.Element | null => {
  const { camera, size } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const opacityRef = useRef(0);

  const accent = useMemo(() => siteContent.siteConfig.accentColor, []);

  useFrame(() => {
    const group = groupRef.current;
    const container = containerRef.current;
    const line = lineRef.current;
    const anchor = anchorRef.current;
    const brainGroup = brainGroupRef.current;

    if (!group || !container || !line || !anchor || !brainGroup) {
      return;
    }

    group.position.copy(anchor);
    group.getWorldPosition(WORLD_POS);
    NDC_POS.copy(WORLD_POS).project(camera);

    // Keep label above the projected top silhouette of the brain for readability.
    let brainTopNdc = Number.NEGATIVE_INFINITY;
    for (const probe of PROBE_POINTS) {
      PROBE_WORLD.set(
        probe[0] * brainRadius,
        probe[1] * brainRadius,
        probe[2] * brainRadius
      );
      brainGroup.localToWorld(PROBE_WORLD);
      PROBE_NDC.copy(PROBE_WORLD).project(camera);
      brainTopNdc = Math.max(brainTopNdc, PROBE_NDC.y);
    }

    const useLongLine =
      sectionId !== null && LONG_LINE_SECTIONS.has(sectionId);
    const useExtraLongLine =
      sectionId !== null && EXTRA_LONG_LINE_SECTIONS.has(sectionId);
    const labelTopClampNdc = useExtraLongLine
      ? EXTRA_LONG_LINE_TOP_CLAMP_NDC
      : useLongLine
        ? LONG_LINE_TOP_CLAMP_NDC
        : LABEL_TOP_CLAMP_NDC;
    const outsideMarginNdc =
      LABEL_OUTSIDE_MARGIN_NDC +
      (useLongLine ? LONG_LINE_EXTRA_MARGIN_NDC : 0) +
      (useExtraLongLine ? EXTRA_LONG_LINE_MARGIN_NDC : 0);

    const labelNdcY = clamp(brainTopNdc + outsideMarginNdc, -0.82, labelTopClampNdc);
    const minGapNdc = 0.04;
    const lineNdc = Math.max(minGapNdc, labelNdcY - NDC_POS.y);
    const lineMaxMultiplier = useExtraLongLine
      ? EXTRA_LONG_LINE_MAX_MULTIPLIER
      : useLongLine
        ? LONG_LINE_MAX_MULTIPLIER
        : LABEL_LINE_MAX_MULTIPLIER;
    const linePx = clamp(
      lineNdc * (size.height * 0.5),
      LABEL_LINE_PX,
      LABEL_LINE_PX * lineMaxMultiplier
    );
    line.style.height = `${linePx.toFixed(0)}px`;

    const targetOpacity = sectionId ? 1 : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * 0.22;
    const opacity = opacityRef.current;

    group.visible = opacity > 0.02;
    container.style.opacity = opacity.toFixed(3);
    container.style.transform = `translate3d(-50%, calc(-100% + ${DOT_RADIUS_PX}px), 0) translate3d(0, ${(
      -(1 - opacity) * LABEL_OFFSET_PX
    ).toFixed(1)}px, 0)`;
  });

  if (!sectionId) {
    return null;
  }

  return (
    <group ref={groupRef} visible>
      <Html transform={false} occlude={false} style={{ pointerEvents: "none" }}>
        <div ref={containerRef} className="select-none will-change-transform">
          <div className="flex flex-col items-center">
            <span className="rounded border border-fg/30 bg-black/90 px-2 py-1 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-fg">
              {TITLE_BY_SECTION[sectionId]}
            </span>
            <span
              ref={lineRef}
              className="my-1 block w-px"
              style={{
                height: `${LABEL_LINE_PX}px`,
                backgroundColor: accent,
                opacity: 0.9
              }}
            />
            <span
              className="block rounded-full"
              style={{
                width: `${DOT_SIZE_PX}px`,
                height: `${DOT_SIZE_PX}px`,
                backgroundColor: accent
              }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
};
