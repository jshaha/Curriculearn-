"use client"

import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import type { JSX } from "react"
import * as THREE from "three"

import type { MetricId } from "./types"
import {
  HALO_OPACITY,
  OVERLAY_FADE_LERP,
  OVERLAY_OPACITY,
  OVERLAY_POINT_SCALE,
  POINT_SIZE,
} from "./brainTuning"

const ACCENT_COLOR = "#FF8A1A"

interface Props {
  positionAttribute: THREE.BufferAttribute
  activeMetricId: MetricId | null
  spotIndicesByMetric: Record<MetricId, Uint32Array>
  pointTexture: THREE.Texture | null
}

export function BrainHighlightOverlay({
  positionAttribute,
  activeMetricId,
  spotIndicesByMetric,
  pointTexture,
}: Props): JSX.Element {
  const overlayRef = useRef<THREE.Points>(null)
  const haloRef = useRef<THREE.Points>(null)
  const overlayMatRef = useRef<THREE.PointsMaterial>(null)
  const haloMatRef = useRef<THREE.PointsMaterial>(null)
  const fadeRef = useRef(0)

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", positionAttribute)
    g.setDrawRange(0, 0)
    return g
  }, [positionAttribute])

  useEffect(() => {
    if (!activeMetricId) {
      geometry.setIndex(null)
      geometry.setDrawRange(0, 0)
      return
    }
    const indices = spotIndicesByMetric[activeMetricId]
    if (!indices || indices.length === 0) {
      geometry.setIndex(null)
      geometry.setDrawRange(0, 0)
      return
    }
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    geometry.setDrawRange(0, indices.length)
  }, [activeMetricId, geometry, spotIndicesByMetric])

  useEffect(() => () => { geometry.dispose() }, [geometry])

  useFrame(() => {
    const target = activeMetricId ? 1 : 0
    fadeRef.current += (target - fadeRef.current) * OVERLAY_FADE_LERP
    const fade = fadeRef.current
    const visible = fade > 0.01 && geometry.drawRange.count > 0

    if (overlayRef.current) overlayRef.current.visible = visible
    if (haloRef.current) haloRef.current.visible = visible
    if (overlayMatRef.current) overlayMatRef.current.opacity = OVERLAY_OPACITY * fade
    if (haloMatRef.current) haloMatRef.current.opacity = HALO_OPACITY * fade
  })

  return (
    <>
      <points ref={haloRef} geometry={geometry} visible={false} renderOrder={1}>
        <pointsMaterial
          ref={haloMatRef}
          transparent depthWrite={false} depthTest={false}
          size={POINT_SIZE * OVERLAY_POINT_SCALE * 1.8} sizeAttenuation
          map={pointTexture ?? undefined} alphaMap={pointTexture ?? undefined}
          alphaTest={0.06} opacity={0} color={ACCENT_COLOR}
          blending={THREE.NormalBlending} toneMapped={false}
        />
      </points>
      <points ref={overlayRef} geometry={geometry} visible={false} renderOrder={2}>
        <pointsMaterial
          ref={overlayMatRef}
          transparent depthWrite={false} depthTest={false}
          size={POINT_SIZE * OVERLAY_POINT_SCALE} sizeAttenuation
          map={pointTexture ?? undefined} alphaMap={pointTexture ?? undefined}
          alphaTest={0.16} opacity={0} color={ACCENT_COLOR}
          blending={THREE.NormalBlending} toneMapped={false}
        />
      </points>
    </>
  )
}
