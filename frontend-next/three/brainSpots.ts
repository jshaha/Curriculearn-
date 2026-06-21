import type { SectionId } from "@/content/siteContent";

import { SPOT_FRACTION } from "./brainTuning";

type Vec3 = [number, number, number];

const SECTIONS: SectionId[] = [
  "experience",
  "projects",
  "leadership",
  "interests",
  "about"
];

const SEEDS_PCA: Record<SectionId, Vec3> = {
  // [left-right, anterior-posterior, inferior-superior] in normalized PCA space (0..1).
  experience: [0.24, 0.82, 0.7],
  projects: [0.76, 0.82, 0.7],
  leadership: [0.3, 0.2, 0.3],
  interests: [0.7, 0.2, 0.3],
  about: [0.5, 0.58, 0.9]
};

export const SECTION_SPOT_MAP: Record<SectionId, string> = {
  experience: "front-left",
  projects: "front-right",
  leadership: "rear-left",
  interests: "rear-right",
  about: "top-mid"
};

type Mat3 = [number, number, number, number, number, number, number, number, number];

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const norm = (v: Vec3): number => Math.hypot(v[0], v[1], v[2]);

const normalize = (v: Vec3): Vec3 => {
  const length = norm(v) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
};

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

const scale = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s];

const matVec = (m: Mat3, v: Vec3): Vec3 => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
];

const outer = (v: Vec3): Mat3 => [
  v[0] * v[0],
  v[0] * v[1],
  v[0] * v[2],
  v[1] * v[0],
  v[1] * v[1],
  v[1] * v[2],
  v[2] * v[0],
  v[2] * v[1],
  v[2] * v[2]
];

const scaleMatrix = (m: Mat3, s: number): Mat3 => [
  m[0] * s,
  m[1] * s,
  m[2] * s,
  m[3] * s,
  m[4] * s,
  m[5] * s,
  m[6] * s,
  m[7] * s,
  m[8] * s
];

const subtractMatrix = (a: Mat3, b: Mat3): Mat3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
  a[3] - b[3],
  a[4] - b[4],
  a[5] - b[5],
  a[6] - b[6],
  a[7] - b[7],
  a[8] - b[8]
];

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];

const orientToward = (axis: Vec3, target: Vec3): Vec3 =>
  dot(axis, target) < 0 ? scale(axis, -1) : axis;

const powerIteration = (matrix: Mat3, seed: Vec3, orthogonals: Vec3[]): Vec3 => {
  let vector = normalize(seed);

  for (let iter = 0; iter < 42; iter += 1) {
    let next = matVec(matrix, vector);
    orthogonals.forEach((axis) => {
      next = sub(next, scale(axis, dot(next, axis)));
    });

    const length = norm(next);
    if (length < 1e-8) {
      break;
    }

    vector = normalize(next);
  }

  return vector;
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const createSectionRecord = <T>(factory: () => T): Record<SectionId, T> => ({
  experience: factory(),
  projects: factory(),
  leadership: factory(),
  interests: factory(),
  about: factory()
});

const sectionByOrder = (index: number): SectionId => SECTIONS[index];

export interface BrainSpotsData {
  spotIndicesBySection: Record<SectionId, Uint32Array>;
  anchorIndexBySection: Record<SectionId, number>;
  anchorPointBySection: Record<SectionId, Vec3>;
  spotSectionLookup: Array<SectionId | null>;
  coverageRatio: number;
  overlapRatioBySection: Record<SectionId, number>;
  axes: {
    leftRight: Vec3;
    anteriorPosterior: Vec3;
    inferiorSuperior: Vec3;
  };
}

export const buildBrainSpots = (
  positions: Float32Array,
  options?: { spotFraction?: number }
): BrainSpotsData => {
  const pointCount = positions.length / 3;
  const mean: Vec3 = [0, 0, 0];

  for (let i = 0; i < pointCount; i += 1) {
    const idx = i * 3;
    mean[0] += positions[idx];
    mean[1] += positions[idx + 1];
    mean[2] += positions[idx + 2];
  }

  if (pointCount > 0) {
    mean[0] /= pointCount;
    mean[1] /= pointCount;
    mean[2] /= pointCount;
  }

  let c00 = 0;
  let c01 = 0;
  let c02 = 0;
  let c11 = 0;
  let c12 = 0;
  let c22 = 0;

  for (let i = 0; i < pointCount; i += 1) {
    const idx = i * 3;
    const x = positions[idx] - mean[0];
    const y = positions[idx + 1] - mean[1];
    const z = positions[idx + 2] - mean[2];

    c00 += x * x;
    c01 += x * y;
    c02 += x * z;
    c11 += y * y;
    c12 += y * z;
    c22 += z * z;
  }

  const invN = 1 / Math.max(pointCount - 1, 1);
  const covariance: Mat3 = [
    c00 * invN,
    c01 * invN,
    c02 * invN,
    c01 * invN,
    c11 * invN,
    c12 * invN,
    c02 * invN,
    c12 * invN,
    c22 * invN
  ];

  const p1 = powerIteration(covariance, [1, 0.2, 0.1], []);
  const lambda1 = dot(p1, matVec(covariance, p1));
  const deflated = subtractMatrix(covariance, scaleMatrix(outer(p1), lambda1));
  const p2 = powerIteration(deflated, [0.1, 1, 0.25], [p1]);
  const p3 = normalize(cross(p1, p2));

  const candidates: Vec3[] = [p1, p2, p3];
  const targets: Vec3[] = [
    [1, 0, 0], // left-right
    [0, 0, 1], // anterior-posterior (world z)
    [0, 1, 0] // inferior-superior (world y)
  ];

  const used = new Set<number>();
  const pickAxis = (target: Vec3): Vec3 => {
    let bestIndex = -1;
    let best = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < candidates.length; i += 1) {
      if (used.has(i)) {
        continue;
      }
      const score = Math.abs(dot(candidates[i], target));
      if (score > best) {
        best = score;
        bestIndex = i;
      }
    }

    if (bestIndex < 0) {
      return target;
    }

    used.add(bestIndex);
    return orientToward(candidates[bestIndex], target);
  };

  const leftRight = pickAxis(targets[0]);
  const anteriorPosterior = pickAxis(targets[1]);
  const inferiorSuperior = pickAxis(targets[2]);

  const projectedLR = new Float32Array(pointCount);
  const projectedAP = new Float32Array(pointCount);
  const projectedIS = new Float32Array(pointCount);

  let minLR = Number.POSITIVE_INFINITY;
  let maxLR = Number.NEGATIVE_INFINITY;
  let minAP = Number.POSITIVE_INFINITY;
  let maxAP = Number.NEGATIVE_INFINITY;
  let minIS = Number.POSITIVE_INFINITY;
  let maxIS = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < pointCount; i += 1) {
    const idx = i * 3;
    const centered: Vec3 = [
      positions[idx] - mean[0],
      positions[idx + 1] - mean[1],
      positions[idx + 2] - mean[2]
    ];

    const lr = dot(centered, leftRight);
    const ap = dot(centered, anteriorPosterior);
    const is = dot(centered, inferiorSuperior);

    projectedLR[i] = lr;
    projectedAP[i] = ap;
    projectedIS[i] = is;

    minLR = Math.min(minLR, lr);
    maxLR = Math.max(maxLR, lr);
    minAP = Math.min(minAP, ap);
    maxAP = Math.max(maxAP, ap);
    minIS = Math.min(minIS, is);
    maxIS = Math.max(maxIS, is);
  }

  const rangeLR = Math.max(maxLR - minLR, 1e-6);
  const rangeAP = Math.max(maxAP - minAP, 1e-6);
  const rangeIS = Math.max(maxIS - minIS, 1e-6);

  const normalizedPca = new Float32Array(pointCount * 3);
  for (let i = 0; i < pointCount; i += 1) {
    const idx = i * 3;
    normalizedPca[idx] = clamp01((projectedLR[i] - minLR) / rangeLR);
    normalizedPca[idx + 1] = clamp01((projectedAP[i] - minAP) / rangeAP);
    normalizedPca[idx + 2] = clamp01((projectedIS[i] - minIS) / rangeIS);
  }

  const spotFraction = options?.spotFraction ?? SPOT_FRACTION;
  const spotCount = Math.max(32, Math.floor(pointCount * spotFraction));
  const assigned = new Uint8Array(pointCount);
  const spotSectionLookup: Array<SectionId | null> = Array.from(
    { length: pointCount },
    () => null
  );

  const buckets = createSectionRecord<number[]>(() => []);
  const overlapRatioBySection = createSectionRecord<number>(() => 0);

  SECTIONS.forEach((sectionId) => {
    const seed = SEEDS_PCA[sectionId];
    const distances: Array<{ index: number; d: number }> = [];

    for (let i = 0; i < pointCount; i += 1) {
      const idx = i * 3;
      const dx = normalizedPca[idx] - seed[0];
      const dy = normalizedPca[idx + 1] - seed[1];
      const dz = normalizedPca[idx + 2] - seed[2];
      distances.push({ index: i, d: dx * dx + dy * dy + dz * dz });
    }

    distances.sort((a, b) => a.d - b.d);

    const chosen: number[] = [];
    let overlapCount = 0;

    for (let i = 0; i < distances.length && chosen.length < spotCount; i += 1) {
      const index = distances[i].index;
      if (assigned[index] === 1) {
        overlapCount += 1;
        continue;
      }

      assigned[index] = 1;
      chosen.push(index);
      spotSectionLookup[index] = sectionId;
    }

    if (chosen.length < spotCount) {
      for (let i = 0; i < distances.length && chosen.length < spotCount; i += 1) {
        const index = distances[i].index;
        if (chosen.includes(index)) {
          continue;
        }
        chosen.push(index);
      }
    }

    buckets[sectionId] = chosen;
    overlapRatioBySection[sectionId] = chosen.length > 0 ? overlapCount / chosen.length : 0;
  });

  const spotIndicesBySection: Record<SectionId, Uint32Array> = {
    experience: Uint32Array.from(buckets.experience),
    projects: Uint32Array.from(buckets.projects),
    leadership: Uint32Array.from(buckets.leadership),
    interests: Uint32Array.from(buckets.interests),
    about: Uint32Array.from(buckets.about)
  };

  const anchorIndexBySection = createSectionRecord<number>(() => 0);
  const anchorPointBySection = createSectionRecord<Vec3>(() => [0, 0, 0]);

  SECTIONS.forEach((sectionId) => {
    const indices = spotIndicesBySection[sectionId];
    const seed = SEEDS_PCA[sectionId];

    if (indices.length === 0) {
      return;
    }

    let bestIndex = indices[0];
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < indices.length; i += 1) {
      const pointIndex = indices[i];
      const idx = pointIndex * 3;

      const dx = normalizedPca[idx] - seed[0];
      const dy = normalizedPca[idx + 1] - seed[1];
      const dz = normalizedPca[idx + 2] - seed[2];
      const d = dx * dx + dy * dy + dz * dz;

      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = pointIndex;
      }
    }

    anchorIndexBySection[sectionId] = bestIndex;
    const baseIdx = bestIndex * 3;
    anchorPointBySection[sectionId] = [
      positions[baseIdx],
      positions[baseIdx + 1],
      positions[baseIdx + 2]
    ];
  });

  const covered = spotSectionLookup.reduce(
    (sum, sectionId) => (sectionId ? sum + 1 : sum),
    0
  );

  return {
    spotIndicesBySection,
    anchorIndexBySection,
    anchorPointBySection,
    spotSectionLookup,
    coverageRatio: pointCount > 0 ? covered / pointCount : 0,
    overlapRatioBySection,
    axes: {
      leftRight,
      anteriorPosterior,
      inferiorSuperior
    }
  };
};

export const getSpotSectionColor = (sectionId: SectionId): string => {
  const palette: Record<SectionId, string> = {
    experience: "#ffad66",
    projects: "#ffd082",
    leadership: "#ff7f50",
    interests: "#ffb347",
    about: "#ff9f1c"
  };

  return palette[sectionId];
};

export const sectionFromOrder = (index: number): SectionId => sectionByOrder(index);
