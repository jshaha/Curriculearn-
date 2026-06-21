"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import type { BrainRegionActivation } from "@/lib/planner-data"
import { preloadBrainSharedData } from "./brain/brainShared"
import type { SampledBrainData } from "./brain/brainSampling"

// ─── Anatomical region targets ────────────────────────────────────────────────
// Each region is a point on the real cortex point cloud, found by nearest-
// neighbour search against an approximate anatomical position. Coordinates
// use the same convention as the sampled mesh: +Z front, +Y up, +X right.
// Regions whose target sits off the midline (|x| > 0.2) are mirrored into
// the opposite hemisphere and merged under the same region name, matching
// how bilateral structures (hippocampus, amygdala, language areas, etc.)
// actually work in the brain.

type LobeDef = {
  region: string
  pos: [number, number, number]
  /** Fraction of total sampled points pulled into this region's cluster. */
  spotFraction: number
}

const LOBE_DEFS: LobeDef[] = [
  // ── Large lobes ────────────────────────────────────────────────────────────
  { region: "Frontal lobe", pos: [0, 0.12, 0.62], spotFraction: 0.07 },
  { region: "Parietal lobe", pos: [0, 0.58, 0.02], spotFraction: 0.06 },
  { region: "Temporal lobe", pos: [0.58, -0.18, 0.12], spotFraction: 0.045 },
  { region: "Occipital lobe", pos: [0, 0.1, -0.62], spotFraction: 0.05 },
  { region: "Cerebellum", pos: [0, -0.5, -0.42], spotFraction: 0.04 },
  // ── Sub-regions ────────────────────────────────────────────────────────────
  { region: "Prefrontal cortex", pos: [0.06, 0.1, 0.84], spotFraction: 0.022 },
  { region: "Hippocampus", pos: [0.34, -0.26, 0.08], spotFraction: 0.016 },
  { region: "Amygdala", pos: [0.36, -0.18, 0.3], spotFraction: 0.012 },
  { region: "Broca's area", pos: [0.6, 0.08, 0.4], spotFraction: 0.014 },
  { region: "Wernicke's area", pos: [0.6, 0.16, -0.08], spotFraction: 0.014 },
]

// Colours — matching the portfolio site's indigo/violet palette
const COL_IDLE = new THREE.Color(0xb9c2da) // idle cortex tint (cool grey-blue)
const COL_ACTIVE = new THREE.Color(0x8b6df0) // active region fill
const COL_HOT = new THREE.Color(0xe6d8ff) // peak highlight

function getIntensity(data: BrainRegionActivation[], region: string): number {
  return data.find((r) => r.region === region)?.intensity ?? 0
}

const distanceSq = (
  positions: Float32Array,
  i: number,
  target: [number, number, number],
): number => {
  const dx = positions[i * 3] - target[0]
  const dy = positions[i * 3 + 1] - target[1]
  const dz = positions[i * 3 + 2] - target[2]
  return dx * dx + dy * dy + dz * dz
}

const nearestIndices = (
  positions: Float32Array,
  target: [number, number, number],
  count: number,
): number[] => {
  const pointCount = positions.length / 3
  const scored: Array<{ index: number; d: number }> = []
  for (let i = 0; i < pointCount; i += 1) {
    scored.push({ index: i, d: distanceSq(positions, i, target) })
  }
  scored.sort((a, b) => a.d - b.d)
  return scored.slice(0, count).map((entry) => entry.index)
}

/** Builds a region -> point-index cluster map against the real cortex mesh. */
const buildLobeSpots = (sampled: SampledBrainData): Record<string, Uint32Array> => {
  const positions = sampled.restPositions
  const pointCount = positions.length / 3
  const result: Record<string, Uint32Array> = {}

  for (const def of LOBE_DEFS) {
    const count = Math.max(24, Math.floor(pointCount * def.spotFraction))
    const indices = new Set<number>(nearestIndices(positions, def.pos, count))

    if (def.pos[0] > 0.2) {
      const mirrored: [number, number, number] = [-def.pos[0], def.pos[1], def.pos[2]]
      for (const index of nearestIndices(positions, mirrored, count)) {
        indices.add(index)
      }
    }

    result[def.region] = Uint32Array.from(indices)
  }

  return result
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BrainMap3DProps {
  data: BrainRegionActivation[]
  highlightThreshold?: number
}

export function BrainMap3D({ data, highlightThreshold = 0.55 }: BrainMap3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  // Keep a stable ref to the latest data so the animation loop can read it
  // without needing to restart the effect.
  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let disposed = false
    let raf = 0
    let cleanupScene: (() => void) | null = null

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
    camera.position.set(0, 0.1, 4.1)
    camera.lookAt(0, 0, 0)

    function resize() {
      const w = mount!.clientWidth
      const h = mount!.clientHeight || 260
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    // ── Loading placeholder — faint wireframe while the cortex mesh loads ─────
    const placeholderGeo = new THREE.IcosahedronGeometry(0.85, 2)
    const placeholderMat = new THREE.MeshBasicMaterial({
      color: 0xd3dbeb,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    })
    const placeholderMesh = new THREE.Mesh(placeholderGeo, placeholderMat)
    scene.add(placeholderMesh)

    let placeholderT = 0
    function animatePlaceholder() {
      if (disposed) return
      raf = requestAnimationFrame(animatePlaceholder)
      placeholderT += 0.006
      placeholderMesh.rotation.y = placeholderT * 0.6
      renderer.render(scene, camera)
    }
    animatePlaceholder()

    // ── Load the real cortex mesh and replace the placeholder ─────────────────
    void preloadBrainSharedData()
      .then((shared) => {
        if (disposed) return
        cancelAnimationFrame(raf)
        scene.remove(placeholderMesh)
        placeholderGeo.dispose()
        placeholderMat.dispose()

        const sampled = shared.sampled
        const lobeSpots = buildLobeSpots(sampled)

        // ── Lights ────────────────────────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0xffffff, 0.4))
        const light1 = new THREE.PointLight(0x8b6df0, 3.2, 12)
        scene.add(light1)
        const light2 = new THREE.PointLight(0x2563eb, 1.6, 12)
        light2.position.set(-2.5, -1, -2)
        scene.add(light2)

        // ── Point cloud built from the real cortex surface ────────────────────
        const group = new THREE.Group()
        scene.add(group)

        const baseColors = sampled.baseColors
        const liveColors = new Float32Array(baseColors)

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute("position", new THREE.BufferAttribute(sampled.restPositions, 3))
        geometry.setAttribute("color", new THREE.BufferAttribute(liveColors, 3))
        geometry.computeBoundingSphere()

        const canvas = document.createElement("canvas")
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext("2d")
        let pointTexture: THREE.CanvasTexture | null = null
        if (ctx) {
          const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30)
          gradient.addColorStop(0, "rgba(255,255,255,1)")
          gradient.addColorStop(0.5, "rgba(255,255,255,0.9)")
          gradient.addColorStop(1, "rgba(255,255,255,0)")
          ctx.beginPath()
          ctx.arc(32, 32, 30, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
          pointTexture = new THREE.CanvasTexture(canvas)
          pointTexture.needsUpdate = true
        }

        const material = new THREE.PointsMaterial({
          size: 0.026,
          sizeAttenuation: true,
          vertexColors: true,
          transparent: true,
          depthWrite: false,
          opacity: 0.88,
          map: pointTexture ?? undefined,
          alphaMap: pointTexture ?? undefined,
          alphaTest: 0.08,
          toneMapped: false,
        })

        const points = new THREE.Points(geometry, material)
        group.add(points)

        // ── Animation ─────────────────────────────────────────────────────────
        let t = 0
        const current: Record<string, number> = {}
        for (const def of LOBE_DEFS) current[def.region] = 0

        const scratch = new THREE.Color()

        function animate() {
          if (disposed) return
          raf = requestAnimationFrame(animate)
          t += 0.008

          group.rotation.y = t * 0.45
          group.rotation.x = Math.sin(t * 0.28) * 0.06

          light1.position.set(
            Math.cos(t * 0.6) * 2.8,
            Math.sin(t * 0.35) * 1.4 + 0.8,
            Math.sin(t * 0.45) * 2,
          )

          // Reset to base cortex shading, then paint active regions on top.
          liveColors.set(baseColors)

          const liveData = dataRef.current
          for (const def of LOBE_DEFS) {
            const target = getIntensity(liveData, def.region)
            current[def.region] += (target - current[def.region]) * 0.05
            const v = current[def.region]
            if (v < 0.02) continue

            const isActive = v >= highlightThreshold
            scratch.copy(COL_IDLE).lerp(COL_ACTIVE, Math.min(v / 0.7, 1))
            if (isActive) {
              scratch.lerp(COL_HOT, Math.min((v - highlightThreshold) / 0.4, 1) * 0.6)
            }

            const indices = lobeSpots[def.region]
            if (!indices) continue
            for (let i = 0; i < indices.length; i += 1) {
              const idx = indices[i] * 3
              liveColors[idx] = liveColors[idx] * (1 - v) + scratch.r * v
              liveColors[idx + 1] = liveColors[idx + 1] * (1 - v) + scratch.g * v
              liveColors[idx + 2] = liveColors[idx + 2] * (1 - v) + scratch.b * v
            }
          }

          ;(geometry.getAttribute("color") as THREE.BufferAttribute).needsUpdate = true
          renderer.render(scene, camera)
        }

        animate()

        cleanupScene = () => {
          geometry.dispose()
          material.dispose()
          pointTexture?.dispose()
        }
      })
      .catch((error) => {
        console.error("Failed to load cortex mesh for brain-map-3d:", error)
      })

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      cleanupScene?.()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // only mount once; data updates via dataRef

  return <div ref={mountRef} className="w-full h-full min-h-[260px]" />
}
