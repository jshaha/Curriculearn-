# Frontend-Next File Structure

## Active Files (Class → Brain Flow)

### App Routes
- `app/page.tsx` - **Homepage**: Class listing grid
- `app/class/[id]/page.tsx` - **Brain pages**: Individual brain visualizations per class
- `app/layout.tsx` - Root layout
- `app/globals.css` - Global styles

### Components (Essential)
- `BrainLeaderLabel.tsx` - Hover labels on brain visualization
- `EdgeNav.tsx` - Navigation interface for brain sections
- `AppHeader.tsx` - Header component (shows class name)
- `Header.tsx` - Header wrapper
- `HomeClient.tsx` - Main brain scene client component
- `TransitionProvider.tsx` - Page transition management
- `PageTransitionOverlay.tsx` - Transition overlay

### Brain Visualization (three/)
- `BrainScene.tsx` - Main 3D brain scene
- `BrainPoints.tsx` - Point cloud rendering
- `SectionBrainHeader.tsx` - Section-specific brain header
- `brainShared.ts` - Shared brain data and loading
- `brainData.ts` - Brain geometry data
- `brainSpots.ts` - Section highlighting spots
- `brainRegions.ts` - Brain region definitions
- `brainSampling.ts` - Point sampling logic
- `brainTuning.ts` - Visual tuning constants
- `picking.ts` - Mouse/touch picking logic

### Content
- `content/sections.ts` - Section definitions (learning, cognitive, engagement, flow, retention)
- `content/siteContent.ts` - Site configuration

### Utilities
- `lib/store.ts` - UI state management
- `lib/hooks.ts` - Custom React hooks
- `lib/utils.ts` - Utility functions

## Archived Files (Old Portfolio)

All old portfolio-related files have been moved to `archived/`:

- `archived/app/` - Old section pages and project pages
- `archived/components/` - Editorial layouts, project components, hobby lists, etc.
- `archived/content/` - Projects, hobbies, interests content

These files are not used in the current class → brain flow but are kept for reference.
