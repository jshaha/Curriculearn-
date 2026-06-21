"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import type { SectionId } from "@/content/siteContent";
import { lerp } from "@/lib/utils";

import { buildBrainSpots } from "./brainSpots";
import { sampleCortexSurface } from "./brainSampling";
import {
  BLENDING_MODE,
  HALO_OPACITY,
  HALO_SCALE,
  HALO_TINT,
  POINT_COUNT_TOTAL,
  POINT_SIZE
} from "./brainTuning";

interface RegionPointCloudProps {
  sectionId: SectionId;
  scrollProgress: number;
  scrollVelocity: number;
  prefersReducedMotion: boolean;
}

interface RegionPointCloudBodyProps extends RegionPointCloudProps {
  pointTexture: THREE.Texture | null;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const countMeshes = (root: THREE.Object3D): number => {
  let count = 0;
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      count += 1;
    }
  });
  return count;
};

const loadObject = (
  loader: OBJLoader,
  url: string
): Promise<THREE.Object3D> =>
  new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });

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

const RegionPointCloudBody = ({
  sectionId,
  scrollProgress,
  scrollVelocity,
  prefersReducedMotion,
  pointTexture
}: RegionPointCloudBodyProps): JSX.Element => {
  const [sampleRoot, setSampleRoot] = useState<THREE.Object3D | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const pointsMaterialRef = useRef<THREE.PointsMaterial>(null);
  const haloMaterialRef = useRef<THREE.PointsMaterial>(null);
  const introRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const setRootIfActive = (root: THREE.Object3D) => {
      if (cancelled) {
        return;
      }
      setSampleRoot(root);
    };

    const loadObjFallback = async () => {
      try {
        const loader = new OBJLoader();
        const [left, right] = await Promise.all([
          loadObject(loader, "/assets/brain/lh_pial.obj"),
          loadObject(loader, "/assets/brain/rh_pial.obj")
        ]);

        const group = new THREE.Group();
        group.add(left);
        group.add(right);
        group.updateWorldMatrix(true, true);
        setRootIfActive(group);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load cortex OBJ fallback:", error);
        }
      }
    };

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      "/assets/brain/cortex.glb",
      (gltf) => {
        if (cancelled) {
          return;
        }
        if (countMeshes(gltf.scene) > 0) {
          setRootIfActive(gltf.scene);
          return;
        }
        void loadObjFallback();
      },
      undefined,
      () => {
        void loadObjFallback();
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const sampled = useMemo(() => {
    if (!sampleRoot) {
      return null;
    }

    return sampleCortexSurface(sampleRoot, {
      pointCount: Math.max(24000, Math.floor(POINT_COUNT_TOTAL * 0.8))
    });
  }, [sampleRoot]);

  const spotData = useMemo(() => {
    if (!sampled) {
      return null;
    }

    const spots = buildBrainSpots(sampled.restPositions);
    const indices = spots.spotIndicesBySection[sectionId];

    const positions = new Float32Array(indices.length * 3);
    const colors = new Float32Array(indices.length * 3);

    for (let i = 0; i < indices.length; i += 1) {
      const sourceIndex = indices[i] * 3;
      const targetIndex = i * 3;
      positions[targetIndex] = sampled.restPositions[sourceIndex];
      positions[targetIndex + 1] = sampled.restPositions[sourceIndex + 1];
      positions[targetIndex + 2] = sampled.restPositions[sourceIndex + 2];

      colors[targetIndex] = sampled.baseColors[sourceIndex];
      colors[targetIndex + 1] = sampled.baseColors[sourceIndex + 1];
      colors[targetIndex + 2] = sampled.baseColors[sourceIndex + 2];
    }

    const positionAttribute = new THREE.BufferAttribute(positions, 3);
    const box = new THREE.Box3().setFromBufferAttribute(positionAttribute);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const largestDimension = Math.max(size.x, size.y, size.z, 1e-6);
    const scale = 1.85 / largestDimension;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (positions[i] - center.x) * scale;
      positions[i + 1] = (positions[i + 1] - center.y) * scale;
      positions[i + 2] = (positions[i + 2] - center.z) * scale;
    }

    return {
      positions,
      colors
    };
  }, [sampled, sectionId]);

  const geometry = useMemo(() => {
    if (!spotData) {
      return null;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(spotData.positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(spotData.colors, 3));
    g.computeBoundingSphere();
    return g;
  }, [spotData]);

  const pointBlending =
    BLENDING_MODE === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending;

  useEffect(() => {
    return () => {
      if (geometry) {
        geometry.dispose();
      }
    };
  }, [geometry]);

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    introRef.current = Math.min(1, introRef.current + dt * 2.25);
    const intro = introRef.current;

    const velocityInfluence = clamp(scrollVelocity, -2.2, 2.2) * 0.075;
    const targetYaw = prefersReducedMotion
      ? 0
      : (scrollProgress - 0.5) * 0.92 + velocityInfluence;
    const targetPitch = prefersReducedMotion ? 0 : (scrollProgress - 0.5) * 0.32;

    group.rotation.y = lerp(group.rotation.y, targetYaw, prefersReducedMotion ? 0.05 : 0.09);
    group.rotation.x = lerp(group.rotation.x, targetPitch, prefersReducedMotion ? 0.05 : 0.08);

    const targetScale = lerp(1.16, 1, intro);
    group.scale.setScalar(targetScale);

    if (pointsMaterialRef.current) {
      pointsMaterialRef.current.opacity = lerp(0.35, 0.88, intro);
    }
    if (haloMaterialRef.current) {
      haloMaterialRef.current.opacity = lerp(0.02, HALO_OPACITY, intro);
    }
  });

  if (!geometry) {
    return (
      <group>
        <mesh>
          <icosahedronGeometry args={[0.72, 2]} />
          <meshBasicMaterial
            color="#d3dbeb"
            wireframe
            transparent
            opacity={0.16}
            depthWrite={false}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <pointsMaterial
          ref={haloMaterialRef}
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

      <points geometry={geometry}>
        <pointsMaterial
          ref={pointsMaterialRef}
          transparent
          depthWrite={false}
          size={POINT_SIZE}
          sizeAttenuation
          map={pointTexture ?? undefined}
          alphaMap={pointTexture ?? undefined}
          alphaTest={0.08}
          opacity={0.88}
          vertexColors
          blending={pointBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
};

export const RegionPointCloud = ({
  sectionId,
  scrollProgress,
  scrollVelocity,
  prefersReducedMotion
}: RegionPointCloudProps): JSX.Element => {
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

  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [0, 0, 4.2], fov: 34 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <fog attach="fog" args={["#0b0c0f", 6.8, 12]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[2, 2.2, 3.5]} intensity={0.42} />

      <RegionPointCloudBody
        sectionId={sectionId}
        scrollProgress={scrollProgress}
        scrollVelocity={scrollVelocity}
        prefersReducedMotion={prefersReducedMotion}
        pointTexture={pointTexture}
      />
    </Canvas>
  );
};
