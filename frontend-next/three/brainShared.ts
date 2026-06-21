"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import type { SectionId } from "@/content/siteContent";

import { buildBrainSpots, type BrainSpotsData } from "./brainSpots";
import { sampleCortexSurface, type SampledBrainData } from "./brainSampling";
import { POINT_COUNT_TOTAL, SPOT_FRACTION } from "./brainTuning";

export interface SectionHeaderGeometryCache {
  baseGeometry: THREE.BufferGeometry;
  overlayGeometryBySection: Record<SectionId, THREE.BufferGeometry>;
}

export interface SharedBrainData {
  sampled: SampledBrainData;
  spots: BrainSpotsData;
  source: "glb" | "obj";
  sectionHeaderGeometry: SectionHeaderGeometryCache;
}

let cachedData: SharedBrainData | null = null;
let loadPromise: Promise<SharedBrainData> | null = null;

const SECTION_IDS: SectionId[] = [
  "experience",
  "projects",
  "leadership",
  "interests",
  "about"
];

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

const loadBrainRoot = async (): Promise<{
  source: "glb" | "obj";
  root: THREE.Object3D;
}> => {
  const gltfLoader = new GLTFLoader();

  const tryGlb = (): Promise<THREE.Object3D> =>
    new Promise((resolve, reject) => {
      gltfLoader.load(
        "/assets/brain/cortex.glb",
        (gltf) => {
          if (countMeshes(gltf.scene) > 0) {
            resolve(gltf.scene);
          } else {
            reject(new Error("GLB loaded but no meshes were found."));
          }
        },
        undefined,
        reject
      );
    });

  try {
    const root = await tryGlb();
    return { source: "glb", root };
  } catch {
    const objLoader = new OBJLoader();
    const [left, right] = await Promise.all([
      loadObject(objLoader, "/assets/brain/lh_pial.obj"),
      loadObject(objLoader, "/assets/brain/rh_pial.obj")
    ]);

    const group = new THREE.Group();
    group.name = "obj-fallback";
    group.add(left);
    group.add(right);
    group.updateWorldMatrix(true, true);

    return { source: "obj", root: group };
  }
};

const buildSectionHeaderGeometry = (
  sampled: SampledBrainData,
  spots: BrainSpotsData
): SectionHeaderGeometryCache => {
  const sharedPositionAttribute = new THREE.BufferAttribute(sampled.restPositions, 3);

  const baseGeometry = new THREE.BufferGeometry();
  baseGeometry.setAttribute("position", sharedPositionAttribute);
  baseGeometry.computeBoundingSphere();

  const overlayGeometryBySection = {} as Record<SectionId, THREE.BufferGeometry>;

  SECTION_IDS.forEach((sectionId) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", sharedPositionAttribute);
    geometry.setIndex(new THREE.BufferAttribute(spots.spotIndicesBySection[sectionId], 1));
    geometry.setDrawRange(0, spots.spotIndicesBySection[sectionId].length);
    geometry.computeBoundingSphere();
    overlayGeometryBySection[sectionId] = geometry;
  });

  return {
    baseGeometry,
    overlayGeometryBySection
  };
};

const buildSharedBrainData = async (): Promise<SharedBrainData> => {
  const { source, root } = await loadBrainRoot();
  const sampled = sampleCortexSurface(root, {
    pointCount: POINT_COUNT_TOTAL
  });
  const spots = buildBrainSpots(sampled.restPositions, { spotFraction: SPOT_FRACTION });
  const sectionHeaderGeometry = buildSectionHeaderGeometry(sampled, spots);

  return {
    sampled,
    spots,
    source,
    sectionHeaderGeometry
  };
};

export const preloadBrainSharedData = (): Promise<SharedBrainData> => {
  if (cachedData) {
    return Promise.resolve(cachedData);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = buildSharedBrainData()
    .then((data) => {
      cachedData = data;
      return data;
    })
    .catch((error) => {
      loadPromise = null;
      throw error;
    });

  return loadPromise;
};

export const getBrainSharedDataSync = (): SharedBrainData | null => cachedData;

export const useBrainSharedData = (): SharedBrainData | null => {
  const [data, setData] = useState<SharedBrainData | null>(() => getBrainSharedDataSync());

  useEffect(() => {
    if (data) {
      return;
    }

    let mounted = true;
    void preloadBrainSharedData()
      .then((resolved) => {
        if (mounted) {
          setData(resolved);
        }
      })
      .catch((error) => {
        console.error("Failed to prepare shared brain data:", error);
      });

    return () => {
      mounted = false;
    };
  }, [data]);

  return data;
};
