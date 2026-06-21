import type { MetricId } from "./types"
import { METRICS } from "./types"
import { SPOT_FRACTION } from "./brainTuning"

type Vec3 = [number, number, number]
type Mat3 = [number, number, number, number, number, number, number, number, number]

// PCA seeds: same positions as portfolio sections, just renamed
const SEEDS_PCA: Record<MetricId, Vec3> = {
  learning_score: [0.24, 0.82, 0.7],
  cognitive_load: [0.76, 0.82, 0.7],
  engagement: [0.3, 0.2, 0.3],
  concept_flow: [0.7, 0.2, 0.3],
  retention: [0.5, 0.58, 0.9],
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const norm = (v: Vec3) => Math.hypot(v[0], v[1], v[2])
const normalize = (v: Vec3): Vec3 => { const l = norm(v) || 1; return [v[0]/l, v[1]/l, v[2]/l] }
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0]-b[0], a[1]-b[1], a[2]-b[2]]
const scale = (v: Vec3, s: number): Vec3 => [v[0]*s, v[1]*s, v[2]*s]
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]

const matVec = (m: Mat3, v: Vec3): Vec3 => [
  m[0]*v[0]+m[1]*v[1]+m[2]*v[2],
  m[3]*v[0]+m[4]*v[1]+m[5]*v[2],
  m[6]*v[0]+m[7]*v[1]+m[8]*v[2],
]
const outer = (v: Vec3): Mat3 => [v[0]*v[0],v[0]*v[1],v[0]*v[2],v[1]*v[0],v[1]*v[1],v[1]*v[2],v[2]*v[0],v[2]*v[1],v[2]*v[2]]
const scaleMatrix = (m: Mat3, s: number): Mat3 => m.map((x) => x * s) as Mat3
const subtractMatrix = (a: Mat3, b: Mat3): Mat3 => a.map((x, i) => x - b[i]) as Mat3

const orientToward = (axis: Vec3, target: Vec3): Vec3 => dot(axis, target) < 0 ? scale(axis, -1) : axis
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

const powerIteration = (m: Mat3, seed: Vec3, ortho: Vec3[]): Vec3 => {
  let v = normalize(seed)
  for (let i = 0; i < 42; i++) {
    let next = matVec(m, v)
    ortho.forEach((a) => { next = sub(next, scale(a, dot(next, a))) })
    const l = norm(next)
    if (l < 1e-8) break
    v = normalize(next)
  }
  return v
}

const createRecord = <T>(factory: () => T): Record<MetricId, T> => ({
  learning_score: factory(), cognitive_load: factory(), engagement: factory(),
  concept_flow: factory(), retention: factory(),
})

export interface BrainSpotsData {
  spotIndicesByMetric: Record<MetricId, Uint32Array>
  anchorPointByMetric: Record<MetricId, Vec3>
  coverageRatio: number
}

export const buildBrainSpots = (
  positions: Float32Array,
  options?: { spotFraction?: number },
): BrainSpotsData => {
  const pointCount = positions.length / 3
  const mean: Vec3 = [0, 0, 0]

  for (let i = 0; i < pointCount; i++) {
    mean[0] += positions[i*3]; mean[1] += positions[i*3+1]; mean[2] += positions[i*3+2]
  }
  if (pointCount > 0) { mean[0] /= pointCount; mean[1] /= pointCount; mean[2] /= pointCount }

  let c00=0,c01=0,c02=0,c11=0,c12=0,c22=0
  for (let i = 0; i < pointCount; i++) {
    const x=positions[i*3]-mean[0], y=positions[i*3+1]-mean[1], z=positions[i*3+2]-mean[2]
    c00+=x*x; c01+=x*y; c02+=x*z; c11+=y*y; c12+=y*z; c22+=z*z
  }
  const inv = 1 / Math.max(pointCount - 1, 1)
  const cov: Mat3 = [c00*inv,c01*inv,c02*inv,c01*inv,c11*inv,c12*inv,c02*inv,c12*inv,c22*inv]

  const p1 = powerIteration(cov, [1,0.2,0.1], [])
  const l1 = dot(p1, matVec(cov, p1))
  const def = subtractMatrix(cov, scaleMatrix(outer(p1), l1))
  const p2 = powerIteration(def, [0.1,1,0.25], [p1])
  const p3 = normalize(cross(p1, p2))

  const candidates: Vec3[] = [p1, p2, p3]
  const used = new Set<number>()
  const pickAxis = (target: Vec3): Vec3 => {
    let bi = -1, best = Number.NEGATIVE_INFINITY
    for (let i = 0; i < candidates.length; i++) {
      if (used.has(i)) continue
      const s = Math.abs(dot(candidates[i], target))
      if (s > best) { best = s; bi = i }
    }
    if (bi < 0) return target
    used.add(bi)
    return orientToward(candidates[bi], target)
  }

  const leftRight   = pickAxis([1,0,0])
  const anteriorPost = pickAxis([0,0,1])
  const infSuperior  = pickAxis([0,1,0])

  const projLR = new Float32Array(pointCount)
  const projAP = new Float32Array(pointCount)
  const projIS = new Float32Array(pointCount)
  let minLR=Infinity,maxLR=-Infinity,minAP=Infinity,maxAP=-Infinity,minIS=Infinity,maxIS=-Infinity

  for (let i = 0; i < pointCount; i++) {
    const c: Vec3 = [positions[i*3]-mean[0], positions[i*3+1]-mean[1], positions[i*3+2]-mean[2]]
    projLR[i] = dot(c, leftRight);   minLR=Math.min(minLR,projLR[i]); maxLR=Math.max(maxLR,projLR[i])
    projAP[i] = dot(c, anteriorPost); minAP=Math.min(minAP,projAP[i]); maxAP=Math.max(maxAP,projAP[i])
    projIS[i] = dot(c, infSuperior);  minIS=Math.min(minIS,projIS[i]); maxIS=Math.max(maxIS,projIS[i])
  }

  const rLR=Math.max(maxLR-minLR,1e-6), rAP=Math.max(maxAP-minAP,1e-6), rIS=Math.max(maxIS-minIS,1e-6)
  const normPca = new Float32Array(pointCount * 3)
  for (let i = 0; i < pointCount; i++) {
    normPca[i*3]   = clamp01((projLR[i]-minLR)/rLR)
    normPca[i*3+1] = clamp01((projAP[i]-minAP)/rAP)
    normPca[i*3+2] = clamp01((projIS[i]-minIS)/rIS)
  }

  const spotFraction = options?.spotFraction ?? SPOT_FRACTION
  const spotCount = Math.max(32, Math.floor(pointCount * spotFraction))
  const assigned = new Uint8Array(pointCount)
  const buckets = createRecord<number[]>(() => [])

  METRICS.forEach((metricId) => {
    const seed = SEEDS_PCA[metricId]
    const dists: { index: number; d: number }[] = []
    for (let i = 0; i < pointCount; i++) {
      const dx=normPca[i*3]-seed[0], dy=normPca[i*3+1]-seed[1], dz=normPca[i*3+2]-seed[2]
      dists.push({ index: i, d: dx*dx+dy*dy+dz*dz })
    }
    dists.sort((a, b) => a.d - b.d)

    const chosen: number[] = []
    for (let i = 0; i < dists.length && chosen.length < spotCount; i++) {
      const idx = dists[i].index
      if (assigned[idx] === 1) continue
      assigned[idx] = 1
      chosen.push(idx)
    }
    if (chosen.length < spotCount) {
      for (let i = 0; i < dists.length && chosen.length < spotCount; i++) {
        if (!chosen.includes(dists[i].index)) chosen.push(dists[i].index)
      }
    }
    buckets[metricId] = chosen
  })

  const spotIndicesByMetric: Record<MetricId, Uint32Array> = {
    learning_score: Uint32Array.from(buckets.learning_score),
    cognitive_load: Uint32Array.from(buckets.cognitive_load),
    engagement: Uint32Array.from(buckets.engagement),
    concept_flow: Uint32Array.from(buckets.concept_flow),
    retention: Uint32Array.from(buckets.retention),
  }

  const anchorPointByMetric = createRecord<Vec3>(() => [0,0,0])
  METRICS.forEach((metricId) => {
    const indices = spotIndicesByMetric[metricId]
    const seed = SEEDS_PCA[metricId]
    if (indices.length === 0) return
    let bestIdx = indices[0], bestD = Infinity
    for (let i = 0; i < indices.length; i++) {
      const pi = indices[i], base = pi*3
      const dx=normPca[base]-seed[0], dy=normPca[base+1]-seed[1], dz=normPca[base+2]-seed[2]
      const d = dx*dx+dy*dy+dz*dz
      if (d < bestD) { bestD = d; bestIdx = pi }
    }
    anchorPointByMetric[metricId] = [positions[bestIdx*3], positions[bestIdx*3+1], positions[bestIdx*3+2]]
  })

  const covered = Object.values(spotIndicesByMetric).reduce((s, a) => s + a.length, 0)
  return { spotIndicesByMetric, anchorPointByMetric, coverageRatio: pointCount > 0 ? covered / pointCount : 0 }
}
