"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { BrainPose } from "@/components/TransitionProvider";
import type { SectionId } from "@/content/siteContent";
import { lerp } from "@/lib/utils";

import { useBrainSharedData } from "./brainShared";
import {
  BLENDING_MODE,
  CAMERA_DISTANCE,
  CAMERA_FOV,
  HALO_OPACITY,
  POINT_SIZE,
  SECTION_HEADER_CAMERA_FOV,
  SECTION_HEADER_CAMERA_LERP,
  SECTION_HEADER_CAMERA_Z,
  SECTION_HEADER_SCALE,
  SECTION_HEADER_Y,
  SECTION_HEADER_TRANSFORM_LERP
} from "./brainTuning";

interface SectionBrainHeaderProps {
  sectionId: SectionId;
  scrollProgress: number;
  scrollVelocity: number;
  prefersReducedMotion: boolean;
  initialPose?: BrainPose | null;
}

interface SectionBrainHeaderBodyProps extends SectionBrainHeaderProps {
  pointTexture: THREE.Texture | null;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

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

const TARGET_FORWARD = new THREE.Vector3(0, 0, 1);
const ANCHOR_VECTOR = new THREE.Vector3();
const EULER_SCROLL = new THREE.Euler();
const Q_SCROLL = new THREE.Quaternion();
const Q_FOCUS = new THREE.Quaternion();
const Q_TARGET = new THREE.Quaternion();
const HORIZONTAL_FOCUS_SECTIONS = new Set<SectionId>(["leadership", "interests"]);

const SectionBrainHeaderBody = ({
  sectionId,
  scrollProgress,
  scrollVelocity,
  prefersReducedMotion,
  initialPose,
  pointTexture
}: SectionBrainHeaderBodyProps): JSX.Element | null => {
  const sharedData = useBrainSharedData();
  const isAboutSection = sectionId === "about";
  const targetScale = isAboutSection ? SECTION_HEADER_SCALE * 0.84 : SECTION_HEADER_SCALE;
  const targetY = isAboutSection ? SECTION_HEADER_Y + 0.1 : SECTION_HEADER_Y;
  const targetCameraZ = isAboutSection ? SECTION_HEADER_CAMERA_Z + 0.24 : SECTION_HEADER_CAMERA_Z;
  const targetCameraFov = isAboutSection
    ? SECTION_HEADER_CAMERA_FOV + 1.8
    : SECTION_HEADER_CAMERA_FOV;

  const groupRef = useRef<THREE.Group>(null);
  const cameraZRef = useRef(
    initialPose ? CAMERA_DISTANCE : targetCameraZ
  );
  const cameraFovRef = useRef(
    initialPose ? CAMERA_FOV : targetCameraFov
  );
  const baseMaterialRef = useRef<THREE.PointsMaterial>(null);
  const overlayMaterialRef = useRef<THREE.PointsMaterial>(null);
  const haloMaterialRef = useRef<THREE.PointsMaterial>(null);

  const focusQuaternion = useMemo(() => {
    if (!sharedData) {
      return null;
    }

    const anchor = sharedData.spots.anchorPointBySection[sectionId];
    ANCHOR_VECTOR.set(anchor[0], anchor[1], anchor[2]).normalize();

    if (HORIZONTAL_FOCUS_SECTIONS.has(sectionId)) {
      ANCHOR_VECTOR.y *= 0.1;
      if (ANCHOR_VECTOR.lengthSq() < 1e-8) {
        ANCHOR_VECTOR.set(0, 0, 1);
      } else {
        ANCHOR_VECTOR.normalize();
      }
    }

    return Q_FOCUS.clone().setFromUnitVectors(ANCHOR_VECTOR, TARGET_FORWARD);
  }, [sectionId, sharedData]);

  const pointBlending =
    BLENDING_MODE === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending;

  useEffect(() => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    if (initialPose) {
      group.position.set(
        initialPose.position[0],
        initialPose.position[1],
        initialPose.position[2]
      );
      group.quaternion.set(
        initialPose.quaternion[0],
        initialPose.quaternion[1],
        initialPose.quaternion[2],
        initialPose.quaternion[3]
      );
      group.scale.setScalar(initialPose.scale);
      cameraZRef.current = CAMERA_DISTANCE;
      cameraFovRef.current = CAMERA_FOV;
    } else {
      group.position.set(0, targetY, 0);
      group.scale.setScalar(targetScale);
      cameraZRef.current = targetCameraZ;
      cameraFovRef.current = targetCameraFov;
      if (focusQuaternion) {
        group.quaternion.copy(focusQuaternion);
      }
    }
  }, [focusQuaternion, initialPose, targetCameraFov, targetCameraZ, targetScale, targetY]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group || !focusQuaternion) {
      return;
    }

    const velocityInfluence = clamp(scrollVelocity, -2.2, 2.2) * 0.062;
    const targetYaw = prefersReducedMotion
      ? 0
      : scrollProgress * 0.84 + velocityInfluence;
    const targetPitch = prefersReducedMotion ? 0 : scrollProgress * 0.3;

    EULER_SCROLL.set(targetPitch, targetYaw, 0, "YXZ");
    Q_SCROLL.setFromEuler(EULER_SCROLL);
    Q_TARGET.copy(focusQuaternion).multiply(Q_SCROLL);

    group.quaternion.slerp(
      Q_TARGET,
      prefersReducedMotion ? 0.05 : SECTION_HEADER_TRANSFORM_LERP
    );

    group.position.x = lerp(group.position.x, 0, SECTION_HEADER_TRANSFORM_LERP);
    group.position.y = lerp(
      group.position.y,
      targetY,
      SECTION_HEADER_TRANSFORM_LERP
    );
    group.position.z = lerp(group.position.z, 0, SECTION_HEADER_TRANSFORM_LERP);

    group.scale.setScalar(
      lerp(group.scale.x, targetScale, SECTION_HEADER_TRANSFORM_LERP)
    );

    const camera = state.camera as THREE.PerspectiveCamera;
    cameraZRef.current = lerp(
      cameraZRef.current,
      targetCameraZ,
      SECTION_HEADER_CAMERA_LERP
    );
    cameraFovRef.current = lerp(
      cameraFovRef.current,
      targetCameraFov,
      SECTION_HEADER_CAMERA_LERP
    );
    camera.position.set(0, 0, cameraZRef.current);
    if (Math.abs(camera.fov - cameraFovRef.current) > 0.0001) {
      camera.fov = cameraFovRef.current;
      camera.updateProjectionMatrix();
    }

    if (baseMaterialRef.current) {
      baseMaterialRef.current.opacity = 0.2;
    }

    if (overlayMaterialRef.current) {
      overlayMaterialRef.current.opacity = 0.93;
    }

    if (haloMaterialRef.current) {
      haloMaterialRef.current.opacity = HALO_OPACITY * 0.18;
    }
  });

  if (!sharedData || !focusQuaternion) {
    return null;
  }

  const baseGeometry = sharedData.sectionHeaderGeometry.baseGeometry;
  const overlayGeometry = sharedData.sectionHeaderGeometry.overlayGeometryBySection[sectionId];

  return (
    <group ref={groupRef}>
      <points geometry={baseGeometry}>
        <pointsMaterial
          ref={baseMaterialRef}
          transparent
          depthWrite={false}
          size={POINT_SIZE * 1.08}
          sizeAttenuation
          map={pointTexture ?? undefined}
          alphaMap={pointTexture ?? undefined}
          alphaTest={0.08}
          opacity={0.2}
          color="#9da5b0"
          blending={pointBlending}
          toneMapped={false}
        />
      </points>

      <points geometry={overlayGeometry}>
        <pointsMaterial
          ref={haloMaterialRef}
          transparent
          depthWrite={false}
          size={POINT_SIZE * 1.08}
          sizeAttenuation
          map={pointTexture ?? undefined}
          alphaMap={pointTexture ?? undefined}
          alphaTest={0.08}
          opacity={HALO_OPACITY * 0.18}
          color="#ffffff"
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      <points geometry={overlayGeometry}>
        <pointsMaterial
          ref={overlayMaterialRef}
          transparent
          depthWrite={false}
          size={POINT_SIZE * 1.08}
          sizeAttenuation
          map={pointTexture ?? undefined}
          alphaMap={pointTexture ?? undefined}
          alphaTest={0.08}
          opacity={0.93}
          color="#f5f5f5"
          blending={pointBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
};

export const SectionBrainHeader = ({
  sectionId,
  scrollProgress,
  scrollVelocity,
  prefersReducedMotion,
  initialPose
}: SectionBrainHeaderProps): JSX.Element => {
  const pointTexture = useMemo(
    () => (typeof document === "undefined" ? null : createPointSpriteTexture()),
    []
  );

  useEffect(() => {
    return () => {
      if (pointTexture) {
        pointTexture.dispose();
      }
    };
  }, [pointTexture]);

  const isAboutSection = sectionId === "about";
  const targetCameraZ = isAboutSection ? SECTION_HEADER_CAMERA_Z + 0.24 : SECTION_HEADER_CAMERA_Z;
  const targetCameraFov = isAboutSection
    ? SECTION_HEADER_CAMERA_FOV + 1.8
    : SECTION_HEADER_CAMERA_FOV;

  const initialCameraZ = initialPose ? CAMERA_DISTANCE : targetCameraZ;
  const initialCameraFov = initialPose ? CAMERA_FOV : targetCameraFov;

  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [0, 0, initialCameraZ], fov: initialCameraFov }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <fog attach="fog" args={["#0b0c0f", 5.6, 9.8]} />
      <ambientLight intensity={0.36} />
      <directionalLight position={[2, 2.4, 3.2]} intensity={0.38} />

      <SectionBrainHeaderBody
        sectionId={sectionId}
        scrollProgress={scrollProgress}
        scrollVelocity={scrollVelocity}
        prefersReducedMotion={prefersReducedMotion}
        initialPose={initialPose}
        pointTexture={pointTexture}
      />
    </Canvas>
  );
};
