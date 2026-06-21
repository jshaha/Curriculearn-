"use client"

import { Canvas } from "@react-three/fiber"
import { Suspense, useEffect, useMemo, useRef } from "react"
import type { JSX, PointerEvent as ReactPointerEvent } from "react"
import * as THREE from "three"

import type { MetricId } from "./types"
import { BrainPoints, type PointerState } from "./BrainPoints"
import { CAMERA_DISTANCE, CAMERA_FOV, FOG_FAR, FOG_NEAR } from "./brainTuning"

interface Props {
  hoveredMetricId: MetricId | null
}

export function BrainCanvas({ hoveredMetricId }: Props): JSX.Element {
  const pointerRef = useRef<PointerState>({ x: 0, y: 0, inside: false })

  const camera = useMemo(
    () => ({ position: [0, 0, CAMERA_DISTANCE] as [number, number, number], fov: CAMERA_FOV }),
    [],
  )

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerRef.current.y = 1 - (e.clientY / window.innerHeight) * 2
      pointerRef.current.inside = true
    }
    const onOut = (e: PointerEvent) => {
      if (e.relatedTarget === null) {
        pointerRef.current.inside = false
        pointerRef.current.x = 0
        pointerRef.current.y = 0
      }
    }
    const onBlur = () => {
      pointerRef.current.inside = false
      pointerRef.current.x = 0
      pointerRef.current.y = 0
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerout", onOut)
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerout", onOut)
      window.removeEventListener("blur", onBlur)
    }
  }, [])

  return (
    <div className="relative h-full w-full">
      <Canvas
        className="h-full w-full"
        camera={camera}
        dpr={[1.25, 2.25]}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#0b0c0f"), 1)
        }}
      >
        <fog attach="fog" args={["#0b0c0f", FOG_NEAR, FOG_FAR]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[2.4, 2.4, 4]} intensity={0.48} />
        <directionalLight position={[-2.6, 1.5, 2.2]} intensity={0.22} />

        <Suspense fallback={null}>
          <BrainPoints pointerRef={pointerRef} hoveredMetricId={hoveredMetricId} />
        </Suspense>
      </Canvas>
    </div>
  )
}
