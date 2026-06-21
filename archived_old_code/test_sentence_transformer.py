"""
Test to understand why simple sentences get high cognitive load scores.
"""

import sys
from pathlib import Path
sys.path.insert(0, 'src')
sys.path.insert(0, 'backend')

import numpy as np
from scipy.spatial.distance import cosine
from src.agents import BrainSimulator, MetricTranslator
from neurocompiler.schemas import StructuredLesson, LessonSegment

def test_sentence(description, segments_text):
    """Test a lesson and show detailed metrics"""
    print("\n" + "="*80)
    print(f" TEST: {description}")
    print("="*80)

    # Create lesson
    lesson = StructuredLesson(
        id="test",
        title="Test",
        learning_goals=[],
        segments=[
            LessonSegment(
                id=f"seg_{i}",
                title=f"Segment {i}",
                content=text,
                concepts=[],
                modality="text"
            )
            for i, text in enumerate(segments_text, 1)
        ]
    )

    # Print segments
    print("\nSegments:")
    for i, text in enumerate(segments_text, 1):
        print(f"  {i}. {text}")

    # Run brain simulator
    brain_sim = BrainSimulator()
    brain_states = brain_sim.simulate_from_text_list(segments_text)

    embeddings = brain_states['embeddings']
    print(f"\nEmbeddings shape: {embeddings.shape}")

    # Show embedding statistics
    print(f"\nEmbedding Statistics:")
    for i, emb in enumerate(embeddings, 1):
        norm = np.linalg.norm(emb)
        print(f"  Segment {i} - L2 norm: {norm:.4f}, Mean: {emb.mean():.4f}, Std: {emb.std():.4f}")

    # Calculate cosine distances manually
    if len(embeddings) > 1:
        print(f"\nCosine Distances Between Consecutive Segments:")
        for i in range(1, len(embeddings)):
            dist = cosine(embeddings[i-1], embeddings[i])
            similarity = 1 - dist
            print(f"  Seg {i-1} → Seg {i}: distance={dist:.4f}, similarity={similarity:.4f}")
            print(f"    Scaled score (dist * 200): {min(100, dist * 200):.1f}")

    # Run metric translator
    metric_translator = MetricTranslator()
    metrics = metric_translator.translate(brain_states)

    print(f"\nFinal Cognitive Load Score: {metrics['cognitive_load']:.1f}/100")
    print(f"Final Learning Score: {metrics['learning_score']:.1f}/100")

    return metrics


print("\n" + "#"*80)
print("# TESTING SENTENCE TRANSFORMER COGNITIVE LOAD CALCULATION")
print("#"*80)

# Test 1: Single simple sentence
print("\n" + "/"*80)
print(" CONTROL TEST: What happens with < 2 segments?")
print("/"*80)
test_sentence(
    "Single simple sentence",
    ["The cat sat on the mat."]
)

# Test 2: Two identical sentences
print("\n" + "/"*80)
print(" TEST 1: Two IDENTICAL sentences (should have ~0 distance)")
print("/"*80)
test_sentence(
    "Identical sentences",
    [
        "The cat sat on the mat.",
        "The cat sat on the mat."
    ]
)

# Test 3: Two very similar sentences
print("\n" + "/"*80)
print(" TEST 2: Two SIMILAR sentences")
print("/"*80)
test_sentence(
    "Similar sentences",
    [
        "The cat sat on the mat.",
        "The dog sat on the mat."
    ]
)

# Test 4: Two related sentences
print("\n" + "/"*80)
print(" TEST 3: Two RELATED sentences (same topic)")
print("/"*80)
test_sentence(
    "Related sentences about cats",
    [
        "Cats are popular pets.",
        "Cats like to sleep a lot."
    ]
)

# Test 5: Two unrelated simple sentences
print("\n" + "/"*80)
print(" TEST 4: Two UNRELATED simple sentences")
print("/"*80)
test_sentence(
    "Unrelated simple sentences",
    [
        "The sky is blue.",
        "Dogs like bones."
    ]
)

# Test 6: Simple vs complex on same topic
print("\n" + "/"*80)
print(" TEST 5: Simple sentence → Complex sentence (SAME topic)")
print("/"*80)
test_sentence(
    "Simple to complex (same topic)",
    [
        "Python is easy.",
        "Python is a high-level programming language with dynamic typing, automatic memory management, and extensive libraries."
    ]
)

# Test 7: Two complex unrelated sentences
print("\n" + "/"*80)
print(" TEST 6: Two COMPLEX unrelated sentences")
print("/"*80)
test_sentence(
    "Complex unrelated",
    [
        "Quantum mechanics describes the behavior of matter and energy at the molecular, atomic, nuclear, and subatomic levels.",
        "The Federal Reserve implements monetary policy through open market operations, discount rates, and reserve requirements."
    ]
)

# Test 8: The original Python lesson
print("\n" + "/"*80)
print(" TEST 7: Original Python lesson (5 segments)")
print("/"*80)
test_sentence(
    "Python lesson (5 segments)",
    [
        "Python is a high-level programming language known for its simple syntax.",
        "Variables store data. You can create them like: x = 5 or name = 'Alice'.",
        "Functions are reusable blocks of code defined with the def keyword.",
        "Lists store multiple items in order: numbers = [1, 2, 3, 4, 5].",
        "Loops repeat actions. For loops iterate over sequences."
    ]
)

# Test 9: Progression on SAME concept
print("\n" + "/"*80)
print(" TEST 8: Progressive lesson (building on SAME concept)")
print("/"*80)
test_sentence(
    "Progressive Python lesson",
    [
        "Python is a programming language.",
        "Python uses simple syntax that is easy to read.",
        "Python syntax uses indentation to define code blocks.",
        "Indentation in Python must be consistent, usually 4 spaces.",
        "Consistent indentation makes Python code clean and readable."
    ]
)

print("\n" + "#"*80)
print("# DIAGNOSIS")
print("#"*80)
print("""
The issue appears to be:

1. **Cosine distance is topic-based, NOT complexity-based**
   - Even simple sentences about different topics have high cosine distance
   - "The sky is blue" vs "Dogs like bones" → High distance (different topics)
   - Complexity doesn't matter, semantic topic shift matters

2. **The scaling formula is too aggressive**
   - Current: score = dist * 200
   - A cosine distance of 0.5 → 100 cognitive load
   - But 0.5 is very common for topic shifts, even simple ones!

3. **Cognitive load should measure COMPLEXITY, not topic shift**
   - Current implementation measures: "How different are consecutive segments?"
   - Should measure: "How complex/dense is the information?"

RECOMMENDED FIXES:
1. Use sentence LENGTH, word difficulty, or embedding variance for complexity
2. Reduce scaling factor (dist * 100 instead of * 200)
3. Consider absolute embedding norms (higher norms = more complex concepts)
4. Use embedding variance within a segment (high variance = complex)
""")
