"""
Agent 7: Visualization Generator

Generates educational diagrams, illustrations, and visual aids to enhance learning.
Uses AI models to create context-appropriate visualizations for lesson segments.
"""

from typing import List, Optional, Dict, Any
import os
import base64
import requests
from pathlib import Path

from neurocompiler.schemas import (
    StructuredLesson,
    LessonSegment,
    Visualization,
    VisualizationType
)


class VisualizationGenerator:
    """
    Generates visual aids for lesson segments to improve multimodal learning.

    Uses AI image generation models to create:
    - Diagrams for complex processes
    - Illustrations for abstract concepts
    - Charts and graphs for data
    - Visual metaphors and analogies
    """

    def __init__(self, model_provider: str = "gemini", api_key: Optional[str] = None):
        """
        Initialize the visualization generator.

        Args:
            model_provider: Which AI provider to use ("gemini", "openai", "replicate")
            api_key: API key for the provider (or use environment variable)
        """
        self.model_provider = model_provider
        self.api_key = api_key or self._get_api_key()

        # Model-specific endpoints
        self.endpoints = {
            "gemini": "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
            "openai": "https://api.openai.com/v1/images/generations",
            "replicate": "https://api.replicate.com/v1/predictions"
        }

        print(f"VisualizationGenerator initialized with {model_provider}")

    def _get_api_key(self) -> Optional[str]:
        """Get API key from environment variables."""
        env_vars = {
            "gemini": "GEMINI_API_KEY",
            "openai": "OPENAI_API_KEY",
            "replicate": "REPLICATE_API_TOKEN"
        }
        key_var = env_vars.get(self.model_provider)
        if key_var:
            return os.getenv(key_var)
        return None

    def generate_visualizations(
        self,
        lesson: StructuredLesson,
        target_segments: Optional[List[str]] = None,
        max_visuals_per_segment: int = 1
    ) -> Dict[str, List[Visualization]]:
        """
        Generate visualizations for lesson segments.

        Args:
            lesson: The lesson to generate visuals for
            target_segments: Specific segment IDs to visualize (None = all)
            max_visuals_per_segment: Maximum visuals per segment

        Returns:
            Dictionary mapping segment_id -> List[Visualization]
        """
        print(f"\n=== Generating Visualizations for: {lesson.title} ===")

        visualizations = {}
        segments_to_process = lesson.segments

        if target_segments:
            segments_to_process = [
                seg for seg in lesson.segments
                if seg.id in target_segments
            ]

        for segment in segments_to_process:
            print(f"Processing segment: {segment.id}")

            # Determine what type of visual would help this segment
            visual_types = self._identify_visual_needs(segment)

            segment_visuals = []
            for visual_type in visual_types[:max_visuals_per_segment]:
                visual = self._generate_visual(segment, visual_type, lesson.title)
                if visual:
                    segment_visuals.append(visual)

            if segment_visuals:
                visualizations[segment.id] = segment_visuals
                print(f"  Generated {len(segment_visuals)} visual(s)")

        print(f"\nTotal visualizations generated: {sum(len(v) for v in visualizations.values())}")
        return visualizations

    def _identify_visual_needs(self, segment: LessonSegment) -> List[VisualizationType]:
        """
        Analyze segment content to determine what types of visuals would help.

        Returns list of visualization types in priority order.
        """
        content_lower = segment.content.lower()
        visual_types = []

        # Process/workflow indicators
        process_keywords = ["process", "cycle", "steps", "stages", "workflow", "how"]
        if any(keyword in content_lower for keyword in process_keywords):
            visual_types.append(VisualizationType.DIAGRAM)

        # Concept/relationship indicators
        concept_keywords = ["relationship", "compare", "contrast", "versus", "different"]
        if any(keyword in content_lower for keyword in concept_keywords):
            visual_types.append(VisualizationType.CONCEPT_MAP)

        # Data/quantitative indicators
        data_keywords = ["data", "percent", "statistics", "numbers", "graph"]
        if any(keyword in content_lower for keyword in data_keywords):
            visual_types.append(VisualizationType.CHART)

        # Abstract concept indicators
        if len(segment.concepts) > 0 or "abstract" in content_lower:
            visual_types.append(VisualizationType.ILLUSTRATION)

        # Analogy/metaphor indicators
        analogy_keywords = ["like", "similar to", "think of", "imagine", "analogy"]
        if any(keyword in content_lower for keyword in analogy_keywords):
            visual_types.append(VisualizationType.METAPHOR)

        # Default to illustration if no specific type identified
        if not visual_types:
            visual_types.append(VisualizationType.ILLUSTRATION)

        return visual_types

    def _generate_visual(
        self,
        segment: LessonSegment,
        visual_type: VisualizationType,
        lesson_title: str
    ) -> Optional[Visualization]:
        """
        Generate a single visualization for a segment.

        Args:
            segment: The segment to visualize
            visual_type: Type of visual to generate
            lesson_title: Overall lesson context

        Returns:
            Visualization object with image data
        """
        # Create educational prompt
        prompt = self._create_visual_prompt(segment, visual_type, lesson_title)

        print(f"  Generating {visual_type.value}...")

        try:
            # Generate image based on provider
            if self.model_provider == "gemini":
                image_data = self._generate_with_gemini(prompt, visual_type)
            elif self.model_provider == "openai":
                image_data = self._generate_with_openai(prompt)
            elif self.model_provider == "replicate":
                image_data = self._generate_with_replicate(prompt)
            else:
                raise ValueError(f"Unsupported provider: {self.model_provider}")

            if image_data:
                return Visualization(
                    id=f"{segment.id}_{visual_type.value}",
                    segment_id=segment.id,
                    type=visual_type,
                    prompt=prompt,
                    image_data=image_data,
                    alt_text=self._generate_alt_text(segment, visual_type)
                )

        except Exception as e:
            print(f"  Error generating visual: {str(e)}")
            return None

    def _create_visual_prompt(
        self,
        segment: LessonSegment,
        visual_type: VisualizationType,
        lesson_title: str
    ) -> str:
        """
        Create an educational prompt for image generation.

        This is the key to generating high-quality educational visuals.
        """
        # Extract key concepts
        content_preview = segment.content[:200] + "..." if len(segment.content) > 200 else segment.content

        # Base style for educational content
        base_style = "clean educational diagram, minimalist style, clear labels, professional, textbook quality"

        # Type-specific prompt engineering
        type_prompts = {
            VisualizationType.DIAGRAM: f"""
Create a clear educational diagram showing the process or workflow described in: "{segment.title}".
Content context: {content_preview}
Style: {base_style}, flowchart elements, arrows showing sequence, labeled steps
Color scheme: blue and white, high contrast, easy to read
            """,

            VisualizationType.CONCEPT_MAP: f"""
Create a concept map showing relationships between ideas in: "{segment.title}".
Content context: {content_preview}
Style: {base_style}, connected nodes, relationship lines, hierarchical structure
Color scheme: multi-color nodes (pastel), black text, white background
            """,

            VisualizationType.CHART: f"""
Create an educational chart or graph visualizing data from: "{segment.title}".
Content context: {content_preview}
Style: {base_style}, clear axes, labeled data points, legend if needed
Color scheme: professional colors, high contrast
            """,

            VisualizationType.ILLUSTRATION: f"""
Create an educational illustration depicting the concept in: "{segment.title}".
Content context: {content_preview}
Style: {base_style}, simplified forms, clear visual metaphor, annotated
Color scheme: limited palette, educational aesthetic, not cartoonish
            """,

            VisualizationType.METAPHOR: f"""
Create a visual metaphor to explain: "{segment.title}".
Content context: {content_preview}
Style: {base_style}, side-by-side comparison, clear analogy, labeled
Color scheme: warm and cool tones to differentiate concepts
            """
        }

        prompt = type_prompts.get(visual_type, type_prompts[VisualizationType.ILLUSTRATION])

        # Add context from lesson
        full_prompt = f"""
Educational visual for lesson: "{lesson_title}"

{prompt.strip()}

Requirements:
- Must be educational and appropriate for students
- Clear, easy to understand at a glance
- High quality, professional appearance
- No text-heavy content (diagrams should be visual)
- Suitable for projection/presentation
        """.strip()

        return full_prompt

    def _generate_with_gemini(self, prompt: str, visual_type: VisualizationType) -> Optional[str]:
        """
        Generate image using Google Gemini.

        Note: Gemini Flash doesn't do image generation directly.
        We'll use it to create an improved prompt for Imagen or return a placeholder.
        """
        if not self.api_key:
            print("  Warning: No GEMINI_API_KEY found. Using placeholder.")
            return self._create_placeholder_image(visual_type)

        try:
            # For now, return placeholder until we integrate Imagen
            # TODO: Integrate Google Imagen API for actual image generation
            print("  Using placeholder (Gemini integration pending)")
            return self._create_placeholder_image(visual_type)

        except Exception as e:
            print(f"  Gemini error: {str(e)}")
            return self._create_placeholder_image(visual_type)

    def _generate_with_openai(self, prompt: str) -> Optional[str]:
        """Generate image using OpenAI DALL-E."""
        if not self.api_key:
            print("  Warning: No OPENAI_API_KEY found. Using placeholder.")
            return self._create_placeholder_image(VisualizationType.ILLUSTRATION)

        try:
            response = requests.post(
                self.endpoints["openai"],
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "dall-e-3",
                    "prompt": prompt,
                    "n": 1,
                    "size": "1024x1024",
                    "quality": "standard",
                    "style": "natural"  # More educational, less artistic
                },
                timeout=60
            )

            if response.status_code == 200:
                result = response.json()
                image_url = result["data"][0]["url"]

                # Download and encode as base64
                img_response = requests.get(image_url, timeout=30)
                if img_response.status_code == 200:
                    image_b64 = base64.b64encode(img_response.content).decode()
                    return f"data:image/png;base64,{image_b64}"

        except Exception as e:
            print(f"  OpenAI error: {str(e)}")
            return self._create_placeholder_image(VisualizationType.ILLUSTRATION)

    def _generate_with_replicate(self, prompt: str) -> Optional[str]:
        """Generate image using Replicate (Flux, SDXL, etc.)."""
        if not self.api_key:
            print("  Warning: No REPLICATE_API_TOKEN found. Using placeholder.")
            return self._create_placeholder_image(VisualizationType.ILLUSTRATION)

        try:
            # Use Flux Schnell for speed
            response = requests.post(
                self.endpoints["replicate"],
                headers={
                    "Authorization": f"Token {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "version": "black-forest-labs/flux-schnell",  # Fast model
                    "input": {
                        "prompt": prompt,
                        "num_outputs": 1,
                        "aspect_ratio": "16:9",  # Good for slides
                        "output_format": "png"
                    }
                },
                timeout=60
            )

            if response.status_code == 201:
                prediction = response.json()
                # Poll for result (Replicate is async)
                # For now, return placeholder
                print("  Replicate request submitted (async processing)")
                return self._create_placeholder_image(VisualizationType.ILLUSTRATION)

        except Exception as e:
            print(f"  Replicate error: {str(e)}")
            return self._create_placeholder_image(VisualizationType.ILLUSTRATION)

    def _create_placeholder_image(self, visual_type: VisualizationType) -> str:
        """
        Create a placeholder SVG image as base64 data URI.

        This is used when no API key is available or generation fails.
        """
        svg_templates = {
            VisualizationType.DIAGRAM: """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect fill="#f0f9ff" width="800" height="600"/>
  <circle cx="200" cy="150" r="60" fill="#00F0FF" opacity="0.3"/>
  <circle cx="400" cy="150" r="60" fill="#00F0FF" opacity="0.3"/>
  <circle cx="600" cy="150" r="60" fill="#00F0FF" opacity="0.3"/>
  <path d="M 260 150 L 340 150" stroke="#00F0FF" stroke-width="3" marker-end="url(#arrow)"/>
  <path d="M 460 150 L 540 150" stroke="#00F0FF" stroke-width="3" marker-end="url(#arrow)"/>
  <text x="400" y="400" font-family="Arial" font-size="24" fill="#666" text-anchor="middle">Process Diagram</text>
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#00F0FF"/>
    </marker>
  </defs>
</svg>
            """,

            VisualizationType.CONCEPT_MAP: """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect fill="#f0f9ff" width="800" height="600"/>
  <circle cx="400" cy="200" r="80" fill="#00F0FF" opacity="0.3"/>
  <circle cx="250" cy="400" r="60" fill="#FF006E" opacity="0.3"/>
  <circle cx="550" cy="400" r="60" fill="#FF006E" opacity="0.3"/>
  <line x1="400" y1="280" x2="250" y2="340" stroke="#666" stroke-width="2"/>
  <line x1="400" y1="280" x2="550" y2="340" stroke="#666" stroke-width="2"/>
  <text x="400" y="460" font-family="Arial" font-size="24" fill="#666" text-anchor="middle">Concept Map</text>
</svg>
            """,

            VisualizationType.CHART: """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect fill="#f0f9ff" width="800" height="600"/>
  <rect x="150" y="300" width="100" height="150" fill="#00F0FF" opacity="0.5"/>
  <rect x="300" y="200" width="100" height="250" fill="#00F0FF" opacity="0.5"/>
  <rect x="450" y="250" width="100" height="200" fill="#00F0FF" opacity="0.5"/>
  <line x1="100" y1="450" x2="650" y2="450" stroke="#333" stroke-width="2"/>
  <line x1="100" y1="450" x2="100" y2="150" stroke="#333" stroke-width="2"/>
  <text x="400" y="520" font-family="Arial" font-size="24" fill="#666" text-anchor="middle">Data Chart</text>
</svg>
            """,

            VisualizationType.ILLUSTRATION: """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect fill="#f0f9ff" width="800" height="600"/>
  <circle cx="400" cy="250" r="120" fill="#00F0FF" opacity="0.3"/>
  <path d="M 400 130 L 450 200 L 500 180 L 480 240 L 540 270 L 470 290 L 480 350 L 400 310 L 320 350 L 330 290 L 260 270 L 320 240 L 300 180 L 350 200 Z" fill="#FF006E" opacity="0.3"/>
  <text x="400" y="480" font-family="Arial" font-size="24" fill="#666" text-anchor="middle">Educational Illustration</text>
</svg>
            """,

            VisualizationType.METAPHOR: """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect fill="#f0f9ff" width="800" height="600"/>
  <rect x="100" y="200" width="250" height="200" fill="#00F0FF" opacity="0.3" rx="10"/>
  <rect x="450" y="200" width="250" height="200" fill="#FF006E" opacity="0.3" rx="10"/>
  <text x="225" y="310" font-family="Arial" font-size="20" fill="#333" text-anchor="middle">Concept A</text>
  <text x="575" y="310" font-family="Arial" font-size="20" fill="#333" text-anchor="middle">Concept B</text>
  <text x="400" y="500" font-family="Arial" font-size="24" fill="#666" text-anchor="middle">Visual Metaphor</text>
</svg>
            """
        }

        svg = svg_templates.get(visual_type, svg_templates[VisualizationType.ILLUSTRATION])
        svg_b64 = base64.b64encode(svg.strip().encode()).decode()
        return f"data:image/svg+xml;base64,{svg_b64}"

    def _generate_alt_text(self, segment: LessonSegment, visual_type: VisualizationType) -> str:
        """Generate accessible alt text for the visualization."""
        type_descriptions = {
            VisualizationType.DIAGRAM: "Process diagram showing",
            VisualizationType.CONCEPT_MAP: "Concept map illustrating",
            VisualizationType.CHART: "Chart displaying",
            VisualizationType.ILLUSTRATION: "Illustration depicting",
            VisualizationType.METAPHOR: "Visual metaphor for"
        }

        prefix = type_descriptions.get(visual_type, "Visual aid for")
        return f"{prefix} {segment.title}"
