# NeuroCompiler Frontend Design Recommendations

## Design Philosophy

**Goal**: Create a clean, professional interface that makes complex brain-based analytics feel approachable and actionable for busy teachers.

**Principles**:
- Minimize cognitive load (ironic, given the product)
- Progressive disclosure: show simple metrics first, details on demand
- Visual hierarchy: scores → problems → recommendations → detailed metrics
- Trust through transparency: show "why" behind every suggestion

---

## Page Structure

### 1. Upload Page (Landing)

**Layout**: Centered, minimal, spacious

**Hero Section**:
```
┌─────────────────────────────────────────┐
│                                         │
│         [Brain Icon + Logo]             │
│                                         │
│    NeuroCompiler                        │
│    Optimize Your Lessons with AI        │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │   [Upload Icon]                   │  │
│  │                                   │  │
│  │   Drag & drop your lesson here    │  │
│  │   or click to browse               │  │
│  │                                   │  │
│  │   PDF • PPTX • DOCX • TXT         │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│     or try a sample lesson →            │
│                                         │
└─────────────────────────────────────────┘
```

**Design Details**:
- Large drop zone (500px × 300px minimum)
- Dotted border that becomes solid on hover
- Drag-over state: subtle glow/highlight
- File type icons below for supported formats
- Sample lessons as clickable cards below the fold

**Interaction States**:
1. **Default**: Calm, inviting purple/blue gradient border
2. **Hover**: Border thickens slightly, background tint
3. **Drag over**: Animated pulse, brighter accent
4. **Uploading**: Progress bar with file preview thumbnail
5. **Success**: Checkmark animation, fade to next step

---

### 2. Objective Selection Modal

**Appears immediately after upload**

```
┌────────────────────────────────────────────┐
│  What's your goal for this lesson?        │
│                                            │
│  ┌──────────────┐  ┌──────────────┐      │
│  │ [Icon]       │  │ [Icon]       │      │
│  │ Maximize     │  │ Reduce       │      │
│  │ Learning     │  │ Cognitive    │      │
│  │              │  │ Overload     │      │
│  └──────────────┘  └──────────────┘      │
│                                            │
│  ┌──────────────┐  ┌──────────────┐      │
│  │ [Icon]       │  │ [Icon]       │      │
│  │ Improve      │  │ Build        │      │
│  │ Retention    │  │ Intuition    │      │
│  │              │  │              │      │
│  └──────────────┘  └──────────────┘      │
│                                            │
│  + Show all 7 objectives                  │
│                                            │
│  [Continue →]                             │
└────────────────────────────────────────────┘
```

**Design Details**:
- Card-based selection (can pick multiple with weights)
- Each card shows icon + title + 1-line description on hover
- Selected cards have accent border and subtle shadow
- Expandable "advanced" section for custom weights

---

### 3. Analysis Dashboard (Main Interface)

**Layout**: Three-column responsive layout

#### Top Bar: Overview Metrics

```
┌──────────────────────────────────────────────────────────────┐
│  Photosynthesis.pptx  •  Analyzing...                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │   72    │  │   76    │  │   84    │  │   58    │        │
│  │ Learning│  │Engagement│  │Cognitive│  │ Concept │        │
│  │  Score  │  │         │  │  Load   │  │  Flow   │        │
│  │         │  │         │  │         │  │         │        │
│  │ ●●●●○   │  │ ●●●●○   │  │ ●●●●●   │  │ ●●●○○   │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│                                                               │
│  Status: ⚠ 4 issues detected • 🎯 Learning Score can         │
│          improve by 23 points                                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Design Details**:
- Large, scannable score cards
- Color coding: Green (80+), Yellow (60-79), Red (<60)
- Dot indicators for quick visual scanning
- Cognitive Load inverted (lower is better) with different color scheme
- Animated counter-up effect on load

---

#### Main Panel: Problems & Timeline Visualization

**Tab 1: Timeline View**

```
┌───────────────────────────────────────────────────┐
│  Cognitive Journey                                │
│                                                   │
│  Engagement    │    ╱╲      ╱╲         ╱         │
│                │   ╱  ╲    ╱  ╲       ╱          │
│                │  ╱    ╲  ╱    ╲     ╱           │
│                │─╯      ╲╱      ╲───╱            │
│                └─────────────────────────────     │
│                Slide:  1  3  5  8  11  15         │
│                                                   │
│  Cognitive Load│     ╱╲                           │
│                │    ╱  ╲                          │
│                │   ╱    ╲╱╲                       │
│                │──╯         ╲                     │
│                └─────────────────────────────     │
│                                                   │
│  ⚠ Problem zones highlighted in red              │
│                                                   │
├───────────────────────────────────────────────────┤
│  Slide 5  •  18:32                                │
│  ⚠ Cognitive Overload                             │
│                                                   │
│  Five concepts introduced simultaneously:         │
│  • Chlorophyll                                    │
│  • ATP                                            │
│  • Carbon fixation                                │
│  • Light reactions                                │
│  • Chemical equation                              │
│                                                   │
│  💡 Recommendation: Break into two sections       │
│     Split at "Light Reactions" (new slide)        │
│                                                   │
│  [View Slide] [Apply Fix]                        │
└───────────────────────────────────────────────────┘
```

**Tab 2: Issues List**

```
┌───────────────────────────────────────────────────┐
│  4 Issues Detected                    Sort: Impact│
│                                                   │
│  ⚠ HIGH IMPACT                                    │
│  ┌─────────────────────────────────────────────┐ │
│  │ Slide 5 • Cognitive Overload                │ │
│  │ Five concepts introduced at once            │ │
│  │ Impact: -12 points on Learning Score        │ │
│  │ [View Details →]                            │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ⚠ MEDIUM IMPACT                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ Slide 8 • Poor Sequencing                   │ │
│  │ Equation before intuition                   │ │
│  │ Impact: -6 points on Concept Flow           │ │
│  │ [View Details →]                            │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Design Details**:
- Interactive timeline with hover tooltips
- Color-coded problem zones (red spikes)
- Clickable points expand to show details
- Smooth scroll to corresponding slide in lesson viewer
- Impact scores help prioritize fixes

---

#### Right Panel: Lesson Preview

```
┌──────────────────────────────────┐
│  Original Lesson                 │
├──────────────────────────────────┤
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │   [Slide 5 Preview]        │  │
│  │                            │  │
│  │   Photosynthesis Process   │  │
│  │   • Chlorophyll            │  │
│  │   • ATP                    │  │
│  │   • Carbon fixation        │  │
│  │   • Light reactions        │  │
│  │   6CO₂ + 6H₂O → C₆H₁₂O₆   │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  Slide 5 of 18                   │
│  ← →                             │
│                                  │
│  ⚠ Problem detected here         │
│                                  │
│  [View All Slides]               │
└──────────────────────────────────┘
```

**Design Details**:
- Thumbnail navigation at bottom
- Problem indicators on thumbnails
- Synchronized with main panel selection
- Full-screen mode available

---

### 4. Optimization Results Page

**Split View: Before vs After**

```
┌──────────────────────────────────────────────────────────────┐
│  Optimization Complete ✓                                     │
│                                                               │
│  Learning Score: 61 → 83  (+36%)                             │
│                                                               │
├────────────────────┬─────────────────────────────────────────┤
│                    │                                         │
│  ORIGINAL          │  OPTIMIZED                              │
│                    │                                         │
│  ┌──────────────┐  │  ┌──────────────┐                      │
│  │ [Slide 5]    │  │  │ [Slide 5a]   │                      │
│  │              │  │  │              │                      │
│  │ 5 concepts   │  │  │ 2 concepts   │  ← Split into two    │
│  │ Dense        │  │  │ + Analogy    │                      │
│  │              │  │  │              │                      │
│  └──────────────┘  │  └──────────────┘                      │
│                    │                                         │
│                    │  ┌──────────────┐                      │
│                    │  │ [Slide 5b]   │                      │
│                    │  │              │  ← New slide         │
│                    │  │ 3 concepts   │                      │
│                    │  │ + Visual     │                      │
│                    │  │              │                      │
│                    │  └──────────────┘                      │
│                    │                                         │
│  Cognitive Load: 84│  Cognitive Load: 52  ↓                 │
│  Engagement: 76    │  Engagement: 89      ↑                 │
│                    │                                         │
├────────────────────┴─────────────────────────────────────────┤
│                                                               │
│  Changes Made:                                               │
│  • Split Slide 5 into two sections                           │
│  • Added "solar panel" analogy to Slide 3                    │
│  • Moved equation to Slide 9 (after animation)               │
│  • Inserted retrieval question after Slide 6                 │
│  • Added recap activity at end                               │
│                                                               │
│  [Download Optimized Lesson]  [Compare Side by Side]        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Design Details**:
- Slider to compare before/after
- Diff highlighting (green = added, red = removed, yellow = modified)
- Expandable change log with rationale
- Download options: PPTX, PDF, or both

---

### 5. Detailed Metrics Drawer (Optional Deep Dive)

**Slides out from right when user clicks "View Details"**

```
┌────────────────────────────────────────┐
│  Slide 5 Deep Dive              [×]    │
├────────────────────────────────────────┤
│                                        │
│  Brain Response Simulation             │
│  ┌──────────────────────────────────┐  │
│  │ [Heatmap of voxel activity]     │  │
│  │                                  │  │
│  │ Time: 0s ─────────●────── 45s   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Cognitive Metrics                     │
│                                        │
│  Information Density                   │
│  ████████████████░░░░  82/100          │
│  ⚠ Too much information per second     │
│                                        │
│  Conceptual Continuity                 │
│  ████████░░░░░░░░░░░░  45/100          │
│  ⚠ Concepts feel disconnected          │
│                                        │
│  Novelty                               │
│  ████████████████████  95/100          │
│  ✓ Good introduction of new ideas      │
│                                        │
│  Reinforcement                         │
│  ████░░░░░░░░░░░░░░░░  28/100          │
│  ⚠ Prior concepts not revisited        │
│                                        │
│  Why This Matters:                     │
│  High information density without      │
│  reinforcement leads to cognitive      │
│  overload. Students will struggle      │
│  to retain these concepts.             │
│                                        │
│  [View Research Paper]                 │
│                                        │
└────────────────────────────────────────┘
```

---

## Color Palette Recommendations

### Primary Colors
- **Deep Indigo**: `#4C51BF` - Main brand, trust, intelligence
- **Bright Purple**: `#9F7AEA` - Accent, neuroscience theme
- **Cool Gray**: `#EDF2F7` - Backgrounds

### Semantic Colors
- **Success Green**: `#48BB78` - High scores, improvements
- **Warning Amber**: `#F6AD55` - Medium scores, caution
- **Error Red**: `#FC8181` - Low scores, problems
- **Info Blue**: `#4299E1` - Neutral information

### Gradients
- **Hero Background**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Card Hover**: `linear-gradient(to right, #4C51BF, #9F7AEA)`

---

## Typography

### Font Families
- **Headlines**: Inter or Satoshi (modern, clean)
- **Body Text**: System UI fonts for readability
- **Metrics/Numbers**: JetBrains Mono or SF Mono (monospace for alignment)

### Hierarchy
- **Hero Title**: 48px, bold
- **Section Titles**: 24px, semibold
- **Metric Values**: 36px, bold, monospace
- **Body**: 16px, regular
- **Captions**: 14px, medium

---

## Component Library Needs

### Must-Haves
1. **File Upload Component**
   - Drag & drop zone
   - Progress indicator
   - File preview thumbnails
   - Error states

2. **Metric Cards**
   - Large number display
   - Trend indicator (up/down arrow)
   - Sparkline graphs
   - Color-coded status

3. **Timeline Visualization**
   - Interactive line charts
   - Hover tooltips
   - Problem zone highlighting
   - Time scrubber

4. **Comparison Slider**
   - Before/after side-by-side
   - Draggable divider
   - Synchronized scrolling

5. **Issue Cards**
   - Priority badges
   - Impact scores
   - Expandable details
   - Action buttons

6. **Slide Viewer**
   - Thumbnail grid
   - Full preview
   - Navigation controls
   - Annotation layer

---

## Animations & Micro-interactions

### Key Moments to Delight
1. **Upload Success**: Confetti or checkmark animation
2. **Analysis Complete**: Progress bar → success state with bounce
3. **Score Improvements**: Counter-up animation with green glow
4. **Problem Detection**: Gentle pulse on issue cards
5. **Optimization Applied**: Smooth transition with "magic wand" effect

### Timing
- **Fast**: 150ms for hovers, clicks
- **Medium**: 300ms for page transitions
- **Slow**: 500ms for large state changes
- Use easing: `cubic-bezier(0.4, 0.0, 0.2, 1)`

---

## Responsive Breakpoints

### Desktop (1280px+)
- Three-column layout
- Full dashboard visible
- Side-by-side comparisons

### Tablet (768px - 1279px)
- Two-column layout
- Stacked metrics
- Collapsible sidebar

### Mobile (< 768px)
- Single column
- Tabbed navigation
- Simplified metrics (top 3 only)
- Swipeable slides

---

## Accessibility Considerations

### WCAG 2.1 AA Compliance
- Color contrast ratio ≥ 4.5:1 for text
- All interactive elements keyboard accessible
- Screen reader labels for all metrics
- Focus indicators on all clickable elements
- Alt text for all visualizations

### Cognitive Accessibility
- Clear visual hierarchy
- Consistent navigation
- No flashing animations (epilepsy risk)
- Progress indicators for long operations
- Clear error messages with recovery actions

---

## Technical Stack Recommendations

### Frontend Framework
- **React** or **Next.js** - Component reusability, good ecosystem
- **TypeScript** - Type safety for complex data structures

### Styling
- **Tailwind CSS** - Fast prototyping, consistent design system
- **Framer Motion** - Smooth animations

### Charts & Visualizations
- **Recharts** or **D3.js** - Interactive timelines and metrics
- **React-PDF** - Lesson preview rendering

### File Handling
- **react-dropzone** - Drag & drop upload
- **react-pdf-viewer** - PDF rendering
- Custom PPTX parser for slide extraction

---

## User Flow Summary

```
1. Land on Upload Page
   ↓
2. Drag & drop lesson file
   ↓
3. Select optimization objective
   ↓
4. View analysis dashboard
   - See overall scores
   - Review problems timeline
   - Click on specific issues
   ↓
5. Generate optimized version
   ↓
6. Compare before/after
   ↓
7. Download improved lesson
   ↓
8. (Optional) Re-run with different objectives
```

---

## Key Design Differentiators

What makes NeuroCompiler's UI unique:

1. **Brain-Based Visualization**: Show voxel activity heatmaps (abstract but compelling)
2. **Cognitive Journey Timeline**: Novel way to visualize lesson progression
3. **Impact Scores**: Every problem shows quantified learning impact
4. **Trust Through Science**: Link to research papers, show methodology
5. **Before/After Diff View**: Like GitHub PR review but for lessons
6. **Progressive Disclosure**: Simple scores → detailed metrics → neural data

---

## Future Enhancements

### Phase 2
- Real-time collaborative editing
- A/B testing multiple optimization strategies
- Student persona targeting (visual learners, etc.)
- Export to LMS (Canvas, Blackboard)

### Phase 3
- Video lesson support with timestamp-based analysis
- AI chat assistant to explain metrics
- Custom objective creation
- Integration with gradebooks for outcome tracking

---

## Design References & Inspiration

Similar successful patterns:
- **Grammarly**: Clarity with detailed explanations
- **Vercel Analytics**: Clean metrics dashboard
- **Figma**: Before/after comparison tools
- **Linear**: Smooth animations and issue tracking
- **Notion**: Progressive disclosure and clean hierarchy

---

## Next Steps for Frontend Team

1. **Week 1**: Build design system in Figma
   - Color palette
   - Typography scale
   - Component library

2. **Week 2**: Prototype upload flow
   - File upload component
   - Objective selection modal
   - Loading states

3. **Week 3**: Build metrics dashboard
   - Metric cards
   - Timeline visualization
   - Issue list

4. **Week 4**: Implement optimization results
   - Before/after comparison
   - Download functionality
   - Share features

5. **Week 5**: Polish & user testing
   - Animations
   - Responsive design
   - Accessibility audit
