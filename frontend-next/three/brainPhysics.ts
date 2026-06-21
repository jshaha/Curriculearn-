import * as THREE from "three";

import {
  DAMPING,
  FRONT_THRESHOLD,
  MAX_DISPLACE,
  REPULSE_RADIUS_PX,
  REPULSE_STRENGTH,
  SPRING_K
} from "./brainTuning";

export interface BrainPhysicsState {
  restPositions: Float32Array;
  currentPositions: Float32Array;
  velocities: Float32Array;
  restNormals: Float32Array | null;
  pointCount: number;
}

export interface BrainPhysicsUpdateInput {
  dt: number;
  isActive: boolean;
  cursorPx: { x: number; y: number } | null;
  viewportWidth: number;
  viewportHeight: number;
  camera: THREE.Camera;
  groupMatrixWorld: THREE.Matrix4;
  groupQuaternionWorld: THREE.Quaternion;
  springK?: number;
  damping?: number;
  repulseRadiusPx?: number;
  repulseStrength?: number;
  maxDisplace?: number;
  frontThreshold?: number;
}

const CAMERA_FORWARD = new THREE.Vector3();
const CAMERA_RIGHT = new THREE.Vector3();
const CAMERA_UP = new THREE.Vector3();
const MVP_MATRIX = new THREE.Matrix4();

const smoothstep01 = (value: number): number => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

export const createBrainPhysicsState = (
  restPositions: Float32Array,
  restNormals: Float32Array | null
): BrainPhysicsState => ({
  restPositions,
  currentPositions: new Float32Array(restPositions),
  velocities: new Float32Array(restPositions.length),
  restNormals,
  pointCount: restPositions.length / 3
});

export const applyCursorRepulsion = (
  state: BrainPhysicsState,
  input: BrainPhysicsUpdateInput
): void => {
  if (
    !input.isActive ||
    !input.cursorPx ||
    input.viewportWidth <= 0 ||
    input.viewportHeight <= 0
  ) {
    return;
  }

  const repulseRadiusPx = input.repulseRadiusPx ?? REPULSE_RADIUS_PX;
  const repulseStrength = input.repulseStrength ?? REPULSE_STRENGTH;
  const frontThreshold = input.frontThreshold ?? FRONT_THRESHOLD;
  const frameScale = Math.min(input.dt, 1 / 30) * 60;
  const repulseRadiusSq = repulseRadiusPx * repulseRadiusPx;

  input.camera.updateMatrixWorld();
  input.camera.matrixWorldInverse.copy(input.camera.matrixWorld).invert();

  MVP_MATRIX.multiplyMatrices(input.camera.projectionMatrix, input.camera.matrixWorldInverse);
  MVP_MATRIX.multiply(input.groupMatrixWorld);
  const m = MVP_MATRIX.elements;

  input.camera.getWorldDirection(CAMERA_FORWARD).normalize();
  CAMERA_RIGHT.setFromMatrixColumn(input.camera.matrixWorld, 0).normalize();
  CAMERA_UP.setFromMatrixColumn(input.camera.matrixWorld, 1).normalize();

  const q = input.groupQuaternionWorld;
  const qx = q.x;
  const qy = q.y;
  const qz = q.z;
  const qw = q.w;

  const r00 = 1 - 2 * (qy * qy + qz * qz);
  const r01 = 2 * (qx * qy - qz * qw);
  const r02 = 2 * (qx * qz + qy * qw);
  const r10 = 2 * (qx * qy + qz * qw);
  const r11 = 1 - 2 * (qx * qx + qz * qz);
  const r12 = 2 * (qy * qz - qx * qw);
  const r20 = 2 * (qx * qz - qy * qw);
  const r21 = 2 * (qy * qz + qx * qw);
  const r22 = 1 - 2 * (qx * qx + qy * qy);

  // Convert view-plane axes from world to local once; per-point direction is then cheap.
  const localRightX = r00 * CAMERA_RIGHT.x + r10 * CAMERA_RIGHT.y + r20 * CAMERA_RIGHT.z;
  const localRightY = r01 * CAMERA_RIGHT.x + r11 * CAMERA_RIGHT.y + r21 * CAMERA_RIGHT.z;
  const localRightZ = r02 * CAMERA_RIGHT.x + r12 * CAMERA_RIGHT.y + r22 * CAMERA_RIGHT.z;
  const localUpX = r00 * CAMERA_UP.x + r10 * CAMERA_UP.y + r20 * CAMERA_UP.z;
  const localUpY = r01 * CAMERA_UP.x + r11 * CAMERA_UP.y + r21 * CAMERA_UP.z;
  const localUpZ = r02 * CAMERA_UP.x + r12 * CAMERA_UP.y + r22 * CAMERA_UP.z;
  const localForwardX =
    r00 * CAMERA_FORWARD.x + r10 * CAMERA_FORWARD.y + r20 * CAMERA_FORWARD.z;
  const localForwardY =
    r01 * CAMERA_FORWARD.x + r11 * CAMERA_FORWARD.y + r21 * CAMERA_FORWARD.z;
  const localForwardZ =
    r02 * CAMERA_FORWARD.x + r12 * CAMERA_FORWARD.y + r22 * CAMERA_FORWARD.z;
  const frontDirX = -localForwardX;
  const frontDirY = -localForwardY;
  const frontDirZ = -localForwardZ;

  const cursorX = input.cursorPx.x;
  const cursorY = input.cursorPx.y;
  for (let i = 0; i < state.pointCount; i += 1) {
    const idx = i * 3;

    const x = state.currentPositions[idx];
    const y = state.currentPositions[idx + 1];
    const z = state.currentPositions[idx + 2];

    const clipX = m[0] * x + m[4] * y + m[8] * z + m[12];
    const clipY = m[1] * x + m[5] * y + m[9] * z + m[13];
    const clipW = m[3] * x + m[7] * y + m[11] * z + m[15];

    if (clipW <= 1e-5) {
      continue;
    }

    const ndcX = clipX / clipW;
    const ndcY = clipY / clipW;

    if (Math.abs(ndcX) > 1.15 || Math.abs(ndcY) > 1.15) {
      continue;
    }

    const outLen = Math.hypot(x, y, z) + 1e-6;
    const outX = x / outLen;
    const outY = y / outLen;
    const outZ = z / outLen;
    const frontness = outX * frontDirX + outY * frontDirY + outZ * frontDirZ;
    if (frontness < frontThreshold) {
      continue;
    }

    const sx = (ndcX * 0.5 + 0.5) * input.viewportWidth;
    const sy = (1 - (ndcY * 0.5 + 0.5)) * input.viewportHeight;

    const dx = sx - cursorX;
    const dy = sy - cursorY;
    const distSq = dx * dx + dy * dy;

    if (distSq >= repulseRadiusSq) {
      continue;
    }

    const dist = Math.sqrt(distSq) + 1e-6;
    const dirX = dx / dist;
    const dirY = dy / dist;
    const t = 1 - dist / repulseRadiusPx;
    const falloff = smoothstep01(t);
    const scale = repulseStrength * falloff * frameScale;

    // Push away in view plane, converted to local coordinates.
    state.velocities[idx] += (localRightX * dirX + localUpX * -dirY) * scale;
    state.velocities[idx + 1] += (localRightY * dirX + localUpY * -dirY) * scale;
    state.velocities[idx + 2] += (localRightZ * dirX + localUpZ * -dirY) * scale;
  }
};

export const updateBrainPhysics = (
  state: BrainPhysicsState,
  input: BrainPhysicsUpdateInput
): void => {
  const dt = Math.min(input.dt, 1 / 30);
  const frameScale = dt * 60;
  const springK = input.springK ?? SPRING_K;
  const damping = input.damping ?? DAMPING;
  const maxDisplace = input.maxDisplace ?? MAX_DISPLACE;
  const maxDisplaceSq = maxDisplace * maxDisplace;
  const dampingFactor = Math.pow(damping, frameScale);

  // Base spring + damping always runs to preserve silhouette and relaxation.
  for (let i = 0; i < state.pointCount; i += 1) {
    const idx = i * 3;
    const restX = state.restPositions[idx];
    const restY = state.restPositions[idx + 1];
    const restZ = state.restPositions[idx + 2];

    const posX = state.currentPositions[idx];
    const posY = state.currentPositions[idx + 1];
    const posZ = state.currentPositions[idx + 2];

    state.velocities[idx] += (restX - posX) * springK * frameScale;
    state.velocities[idx + 1] += (restY - posY) * springK * frameScale;
    state.velocities[idx + 2] += (restZ - posZ) * springK * frameScale;
  }

  applyCursorRepulsion(state, input);

  for (let i = 0; i < state.pointCount; i += 1) {
    const idx = i * 3;

    let velX = state.velocities[idx] * dampingFactor;
    let velY = state.velocities[idx + 1] * dampingFactor;
    let velZ = state.velocities[idx + 2] * dampingFactor;

    const restX = state.restPositions[idx];
    const restY = state.restPositions[idx + 1];
    const restZ = state.restPositions[idx + 2];

    let posX = state.currentPositions[idx] + velX * dt;
    let posY = state.currentPositions[idx + 1] + velY * dt;
    let posZ = state.currentPositions[idx + 2] + velZ * dt;

    const dispX = posX - restX;
    const dispY = posY - restY;
    const dispZ = posZ - restZ;
    const dispSq = dispX * dispX + dispY * dispY + dispZ * dispZ;

    if (dispSq > maxDisplaceSq) {
      const scale = maxDisplace / Math.sqrt(dispSq);
      posX = restX + dispX * scale;
      posY = restY + dispY * scale;
      posZ = restZ + dispZ * scale;
      velX *= 0.72;
      velY *= 0.72;
      velZ *= 0.72;
    }

    state.currentPositions[idx] = posX;
    state.currentPositions[idx + 1] = posY;
    state.currentPositions[idx + 2] = posZ;
    state.velocities[idx] = velX;
    state.velocities[idx + 1] = velY;
    state.velocities[idx + 2] = velZ;
  }
};

export const syncCurrentToRest = (state: BrainPhysicsState): void => {
  state.currentPositions.set(state.restPositions);
  state.velocities.fill(0);
};
