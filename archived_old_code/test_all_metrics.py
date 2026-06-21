"""
Test all metrics to see what's broken
"""

import sys
sys.path.insert(0, 'src')

from src.agents import BrainSimulator, MetricTranslator
import numpy as np

def test_metrics(description, texts):
    print(f"\n{'='*60}")
    print(f"TEST: {description}")
    print(f"{'='*60}")

    for i, text in enumerate(texts, 1):
        print(f"{i}. {text}")

    brain_sim = BrainSimulator()
    brain_states = brain_sim.simulate_from_text_list(texts)

    metric_translator = MetricTranslator()
    metrics = metric_translator.translate(brain_states)

    print(f"\nMetrics:")
    print(f"  Cognitive Load:  {metrics['cognitive_load']:.1f}")
    print(f"  Engagement:      {metrics['engagement']:.1f}")
    print(f"  Concept Flow:    {metrics['concept_flow']:.1f}")
    print(f"  Retention:       {metrics['retention']:.1f}")
    print(f"  Novelty:         {metrics['novelty']:.1f}")
    print(f"  Info Density:    {metrics['information_density']:.1f}")
    print(f"  Learning Score:  {metrics['learning_score']:.1f}")

    # Debug engagement
    embeddings = brain_states['embeddings']
    total_var = np.var(embeddings)
    activation_strengths = np.linalg.norm(embeddings, axis=1)
    strength_var = np.var(activation_strengths)

    print(f"\nEngagement Debug:")
    print(f"  Total variance: {total_var:.6f}")
    print(f"  Strength variance: {strength_var:.6f}")
    print(f"  Formula: ({total_var:.6f} * 500 + {strength_var:.6f} * 100) / 2")
    print(f"  = {(total_var * 500 + strength_var * 100) / 2:.2f}")

# Test 1: Boring repetitive lesson (should have LOW engagement)
test_metrics(
    "Boring repetitive lesson",
    [
        "The cat sat on the mat.",
        "The cat sat on the mat.",
        "The cat sat on the mat."
    ]
)

# Test 2: Diverse engaging lesson (should have HIGH engagement)
test_metrics(
    "Diverse engaging lesson",
    [
        "Quantum mechanics revolutionized physics in the 20th century.",
        "Shakespeare's plays explore the depths of human emotion.",
        "The Amazon rainforest contains incredible biodiversity.",
        "Machine learning algorithms can recognize patterns in data."
    ]
)

# Test 3: Progressive lesson (moderate engagement, high retention)
test_metrics(
    "Progressive lesson building on concepts",
    [
        "Python is a programming language.",
        "Python uses simple, readable syntax.",
        "Python syntax relies on indentation for structure.",
        "Proper indentation is crucial in Python programming.",
        "Python's readability makes it great for beginners."
    ]
)
