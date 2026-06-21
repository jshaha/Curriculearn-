import * as THREE from "three";

import type { SectionId } from "@/content/siteContent";

import { BRAIN_RADIUS, POINT_COUNT_TOTAL, TARGET_SIZE } from "./brainTuning";

type Vec3Tuple = [number, number, number];

const SECTION_IDS: SectionId[] = [
  "experience",
  "projects",
  "leadership",
  "interests",
  "about"
];

const ANCHOR_TARGETS: Record<SectionId, Vec3Tuple> = {
  experience: [-0.56, 0.1, 0.16],
  projects: [0.56, 0.1, 0.16],
  leadership: [-0.42, -0.38, 0.12],
  interests: [0.42, -0.38, 0.12],
  about: [0, 0.58, 0.08]
};

const ANCHOR_CLUSTER_SIZE = 1;

const KEY_LIGHT = new THREE.Vector3(0.36, 0.47, 0.81).normalize();
const FILL_LIGHT = new THREE.Vector3(-0.58, 0.2, 0.28).normalize();

interface PreparedMesh {
  name: string;
  geometry: THREE.BufferGeometry;
  area: number;
}

interface TriangleSampler {
  position: THREE.BufferAttribute;
  index: ArrayLike<number>;
  cumulativeAreas: Float64Array;
  triangleCount: number;
  totalArea: number;
}

export interface MeshPointAllocation {
  name: string;
  pointCount: number;
  area: number;
  ratio: number;
}

export interface SampledBrainData {
  restPositions: Float32Array;
  restNormals: Float32Array;
  baseColors: Float32Array;
  pointCount: number;
  brainRadius: number;
  pointSectionLookup: Array<SectionId | null>;
  anchorCentersBySection: Record<SectionId, Vec3Tuple>;
  focusVectorBySection: Record<SectionId, Vec3Tuple>;
  anchorIndicesBySection: Record<SectionId, number[]>;
  debugMeshGeometries: THREE.BufferGeometry[];
  debugBoundsCenter: Vec3Tuple;
  debugBoundsSize: Vec3Tuple;
  meshCount: number;
  meshAllocations: MeshPointAllocation[];
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const normalizeTuple = (x: number, y: number, z: number): Vec3Tuple => {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
};

const ensureIndexed = (geometry: THREE.BufferGeometry): THREE.BufferGeometry => {
  if (geometry.index) {
    return geometry;
  }

  const position = geometry.getAttribute("position");
  const count = position.count;
  const indexArray =
    count > 65535 ? new Uint32Array(count) : new Uint16Array(count);

  for (let i = 0; i < count; i += 1) {
    indexArray[i] = i;
  }

  geometry.setIndex(new THREE.BufferAttribute(indexArray, 1));
  return geometry;
};

const remapPosition = (x: number, y: number, z: number): Vec3Tuple => [x, z, y];

const remapNormal = (x: number, y: number, z: number): Vec3Tuple =>
  normalizeTuple(x, z, y);

const computeSurfaceArea = (geometry: THREE.BufferGeometry): number => {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const index = geometry.getIndex();

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const cross = new THREE.Vector3();

  let area = 0;

  if (index) {
    const indexArray = index.array;
    for (let i = 0; i < indexArray.length; i += 3) {
      const i0 = Number(indexArray[i]);
      const i1 = Number(indexArray[i + 1]);
      const i2 = Number(indexArray[i + 2]);

      a.fromBufferAttribute(position, i0);
      b.fromBufferAttribute(position, i1);
      c.fromBufferAttribute(position, i2);

      ab.subVectors(b, a);
      ac.subVectors(c, a);
      cross.crossVectors(ab, ac);
      area += cross.length() * 0.5;
    }
  } else {
    for (let i = 0; i < position.count; i += 3) {
      a.fromBufferAttribute(position, i);
      b.fromBufferAttribute(position, i + 1);
      c.fromBufferAttribute(position, i + 2);

      ab.subVectors(b, a);
      ac.subVectors(c, a);
      cross.crossVectors(ab, ac);
      area += cross.length() * 0.5;
    }
  }

  return area;
};

const createTriangleSampler = (geometry: THREE.BufferGeometry): TriangleSampler => {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const indexAttribute = geometry.getIndex();
  const index =
    indexAttribute?.array ??
    (() => {
      const generated = new Uint32Array(position.count);
      for (let i = 0; i < position.count; i += 1) {
        generated[i] = i;
      }
      return generated;
    })();

  const triangleCount = Math.floor(index.length / 3);
  const cumulativeAreas = new Float64Array(triangleCount);

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const cross = new THREE.Vector3();

  let running = 0;
  for (let i = 0; i < triangleCount; i += 1) {
    const idx = i * 3;
    const i0 = Number(index[idx]);
    const i1 = Number(index[idx + 1]);
    const i2 = Number(index[idx + 2]);

    a.fromBufferAttribute(position, i0);
    b.fromBufferAttribute(position, i1);
    c.fromBufferAttribute(position, i2);

    ab.subVectors(b, a);
    ac.subVectors(c, a);
    cross.crossVectors(ab, ac);
    running += cross.length() * 0.5;
    cumulativeAreas[i] = running;
  }

  return {
    position,
    index,
    cumulativeAreas,
    triangleCount,
    totalArea: running
  };
};

const findTriangleIndex = (cumulativeAreas: Float64Array, target: number): number => {
  let low = 0;
  let high = cumulativeAreas.length - 1;

  while (low < high) {
    const mid = (low + high) >> 1;
    if (target <= cumulativeAreas[mid]) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  return low;
};

const SAMPLE_A = new THREE.Vector3();
const SAMPLE_B = new THREE.Vector3();
const SAMPLE_C = new THREE.Vector3();
const SAMPLE_AB = new THREE.Vector3();
const SAMPLE_AC = new THREE.Vector3();

const samplePointFromTriangleSampler = (
  sampler: TriangleSampler,
  outPosition: THREE.Vector3,
  outNormal: THREE.Vector3
): void => {
  if (sampler.triangleCount === 0 || sampler.totalArea <= 0) {
    outPosition.set(0, 0, 0);
    outNormal.set(0, 0, 1);
    return;
  }

  const pick = Math.random() * sampler.totalArea;
  const triangleIndex = findTriangleIndex(sampler.cumulativeAreas, pick);
  const idx = triangleIndex * 3;

  const i0 = Number(sampler.index[idx]);
  const i1 = Number(sampler.index[idx + 1]);
  const i2 = Number(sampler.index[idx + 2]);

  const a = SAMPLE_A.fromBufferAttribute(sampler.position, i0);
  const b = SAMPLE_B.fromBufferAttribute(sampler.position, i1);
  const c = SAMPLE_C.fromBufferAttribute(sampler.position, i2);

  const r1 = Math.random();
  const r2 = Math.random();
  const sqrtR1 = Math.sqrt(r1);
  const u = 1 - sqrtR1;
  const v = sqrtR1 * (1 - r2);
  const w = sqrtR1 * r2;

  outPosition.set(
    u * a.x + v * b.x + w * c.x,
    u * a.y + v * b.y + w * c.y,
    u * a.z + v * b.z + w * c.z
  );

  const ab = SAMPLE_AB.subVectors(b, a);
  const ac = SAMPLE_AC.subVectors(c, a);
  outNormal.crossVectors(ab, ac).normalize();
};

const collectSampleMeshes = (root: THREE.Object3D): PreparedMesh[] => {
  root.updateWorldMatrix(true, true);

  const meshes: PreparedMesh[] = [];
  let meshIndex = 0;

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return;
    }

    if (!(object.geometry instanceof THREE.BufferGeometry)) {
      return;
    }

    const position = object.geometry.getAttribute("position");
    if (!position || position.count < 3) {
      return;
    }

    object.updateWorldMatrix(true, false);

    const geometry = ensureIndexed(object.geometry.clone());
    geometry.applyMatrix4(object.matrixWorld);
    geometry.computeVertexNormals();

    const area = computeSurfaceArea(geometry);
    if (area <= 0) {
      geometry.dispose();
      return;
    }

    meshIndex += 1;
    meshes.push({
      name: object.name || `mesh-${meshIndex}`,
      geometry,
      area
    });
  });

  if (meshes.length === 0) {
    throw new Error("No mesh geometry found in cortex.glb for surface sampling.");
  }

  return meshes;
};

const allocatePointsByArea = (
  meshes: PreparedMesh[],
  pointCountTotal: number
): number[] => {
  if (meshes.length === 1) {
    return [pointCountTotal];
  }

  const totalArea = meshes.reduce((sum, mesh) => sum + mesh.area, 0);
  if (totalArea <= 1e-8) {
    const even = Math.floor(pointCountTotal / meshes.length);
    const counts = Array.from({ length: meshes.length }, () => even);
    let remaining = pointCountTotal - even * meshes.length;
    let cursor = 0;
    while (remaining > 0) {
      counts[cursor % counts.length] += 1;
      cursor += 1;
      remaining -= 1;
    }
    return counts;
  }

  const rawAllocations = meshes.map(
    (mesh) => (mesh.area / totalArea) * pointCountTotal
  );

  const counts = rawAllocations.map((raw) => Math.floor(raw));

  if (pointCountTotal >= meshes.length) {
    for (let i = 0; i < counts.length; i += 1) {
      if (meshes[i].area > 0 && counts[i] === 0) {
        counts[i] = 1;
      }
    }
  }

  const remainders = rawAllocations.map((raw, index) => ({
    index,
    remainder: raw - Math.floor(raw)
  }));

  let assigned = counts.reduce((sum, count) => sum + count, 0);
  let delta = pointCountTotal - assigned;

  if (delta > 0) {
    remainders.sort((a, b) => b.remainder - a.remainder);
    let cursor = 0;
    while (delta > 0) {
      counts[remainders[cursor % remainders.length].index] += 1;
      cursor += 1;
      delta -= 1;
    }
  } else if (delta < 0) {
    remainders.sort((a, b) => a.remainder - b.remainder);
    let cursor = 0;
    while (delta < 0 && cursor < remainders.length * 4) {
      const target = remainders[cursor % remainders.length].index;
      if (counts[target] > 1) {
        counts[target] -= 1;
        delta += 1;
      }
      cursor += 1;
    }
  }

  assigned = counts.reduce((sum, count) => sum + count, 0);
  if (assigned !== pointCountTotal) {
    const last = counts.length - 1;
    counts[last] += pointCountTotal - assigned;
  }

  return counts;
};

const sampleMeshes = (
  meshes: PreparedMesh[],
  pointCountsByMesh: number[]
): {
  positions: Float32Array;
  normals: Float32Array;
  totalPoints: number;
} => {
  const totalPoints = pointCountsByMesh.reduce((sum, count) => sum + count, 0);
  const positions = new Float32Array(totalPoints * 3);
  const normals = new Float32Array(totalPoints * 3);

  const sampledPosition = new THREE.Vector3();
  const sampledNormal = new THREE.Vector3();
  const triangleSamplers = meshes.map((mesh) => createTriangleSampler(mesh.geometry));

  let offset = 0;

  for (let meshIndex = 0; meshIndex < meshes.length; meshIndex += 1) {
    const pointCount = pointCountsByMesh[meshIndex];
    if (pointCount <= 0) {
      continue;
    }

    const sampler = triangleSamplers[meshIndex];

    for (let i = 0; i < pointCount; i += 1) {
      samplePointFromTriangleSampler(sampler, sampledPosition, sampledNormal);

      const mappedPosition = remapPosition(
        sampledPosition.x,
        sampledPosition.y,
        sampledPosition.z
      );
      const mappedNormal = remapNormal(
        sampledNormal.x,
        sampledNormal.y,
        sampledNormal.z
      );

      const idx = offset * 3;
      positions[idx] = mappedPosition[0];
      positions[idx + 1] = mappedPosition[1];
      positions[idx + 2] = mappedPosition[2];

      normals[idx] = mappedNormal[0];
      normals[idx + 1] = mappedNormal[1];
      normals[idx + 2] = mappedNormal[2];

      offset += 1;
    }
  }

  return { positions, normals, totalPoints };
};

const sampleMeshesFromVertices = (
  meshes: PreparedMesh[],
  pointCountsByMesh: number[]
): {
  positions: Float32Array;
  normals: Float32Array;
  totalPoints: number;
} => {
  const totalPoints = pointCountsByMesh.reduce((sum, count) => sum + count, 0);
  const positions = new Float32Array(totalPoints * 3);
  const normals = new Float32Array(totalPoints * 3);

  let offset = 0;

  for (let meshIndex = 0; meshIndex < meshes.length; meshIndex += 1) {
    const pointCount = pointCountsByMesh[meshIndex];
    if (pointCount <= 0) {
      continue;
    }

    const geometry = meshes[meshIndex].geometry;
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    const normal = geometry.getAttribute("normal") as THREE.BufferAttribute | undefined;
    const vertexCount = position.count;

    if (vertexCount === 0) {
      continue;
    }

    for (let i = 0; i < pointCount; i += 1) {
      const vertexIndex = Math.floor(Math.random() * vertexCount);
      const mappedPosition = remapPosition(
        position.getX(vertexIndex),
        position.getY(vertexIndex),
        position.getZ(vertexIndex)
      );
      const mappedNormal = normal
        ? remapNormal(
            normal.getX(vertexIndex),
            normal.getY(vertexIndex),
            normal.getZ(vertexIndex)
          )
        : [0, 0, 1];

      const idx = offset * 3;
      positions[idx] = mappedPosition[0];
      positions[idx + 1] = mappedPosition[1];
      positions[idx + 2] = mappedPosition[2];
      normals[idx] = mappedNormal[0];
      normals[idx + 1] = mappedNormal[1];
      normals[idx + 2] = mappedNormal[2];
      offset += 1;
    }
  }

  return { positions, normals, totalPoints };
};

const normalizePointCloud = (
  positions: Float32Array,
  targetSize: number
): {
  sourceCenter: Vec3Tuple;
  scale: number;
  boundsCenter: Vec3Tuple;
  boundsSize: Vec3Tuple;
  radius: number;
} => {
  const box = new THREE.Box3().setFromBufferAttribute(
    new THREE.BufferAttribute(positions, 3)
  );
  const centerVec = box.getCenter(new THREE.Vector3());
  const sizeVec = box.getSize(new THREE.Vector3());
  const largestDimension = Math.max(sizeVec.x, sizeVec.y, sizeVec.z, 1e-6);
  const scale = targetSize / largestDimension;

  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (positions[i] - centerVec.x) * scale;
    positions[i + 1] = (positions[i + 1] - centerVec.y) * scale;
    positions[i + 2] = (positions[i + 2] - centerVec.z) * scale;
  }

  const normalizedBox = new THREE.Box3().setFromBufferAttribute(
    new THREE.BufferAttribute(positions, 3)
  );
  const normalizedCenter = normalizedBox.getCenter(new THREE.Vector3());
  const normalizedSize = normalizedBox.getSize(new THREE.Vector3());

  let radius = 0;
  for (let i = 0; i < positions.length; i += 3) {
    radius = Math.max(
      radius,
      Math.hypot(positions[i], positions[i + 1], positions[i + 2])
    );
  }

  return {
    sourceCenter: [centerVec.x, centerVec.y, centerVec.z],
    scale,
    boundsCenter: [normalizedCenter.x, normalizedCenter.y, normalizedCenter.z],
    boundsSize: [normalizedSize.x, normalizedSize.y, normalizedSize.z],
    radius
  };
};

const computeColors = (
  positions: Float32Array,
  normals: Float32Array
): Float32Array => {
  const colors = new Float32Array(positions.length);

  for (let i = 0; i < positions.length / 3; i += 1) {
    const idx = i * 3;

    const x = positions[idx];
    const y = positions[idx + 1];
    const z = positions[idx + 2];

    const nx = normals[idx];
    const ny = normals[idx + 1];
    const nz = normals[idx + 2];

    const normal = new THREE.Vector3(nx, ny, nz);
    const key = Math.max(0, normal.dot(KEY_LIGHT));
    const fill = Math.max(0, normal.dot(FILL_LIGHT));
    const rim = Math.pow(1 - Math.abs(normal.z), 1.8) * 0.18;

    const depth = 0.82 + 0.18 * smoothstep(-1, 1, z);

    const ridgeA = 1 - Math.abs(Math.sin(Math.abs(x) * 16.8 + y * 10.6 + z * 2.4));
    const ridgeB = 1 - Math.abs(Math.sin(Math.abs(x) * 12.4 - y * 13.8 + z * 3.1));
    const ridges = Math.pow(clamp(ridgeA, 0, 1), 18) + Math.pow(clamp(ridgeB, 0, 1), 18) * 0.75;
    const ridgeMask = smoothstep(-0.5, 0.95, y);

    const intensity = clamp(
      (0.24 + key * 0.54 + fill * 0.2 + rim) * depth + ridges * ridgeMask * 0.24,
      0.52,
      1
    );

    colors[idx] = 0.93 * intensity;
    colors[idx + 1] = 0.95 * intensity;
    colors[idx + 2] = 1.0 * intensity;
  }

  return colors;
};

const nearestIndices = (
  positions: Float32Array,
  target: Vec3Tuple,
  count: number
): number[] => {
  if (count <= 0) {
    return [];
  }

  const best: Array<{ index: number; distance: number }> = [];

  for (let i = 0; i < positions.length / 3; i += 1) {
    const idx = i * 3;
    const dx = positions[idx] - target[0];
    const dy = positions[idx + 1] - target[1];
    const dz = positions[idx + 2] - target[2];
    const distance = dx * dx + dy * dy + dz * dz;

    if (best.length < count) {
      best.push({ index: i, distance });
      best.sort((a, b) => b.distance - a.distance);
      continue;
    }

    if (distance < best[0].distance) {
      best[0] = { index: i, distance };
      best.sort((a, b) => b.distance - a.distance);
    }
  }

  return best.sort((a, b) => a.distance - b.distance).map((entry) => entry.index);
};

const averageIndices = (positions: Float32Array, indices: number[]): Vec3Tuple => {
  if (indices.length === 0) {
    return [0, 0, 0];
  }

  let x = 0;
  let y = 0;
  let z = 0;

  for (const index of indices) {
    const idx = index * 3;
    x += positions[idx];
    y += positions[idx + 1];
    z += positions[idx + 2];
  }

  const inv = 1 / indices.length;
  return [x * inv, y * inv, z * inv];
};

const transformDebugGeometry = (
  geometry: THREE.BufferGeometry,
  sourceCenter: Vec3Tuple,
  scale: number
): THREE.BufferGeometry => {
  const transformed = geometry.clone();
  const positions = transformed.getAttribute("position") as THREE.BufferAttribute;
  const normals = transformed.getAttribute("normal") as THREE.BufferAttribute | undefined;

  for (let i = 0; i < positions.count; i += 1) {
    const mapped = remapPosition(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    );

    positions.setXYZ(
      i,
      (mapped[0] - sourceCenter[0]) * scale,
      (mapped[1] - sourceCenter[1]) * scale,
      (mapped[2] - sourceCenter[2]) * scale
    );

    if (normals) {
      const mappedNormal = remapNormal(
        normals.getX(i),
        normals.getY(i),
        normals.getZ(i)
      );
      normals.setXYZ(i, mappedNormal[0], mappedNormal[1], mappedNormal[2]);
    }
  }

  positions.needsUpdate = true;
  if (normals) {
    normals.needsUpdate = true;
  }
  transformed.computeBoundingBox();

  return transformed;
};

export const sampleCortexSurface = (
  scene: THREE.Object3D,
  options?: {
    pointCount?: number;
  }
): SampledBrainData => {
  const pointCountTotal = options?.pointCount ?? POINT_COUNT_TOTAL;

  const preparedMeshes = collectSampleMeshes(scene);
  const pointCountsByMesh = allocatePointsByArea(preparedMeshes, pointCountTotal);

  let { positions, normals, totalPoints } = sampleMeshes(
    preparedMeshes,
    pointCountsByMesh
  );

  const sampledBounds = new THREE.Box3().setFromBufferAttribute(
    new THREE.BufferAttribute(positions, 3)
  );
  const sampledSize = sampledBounds.getSize(new THREE.Vector3());
  const sampledLargestDimension = Math.max(
    sampledSize.x,
    sampledSize.y,
    sampledSize.z
  );

  if (!Number.isFinite(sampledLargestDimension) || sampledLargestDimension < 1e-5) {
    ({ positions, normals, totalPoints } = sampleMeshesFromVertices(
      preparedMeshes,
      pointCountsByMesh
    ));
  }

  const normalized = normalizePointCloud(positions, TARGET_SIZE);

  const baseColors = computeColors(positions, normals);

  const debugMeshGeometries = preparedMeshes.map((mesh) =>
    transformDebugGeometry(mesh.geometry, normalized.sourceCenter, normalized.scale)
  );

  const meshAreaTotal = preparedMeshes.reduce((sum, mesh) => sum + mesh.area, 0);
  const meshAllocations: MeshPointAllocation[] = preparedMeshes.map((mesh, index) => ({
    name: mesh.name,
    area: mesh.area,
    pointCount: pointCountsByMesh[index],
    ratio: meshAreaTotal > 0 ? mesh.area / meshAreaTotal : 0
  }));

  preparedMeshes.forEach((mesh) => {
    mesh.geometry.dispose();
  });

  const pointSectionLookup: Array<SectionId | null> = Array.from(
    { length: totalPoints },
    () => null
  );

  const anchorIndicesBySection = SECTION_IDS.reduce(
    (accumulator, sectionId) => {
      accumulator[sectionId] = nearestIndices(
        positions,
        ANCHOR_TARGETS[sectionId],
        ANCHOR_CLUSTER_SIZE
      );
      return accumulator;
    },
    {
      experience: [],
      projects: [],
      leadership: [],
      interests: [],
      about: []
    } as Record<SectionId, number[]>
  );

  SECTION_IDS.forEach((sectionId) => {
    anchorIndicesBySection[sectionId].forEach((index) => {
      pointSectionLookup[index] = sectionId;
    });
  });

  const anchorCentersBySection = SECTION_IDS.reduce(
    (accumulator, sectionId) => {
      accumulator[sectionId] = averageIndices(
        positions,
        anchorIndicesBySection[sectionId]
      );
      return accumulator;
    },
    {
      experience: [0, 0, 0],
      projects: [0, 0, 0],
      leadership: [0, 0, 0],
      interests: [0, 0, 0],
      about: [0, 0, 0]
    } as Record<SectionId, Vec3Tuple>
  );

  const focusVectorBySection = SECTION_IDS.reduce(
    (accumulator, sectionId) => {
      const center = anchorCentersBySection[sectionId];
      accumulator[sectionId] = normalizeTuple(center[0], center[1], center[2]);
      return accumulator;
    },
    {
      experience: [0, 0, 1],
      projects: [0, 0, 1],
      leadership: [0, 0, 1],
      interests: [0, 0, 1],
      about: [0, 0, 1]
    } as Record<SectionId, Vec3Tuple>
  );

  return {
    restPositions: positions,
    restNormals: normals,
    baseColors,
    pointCount: totalPoints,
    brainRadius: Math.max(BRAIN_RADIUS, normalized.radius * 1.02),
    pointSectionLookup,
    anchorCentersBySection,
    focusVectorBySection,
    anchorIndicesBySection,
    debugMeshGeometries,
    debugBoundsCenter: normalized.boundsCenter,
    debugBoundsSize: normalized.boundsSize,
    meshCount: preparedMeshes.length,
    meshAllocations
  };
};
