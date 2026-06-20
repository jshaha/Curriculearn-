"""
Photosynthesis Demo - From Product Spec

This demonstrates the exact example from the product spec:
A lesson with cognitive overload issues that should be detected.
"""

import sys
sys.path.insert(0, '../src')

from agents import BrainSimulator, MetricTranslator


def run_original_lesson():
    """Original lesson with problems (from spec)"""

    print("\n" + "="*60)
    print("ORIGINAL LESSON (with problems)")
    print("="*60)

    original_lesson = [
        # Slide 1
        "Today we'll learn about photosynthesis",

        # Slide 2
        "Plants convert light into energy",

        # Slide 3
        "Plants use sunlight to make food",

        # Slide 4
        "This process is called photosynthesis",

        # Slide 5 - COGNITIVE OVERLOAD (from spec: introduces 5 concepts at once)
        """Photosynthesis involves several key components: chlorophyll (the green pigment),
        ATP (adenosine triphosphate energy molecules), carbon fixation (converting CO2),
        light reactions (photosystem I and II), and the chemical equation
        6CO2 + 6H2O + light → C6H12O6 + 6O2""",

        # Slide 6
        "Plants need sunlight, water, and carbon dioxide",

        # Slide 7
        "The process happens in the chloroplasts",

        # Slide 8 - PROBLEM: Equation before intuition (from spec)
        "The chemical equation is 6CO2 + 6H2O + light → C6H12O6 + 6O2",

        # Slide 9
        "Now let's think of it like a solar panel analogy",

        # Slide 10-15 (simulate no reinforcement issue)
        "Chloroplasts contain thylakoids where light reactions occur",
        "The Calvin cycle happens in the stroma",
        "NADPH is another energy carrier molecule",
        "Photosystem II comes before Photosystem I in the process",
        "Oxygen is released as a byproduct",
        "This oxygen comes from splitting water molecules",
    ]

    # Run pipeline
    brain_sim = BrainSimulator()
    metric_translator = MetricTranslator()

    brain_states = brain_sim.simulate_from_text_list(original_lesson)
    metrics = metric_translator.translate(brain_states)

    return metrics


def run_improved_lesson():
    """Improved lesson with fixes"""

    print("\n" + "="*60)
    print("IMPROVED LESSON (optimized)")
    print("="*60)

    improved_lesson = [
        # Slide 1
        "Today we'll learn about photosynthesis",

        # Slide 2
        "Plants are like solar panels - they convert sunlight into energy",

        # Slide 3
        "Let's think about what plants need: sunlight, water, and air",

        # Slide 4
        "Plants have a special green pigment called chlorophyll",

        # Slide 5 - FIXED: One concept at a time
        "Chlorophyll captures light energy, like a solar panel captures sunlight",

        # Slide 6
        "This light energy is used to power a chemical reaction",

        # Slide 7
        "The reaction combines water and carbon dioxide",

        # Slide 8 - FIXED: Intuition before equation
        "Think of it like this: light + water + CO2 → sugar + oxygen",

        # Slide 9
        "Now let's see the scientific equation: 6CO2 + 6H2O + light → C6H12O6 + 6O2",

        # Slide 10 - REINFORCEMENT
        "Remember: plants use chlorophyll to capture light energy",

        # Slide 11
        "This process happens inside chloroplasts",

        # Slide 12
        "Chloroplasts have two main parts: thylakoids and stroma",

        # Slide 13
        "Light reactions happen in the thylakoids",

        # Slide 14 - REINFORCEMENT
        "Recall how we said light is captured? That's the light reaction",

        # Slide 15
        "The sugar-building reactions happen in the stroma",

        # Slide 16 - FINAL REINFORCEMENT
        "Let's review: chlorophyll captures light, water is split, and sugar is made",
    ]

    # Run pipeline
    brain_sim = BrainSimulator()
    metric_translator = MetricTranslator()

    brain_states = brain_sim.simulate_from_text_list(improved_lesson)
    metrics = metric_translator.translate(brain_states)

    return metrics


def main():
    print("="*60)
    print("PHOTOSYNTHESIS LESSON COMPARISON")
    print("Demo from Product Spec")
    print("="*60)

    # Run both versions
    original_metrics = run_original_lesson()
    improved_metrics = run_improved_lesson()

    # Compare results
    print("\n" + "="*60)
    print("COMPARISON RESULTS")
    print("="*60)

    print("\n📊 Learning Scores:")
    print(f"  Original Lesson:  {original_metrics['learning_score']:.1f}/100")
    print(f"  Improved Lesson:  {improved_metrics['learning_score']:.1f}/100")
    print(f"  Improvement:      +{improved_metrics['learning_score'] - original_metrics['learning_score']:.1f} points")

    print("\n📈 Metric Changes:")
    metrics_to_compare = ['engagement', 'cognitive_load', 'concept_flow', 'retention']

    for metric in metrics_to_compare:
        original = original_metrics[metric]
        improved = improved_metrics[metric]
        change = improved - original

        # For cognitive load, lower is better
        if metric == 'cognitive_load':
            change_symbol = "✓" if change < 0 else "✗"
            change_str = f"{change:.1f}"
        else:
            change_symbol = "✓" if change > 0 else "✗"
            change_str = f"+{change:.1f}" if change > 0 else f"{change:.1f}"

        print(f"  {metric.replace('_', ' ').title():20s}: {original:5.1f} → {improved:5.1f} ({change_str}) {change_symbol}")

    print("\n⚠️  Problems Detected in Original:")
    for problem in original_metrics['problem_segments'][:5]:
        print(f"  - Segment {problem['segment_index']}: {problem['description']}")

    print("\n✓ Problems Fixed in Improved:")
    if len(improved_metrics['problem_segments']) < len(original_metrics['problem_segments']):
        print(f"  Reduced from {len(original_metrics['problem_segments'])} to {len(improved_metrics['problem_segments'])} issues")
    else:
        print(f"  Still has {len(improved_metrics['problem_segments'])} issues (may need more optimization)")

    print("\n" + "="*60)
    print("This is the kind of optimization Agent 6 will perform!")
    print("="*60)


if __name__ == "__main__":
    main()
