"use client"

import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import type { JSX, RefObject } from "react"
import * as THREE from "three"

import { lerp, clamp } from "@/lib/utils"
import type { MetricId } from "./types"
import { BrainHighlightOverlay } from "./BrainHighlightOverlay"
import { useBrainSharedData } from "./brainShared"
import { createBrainPhysicsState, updateBrainPhysics } from "./brainPhysics"
import type { BrainPhysicsState } from "./brainPhysics"
import {
  BLENDING_MODE,
  CURSOR_BLEND_WHILE_FOCUS,
  DIM_FACTOR,
  FOCUS_SLERP,
  HALO_OPACITY,
  HALO_SCALE,
  HALO_TINT,
  POINT_OPACITY,
  POINT_SIZE,
  ROTATION_LERP,
  YAW_MAX,
} from "./brainTuning"

export interface PointerState { x: number; y: number; inside: boolean }

interface Props {
  pointerRef: RefObject<PointerState>
  hoveredMetricId: MetricId | null
}

const TARGET_FORWARD = new THREE.Vector3(0, 0, 1)
const ANCHOR_VECTOR = new THREE.Vector3()
const EULER_CURSOR = new THREE.Euler()
const Q_CURSOR = new THREE.Quaternion()
const Q_FOCUS = new THREE.Quaternion()
const Q_TARGET = new THREE.Quaternion()
const Q_WORLD = new THREE.Quaternion()

const HORIZONTAL_METRICS = new Set<MetricId>(["engagement", "concept_flow"])
const HORIZONTAL_Y_FACTOR = 0.08

const createPointSprite = (): THREE.CanvasTexture => {
  const canvas = document.createElement("canvas")
  canvas.width = 128; canvas.height = 128
  const ctx = canvas.getContext("2d")!
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 58)
  g.addColorStop(0, "rgba(255,255,255,1)")
  g.addColorStop(0.45, "rgba(255,255,255,0.95)")
  g.addColorStop(1, "rgba(255,255,255,0)")
  ctx.clearRect(0, 0, 128, 128)
  ctx.beginPath(); ctx.arc(64, 64, 58, 0, Math.PI * 2)
  ctx.fillStyle = g; ctx.fill()
  const t = new THREE.CanvasTexture(canvas); t.needsUpdate = true; return t
}

export function BrainPoints({ pointerRef, hoveredMetricId }: Props): JSX.Element {
  const sharedData = useBrainSharedData()
  const sampled = sharedData?.sampled ?? null
  const spots = sharedData?.spots ?? null

  const groupRef = useRef<THREE.Group>(null)
  const baseMaterialRef = useRef<THREE.PointsMaterial>(null)
  const physicsRef = useRef<BrainPhysicsState | null>(null)
  const baseOpacityRef = useRef(POINT_OPACITY)

  const pointTexture = useMemo(() => typeof document === "undefined" ? null : createPointSprite(), [])

  const physicsState = useMemo(() => {
    if (!sampled) return null
    return createBrainPhysicsState(sampled.restPositions, sampled.restNormals)
  }, [sampled])

  useEffect(() => { physicsRef.current = physicsState }, [physicsState])

  const geometry = useMemo(() => {
    if (!sampled || !physicsState) return null
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(physicsState.currentPositions, 3))
    g.computeBoundingSphere()
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(sampled.baseColors), 3))
    return g
  }, [sampled, physicsState])

  const basePositionAttribute = useMemo(
    () => (geometry ? (geometry.getAttribute("position") as THREE.BufferAttribute) : null),
    [geometry],
  )

  const pointBlending = BLENDING_MODE === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending

  useEffect(() => () => {
    pointTexture?.dispose()
    geometry?.dispose()
  }, [geometry, pointTexture])

  useFrame((state, dt) => {
    if (!sampled || !geometry || !physicsRef.current || !spots) return
    const group = groupRef.current
    if (!group) return

    const pointer = pointerRef.current
    const px = pointer?.inside ? clamp(pointer.x, -1, 1) : 0
    const py = pointer?.inside ? clamp(pointer.y, -1, 1) : 0

    // Cursor rotation
    EULER_CURSOR.set(-py * 0.34, px * YAW_MAX, 0, "YXZ")
    Q_CURSOR.setFromEuler(EULER_CURSOR)

    if (hoveredMetricId) {
      const anchor = spots.anchorPointByMetric[hoveredMetricId]
      ANCHOR_VECTOR.set(anchor[0], anchor[1], anchor[2]).normalize()
      if (HORIZONTAL_METRICS.has(hoveredMetricId)) {
        ANCHOR_VECTOR.y *= HORIZONTAL_Y_FACTOR
        if (ANCHOR_VECTOR.lengthSq() < 1e-8) ANCHOR_VECTOR.set(0, 0, 1)
        else ANCHOR_VECTOR.normalize()
      }
      Q_FOCUS.setFromUnitVectors(ANCHOR_VECTOR, TARGET_FORWARD)
      Q_TARGET.copy(Q_FOCUS).slerp(Q_CURSOR, CURSOR_BLEND_WHILE_FOCUS)
      group.quaternion.slerp(Q_TARGET, FOCUS_SLERP)
    } else {
      group.quaternion.slerp(Q_CURSOR, ROTATION_LERP)
    }

    // Dim base cloud when a region is highlighted
    const targetOpacity = hoveredMetricId ? POINT_OPACITY * DIM_FACTOR : POINT_OPACITY
    baseOpacityRef.current = lerp(baseOpacityRef.current, targetOpacity, 0.18)
    if (baseMaterialRef.current) baseMaterialRef.current.opacity = baseOpacityRef.current

    // Cursor repulsion physics
    let cursorPx: { x: number; y: number } | null = null
    if (pointer?.inside) {
      cursorPx = {
        x: (px * 0.5 + 0.5) * state.size.width,
        y: (1 - (py * 0.5 + 0.5)) * state.size.height,
      }
    }

    group.updateWorldMatrix(true, false)
    group.getWorldQuaternion(Q_WORLD)

    updateBrainPhysics(physicsRef.current, {
      dt,
      isActive: Boolean(cursorPx),
      cursorPx,
      viewportWidth: state.size.width,
      viewportHeight: state.size.height,
      camera: state.camera,
      groupMatrixWorld: group.matrixWorld,
      groupQuaternionWorld: Q_WORLD,
    })

    ;(geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true
  })

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
    )
  }

  return (
    <group ref={groupRef}>
      {/* Halo layer */}
      <points geometry={geometry}>
        <pointsMaterial
          transparent depthWrite={false}
          size={POINT_SIZE * HALO_SCALE} sizeAttenuation
          map={pointTexture ?? undefined} alphaMap={pointTexture ?? undefined}
          alphaTest={0.08} opacity={HALO_OPACITY} color={HALO_TINT}
          blending={pointBlending} toneMapped={false}
        />
      </points>

      {/* Base cloud */}
      <points geometry={geometry}>
        <pointsMaterial
          ref={baseMaterialRef}
          transparent depthWrite={false}
          size={POINT_SIZE} sizeAttenuation
          map={pointTexture ?? undefined} alphaMap={pointTexture ?? undefined}
          alphaTest={0.08} opacity={POINT_OPACITY} vertexColors
          blending={pointBlending} toneMapped={false}
        />
      </points>

      {/* Hover highlight overlay */}
      <BrainHighlightOverlay
        positionAttribute={basePositionAttribute}
        activeMetricId={hoveredMetricId}
        spotIndicesByMetric={spots.spotIndicesByMetric}
        pointTexture={pointTexture}
      />
    </group>
  )
}
