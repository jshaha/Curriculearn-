"""
Full Pipeline Demo - All 3 Agents Working Together

Demonstrates:
- Agent 1: Parse lesson file
- Agent 2: Generate brain states
- Agent 3: Compute educational metrics
"""

import sys
sys.path.insert(0, '../src')

from agents import CurriculumParser, BrainSimulator, MetricTranslator


def analyze_lesson_file(file_path: str):
    """
    Complete pipeline: Parse → Simulate → Analyze

    Args:
        file_path: Path to lesson file (.txt, .pdf, .pptx, .docx)
    """
    print("="*60)
    print("NEUROCOMPILER - FULL PIPELINE")
    print("="*60)

    # Agent 1: Parse the lesson file
    print("\n📄 AGENT 1: Curriculum Parser")
    print("-" * 60)

    parser = CurriculumParser()
    lesson_content = parser.parse(file_path)

    # Show preview
    print(parser.get_preview(lesson_content, max_sections=3))

    # Agent 2: Generate brain states
    print("\n🧠 AGENT 2: Brain Simulator")
    print("-" * 60)

    brain_sim = BrainSimulator()
    brain_states = brain_sim.simulate(lesson_content)

    # Agent 3: Compute metrics
    print("\n📊 AGENT 3: Metric Translator")
    print("-" * 60)

    metric_translator = MetricTranslator()
    metrics = metric_translator.translate(brain_states)

    # Summary
    print("\n" + "="*60)
    print("PIPELINE COMPLETE")
    print("="*60)
    print(f"\n✓ Parsed: {lesson_content['metadata']['filename']}")
    print(f"✓ Analyzed: {len(lesson_content['sections'])} lesson segments")
    print(f"✓ Overall Learning Score: {metrics['learning_score']:.1f}/100")

    if metrics['problem_segments']:
        print(f"\n⚠️  Detected {len(metrics['problem_segments'])} issue(s):")
        for problem in metrics['problem_segments'][:3]:
            print(f"  - {problem['description']}")

    print("\n" + "="*60)
    print("Next: Pass metrics to Agent 4 for detailed diagnosis")
    print("="*60)

    return lesson_content, brain_states, metrics


def analyze_raw_text(text: str):
    """
    Analyze raw text directly (for pasted content, transcripts, etc.)

    Args:
        text: Raw lesson text
    """
    print("="*60)
    print("NEUROCOMPILER - TEXT ANALYSIS")
    print("="*60)

    # Agent 1: Parse raw text
    print("\n📄 AGENT 1: Curriculum Parser (Raw Text)")
    print("-" * 60)

    parser = CurriculumParser()
    lesson_content = parser.parse_text(text, segment_by='paragraph')

    print(parser.get_preview(lesson_content, max_sections=3))

    # Agent 2 & 3: Same as above
    brain_sim = BrainSimulator()
    metric_translator = MetricTranslator()

    brain_states = brain_sim.simulate(lesson_content)
    metrics = metric_translator.translate(brain_states)

    print(f"\n✓ Overall Learning Score: {metrics['learning_score']:.1f}/100")

    return lesson_content, brain_states, metrics


def main():
    """Run the demo with sample lesson file"""

    # Test with the sample text file
    sample_file = "../test_files/sample_lesson.txt"

    print("\n🎯 Analyzing sample photosynthesis lesson...\n")

    lesson_content, brain_states, metrics = analyze_lesson_file(sample_file)

    # Show what Agent 4 would receive
    print("\n" + "="*60)
    print("DATA FOR AGENT 4 (Educational Diagnostician)")
    print("="*60)
    print("\nYour friend's agent will receive:")
    print(f"""
    {{
        'learning_score': {metrics['learning_score']:.1f},
        'cognitive_load': {metrics['cognitive_load']:.1f},
        'engagement': {metrics['engagement']:.1f},
        'concept_flow': {metrics['concept_flow']:.1f},
        'retention': {metrics['retention']:.1f},
        'problem_segments': {len(metrics['problem_segments'])} issues
    }}
    """)

    print("\nAgent 4 can now:")
    print("  1. Analyze which segments have issues")
    print("  2. Generate detailed diagnoses")
    print("  3. Recommend specific improvements")
    print("  4. Pass to Agent 5 for editing")


if __name__ == "__main__":
    main()
