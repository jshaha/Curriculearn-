import type { SectionId } from "@/content/siteContent";

type Vec3Tuple = [number, number, number];

type Axis3 = [number, number, number];

type LobeId = "frontal" | "parietal" | "temporal" | "occipital";

const SECTION_ORDER: SectionId[] = [
  "experience",
  "projects",
  "leadership",
  "interests",
  "about"
];

export const SECTION_LOBE_MAP: Record<SectionId, string> = {
  experience: "frontal-left",
  projects: "frontal-right",
  leadership: "parietal",
  interests: "temporal",
  about: "occipital"
};

const SECTION_TO_REGION_INDEX: Record<SectionId, number> = {
  experience: 0,
  projects: 1,
  leadership: 2,
  interests: 3,
  about: 4
};

const dot = (a: Axis3, b: Axis3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const norm = (v: Axis3): number => Math.hypot(v[0], v[1], v[2]);

const normalize = (v: Axis3): Axis3 => {
  const length = norm(v) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
};

const sub = (a: Axis3, b: Axis3): Axis3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

const scale = (v: Axis3, scalar: number): Axis3 => [v[0] * scalar, v[1] * scalar, v[2] * scalar];

const matVec = (
  matrix: [number, number, number, number, number, number, number, number, number],
  vector: Axis3
): Axis3 => [
  matrix[0] * vector[0] + matrix[1] * vector[1] + matrix[2] * vector[2],
  matrix[3] * vector[0] + matrix[4] * vector[1] + matrix[5] * vector[2],
  matrix[6] * vector[0] + matrix[7] * vector[1] + matrix[8] * vector[2]
];

const outer = (v: Axis3): [number, number, number, number, number, number, number, number, number] => [
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

const subtractMatrix = (
  a: [number, number, number, number, number, number, number, number, number],
  b: [number, number, number, number, number, number, number, number, number]
): [number, number, number, number, number, number, number, number, number] => [
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

const scaleMatrix = (
  matrix: [number, number, number, number, number, number, number, number, number],
  scalar: number
): [number, number, number, number, number, number, number, number, number] => [
  matrix[0] * scalar,
  matrix[1] * scalar,
  matrix[2] * scalar,
  matrix[3] * scalar,
  matrix[4] * scalar,
  matrix[5] * scalar,
  matrix[6] * scalar,
  matrix[7] * scalar,
  matrix[8] * scalar
];

const cross = (a: Axis3, b: Axis3): Axis3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const createRecord = <T>(factory: () => T): Record<SectionId, T> => ({
  experience: factory(),
  projects: factory(),
  leadership: factory(),
  interests: factory(),
  about: factory()
});

const powerIteration = (
  matrix: [number, number, number, number, number, number, number, number, number],
  seed: Axis3,
  orthogonalTo: Axis3[]
): Axis3 => {
  let vector = normalize(seed);

  for (let iter = 0; iter < 42; iter += 1) {
    let next = matVec(matrix, vector);

    orthogonalTo.forEach((axis) => {
      next = sub(next, scale(axis, dot(next, axis)));
    });

    const length = norm(next);
    if (length < 1e-8) {
      break;
    }

    vector = normalize(next);
  }

  return normalize(vector);
};

const orientToward = (axis: Axis3, target: Axis3): Axis3 =>
  dot(axis, target) < 0 ? scale(axis, -1) : axis;

const nearestLobe = (lr: number, ap: number, si: number): LobeId => {
  const frontal = [0.5, 0.84, 0.68] as const;
  const parietal = [0.5, 0.56, 0.74] as const;
  const occipital = [0.5, 0.14, 0.6] as const;
  const temporalLeft = [0.23, 0.45, 0.22] as const;
  const temporalRight = [0.77, 0.45, 0.22] as const;

  const distance = (center: readonly [number, number, number]): number => {
    const dx = lr - center[0];
    const dy = ap - center[1];
    const dz = si - center[2];
    return dx * dx + dy * dy + dz * dz;
  };

  const scores: Array<{ lobe: LobeId; score: number }> = [
    { lobe: "frontal", score: distance(frontal) },
    { lobe: "parietal", score: distance(parietal) },
    { lobe: "occipital", score: distance(occipital) },
    {
      lobe: "temporal",
      score: Math.min(distance(temporalLeft), distance(temporalRight))
    }
  ];

  scores.sort((a, b) => a.score - b.score);
  return scores[0].lobe;
};

const classifyLobe = (lr: number, ap: number, si: number): LobeId => {
  const frontalRule = ap >= 0.62 && si >= 0.34;
  const occipitalRule = ap <= 0.3 && si >= 0.34;
  const temporalRule = si <= 0.4 && (lr <= 0.42 || lr >= 0.58) && ap < 0.78;
  const parietalRule = si >= 0.5 && ap > 0.24 && ap < 0.76;

  if (frontalRule) {
    return "frontal";
  }

  if (occipitalRule) {
    return "occipital";
  }

  if (temporalRule) {
    return "temporal";
  }

  if (parietalRule) {
    return "parietal";
  }

  return nearestLobe(lr, ap, si);
};

const sectionFromLobe = (lobe: LobeId, lr: number): SectionId => {
  if (lobe === "frontal") {
    // Split frontal lobe into left/right halves to create 5 deterministic regions.
    return lr <= 0.5 ? "experience" : "projects";
  }

  if (lobe === "parietal") {
    return "leadership";
  }

  if (lobe === "temporal") {
    return "interests";
  }

  return "about";
};

export interface BrainRegionsData {
  regionIndexForPoint: Uint8Array;
  sectionByPoint: Array<SectionId>;
  regionPointIndices: Record<SectionId, Uint32Array>;
  regionCentroids: Record<SectionId, Vec3Tuple>;
  regionAnchorIndexBySection: Record<SectionId, number>;
  regionAnchorPointBySection: Record<SectionId, Vec3Tuple>;
  coverageRatio: number;
  axes: {
    leftRight: Vec3Tuple;
    anteriorPosterior: Vec3Tuple;
    superiorInferior: Vec3Tuple;
  };
}

export const buildBrainRegions = (positions: Float32Array): BrainRegionsData => {
  const pointCount = positions.length / 3;
  const mean: Axis3 = [0, 0, 0];

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
  const covariance: [number, number, number, number, number, number, number, number, number] = [
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

  const v1 = powerIteration(covariance, [1, 0.2, 0.1], []);
  const lambda1 = dot(v1, matVec(covariance, v1));
  const deflated = subtractMatrix(covariance, scaleMatrix(outer(v1), lambda1));
  const v2 = powerIteration(deflated, [0.2, 1, 0.3], [v1]);
  const v3 = normalize(cross(v1, v2));

  const candidates: Axis3[] = [v1, v2, v3];
  const xAxis: Axis3 = [1, 0, 0];
  const yAxis: Axis3 = [0, 1, 0];
  const zAxis: Axis3 = [0, 0, 1];

  const used = new Set<number>();

  const pickAxis = (target: Axis3): Axis3 => {
    let bestIndex = -1;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < candidates.length; i += 1) {
      if (used.has(i)) {
        continue;
      }

      const score = Math.abs(dot(candidates[i], target));
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    if (bestIndex < 0) {
      return target;
    }

    used.add(bestIndex);
    return orientToward(candidates[bestIndex], target);
  };

  const leftRight = pickAxis(xAxis);
  const anteriorPosterior = pickAxis(zAxis);
  const superiorInferior = pickAxis(yAxis);

  const projectedLR = new Float32Array(pointCount);
  const projectedAP = new Float32Array(pointCount);
  const projectedSI = new Float32Array(pointCount);

  let minLR = Number.POSITIVE_INFINITY;
  let maxLR = Number.NEGATIVE_INFINITY;
  let minAP = Number.POSITIVE_INFINITY;
  let maxAP = Number.NEGATIVE_INFINITY;
  let minSI = Number.POSITIVE_INFINITY;
  let maxSI = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < pointCount; i += 1) {
    const idx = i * 3;
    const centered: Axis3 = [
      positions[idx] - mean[0],
      positions[idx + 1] - mean[1],
      positions[idx + 2] - mean[2]
    ];

    const lr = dot(centered, leftRight);
    const ap = dot(centered, anteriorPosterior);
    const si = dot(centered, superiorInferior);

    projectedLR[i] = lr;
    projectedAP[i] = ap;
    projectedSI[i] = si;

    minLR = Math.min(minLR, lr);
    maxLR = Math.max(maxLR, lr);
    minAP = Math.min(minAP, ap);
    maxAP = Math.max(maxAP, ap);
    minSI = Math.min(minSI, si);
    maxSI = Math.max(maxSI, si);
  }

  const rangeLR = Math.max(maxLR - minLR, 1e-6);
  const rangeAP = Math.max(maxAP - minAP, 1e-6);
  const rangeSI = Math.max(maxSI - minSI, 1e-6);

  const regionIndexForPoint = new Uint8Array(pointCount);
  const sectionByPoint: Array<SectionId> = Array.from({ length: pointCount }, () => "about");
  const buckets = createRecord<number[]>(() => []);

  for (let i = 0; i < pointCount; i += 1) {
    const lrN = clamp01((projectedLR[i] - minLR) / rangeLR);
    const apN = clamp01((projectedAP[i] - minAP) / rangeAP);
    const siN = clamp01((projectedSI[i] - minSI) / rangeSI);

    const lobe = classifyLobe(lrN, apN, siN);
    const sectionId = sectionFromLobe(lobe, lrN);

    sectionByPoint[i] = sectionId;
    regionIndexForPoint[i] = SECTION_TO_REGION_INDEX[sectionId];
    buckets[sectionId].push(i);
  }

  // Make sure each section has at least one point (rare fallback for unusual meshes).
  SECTION_ORDER.forEach((sectionId) => {
    if (buckets[sectionId].length > 0) {
      return;
    }

    let largest: SectionId = "experience";
    SECTION_ORDER.forEach((candidate) => {
      if (buckets[candidate].length > buckets[largest].length) {
        largest = candidate;
      }
    });

    const moved = buckets[largest].pop();
    if (typeof moved === "number") {
      buckets[sectionId].push(moved);
      sectionByPoint[moved] = sectionId;
      regionIndexForPoint[moved] = SECTION_TO_REGION_INDEX[sectionId];
    }
  });

  const regionPointIndices: Record<SectionId, Uint32Array> = {
    experience: Uint32Array.from(buckets.experience),
    projects: Uint32Array.from(buckets.projects),
    leadership: Uint32Array.from(buckets.leadership),
    interests: Uint32Array.from(buckets.interests),
    about: Uint32Array.from(buckets.about)
  };

  const regionCentroids = createRecord<Vec3Tuple>(() => [0, 0, 0]);
  const regionAnchorIndexBySection = createRecord<number>(() => 0);
  const regionAnchorPointBySection = createRecord<Vec3Tuple>(() => [0, 0, 0]);

  SECTION_ORDER.forEach((sectionId) => {
    const indices = regionPointIndices[sectionId];
    if (indices.length === 0) {
      return;
    }

    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    for (let i = 0; i < indices.length; i += 1) {
      const idx = indices[i] * 3;
      sumX += positions[idx];
      sumY += positions[idx + 1];
      sumZ += positions[idx + 2];
    }

    const inv = 1 / indices.length;
    const centroid: Vec3Tuple = [sumX * inv, sumY * inv, sumZ * inv];
    regionCentroids[sectionId] = centroid;

    let bestIndex = indices[0];
    let bestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < indices.length; i += 1) {
      const index = indices[i];
      const idx = index * 3;
      const dx = positions[idx] - centroid[0];
      const dy = positions[idx + 1] - centroid[1];
      const dz = positions[idx + 2] - centroid[2];
      const dist = dx * dx + dy * dy + dz * dz;

      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = index;
      }
    }

    regionAnchorIndexBySection[sectionId] = bestIndex;
    const anchorIdx = bestIndex * 3;
    regionAnchorPointBySection[sectionId] = [
      positions[anchorIdx],
      positions[anchorIdx + 1],
      positions[anchorIdx + 2]
    ];
  });

  const coveredPoints = SECTION_ORDER.reduce(
    (sum, sectionId) => sum + regionPointIndices[sectionId].length,
    0
  );

  return {
    regionIndexForPoint,
    sectionByPoint,
    regionPointIndices,
    regionCentroids,
    regionAnchorIndexBySection,
    regionAnchorPointBySection,
    coverageRatio: pointCount > 0 ? coveredPoints / pointCount : 0,
    axes: {
      leftRight,
      anteriorPosterior,
      superiorInferior
    }
  };
};

export const getStableRegionAnchorPoint = (
  sectionId: SectionId,
  regions: BrainRegionsData
): Vec3Tuple => regions.regionAnchorPointBySection[sectionId];
