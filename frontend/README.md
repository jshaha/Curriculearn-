# NeuroCompiler Frontend

A distinctive, production-grade frontend for NeuroCompiler — an AI-powered curriculum optimization tool that uses brain response simulation to improve learning outcomes.

## Design Philosophy

**Neural Laboratory × Editorial Magazine**

This interface combines scientific precision with editorial elegance, featuring:

- **Bioluminescent color palette**: Electric cyan and magenta on deep space backgrounds
- **Animated neural network**: Living background that responds to mouse movement
- **Monospace tabular numbers**: Scientific precision in metrics display
- **Serif editorial typography**: Newsreader for headlines, creating sophisticated contrast
- **Progressive disclosure**: Simple scores → detailed metrics → neural data

## Features

### 🎨 Visual Design
- Dark mode with high-contrast bioluminescent accents
- Animated neural network background using Canvas API
- Smooth transitions and micro-interactions
- Responsive design (desktop, tablet, mobile)

### 📊 Core Functionality
1. **Upload Interface**: Drag-and-drop file upload with sample lessons
2. **Objective Selection**: Multi-select cards for optimization goals
3. **Analytics Dashboard**: Real-time cognitive metrics with timeline visualization
4. **Results View**: Before/after comparison with downloadable optimized lessons

### ⚡ Animations
- Counter-up animations for metrics
- Staggered reveals for UI elements
- Interactive timeline chart with problem zone highlighting
- Pulsing status indicators
- Checkmark success animations

## Tech Stack

- **Pure HTML/CSS/JavaScript** - No framework dependencies
- **Canvas API** - Neural network background and chart rendering
- **CSS Custom Properties** - Theme system with consistent design tokens
- **CSS Grid & Flexbox** - Modern responsive layouts
- **Google Fonts** - IBM Plex Mono, Newsreader, DM Sans

## File Structure

```
frontend/
├── index.html              # Main HTML structure
├── styles/
│   └── main.css           # Complete design system
├── utils/
│   ├── neural-bg.js       # Animated neural network background
│   ├── animations.js      # Animation utilities and chart rendering
│   └── app.js             # Main application logic
└── README.md              # This file
```

## Getting Started

### Option 1: Direct Browser Open
Simply open `index.html` in a modern browser. No build step required.

### Option 2: Local Server (Recommended)
For best performance and to avoid CORS issues:

```bash
# Using Python 3
cd frontend
python3 -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## User Flow

1. **Landing Page**: Upload a lesson file or select a sample
2. **Objectives Modal**: Choose optimization goals (e.g., Maximize Learning, Reduce Cognitive Overload)
3. **Dashboard**: View cognitive metrics, timeline chart, and identified issues
4. **Generate**: Click to create optimized version
5. **Results**: See before/after comparison and download improved lesson

## Customization

### Color Scheme
Edit CSS custom properties in `styles/main.css`:

```css
:root {
    --color-cyan-vivid: #00F0FF;
    --color-magenta-vivid: #FF006E;
    --color-purple-deep: #6366F1;
    /* ... */
}
```

### Neural Network Background
Adjust parameters in `utils/neural-bg.js`:

```javascript
this.config = {
    nodeCount: 60,              // Number of nodes
    connectionDistance: 150,    // Max distance for connections
    mouseInfluence: 200,        // Mouse interaction radius
    /* ... */
};
```

### Typography
Change font families in CSS custom properties:

```css
:root {
    --font-mono: 'IBM Plex Mono', monospace;
    --font-serif: 'Newsreader', Georgia, serif;
    --font-sans: 'DM Sans', system-ui, sans-serif;
}
```

## Key Components

### Upload Dropzone
- Accepts drag-and-drop and click-to-browse
- Visual feedback states (hover, drag-over, uploading)
- Supported formats: PDF, PPTX, DOCX, TXT

### Metric Cards
- Large tabular numbers with counter-up animation
- Color-coded status indicators
- Dot visualization for quick scanning
- Inverted display for "lower is better" metrics

### Cognitive Timeline
- Canvas-based line chart
- Dual metrics: Engagement and Cognitive Load
- Problem zone highlighting
- Interactive hover tooltips (can be extended)

### Comparison View
- Side-by-side before/after slides
- Color-coded improvements (green) and issues (red)
- Detailed change log with icons
- Download and export options

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Required features:
- CSS Custom Properties
- CSS Grid
- Canvas API
- ES6 JavaScript

## Performance

- No external dependencies (except Google Fonts)
- Optimized animations using `requestAnimationFrame`
- Hardware-accelerated CSS transforms
- Lazy-loaded sections
- Total bundle size: ~30KB (HTML + CSS + JS)

## Accessibility

- WCAG 2.1 AA contrast ratios
- Keyboard navigation support
- Semantic HTML structure
- ARIA labels on interactive elements
- Focus indicators on all controls
- Reduced motion support (can be added)

## Future Enhancements

### Phase 2
- [ ] Real-time collaborative features
- [ ] Multiple lesson comparison
- [ ] Custom objective creation
- [ ] Export to multiple formats

### Phase 3
- [ ] Video lesson support
- [ ] AI chat assistant
- [ ] Advanced brain heatmap visualization
- [ ] Integration with LMS platforms

## Design Credits

**Fonts**:
- IBM Plex Mono - IBM
- Newsreader - Production Type
- DM Sans - Colophon Foundry

**Inspiration**:
- Linear - Clean dashboard patterns
- Grammarly - Clarity in analytics
- Vercel - Metrics visualization
- Nature Journal - Editorial typography

## License

Part of the NeuroCompiler project. See main repository for license details.

---

**Built with attention to detail and a commitment to distinctive design.**
