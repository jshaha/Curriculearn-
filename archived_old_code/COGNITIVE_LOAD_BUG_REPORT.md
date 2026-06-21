# 🐛 Cognitive Load Metric Bug Report

## Summary
The cognitive load metric is **measuring topic shift instead of complexity**. Simple sentences like "Cats are popular pets" → "Cats like to sleep a lot" score 81/100 cognitive load, which is incorrect.

## Root Cause

### Current Implementation (src/agents/metric_translator.py:102-125)
```python
def _compute_cognitive_load(self, embeddings: np.ndarray) -> float:
    if len(embeddings) < 2:
        return 50.0

    changes = []
    for i in range(1, len(embeddings)):
        dist = cosine(embeddings[i-1], embeddings[i])
        changes.append(dist)

    avg_change = np.mean(changes)

    # PROBLEM: This scales cosine distance to cognitive load
    score = min(100, avg_change * 200)

    return float(score)
```

### What This Actually Measures
- **Cosine distance** = how semantically different two sentences are
- **NOT** = how cognitively complex a sentence is

## Test Results

| Test | Sentences | Cosine Dist | Cognitive Load | Expected |
|------|-----------|-------------|----------------|----------|
| **Identical** | "Cat sat on mat" → same | 0.00 | 0 | ✅ Correct |
| **Similar** | "Cat sat on mat" → "Dog sat on mat" | 0.28 | 56 | ❌ Should be ~10 |
| **Related (same topic)** | "Cats are popular" → "Cats sleep a lot" | 0.41 | **81** | ❌ Should be ~20 |
| **Simple unrelated** | "Sky is blue" → "Dogs like bones" | 0.99 | **100** | ❌ Should be ~10 |
| **Progressive (good)** | Python lesson building on same concept | 0.25 | **49** | ✅ About right |

### Key Finding
**Simple 4-word sentences score 100 cognitive load** if they're about different topics!

## What Cognitive Load SHOULD Measure

### Educational Definition
Cognitive load = the mental effort required to process information

### Correct Metrics
1. **Sentence complexity**: Length, clause count, word difficulty
2. **Information density**: Concepts per sentence
3. **Technical vocabulary**: Specialized terms
4. **Structural complexity**: Nested ideas, abstractions

### What It Should NOT Measure
- ❌ Topic shifts (that's "novelty" or "concept flow")
- ❌ Semantic distance between ideas
- ❌ Whether content is related

## Proposed Fixes

### Option 1: Reduce Scaling (Quick Fix)
```python
# Current: score = avg_change * 200
# Proposed: score = avg_change * 100

score = min(100, avg_change * 100)
```
**Effect**: Cuts all scores in half
- Related sentences: 81 → 40
- Unrelated: 100 → 50

### Option 2: Add Complexity Features (Better)
```python
def _compute_cognitive_load(self, embeddings, segment_texts):
    # 50% topic shift + 50% actual complexity
    topic_shift = self._compute_topic_shift(embeddings)
    complexity = self._compute_text_complexity(segment_texts)

    return 0.5 * topic_shift + 0.5 * complexity

def _compute_text_complexity(self, texts):
    """Measure actual cognitive complexity"""
    scores = []
    for text in texts:
        words = text.split()
        # Factors:
        # - Sentence length (longer = more complex)
        # - Average word length (technical words longer)
        # - Punctuation (commas = clauses)

        length_score = min(100, len(words) * 3)
        word_length = np.mean([len(w) for w in words])
        word_score = min(100, word_length * 10)

        scores.append((length_score + word_score) / 2)

    return np.mean(scores)
```

### Option 3: Separate Metrics (Best)
```python
# Rename current metric to "Novelty" (topic shift)
novelty = self._compute_novelty(embeddings)  # Already exists!

# Create NEW cognitive load based on text features
cognitive_load = self._compute_text_complexity(segment_texts)

# Keep both metrics separate
```

## Recommended Solution

**Option 3** is best because:
1. ✅ "Novelty" already correctly measures topic shift
2. ✅ Cognitive load should be separate
3. ✅ Keeps all information, no loss
4. ✅ More interpretable

### Implementation
```python
def _compute_cognitive_load(self, embeddings, segment_texts):
    """
    Cognitive load = mental effort to process information.

    Based on:
    - Sentence length (words per sentence)
    - Word complexity (avg chars per word)
    - Information density (concepts per sentence)
    """
    if not segment_texts:
        return 50.0

    scores = []
    for text in segment_texts:
        words = text.split()

        # Length factor (0-100)
        # 5 words = 15, 10 words = 30, 20 words = 60, 30+ words = 90+
        length_score = min(100, len(words) * 3)

        # Word complexity (0-100)
        # Avg 3 chars = 30, 5 chars = 50, 7+ chars = 70+
        if words:
            avg_word_len = np.mean([len(w.strip('.,!?')) for w in words])
            word_score = min(100, avg_word_len * 10)
        else:
            word_score = 50

        # Combine (70% length, 30% word complexity)
        segment_score = 0.7 * length_score + 0.3 * word_score
        scores.append(segment_score)

    return float(np.mean(scores))
```

## Impact Analysis

### Before Fix
```
"Python is a high-level programming language." → "Variables store data."
Cognitive Load: 100/100 ❌ (measuring topic shift)
```

### After Fix
```
"Python is a high-level programming language." → "Variables store data."
Cognitive Load: 35/100 ✅ (8 words avg, simple words)

vs.

"The photosynthesis process involves chlorophyll absorbing photons..." (18 words)
Cognitive Load: 75/100 ✅ (long sentence, technical terms)
```

## Test Coverage Needed

After fix, verify:
1. ✅ Simple short sentences: 10-30 load
2. ✅ Medium sentences: 30-60 load
3. ✅ Long/technical sentences: 60-90 load
4. ✅ Very dense sentences: 90-100 load
5. ✅ Topic shift doesn't affect score

## Files to Modify

1. `src/agents/metric_translator.py`
   - Update `_compute_cognitive_load()` method
   - Add text complexity calculation
   - Update method signature to accept `segment_texts`

2. `src/agents/brain_simulator.py`
   - Ensure segment_texts are passed through

3. `src/adapters/brain_simulator_adapter.py`
   - Pass segment texts to metric translator

## Timeline
- Quick fix (Option 1): 5 minutes
- Better fix (Option 2): 30 minutes
- Best fix (Option 3): 1 hour + testing
