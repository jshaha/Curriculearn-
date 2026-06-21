import type { SectionId } from "@/content/siteContent";

import { BRAIN_RADIUS, POINT_COUNT } from "./brainTuning";

export interface AnchorConfig {
  sectionId: SectionId;
  anchorIndices: number[];
  focusVector: [number, number, number];
}

type Vec3 = [number, number, number];

interface RegionHit {
  center: Vec3;
  value: number;
}

const SECTION_IDS: SectionId[] = [
  "experience",
  "projects",
  "leadership",
  "interests",
  "about"
];

const ANCHOR_TARGETS: Record<SectionId, Vec3> = {
  experience: [-0.5, 0.18, 0.22],
  projects: [0.5, 0.18, 0.22],
  leadership: [-0.36, -0.22, 0.18],
  interests: [0.36, -0.22, 0.18],
  about: [0, 0.54, 0.16]
};

const ANCHOR_CLUSTER_SIZE = 1;

const KEY_LIGHT = normalizeVector(0.36, 0.48, 0.8);
const FILL_LIGHT = normalizeVector(-0.52, 0.18, 0.36);

const mulberry32 = (seed: number) => {
  let currentSeed = seed >>> 0;
  return () => {
    currentSeed += 0x6d2b79f5;
    let value = Math.imul(currentSeed ^ (currentSeed >>> 15), 1 | currentSeed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const randRange = (random: () => number, min: number, max: number): number =>
  min + (max - min) * random();

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

function normalizeVector(x: number, y: number, z: number): Vec3 {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const ellipsoidValue = (
  x: number,
  y: number,
  z: number,
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  rz: number
): number => {
  const nx = (x - cx) / rx;
  const ny = (y - cy) / ry;
  const nz = (z - cz) / rz;
  return nx * nx + ny * ny + nz * nz;
};

const collectRegionHits = (x: number, y: number, z: number): RegionHit[] => {
  const hits: RegionHit[] = [];

  const left = ellipsoidValue(x, y, z, -0.43, 0.03, 0, 0.72, 0.82, 0.61);
  if (left <= 1) {
    hits.push({ center: [-0.43, 0.03, 0], value: left });
  }

  const right = ellipsoidValue(x, y, z, 0.43, 0.03, 0, 0.72, 0.82, 0.61);
  if (right <= 1) {
    hits.push({ center: [0.43, 0.03, 0], value: right });
  }

  const bridge = ellipsoidValue(x, y, z, 0, -0.04, 0, 0.24, 0.34, 0.28);
  if (bridge <= 1) {
    hits.push({ center: [0, -0.04, 0], value: bridge });
  }

  return hits;
};

const acceptPoint = (
  x: number,
  y: number,
  z: number,
  random: () => number,
  hits: RegionHit[]
): { accepted: boolean; boundary: number } => {
  if (hits.length === 0) {
    return { accepted: false, boundary: 0 };
  }

  // Cortex-only: remove lower spinal/stem profile entirely.
  if (y < -0.54) {
    return { accepted: false, boundary: 0 };
  }

  // Keep a dome-like top and rounded inferior edge.
  if (y > 0.9 || Math.abs(x) > 0.94) {
    return { accepted: false, boundary: 0 };
  }

  // Midline fissure for hemisphere readability without heart-like notch.
  const fissureHeight = smoothstep(-0.02, 0.86, y);
  const fissureWidth = 0.012 + 0.03 * fissureHeight;
  if (
    y > -0.02 &&
    y < 0.9 &&
    z > -0.44 &&
    Math.abs(x) < fissureWidth &&
    random() < 0.66 * fissureHeight
  ) {
    return { accepted: false, boundary: 0 };
  }

  const boundary = Math.max(...hits.map((hit) => hit.value));

  // Bias toward shell while retaining interior mass.
  const shellProbability = 0.48 + 0.48 * Math.pow(boundary, 0.68);
  return { accepted: random() <= shellProbability, boundary };
};

const computePointLighting = (
  x: number,
  y: number,
  z: number,
  hits: RegionHit[],
  boundary: number
): number => {
  const region = hits.reduce((best, hit) => (hit.value > best.value ? hit : best), hits[0]);
  const normal = normalizeVector(x - region.center[0], y - region.center[1], z - region.center[2]);

  const key = Math.max(0, dot(normal, KEY_LIGHT));
  const fill = Math.max(0, dot(normal, FILL_LIGHT));
  const rim = Math.pow(1 - Math.abs(normal[2]), 2) * 0.2;
  const depth = 0.8 + 0.2 * smoothstep(-0.7, 0.7, z);

  let intensity = (0.24 + key * 0.65 + fill * 0.24 + rim) * depth;

  // Gyri-like ridge bands on the cortical shell.
  const ridgeA = 1 - Math.abs(Math.sin(Math.abs(x) * 17.6 + (y + 0.14) * 8.8 + z * 3.4));
  const ridgeB = 1 - Math.abs(Math.sin(Math.abs(x) * 12.8 - (y - 0.04) * 13.4 + z * 2.1));
  const ridgeC = 1 - Math.abs(Math.sin((Math.abs(x) + y) * 10.2 + z * 5.6));
  const ridgeThin =
    Math.pow(clamp(ridgeA, 0, 1), 20) +
    Math.pow(clamp(ridgeB, 0, 1), 19) * 0.76 +
    Math.pow(clamp(ridgeC, 0, 1), 22) * 0.48;
  const ridgeMask = smoothstep(0.7, 0.995, boundary) * smoothstep(-0.5, 0.84, y);

  intensity += ridgeThin * ridgeMask * 0.55;

  return clamp(intensity, 0.22, 1);
};

const generateBrainPositions = (
  pointCount: number
): { positions: Float32Array; colors: Float32Array } => {
  const random = mulberry32(20260220);
  const positions = new Float32Array(pointCount * 3);
  const colors = new Float32Array(pointCount * 3);

  let index = 0;
  let guard = 0;

  while (index < pointCount && guard < pointCount * 280) {
    guard += 1;

    const x = randRange(random, -1.02, 1.02);
    const y = randRange(random, -0.56, 0.94);
    const z = randRange(random, -0.84, 0.84);

    const hits = collectRegionHits(x, y, z);
    const decision = acceptPoint(x, y, z, random, hits);
    if (!decision.accepted) {
      continue;
    }

    const ripple =
      0.011 * Math.sin((x + 0.2) * 12.2 + y * 7.8) +
      0.009 * Math.sin(z * 15.2 - x * 4.8);
    const jitter = (random() - 0.5) * 0.012;

    const px = x + ripple * 0.5 + jitter;
    const py = y + ripple * 0.3 + jitter * 0.3;
    const pz = z + ripple * 0.92 + jitter * 0.4;

    const lighting = computePointLighting(px, py, pz, hits, decision.boundary);

    positions[index * 3] = px;
    positions[index * 3 + 1] = py;
    positions[index * 3 + 2] = pz;

    colors[index * 3] = 0.9 * lighting;
    colors[index * 3 + 1] = 0.92 * lighting;
    colors[index * 3 + 2] = 0.96 * lighting;

    index += 1;
  }

  if (index < pointCount) {
    for (let i = index; i < pointCount; i += 1) {
      const source = (i % Math.max(index, 1)) * 3;
      const target = i * 3;
      positions[target] = positions[source];
      positions[target + 1] = positions[source + 1];
      positions[target + 2] = positions[source + 2];
      colors[target] = colors[source];
      colors[target + 1] = colors[source + 1];
      colors[target + 2] = colors[source + 2];
    }
  }

  return { positions, colors };
};

const isInsideDeterministic = (x: number, y: number, z: number): boolean => {
  const hits = collectRegionHits(x, y, z);
  if (hits.length === 0 || y < -0.54 || y > 0.9 || Math.abs(x) > 0.94) {
    return false;
  }

  const fissureHeight = smoothstep(-0.02, 0.86, y);
  const fissureWidth = (0.012 + 0.03 * fissureHeight) * 0.84;
  if (y > -0.02 && y < 0.88 && z > -0.44 && Math.abs(x) < fissureWidth) {
    return false;
  }

  return true;
};

const findBoundaryX = (y: number, side: "left" | "right"): number | null => {
  const start = side === "right" ? 1.02 : -1.02;
  const end = 0;
  const step = side === "right" ? -0.01 : 0.01;

  for (let x = start; side === "right" ? x >= end : x <= end; x += step) {
    for (let z = -0.84; z <= 0.84; z += 0.04) {
      if (isInsideDeterministic(x, y, z)) {
        return x;
      }
    }
  }

  return null;
};

const generateOutlinePositions = (): Float32Array => {
  const rows = 126;
  const rightPath: Vec3[] = [];
  const leftPath: Vec3[] = [];

  for (let row = 0; row <= rows; row += 1) {
    const y = 0.9 - (row / rows) * 1.44;
    const right = findBoundaryX(y, "right");
    const left = findBoundaryX(y, "left");

    if (right !== null && left !== null) {
      const zFront = 0.05 + 0.022 * smoothstep(-0.52, 0.88, y);
      rightPath.push([right + 0.004, y, zFront]);
      leftPath.push([left - 0.004, y, zFront]);
    }
  }

  const path = [...rightPath, ...leftPath.reverse()];
  const densePoints: number[] = [];

  for (let i = 0; i < path.length; i += 1) {
    const [x, y, z] = path[i];
    for (let layer = 0; layer < 3; layer += 1) {
      const spread = (layer - 1) * 0.008;
      densePoints.push(x, y + spread * 0.2, z + spread);
    }
  }

  // Top fissure cue.
  for (let i = 0; i < 28; i += 1) {
    const t = i / 27;
    const y = 0.82 - t * 0.48;
    densePoints.push(0, y, 0.06 + 0.005 * Math.sin(i * 0.72));
  }

  return new Float32Array(densePoints);
};

const distanceSquared = (
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number
): number => {
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  return dx * dx + dy * dy + dz * dz;
};

const nearestIndices = (
  positions: Float32Array,
  target: Vec3,
  count: number
): number[] => {
  const scored: Array<{ index: number; distance: number }> = [];

  for (let i = 0; i < positions.length / 3; i += 1) {
    const distance = distanceSquared(
      positions[i * 3],
      positions[i * 3 + 1],
      positions[i * 3 + 2],
      target[0],
      target[1],
      target[2]
    );

    scored.push({ index: i, distance });
  }

  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, count).map((entry) => entry.index);
};

const averagePoint = (positions: Float32Array, indices: number[]): Vec3 => {
  let x = 0;
  let y = 0;
  let z = 0;

  for (const index of indices) {
    x += positions[index * 3];
    y += positions[index * 3 + 1];
    z += positions[index * 3 + 2];
  }

  const inv = 1 / Math.max(indices.length, 1);
  return [x * inv, y * inv, z * inv];
};

const computeBoundingRadius = (positions: Float32Array): number => {
  let radius = 0;

  for (let i = 0; i < positions.length / 3; i += 1) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    radius = Math.max(radius, Math.hypot(x, y, z));
  }

  return radius;
};

const generated = generateBrainPositions(POINT_COUNT);
const positions = generated.positions;
const baseColors = generated.colors;
const outlinePositions = generateOutlinePositions();

const anchorConfigs: AnchorConfig[] = SECTION_IDS.map((sectionId) => {
  const anchorIndices = nearestIndices(
    positions,
    ANCHOR_TARGETS[sectionId],
    ANCHOR_CLUSTER_SIZE
  );
  const center = averagePoint(positions, anchorIndices);

  return {
    sectionId,
    anchorIndices,
    focusVector: normalizeVector(center[0], center[1], center[2])
  };
});

const pointSectionLookup: Array<SectionId | null> = Array.from(
  { length: POINT_COUNT },
  () => null
);

for (const config of anchorConfigs) {
  for (const index of config.anchorIndices) {
    pointSectionLookup[index] = config.sectionId;
  }
}

const anchorIndexSet = new Set<number>();
for (const config of anchorConfigs) {
  for (const index of config.anchorIndices) {
    anchorIndexSet.add(index);
  }
}

export const brainData = {
  positions,
  baseColors,
  outlinePositions,
  pointCount: POINT_COUNT,
  anchorConfigs,
  pointSectionLookup,
  anchorIndexSet,
  brainRadius: Math.max(BRAIN_RADIUS, computeBoundingRadius(positions) * 1.03)
};

export const focusVectorBySection: Record<SectionId, Vec3> =
  anchorConfigs.reduce(
    (accumulator, config) => {
      accumulator[config.sectionId] = config.focusVector;
      return accumulator;
    },
    {
      experience: [0, 0, 1],
      projects: [0, 0, 1],
      leadership: [0, 0, 1],
      interests: [0, 0, 1],
      about: [0, 0, 1]
    } as Record<SectionId, Vec3>
  );

export const anchorCentersBySection: Record<SectionId, Vec3> =
  anchorConfigs.reduce(
    (accumulator, config) => {
      accumulator[config.sectionId] = averagePoint(positions, config.anchorIndices);
      return accumulator;
    },
    {
      experience: [0, 0, 0],
      projects: [0, 0, 0],
      leadership: [0, 0, 0],
      interests: [0, 0, 0],
      about: [0, 0, 0]
    } as Record<SectionId, Vec3>
  );
