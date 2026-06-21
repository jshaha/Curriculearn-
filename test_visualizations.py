"""
Test the visualization generation system.

This script demonstrates how to use Agent 7 (VisualizationGenerator)
to create AI-generated diagrams and illustrations for lessons.
"""

import sys
from pathlib import Path

# Add paths
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root / 'backend'))

from neurocompiler.schemas import StructuredLesson, LessonSegment
from neurocompiler.agents import VisualizationGenerator


def test_basic_visualization():
    """Test basic visualization generation with placeholders."""

    print("\n" + "="*70)
    print(" Testing Visualization Generation (Agent 7)")
    print("="*70)

    # Create a test lesson
    lesson = StructuredLesson(
        id="test_photo",
        title="Introduction to Photosynthesis",
        learning_goals=["Understand the photosynthesis process"],
        segments=[
            LessonSegment(
                id="seg_1",
                title="What is Photosynthesis?",
                content="""Photosynthesis is the process by which plants convert light
                energy into chemical energy. This process involves several steps and
                requires specific inputs.""",
                concepts=["photosynthesis", "energy conversion"]
            ),
            LessonSegment(
                id="seg_2",
                title="The Photosynthesis Cycle",
                content="""The cycle begins with light absorption by chlorophyll,
                followed by water splitting, electron transport, and finally glucose
                synthesis. Each stage is crucial for the overall process.""",
                concepts=["chlorophyll", "light reactions", "dark reactions"]
            ),
            LessonSegment(
                id="seg_3",
                title="Comparing Photosynthesis and Cellular Respiration",
                content="""Photosynthesis and cellular respiration are like mirror
                processes. Plants use photosynthesis to store energy, while both plants
                and animals use cellular respiration to release energy.""",
                concepts=["cellular respiration", "energy cycle"]
            )
        ]
    )

    # Initialize generator (will use placeholders without API key)
    print("\nInitializing VisualizationGenerator...")
    generator = VisualizationGenerator(model_provider="gemini")

    # Generate visualizations
    print("\nGenerating visualizations for all segments...")
    visualizations = generator.generate_visualizations(
        lesson,
        max_visuals_per_segment=1
    )

    # Display results
    print("\n" + "="*70)
    print(" Results")
    print("="*70)

    for seg_id, visuals in visualizations.items():
        print(f"\n{seg_id}:")
        for visual in visuals:
            print(f"  - Type: {visual.type.value}")
            print(f"  - Alt: {visual.alt_text}")
            print(f"  - Prompt (first 100 chars): {visual.prompt[:100]}...")
            print(f"  - Image data: {visual.image_data[:50]}...")

    print("\n" + "="*70)
    print(f" Total visualizations: {sum(len(v) for v in visualizations.values())}")
    print("="*70)

    print("\n✓ Visualization test complete!")
    print("\nNote: Using placeholder SVG images (no API key provided)")
    print("To use real AI generation, set one of:")
    print("  - GEMINI_API_KEY (Google Gemini)")
    print("  - OPENAI_API_KEY (DALL-E)")
    print("  - REPLICATE_API_TOKEN (Flux/SDXL)")


def test_with_api():
    """
    Test with real API (requires API key).

    To run this:
    1. Set environment variable: export OPENAI_API_KEY=your_key
    2. Run: python test_visualizations.py --api
    """
    import os

    if not os.getenv('OPENAI_API_KEY') and not os.getenv('GEMINI_API_KEY'):
        print("\n⚠️  No API key found. Set OPENAI_API_KEY or GEMINI_API_KEY")
        print("Example: export OPENAI_API_KEY=sk-...")
        return

    print("\n" + "="*70)
    print(" Testing with Real AI Image Generation")
    print("="*70)

    # Simple test lesson
    lesson = StructuredLesson(
        id="test_simple",
        title="Simple Test",
        learning_goals=["Test visualization"],
        segments=[
            LessonSegment(
                id="seg_1",
                title="The Water Cycle",
                content="""The water cycle shows how water moves through evaporation,
                condensation, precipitation, and collection. This is a continuous
                process that sustains life on Earth.""",
                concepts=["water cycle", "evaporation", "precipitation"]
            )
        ]
    )

    # Use OpenAI if available, otherwise Gemini
    provider = "openai" if os.getenv('OPENAI_API_KEY') else "gemini"
    generator = VisualizationGenerator(model_provider=provider)

    print(f"\nUsing {provider} for image generation...")
    print("This may take 10-30 seconds...")

    visualizations = generator.generate_visualizations(lesson, max_visuals_per_segment=1)

    print("\n✓ Real AI generation complete!")
    print(f"Generated {sum(len(v) for v in visualizations.values())} visualization(s)")


if __name__ == "__main__":
    if "--api" in sys.argv:
        test_with_api()
    else:
        test_basic_visualization()
