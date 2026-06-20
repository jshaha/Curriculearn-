"""
Quick test to verify the pipeline works
"""

from src.agents import BrainSimulator, MetricTranslator


def test_basic_pipeline():
    print("Testing Agent 2 + Agent 3 pipeline...\n")

    # Initialize
    brain_sim = BrainSimulator()
    metric_translator = MetricTranslator()

    # Test with a simple lesson
    test_lesson = [
        "Welcome to Introduction to Programming",
        "Today we'll learn about variables",
        "A variable is like a container that holds data",
        "For example: x = 5 stores the number 5 in variable x"
    ]

    print(f"Test lesson has {len(test_lesson)} segments\n")

    # Run pipeline
    brain_states = brain_sim.simulate_from_text_list(test_lesson)
    print(f"\n✓ Brain states generated: shape {brain_states['embeddings'].shape}")

    metrics = metric_translator.translate(brain_states)
    print(f"\n✓ Metrics computed successfully")

    # Verify output structure
    assert 'learning_score' in metrics
    assert 'cognitive_load' in metrics
    assert 'engagement' in metrics
    assert 'problem_segments' in metrics

    print("\n" + "="*50)
    print("✅ ALL TESTS PASSED!")
    print("="*50)
    print("\nYour pipeline is working! You can now:")
    print("1. Run examples/basic_pipeline.py")
    print("2. Run examples/photosynthesis_demo.py")
    print("3. Share docs/AGENT_INTERFACE_SPEC.md with your friend")
    print("\n")

    return metrics


if __name__ == "__main__":
    test_basic_pipeline()
