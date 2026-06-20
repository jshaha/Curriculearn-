"""
Basic Pipeline Example

Demonstrates the full Agent 2 -> Agent 3 pipeline with a simple lesson.
"""

import sys
sys.path.insert(0, '../src')

from agents import BrainSimulator, MetricTranslator


def main():
    print("="*60)
    print("NEUROCOMPILER - BASIC PIPELINE DEMO")
    print("="*60)

    # Initialize agents
    brain_sim = BrainSimulator()
    metric_translator = MetricTranslator()

    # Simple lesson example
    lesson = [
        "Today we'll learn about photosynthesis",
        "Plants are like solar panels - they convert sunlight into energy",
        "Let's understand the basic process step by step",
        "First, plants capture light using chlorophyll in their leaves",
        "This light energy is then used to split water molecules",
        "The energy from splitting water is stored in molecules called ATP",
        "Plants use this stored energy to convert carbon dioxide into sugar",
        "This process happens in two main stages: light reactions and dark reactions"
    ]

    print(f"\n📚 Analyzing lesson with {len(lesson)} segments...")

    # Agent 2: Generate brain states
    brain_states = brain_sim.simulate_from_text_list(lesson)

    # Agent 3: Convert to metrics
    metrics = metric_translator.translate(brain_states)

    # Display results
    print("\n" + "="*60)
    print("RESULTS FOR YOUR FRIEND (Agent 4+)")
    print("="*60)
    print("\nThis is the data structure Agent 4 will receive:")
    print("\nmetrics = {")
    for key in ['learning_score', 'cognitive_load', 'engagement',
                'concept_flow', 'retention', 'novelty', 'information_density']:
        print(f"    '{key}': {metrics[key]:.1f},")
    print("    'problem_segments': [")
    for problem in metrics['problem_segments'][:2]:
        print(f"        {problem},")
    if len(metrics['problem_segments']) > 2:
        print(f"        ... {len(metrics['problem_segments']) - 2} more")
    print("    ]")
    print("}")

    return metrics


if __name__ == "__main__":
    main()
