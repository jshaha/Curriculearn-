"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import type { BrainRegionActivation } from "@/lib/planner-data"

// ─── Lobe geometry definitions ────────────────────────────────────────────────
// Each lobe is a scaled sphere placed at an anatomically-approximate position
// inside a unit-radius cerebrum. Coordinates: +Z front, +Y up, +X right.

type LobeDef = {
  region: string
  pos: [number, number, number]
  /** x/y/z scale applied to a base SphereGeometry(0.9, 32, 32) */
  scale: [number, number, number]
  /** Euler rotation in radians for non-symmetric lobes */
  rot?: [number, number, number]
}

const LOBE_DEFS: LobeDef[] = [
  // ── Large lobes ────────────────────────────────────────────────────────────
  {
    region: "Frontal lobe",
    pos: [0, 0.12, 0.52],
    scale: [0.78, 0.62, 0.6],
  },
  {
    region: "Parietal lobe",
    pos: [0, 0.52, 0.05],
    scale: [0.72, 0.42, 0.6],
  },
  {
    region: "Temporal lobe",
    pos: [0.62, -0.14, 0.1],
    scale: [0.3, 0.28, 0.62],
    rot: [0, 0.2, 0.18],
  },
  {
    region: "Occipital lobe",
    pos: [0, 0.08, -0.62],
    scale: [0.62, 0.48, 0.35],
  },
  {
    region: "Cerebellum",
    pos: [0, -0.55, -0.38],
    scale: [0.6, 0.3, 0.44],
  },
  // ── Sub-regions ────────────────────────────────────────────────────────────
  {
    region: "Prefrontal cortex",
    pos: [0.08, 0.08, 0.82],
    scale: [0.38, 0.35, 0.25],
  },
  {
    region: "Hippocampus",
    pos: [0.34, -0.24, 0.1],
    scale: [0.2, 0.16, 0.38],
    rot: [0, 0.3, 0],
  },
  {
    region: "Amygdala",
    pos: [0.38, -0.16, 0.32],
    scale: [0.16, 0.14, 0.16],
  },
  {
    region: "Broca's area",
    pos: [0.62, 0.06, 0.42],
    scale: [0.2, 0.18, 0.2],
  },
  {
    region: "Wernicke's area",
    pos: [0.62, 0.14, -0.1],
    scale: [0.2, 0.18, 0.2],
  },
]

// Colours — matching the portfolio site's indigo/violet palette
const COL_BASE = new THREE.Color(0x1e1b4b)      // dark indigo base
const COL_IDLE = new THREE.Color(0x312e81)       // idle lobe fill
const COL_ACTIVE = new THREE.Color(0x6d28d9)     // active lobe fill
const COL_GLOW = new THREE.Color(0xa78bfa)       // emissive glow
const COL_HOT = new THREE.Color(0xc4b5fd)        // peak emissive
const COL_SHELL = new THREE.Color(0x1e1b4b)
const COL_WIRE = new THREE.Color(0x4338ca)
const COL_MIDLINE = new THREE.Color(0x4f46e5)

function getIntensity(data: BrainRegionActivation[], region: string): number {
  return data.find((r) => r.region === region)?.intensity ?? 0
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
  useEffect(() => { dataRef.current = data }, [data])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = false
    mount.appendChild(renderer.domElement)

    function resize() {
      const w = mount!.clientWidth
      const h = mount!.clientHeight || 260
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    // ── Scene & Camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0.15, 3.6)
    camera.lookAt(0, 0, 0)

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.25))

    const light1 = new THREE.PointLight(0x7c3aed, 4, 12)
    scene.add(light1)
    const light2 = new THREE.PointLight(0x2563eb, 2.5, 12)
    light2.position.set(-2.5, -1, -2)
    scene.add(light2)
    const light3 = new THREE.PointLight(0xffffff, 1, 8)
    light3.position.set(0, 3, 1)
    scene.add(light3)

    // ── Brain group ───────────────────────────────────────────────────────────
    const group = new THREE.Group()
    group.rotation.x = 0.1
    scene.add(group)

    // Outer cerebrum shell — very low opacity, gives the rounded silhouette
    const shellGeo = new THREE.SphereGeometry(1.02, 48, 48)
    shellGeo.scale(1, 0.88, 1.06)
    const shellMat = new THREE.MeshPhongMaterial({
      color: COL_SHELL,
      emissive: COL_BASE,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.18,
      side: THREE.FrontSide,
      depthWrite: false,
    })
    group.add(new THREE.Mesh(shellGeo, shellMat))

    // Wireframe overlay (coarse) — the lattice effect
    const wireGeo = new THREE.SphereGeometry(1.03, 18, 18)
    wireGeo.scale(1, 0.88, 1.06)
    const wireMat = new THREE.MeshBasicMaterial({
      color: COL_WIRE,
      wireframe: true,
      transparent: true,
      opacity: 0.07,
    })
    group.add(new THREE.Mesh(wireGeo, wireMat))

    // Midline plane — faint dividing line between hemispheres
    const planeGeo = new THREE.PlaneGeometry(0.005, 1.6)
    const planeMat = new THREE.MeshBasicMaterial({
      color: COL_MIDLINE,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    })
    const plane = new THREE.Mesh(planeGeo, planeMat)
    plane.position.set(0, 0, 0)
    group.add(plane)

    // ── Lobe meshes ───────────────────────────────────────────────────────────
    type LobeMesh = {
      mesh: THREE.Mesh
      mat: THREE.MeshPhongMaterial
      region: string
    }
    const lobeMeshes: LobeMesh[] = []

    for (const def of LOBE_DEFS) {
      const geo = new THREE.SphereGeometry(0.9, 28, 28)
      geo.scale(...def.scale)

      const mat = new THREE.MeshPhongMaterial({
        color: COL_IDLE.clone(),
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0.38,
        shininess: 120,
        specular: new THREE.Color(0x7c3aed),
      })

      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(...def.pos)
      if (def.rot) mesh.rotation.set(...def.rot)
      group.add(mesh)
      lobeMeshes.push({ mesh, mat, region: def.region })

      // Mirror temporal / hippocampus / broca / wernicke to left hemisphere
      if (def.pos[0] > 0.2) {
        const matL = mat.clone()
        const meshL = new THREE.Mesh(geo.clone(), matL)
        meshL.position.set(-def.pos[0], def.pos[1], def.pos[2])
        if (def.rot) meshL.rotation.set(-def.rot[0], -def.rot[1], -def.rot[2])
        group.add(meshL)
        // Push mirrored lobe under the same region name so it also activates
        lobeMeshes.push({ mesh: meshL, mat: matL, region: def.region })
      }
    }

    // ── Animation ─────────────────────────────────────────────────────────────
    let raf = 0
    let t = 0

    // Smooth per-lobe intensity targets (lerped each frame)
    const current: Record<string, number> = {}
    for (const def of LOBE_DEFS) current[def.region] = 0

    function animate() {
      raf = requestAnimationFrame(animate)
      t += 0.008

      // Slow Y-axis rotation + gentle wobble
      group.rotation.y = t * 0.55
      group.rotation.x = 0.1 + Math.sin(t * 0.28) * 0.08

      // Orbiting key light for the shimmer effect
      light1.position.set(
        Math.cos(t * 0.6) * 2.8,
        Math.sin(t * 0.35) * 1.4 + 0.8,
        Math.sin(t * 0.45) * 2,
      )

      // Lerp lobe colours toward target intensities
      const liveData = dataRef.current
      for (const { mat, region } of lobeMeshes) {
        const target = getIntensity(liveData, region)
        current[region] = current[region] ?? 0
        current[region] += (target - current[region]) * 0.04 // smooth lerp

        const v = current[region]
        const isActive = v >= highlightThreshold

        // Colour
        mat.color.lerpColors(COL_IDLE, COL_ACTIVE, Math.min(v / 0.8, 1))

        // Emissive glow
        if (v > 0.05) {
          mat.emissive.lerpColors(COL_GLOW, COL_HOT, Math.min((v - 0.05) / 0.7, 1))
          mat.emissiveIntensity = v * 0.65
        } else {
          mat.emissive.set(0x000000)
          mat.emissiveIntensity = 0
        }

        // Opacity — active lobes are more solid
        mat.opacity = isActive ? 0.82 : 0.3 + v * 0.35
        mat.needsUpdate = true
      }

      renderer.render(scene, camera)
    }

    resize()
    animate()

    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      // Dispose geometries & materials
      for (const { mesh, mat } of lobeMeshes) {
        mesh.geometry.dispose()
        mat.dispose()
      }
      shellGeo.dispose(); shellMat.dispose()
      wireGeo.dispose(); wireMat.dispose()
      planeGeo.dispose(); planeMat.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // only mount once; data updates via dataRef

  return <div ref={mountRef} className="w-full h-full min-h-[260px]" />
}
