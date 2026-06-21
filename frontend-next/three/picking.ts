import * as THREE from "three";

import type { SectionId } from "@/content/siteContent";

export interface PickSectionInput {
  pointerNdc: { x: number; y: number };
  camera: THREE.Camera;
  points: THREE.Points;
  raycaster: THREE.Raycaster;
  pointSectionLookup: Array<SectionId | null>;
  anchorCentersBySection: Record<SectionId, [number, number, number]>;
  viewportWidth: number;
  viewportHeight: number;
  pointsThreshold: number;
  fallbackPixelThreshold: number;
}

const sections: SectionId[] = [
  "experience",
  "projects",
  "leadership",
  "interests",
  "about"
];

const workingVector = new THREE.Vector3();
const pointerVector = new THREE.Vector2();

const ndcToPixels = (
  ndcX: number,
  ndcY: number,
  width: number,
  height: number
): [number, number] => [((ndcX + 1) * width) / 2, ((1 - ndcY) * height) / 2];

export const pickSectionFromPointer = (
  input: PickSectionInput
): SectionId | null => {
  if (!input.raycaster.params.Points) {
    input.raycaster.params.Points = { threshold: input.pointsThreshold };
  } else {
    input.raycaster.params.Points.threshold = input.pointsThreshold;
  }

  pointerVector.set(input.pointerNdc.x, input.pointerNdc.y);
  input.raycaster.setFromCamera(pointerVector, input.camera);

  const hits = input.raycaster.intersectObject(input.points, false);

  for (const hit of hits) {
    if (typeof hit.index === "number") {
      const section = input.pointSectionLookup[hit.index];
      if (section) {
        return section;
      }
    }
  }

  const [pointerX, pointerY] = ndcToPixels(
    input.pointerNdc.x,
    input.pointerNdc.y,
    input.viewportWidth,
    input.viewportHeight
  );

  let closestSection: SectionId | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const sectionId of sections) {
    const center = input.anchorCentersBySection[sectionId];
    workingVector.set(center[0], center[1], center[2]);
    input.points.localToWorld(workingVector);
    workingVector.project(input.camera);

    const [anchorX, anchorY] = ndcToPixels(
      workingVector.x,
      workingVector.y,
      input.viewportWidth,
      input.viewportHeight
    );

    const dx = anchorX - pointerX;
    const dy = anchorY - pointerY;
    const distance = Math.hypot(dx, dy);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestSection = sectionId;
    }
  }

  if (closestDistance <= input.fallbackPixelThreshold) {
    return closestSection;
  }

  return null;
};

const centerWorld = new THREE.Vector3();
const edgeWorld = new THREE.Vector3();
const centerNdc = new THREE.Vector3();
const edgeNdc = new THREE.Vector3();

export const isPointerNearBrainProjection = ({
  pointerNdc,
  camera,
  points,
  brainRadius,
  margin = 1.2
}: {
  pointerNdc: { x: number; y: number };
  camera: THREE.Camera;
  points: THREE.Points;
  brainRadius: number;
  margin?: number;
}): boolean => {
  centerWorld.set(0, 0, 0);
  edgeWorld.set(brainRadius, 0, 0);

  points.localToWorld(centerWorld);
  points.localToWorld(edgeWorld);

  centerNdc.copy(centerWorld).project(camera);
  edgeNdc.copy(edgeWorld).project(camera);

  const projectedRadius = Math.abs(edgeNdc.x - centerNdc.x) * margin;
  const dx = pointerNdc.x - centerNdc.x;
  const dy = pointerNdc.y - centerNdc.y;

  return dx * dx + dy * dy <= projectedRadius * projectedRadius;
};

export const setInteractiveCursor = (isInteractive: boolean): void => {
  if (typeof document === "undefined") {
    return;
  }

  document.body.style.cursor = isInteractive ? "pointer" : "default";
};
