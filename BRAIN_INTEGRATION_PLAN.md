# 3D Brain Visualization Integration Plan

## Overview
Integrate the interactive 3D brain visualization into NeuroCompiler to show teachers which brain regions are activated by different parts of their curriculum.

## Brain Region Mapping

Instead of portfolio sections, we'll map brain regions to **educational cognitive functions**:

### Curriculum → Brain Regions

| Curriculum Element | Brain Region | Color | Function |
|-------------------|--------------|-------|----------|
| **Core Concepts** | Prefrontal Cortex | Electric Cyan | Reasoning & Problem Solving |
| **Memory/Retention** | Hippocampus | Magenta | Memory Formation |
| **Language/Reading** | Broca's & Wernicke's | Purple | Language Processing |
| **Visual Learning** | Occipital Lobe | Green | Visual Processing |
| **Attention/Focus** | Parietal Lobe | Orange | Attention & Awareness |
| **Emotional Engagement** | Amygdala/Limbic | Pink | Emotional Response |

## User Experience Flow

### 1. Landing Page
```
┌─────────────────────────────────────┐
│                                     │
│     [3D ROTATING BRAIN]             │
│     Floating in space               │
│     Subtle glow effects             │
│                                     │
│    NeuroCompiler                    │
│    Optimize lessons with            │
│    brain-based AI                   │
│                                     │
│    [Upload Lesson Button]           │
│                                     │
└─────────────────────────────────────┘
      ↓ scroll down ↓
┌─────────────────────────────────────┐
│  How It Works                       │
│  Sample Lessons                     │
│  Get Started                        │
└─────────────────────────────────────┘
```

### 2. Analysis Page (After Upload)
```
┌─────────────────────────────────────┐
│                                     │
│     [3D BRAIN WITH HIGHLIGHTS]      │
│                                     │
│  [Analyzing your lesson...]         │
│                                     │
│  Cognitive Load: 87%                │
│  Active regions:                    │
│  • Prefrontal Cortex (high)         │
│  • Hippocampus (medium)             │
│                                     │
└─────────────────────────────────────┘
      ↓ scroll down ↓
┌─────────────────────────────────────┐
│  Timeline Chart                     │
│  Problem Segments                   │
│  Recommendations                    │
└─────────────────────────────────────┘
```

### 3. Results Page (After Optimization)
```
┌─────────────────────────────────────┐
│                                     │
│   BEFORE          AFTER             │
│  [Brain with     [Brain with        │
│   red regions]    green regions]    │
│                                     │
│  Learning Score: 61 → 83 (+22)      │
│                                     │
└─────────────────────────────────────┘
      ↓ scroll down ↓
┌─────────────────────────────────────┐
│  Detailed Changes                   │
│  Download Optimized Lesson          │
└─────────────────────────────────────┘
```

## Interactive Features

### Hover Behavior
```javascript
// When teacher hovers over brain region:
onHoverRegion(region) {
  showTooltip({
    region: "Prefrontal Cortex",
    function: "Reasoning & Problem Solving",
    activity: "87% active",
    segments: [
      "Slide 3: Complex equation",
      "Slide 5: Multi-step problem",
      "Slide 8: Abstract concepts"
    ]
  })
}
```

### Click Behavior
```javascript
// When teacher clicks brain region:
onClickRegion(region) {
  highlightSegments(region.segments)
  scrollToLessonPart(region.segments[0])
  showDetailPanel({
    whatThisMeans: "Students are heavily using reasoning...",
    goodOrBad: "High prefrontal activity is good for...",
    recommendations: [...]
  })
}
```

## Data Flow

```
Lesson Upload
    ↓
Agent 1: Parse
    ↓
Agent 2: Brain Simulation (sentence transformers)
    ↓
Agent 3: Metrics Translation
    ↓
MAP TO BRAIN REGIONS:
{
  "prefrontalCortex": {
    "activation": 87,
    "segments": [3, 5, 8],
    "description": "High reasoning load on these slides"
  },
  "hippocampus": {
    "activation": 45,
    "segments": [2, 6],
    "description": "Low retention support"
  },
  ...
}
    ↓
RENDER 3D BRAIN with color-coded regions
```

## Technical Implementation

### Files to Modify/Create

From `brain-visualization` repo:
```
✅ COPY:
- src/three/BrainPoints.tsx
- src/three/BrainScene.tsx
- src/three/brainPhysics.ts
- src/three/brainSampling.ts
- public/assets/brain/cortex.glb

✏️ MODIFY:
- src/three/brainRegions.ts
  ↳ Change from portfolio sections to brain regions
  ↳ Add coordinates for: prefrontal, hippocampus, etc.

- src/three/brainSpots.ts
  ↳ Map colors to cognitive load levels:
    - High load (>75%) = Red
    - Medium load (50-75%) = Yellow
    - Low load (<50%) = Green/Cyan

- src/three/BrainPoints.tsx
  ↳ Add hover tooltips showing:
    - Region name
    - Cognitive function
    - Activation level
    - Related lesson segments
```

From current `frontend/`:
```
✅ PORT TO NEXT.JS:
- Upload interface → app/upload/page.tsx
- Dashboard → app/dashboard/page.tsx
- Results → app/results/page.tsx

✨ NEW COMPONENTS:
- components/BrainVisualization.tsx
  ↳ Wraps the 3D brain
  ↳ Props: lessonData, metrics, onRegionHover, onRegionClick

- components/BrainLegend.tsx
  ↳ Shows color mapping: red=high load, green=optimal

- components/RegionTooltip.tsx
  ↳ Displays on hover: region info + lesson segments
```

## Layout Structure

```tsx
// app/analysis/page.tsx
export default function AnalysisPage({ lessonData, metrics }) {
  return (
    <div className="analysis-page">
      {/* Full-screen brain section */}
      <section className="brain-section h-screen sticky top-0">
        <BrainVisualization
          metrics={metrics}
          onRegionHover={handleHover}
          onRegionClick={handleClick}
        />
        <MetricsSummary metrics={metrics} />
      </section>

      {/* Scrollable content */}
      <section className="content-section">
        <Timeline data={metrics.temporal} />
        <ProblemsList problems={metrics.problems} />
        <Recommendations recs={metrics.recommendations} />
      </section>
    </div>
  )
}
```

## Brain Region Coordinates

We'll map lesson metrics to these brain regions:

```typescript
const BRAIN_REGIONS = {
  prefrontalCortex: {
    position: [0.3, 0.4, 0.2],  // 3D coordinates on brain mesh
    label: "Prefrontal Cortex",
    function: "Reasoning & Problem Solving",
    metricMapping: "cognitive_load"
  },
  hippocampus: {
    position: [-0.1, -0.2, 0.0],
    label: "Hippocampus",
    function: "Memory Formation",
    metricMapping: "retention"
  },
  brocasArea: {
    position: [0.4, 0.1, 0.3],
    label: "Broca's Area",
    function: "Language Production",
    metricMapping: "concept_flow"
  },
  // ... more regions
}
```

## Color Coding

```typescript
function getRegionColor(activation: number) {
  if (activation > 85) return '#FF006E'  // Magenta (overload)
  if (activation > 70) return '#FF6B35'  // Orange (high)
  if (activation > 50) return '#FFD23F'  // Yellow (medium)
  if (activation > 30) return '#00F0FF'  // Cyan (good)
  return '#6366F1'                        // Purple (low/inactive)
}
```

## Animation States

1. **Idle**: Gentle rotation, all regions visible
2. **Analyzing**: Pulsing glow, regions light up sequentially
3. **Results**: Color-coded regions, clickable/hoverable
4. **Comparison**: Side-by-side before/after with morphing colors

## Next Steps

1. ✅ Set up Next.js project structure
2. ⏳ Copy 3D brain components
3. ⏳ Create brain region mapping
4. ⏳ Port current frontend to Next.js
5. ⏳ Integrate data flow from Python backend
6. ⏳ Add hover/click interactions
7. ⏳ Style to match current design system
8. ⏳ Test with real lesson data
9. ⏳ Deploy

## Expected Result

Teachers will be able to:
1. Upload a lesson
2. See a 3D brain visualization showing which regions are activated
3. Hover over regions to see which lesson segments activate them
4. Click regions to jump to those segments
5. See before/after brain states when optimized
6. Understand cognitive load through intuitive visual representation

---

**Status**: Ready to implement
**Estimated Time**: 2-3 hours for full integration
