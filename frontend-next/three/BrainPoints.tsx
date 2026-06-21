"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

import { BrainLeaderLabel } from "@/components/BrainLeaderLabel";
import type { BrainPose } from "@/components/TransitionProvider";
import type { SectionId } from "@/content/siteContent";
import { siteContent } from "@/content/siteContent";
import { clamp, lerp } from "@/lib/utils";

import { BrainHighlightOverlay } from "./BrainHighlightOverlay";
import {
  getSpotSectionColor,
  SECTION_SPOT_MAP
} from "./brainSpots";
import type { BrainPhysicsState } from "./brainPhysics";
import { createBrainPhysicsState, updateBrainPhysics } from "./brainPhysics";
import { useBrainSharedData } from "./brainShared";
import {
  BLENDING_MODE,
  CURSOR_BLEND_WHILE_FOCUS,
  DIM_FACTOR,
  FOCUS_SLERP,
  HALO_OPACITY,
  HALO_SCALE,
  HALO_TINT,
  MODAL_ROTATION_SCALE,
  NAVIGATION_CURSOR_BLEND,
  NAVIGATION_SCALE_TARGET,
  NAVIGATION_TRANSFORM_LERP,
  NAVIGATION_Y_TARGET,
  PITCH_MAX,
  POINT_OPACITY,
  POINT_SIZE,
  REDUCED_MOTION_ROTATION_SCALE,
  ROTATION_LERP,
  SCROLL_ROTATION_SCALE,
  YAW_MAX
} from "./brainTuning";

export interface PointerState {
  x: number;
  y: number;
  inside: boolean;
}

interface BrainPointsProps {
  pointerRef: RefObject<PointerState>;
  hoveredSectionId: SectionId | null;
  navigationSectionId: SectionId | null;
  onNavigationPose?: (pose: BrainPose) => void;
  mobileMode: boolean;
  isModalOpen: boolean;
  isScrolling: boolean;
  prefersReducedMotion: boolean;
  debugAnchors: boolean;
  debugPreviewSectionId: SectionId | null;
  debugShowAllSpots: boolean;
}

const ACCENT = new THREE.Color(siteContent.siteConfig.accentColor);
const TARGET_FORWARD = new THREE.Vector3(0, 0, 1);
const ANCHOR_VECTOR = new THREE.Vector3();
const EULER_CURSOR = new THREE.Euler();
const Q_CURSOR = new THREE.Quaternion();
const Q_FOCUS = new THREE.Quaternion();
const Q_TARGET = new THREE.Quaternion();
const Q_WORLD = new THREE.Quaternion();
const HORIZONTAL_FOCUS_SECTIONS = new Set<SectionId>([
  "leadership",
  "interests"
]);
const HORIZONTAL_FOCUS_Y_FACTOR = 0.08;

const createPointSpriteTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context for point sprite texture.");
  }

  const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 58);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.45, "rgba(255, 255, 255, 0.95)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  context.clearRect(0, 0, 128, 128);
  context.beginPath();
  context.arc(64, 64, 58, 0, Math.PI * 2);
  context.fillStyle = gradient;
  context.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

export const BrainPoints = ({
  pointerRef,
  hoveredSectionId,
  navigationSectionId,
  onNavigationPose,
  mobileMode,
  isModalOpen,
  isScrolling,
  prefersReducedMotion,
  debugAnchors,
  debugPreviewSectionId,
  debugShowAllSpots
}: BrainPointsProps): JSX.Element => {
  const sharedData = useBrainSharedData();
  const sampled = sharedData?.sampled ?? null;
  const spots = sharedData?.spots ?? null;

  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const baseMaterialRef = useRef<THREE.PointsMaterial>(null);
  const physicsRef = useRef<BrainPhysicsState | null>(null);
  const leaderAnchorRef = useRef(new THREE.Vector3(0, 0, 0));
  const baseOpacityRef = useRef(POINT_OPACITY);
  const navigationPoseRef = useRef<BrainPose>({
    position: [0, 0, 0],
    quaternion: [0, 0, 0, 1],
    scale: 1
  });

  const pointTexture = useMemo(
    () => (typeof document === "undefined" ? null : createPointSpriteTexture()),
    []
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !spots) {
      return;
    }

    const overlap = (["experience", "projects", "leadership", "interests", "about"] as SectionId[])
      .map((sectionId) => `${sectionId}:${(spots.overlapRatioBySection[sectionId] * 100).toFixed(1)}%`)
      .join(" | ");

    const sizes = (["experience", "projects", "leadership", "interests", "about"] as SectionId[])
      .map((sectionId) => `${sectionId}:${spots.spotIndicesBySection[sectionId].length}`)
      .join(" | ");

    console.log("[brainSpots] sizes:", sizes);
    console.log("[brainSpots] overlap:", overlap);
    console.log("[brainSpots] coverage:", `${(spots.coverageRatio * 100).toFixed(1)}%`);
  }, [spots]);

  const physicsState = useMemo(() => {
    if (!sampled) {
      return null;
    }

    return createBrainPhysicsState(sampled.restPositions, sampled.restNormals);
  }, [sampled]);

  useEffect(() => {
    physicsRef.current = physicsState;
  }, [physicsState]);

  const geometry = useMemo(() => {
    if (!sampled || !physicsState) {
      return null;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(physicsState.currentPositions, 3)
    );
    g.computeBoundingSphere();

    const colors = new Float32Array(sampled.baseColors);
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return g;
  }, [sampled, physicsState]);

  const debugBoundsGeometry = useMemo(() => {
    if (!sampled) {
      return null;
    }

    return new THREE.BoxGeometry(
      sampled.debugBoundsSize[0],
      sampled.debugBoundsSize[1],
      sampled.debugBoundsSize[2]
    );
  }, [sampled]);

  const pointBlending =
    BLENDING_MODE === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending;

  const basePositionAttribute = useMemo(() => {
    if (!geometry) {
      return null;
    }
    return geometry.getAttribute("position") as THREE.BufferAttribute;
  }, [geometry]);

  // Hover state is nav-only; debug preview is fallback-only in development.
  const activeHoverSection = mobileMode ? null : hoveredSectionId ?? debugPreviewSectionId;
  const activeInteractiveSection = mobileMode ? null : navigationSectionId ?? activeHoverSection;
  const focusSectionId = isModalOpen || mobileMode ? null : activeInteractiveSection;
  const highlightSectionId = isModalOpen || mobileMode ? null : activeInteractiveSection;

  useEffect(() => {
    if (!spots || !highlightSectionId) {
      return;
    }

    const anchor = spots.anchorPointBySection[highlightSectionId];
    leaderAnchorRef.current.set(anchor[0], anchor[1], anchor[2]);
  }, [highlightSectionId, spots]);

  useEffect(() => {
    return () => {
      if (pointTexture) {
        pointTexture.dispose();
      }
      if (geometry) {
        geometry.dispose();
      }
      if (debugBoundsGeometry) {
        debugBoundsGeometry.dispose();
      }
    };
  }, [debugBoundsGeometry, geometry, pointTexture]);

  useFrame((state, dt) => {
    if (!sampled || !geometry || !physicsRef.current || !spots) {
      return;
    }

    const group = groupRef.current;
    const points = pointsRef.current;

    if (!group || !points) {
      return;
    }

    const pointer = pointerRef.current;
    const isNavigating = Boolean(navigationSectionId);
    const pointerX =
      pointer?.inside && !isNavigating && !mobileMode ? clamp(pointer.x, -1, 1) : 0;
    const pointerY =
      pointer?.inside && !isNavigating && !mobileMode ? clamp(pointer.y, -1, 1) : 0;

    let motionScale = 1;
    if (prefersReducedMotion) {
      motionScale *= REDUCED_MOTION_ROTATION_SCALE;
    }
    if (isScrolling) {
      motionScale *= SCROLL_ROTATION_SCALE;
    }
    if (isModalOpen) {
      motionScale *= MODAL_ROTATION_SCALE;
    }

    const cursorYaw = pointerX * YAW_MAX * motionScale;
    const cursorPitch = -pointerY * PITCH_MAX * motionScale;
    EULER_CURSOR.set(cursorPitch, cursorYaw, 0, "YXZ");
    Q_CURSOR.setFromEuler(EULER_CURSOR);

    if (focusSectionId) {
      const anchor = spots.anchorPointBySection[focusSectionId];
      leaderAnchorRef.current.set(anchor[0], anchor[1], anchor[2]);

      ANCHOR_VECTOR.set(anchor[0], anchor[1], anchor[2]).normalize();
      if (HORIZONTAL_FOCUS_SECTIONS.has(focusSectionId)) {
        ANCHOR_VECTOR.y *= HORIZONTAL_FOCUS_Y_FACTOR;
        if (ANCHOR_VECTOR.lengthSq() < 1e-8) {
          ANCHOR_VECTOR.set(0, 0, 1);
        } else {
          ANCHOR_VECTOR.normalize();
        }
      }
      Q_FOCUS.setFromUnitVectors(ANCHOR_VECTOR, TARGET_FORWARD);

      Q_TARGET
        .copy(Q_FOCUS)
        .slerp(
          Q_CURSOR,
          isNavigating ? NAVIGATION_CURSOR_BLEND : CURSOR_BLEND_WHILE_FOCUS
        );
      group.quaternion.slerp(Q_TARGET, FOCUS_SLERP);
    } else {
      group.quaternion.slerp(Q_CURSOR, ROTATION_LERP);
    }

    const targetScale = isNavigating ? NAVIGATION_SCALE_TARGET : 1;
    const nextScale = lerp(
      group.scale.x,
      targetScale,
      isNavigating ? NAVIGATION_TRANSFORM_LERP : 0.12
    );
    group.scale.setScalar(nextScale);
    const targetY = isNavigating ? NAVIGATION_Y_TARGET : 0;
    group.position.y = lerp(
      group.position.y,
      targetY,
      isNavigating ? NAVIGATION_TRANSFORM_LERP : 0.1
    );
    group.position.x = lerp(group.position.x, 0, 0.12);
    group.position.z = lerp(group.position.z, 0, 0.12);

    const targetOpacity = highlightSectionId ? POINT_OPACITY * DIM_FACTOR : POINT_OPACITY;
    baseOpacityRef.current = lerp(baseOpacityRef.current, targetOpacity, 0.18);
    if (baseMaterialRef.current) {
      baseMaterialRef.current.opacity = baseOpacityRef.current;
    }

    const pointerNdc = {
      x: pointer?.inside ? pointerX : 999,
      y: pointer?.inside ? pointerY : 999
    };

    let cursorPx: { x: number; y: number } | null = null;

    if (pointer?.inside && !isNavigating) {
      cursorPx = {
        x: (pointerNdc.x * 0.5 + 0.5) * state.size.width,
        y: (1 - (pointerNdc.y * 0.5 + 0.5)) * state.size.height
      };
    }

    const physicsActive =
      !isNavigating &&
      !isModalOpen &&
      !prefersReducedMotion &&
      !isScrolling &&
      Boolean(cursorPx);

    group.updateWorldMatrix(true, false);
    group.getWorldQuaternion(Q_WORLD);

    updateBrainPhysics(physicsRef.current, {
      dt,
      isActive: physicsActive,
      cursorPx,
      viewportWidth: state.size.width,
      viewportHeight: state.size.height,
      camera: state.camera,
      groupMatrixWorld: group.matrixWorld,
      groupQuaternionWorld: Q_WORLD
    });

    const positionAttribute = geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    positionAttribute.needsUpdate = true;

    if (onNavigationPose) {
      navigationPoseRef.current = {
        position: [group.position.x, group.position.y, group.position.z],
        quaternion: [
          group.quaternion.x,
          group.quaternion.y,
          group.quaternion.z,
          group.quaternion.w
        ],
        scale: group.scale.x
      };
      onNavigationPose(navigationPoseRef.current);
    }
  });

  if (!sampled || !geometry || !spots || !basePositionAttribute) {
    return (
      <group>
        <mesh>
          <icosahedronGeometry args={[0.85, 2]} />
          <meshBasicMaterial
            color="#d3dbeb"
            wireframe
            transparent
            opacity={0.12}
            depthWrite={false}
          />
        </mesh>
      </group>
    );
  }

  const sectionList = [
    "experience",
    "projects",
    "leadership",
    "interests",
    "about"
  ] as SectionId[];

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <pointsMaterial
          transparent
          depthWrite={false}
          size={POINT_SIZE * HALO_SCALE}
          sizeAttenuation
          map={pointTexture ?? undefined}
          alphaMap={pointTexture ?? undefined}
          alphaTest={0.08}
          opacity={HALO_OPACITY}
          color={HALO_TINT}
          blending={pointBlending}
          toneMapped={false}
        />
      </points>

      <points
        ref={pointsRef}
        geometry={geometry}
      >
        <pointsMaterial
          ref={baseMaterialRef}
          transparent
          depthWrite={false}
          size={POINT_SIZE}
          sizeAttenuation
          map={pointTexture ?? undefined}
          alphaMap={pointTexture ?? undefined}
          alphaTest={0.08}
          opacity={POINT_OPACITY}
          vertexColors
          blending={pointBlending}
          toneMapped={false}
        />
      </points>

      <BrainHighlightOverlay
        positionAttribute={basePositionAttribute}
        activeSectionId={highlightSectionId}
        regionPointIndices={spots.spotIndicesBySection}
        pointTexture={pointTexture}
        accentColor={siteContent.siteConfig.accentColor}
      />

      {debugShowAllSpots
        ? sectionList.map((sectionId) => (
            <BrainHighlightOverlay
              key={`debug-spot-${sectionId}`}
              positionAttribute={basePositionAttribute}
              activeSectionId={sectionId}
              regionPointIndices={spots.spotIndicesBySection}
              pointTexture={pointTexture}
              accentColor={getSpotSectionColor(sectionId)}
              haloOpacityScale={0}
            />
          ))
        : null}

      <BrainLeaderLabel
        sectionId={highlightSectionId}
        anchorRef={leaderAnchorRef}
        brainGroupRef={groupRef}
        brainRadius={sampled.brainRadius}
      />

      {debugAnchors && debugBoundsGeometry ? (
        <>
          {sampled.debugMeshGeometries.map((debugMeshGeometry, index) => (
            <mesh
              key={`${sampled.meshAllocations[index]?.name ?? "mesh"}-${index}`}
              geometry={debugMeshGeometry}
            >
              <meshBasicMaterial
                color="#cad3e6"
                wireframe
                transparent
                opacity={0.06}
                depthWrite={false}
              />
            </mesh>
          ))}

          <mesh
            geometry={debugBoundsGeometry}
            position={sampled.debugBoundsCenter}
          >
            <meshBasicMaterial
              color={siteContent.siteConfig.accentColor}
              wireframe
              transparent
              opacity={0.32}
              depthWrite={false}
            />
          </mesh>

          {sectionList.map((sectionId) => (
            <mesh key={sectionId} position={spots.anchorPointBySection[sectionId]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial
                color={sectionId === highlightSectionId ? ACCENT : "#f2f0ea"}
                transparent
                opacity={0.9}
                depthWrite={false}
              />
            </mesh>
          ))}

          <Html
            position={[0, sampled.debugBoundsSize[1] * 0.64, 0]}
            center
            style={{
              color: "#f3f3f1",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: "11px",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              textAlign: "center"
            }}
          >
            <div>
              meshes: {sampled.meshCount} | points: {sampled.pointCount}
            </div>
            <div>
              coverage: {(spots.coverageRatio * 100).toFixed(1)}% | {sectionList
                .map((sectionId) => `${sectionId}:${spots.spotIndicesBySection[sectionId].length}`)
                .join(" • ")}
            </div>
            <div>
              {sectionList
                .map((sectionId) => `${sectionId}:${SECTION_SPOT_MAP[sectionId]}`)
                .join(" • ")}
            </div>
          </Html>
        </>
      ) : null}
    </group>
  );
};
