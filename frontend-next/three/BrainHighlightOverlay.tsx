"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { SectionId } from "@/content/siteContent";

import {
  OVERLAY_BLEND,
  OVERLAY_FADE_LERP,
  OVERLAY_OPACITY,
  HALO_OPACITY,
  OVERLAY_POINT_SCALE,
  POINT_SIZE
} from "./brainTuning";

interface BrainHighlightOverlayProps {
  positionAttribute: THREE.BufferAttribute;
  activeSectionId: SectionId | null;
  regionPointIndices: Record<SectionId, Uint32Array>;
  pointTexture: THREE.Texture | null;
  accentColor: string;
  haloOpacityScale?: number;
}

export const BrainHighlightOverlay = ({
  positionAttribute,
  activeSectionId,
  regionPointIndices,
    pointTexture,
    accentColor,
  haloOpacityScale = 0
}: BrainHighlightOverlayProps): JSX.Element => {
  const overlayPointsRef = useRef<THREE.Points>(null);
  const haloPointsRef = useRef<THREE.Points>(null);
  const overlayMaterialRef = useRef<THREE.PointsMaterial>(null);
  const haloMaterialRef = useRef<THREE.PointsMaterial>(null);
  const currentFadeRef = useRef(0);
  const indexAttributeRef = useRef<THREE.BufferAttribute | null>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", positionAttribute);
    g.setDrawRange(0, 0);
    return g;
  }, [positionAttribute]);

  const pointBlending =
    OVERLAY_BLEND === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending;

  useEffect(() => {
    indexAttributeRef.current = null;

    if (!activeSectionId) {
      geometry.setIndex(null);
      geometry.setDrawRange(0, 0);
      return;
    }

    const sectionIndices = regionPointIndices[activeSectionId];
    if (!sectionIndices || sectionIndices.length === 0) {
      geometry.setIndex(null);
      geometry.setDrawRange(0, 0);
      return;
    }

    const indexAttribute = new THREE.BufferAttribute(sectionIndices, 1);
    indexAttributeRef.current = indexAttribute;
    geometry.setIndex(indexAttribute);
    geometry.setDrawRange(0, sectionIndices.length);
  }, [activeSectionId, geometry, regionPointIndices]);

  useEffect(() => {
    return () => {
      indexAttributeRef.current = null;
      geometry.dispose();
    };
  }, [geometry]);

  useFrame(() => {
    const target = activeSectionId ? 1 : 0;
    currentFadeRef.current += (target - currentFadeRef.current) * OVERLAY_FADE_LERP;

    const fade = currentFadeRef.current;
    const visible = fade > 0.01 && geometry.drawRange.count > 0;

    if (overlayPointsRef.current) {
      overlayPointsRef.current.visible = visible;
    }

    if (haloPointsRef.current) {
      haloPointsRef.current.visible = visible;
    }

    if (overlayMaterialRef.current) {
      overlayMaterialRef.current.opacity = OVERLAY_OPACITY * fade;
    }

    if (haloMaterialRef.current) {
      haloMaterialRef.current.opacity = HALO_OPACITY * haloOpacityScale * fade;
    }
  });

  return (
    <>
      <points ref={haloPointsRef} geometry={geometry} visible={false} renderOrder={1}>
        <pointsMaterial
          ref={haloMaterialRef}
          transparent
          depthWrite={false}
          depthTest={false}
          size={POINT_SIZE * OVERLAY_POINT_SCALE}
          sizeAttenuation
          map={pointTexture ?? undefined}
          alphaMap={pointTexture ?? undefined}
          alphaTest={0.06}
          opacity={0}
          color={accentColor}
          blending={THREE.NormalBlending}
          toneMapped={false}
        />
      </points>

      <points ref={overlayPointsRef} geometry={geometry} visible={false} renderOrder={2}>
        <pointsMaterial
          ref={overlayMaterialRef}
          transparent
          depthWrite={false}
          depthTest={false}
          size={POINT_SIZE * OVERLAY_POINT_SCALE}
          sizeAttenuation
          map={pointTexture ?? undefined}
          alphaMap={pointTexture ?? undefined}
          alphaTest={0.16}
          opacity={0}
          color={accentColor}
          blending={pointBlending}
          toneMapped={false}
        />
      </points>
    </>
  );
};
