# Agent 7: Visualization Generator

AI-powered educational visualization generation for enhanced multimodal learning.

## Overview

The VisualizationGenerator automatically creates context-appropriate diagrams, illustrations, and visual aids to improve learning outcomes. It analyzes lesson content and generates visuals that match the pedagogical needs of each segment.

## Features

### 🎨 Visual Types

- **Diagrams** - Process flows, workflows, step-by-step sequences
- **Concept Maps** - Relationship networks, hierarchies, connections
- **Charts** - Data visualization, statistics, comparisons
- **Illustrations** - Abstract concepts, visual metaphors
- **Metaphors** - Side-by-side comparisons, analogies

### 🧠 Intelligent Detection

The agent analyzes segment content to automatically determine:
- What type of visual would be most helpful
- Where visuals would reduce cognitive load
- Which concepts benefit from visual representation

### 🔌 Multi-Provider Support

Supports multiple AI image generation providers:
- **Google Gemini** (Imagen) - Fast, educational style
- **OpenAI DALL-E 3** - High quality, detailed
- **Replicate (Flux/SDXL)** - Open source, customizable
- **Placeholder SVG** - Works without API keys for testing

## Usage

### Basic Usage (Placeholders)

```python
from neurocompiler.agents import VisualizationGenerator
from neurocompiler.schemas import StructuredLesson, LessonSegment

# Create a lesson
lesson = StructuredLesson(
    id="lesson_1",
    title="Introduction to Photosynthesis",
    learning_goals=["Understand photosynthesis"],
    segments=[
        LessonSegment(
            id="seg_1",
            title="The Photosynthesis Process",
            content="Photosynthesis involves light absorption...",
            concepts=["chlorophyll", "light reactions"]
        )
    ]
)

# Generate visualizations (uses placeholders without API key)
generator = VisualizationGenerator()
visuals = generator.generate_visualizations(lesson)

# Result: Dict[segment_id, List[Visualization]]
for seg_id, visual_list in visuals.items():
    for visual in visual_list:
        print(f"Type: {visual.type}")
        print(f"Image: {visual.image_data}")  # Base64 data URI
```

### With AI Provider

```python
import os

# Set API key
os.environ['OPENAI_API_KEY'] = 'sk-...'

# Initialize with provider
generator = VisualizationGenerator(model_provider="openai")

# Generate real AI images
visuals = generator.generate_visualizations(
    lesson,
    target_segments=["seg_1"],  # Optional: specific segments
    max_visuals_per_segment=1   # Optional: limit per segment
)
```

### Via REST API

```bash
# Upload lesson
curl -X POST http://localhost:5001/api/upload \
  -F "file=@lesson.pdf"

# Analyze lesson
curl -X POST http://localhost:5001/api/analyze/<lesson_id>

# Generate visualizations
curl -X POST http://localhost:5001/api/visualize/<lesson_id> \
  -H "Content-Type: application/json" \
  -d '{
    "segment_ids": ["seg_1", "seg_2"],
    "max_per_segment": 1
  }'
```

## Prompt Engineering

The agent uses carefully crafted prompts for educational quality:

### Diagram Example
```
Create a clear educational diagram showing the process described in:
"The Photosynthesis Process"

Style: clean educational diagram, minimalist, clear labels,
professional, textbook quality, flowchart elements,
arrows showing sequence, labeled steps

Color scheme: blue and white, high contrast, easy to read
```

### Key Principles

1. **Educational First** - Clear, simple, appropriate for students
2. **High Contrast** - Easy to read when projected
3. **Minimal Text** - Visual communication, not text-heavy
4. **Professional Quality** - Textbook-grade appearance
5. **Annotated** - Labels and context provided

## Configuration

### Environment Variables

```bash
# Google Gemini (recommended for speed)
export GEMINI_API_KEY=your_key_here

# OpenAI DALL-E (best quality)
export OPENAI_API_KEY=sk-your_key_here

# Replicate (open source models)
export REPLICATE_API_TOKEN=your_token_here
```

### Model Selection

```python
# Fast, good for testing
generator = VisualizationGenerator(model_provider="gemini")

# Highest quality
generator = VisualizationGenerator(model_provider="openai")

# Open source, customizable
generator = VisualizationGenerator(model_provider="replicate")

# No API key needed (placeholders)
generator = VisualizationGenerator()
```

## Integration

### With Optimizer Pipeline

```python
from neurocompiler.agents import LessonOptimizer, VisualizationGenerator

# Optimize lesson first
result = optimizer.optimize(lesson, simulator)

# Generate visuals for optimized version
generator = VisualizationGenerator()
visuals = generator.generate_visualizations(result.best_lesson)

# Visuals are stored and included in slide export
```

### With Slide Generator

The slide generator automatically includes visualizations:

```python
# Visualizations are embedded in slides
python backend/json_to_slides.py optimized_lesson.json output_slides.html
```

Slides display visualizations prominently:
- Centered below segment title
- Responsive sizing (max 400px height)
- Rounded corners with subtle border
- Type caption below image

## API Response Format

```json
{
  "lesson_id": "abc123",
  "visualizations": {
    "seg_1": [
      {
        "id": "seg_1_diagram",
        "segment_id": "seg_1",
        "type": "diagram",
        "image_data": "data:image/png;base64,iVBORw0KGgo...",
        "alt_text": "Process diagram showing The Photosynthesis Process",
        "prompt": "Create a clear educational diagram..."
      }
    ]
  },
  "total_visuals": 5,
  "message": "Visualizations generated successfully"
}
```

## Performance

### Generation Time

- **Placeholder SVG**: Instant (<1ms)
- **OpenAI DALL-E**: 10-30 seconds per image
- **Replicate Flux**: 5-15 seconds per image
- **Google Imagen**: 3-10 seconds per image (coming soon)

### Best Practices

1. **Generate After Optimization** - Optimize first, then visualize
2. **Target Specific Segments** - Don't generate for every segment
3. **Use Placeholders for Testing** - Fast iteration without API costs
4. **Batch Generation** - Generate multiple at once for efficiency

## Cost Estimation

### OpenAI DALL-E 3
- Standard quality: $0.04 per image
- 18-segment lesson: ~$0.72 (if all visualized)

### Replicate (Flux Schnell)
- ~$0.003 per image
- 18-segment lesson: ~$0.05

### Google Imagen
- Coming soon (expected: ~$0.02 per image)

## Testing

Run the test script:

```bash
# Test with placeholders (no API key)
python test_visualizations.py

# Test with real AI (requires API key)
export OPENAI_API_KEY=sk-...
python test_visualizations.py --api
```

## Future Enhancements

- [ ] Google Imagen integration
- [ ] Style transfer from existing course materials
- [ ] Custom visual templates per subject
- [ ] Interactive diagram generation
- [ ] Video generation for processes
- [ ] AR/VR compatible exports

## Architecture

```
User Upload PDF
      ↓
   Parser (Agent 1)
      ↓
Brain Simulator (Agent 2)
      ↓
Metric Translator (Agent 3)
      ↓
  Diagnostician (Agent 4)
      ↓
    Editor (Agent 5)
      ↓
   Optimizer (Agent 6)
      ↓
→ Visualizer (Agent 7) ← NEW!
      ↓
  Export to Slides
```

## Contributing

To add a new provider:

1. Add endpoint to `self.endpoints` in `__init__`
2. Implement `_generate_with_<provider>` method
3. Add API key env var to `_get_api_key`
4. Update documentation

---

**NeuroCompiler** - Making learning visual, one diagram at a time 🎨
