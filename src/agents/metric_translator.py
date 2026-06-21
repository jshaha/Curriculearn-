"""
Agent 3: Metric Translator

Converts brain state representations into interpretable educational metrics.

Input: Brain states from Agent 2 (embeddings over time)
Output: Educational metrics (cognitive load, engagement, etc.)
"""

import numpy as np
from scipy.spatial.distance import cosine, euclidean
from typing import Dict, Any, List


class MetricTranslator:
    """
    Translates brain representations into educational metrics.

    This agent analyzes the temporal dynamics of brain states to compute
    metrics like cognitive load, engagement, concept flow, and retention.
    """

    def __init__(self):
        """Initialize the metric translator."""
        pass

    def translate(self, brain_states: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert brain states into educational metrics.

        Args:
            brain_states: Dictionary from Agent 2 containing:
                - 'embeddings': numpy array of shape (num_segments, embedding_dim)
                - 'timestamps': list of time indices
                - other metadata

        Returns:
            Dictionary containing:
                - Aggregate scores (0-100 scale)
                - Detailed temporal metrics
                - Interpretations and recommendations
        """
        embeddings = brain_states['embeddings']
        timestamps = brain_states.get('timestamps', list(range(len(embeddings))))
        segment_texts = brain_states.get('segment_texts', [])

        print(f"\nTranslating brain states to educational metrics...")
        print(f"Analyzing {len(embeddings)} segments...")

        # Compute all metrics
        cognitive_load = self._compute_cognitive_load(embeddings, segment_texts)
        engagement = self._compute_engagement(embeddings)
        concept_flow = self._compute_concept_flow(embeddings)
        retention = self._compute_retention(embeddings)
        novelty = self._compute_novelty(embeddings)
        information_density = self._compute_information_density(embeddings)

        # Compute temporal trajectories (for visualizations)
        temporal_metrics = self._compute_temporal_metrics(embeddings, segment_texts)

        # Identify problem segments
        problem_segments = self._identify_problem_segments(
            embeddings,
            temporal_metrics,
            segment_texts
        )

        # Compute overall learning score
        learning_score = self._compute_learning_score({
            'engagement': engagement,
            'cognitive_load': cognitive_load,
            'concept_flow': concept_flow,
            'retention': retention,
            'information_density': information_density
        })

        metrics = {
            # Aggregate scores (0-100 scale)
            'learning_score': learning_score,
            'cognitive_load': cognitive_load,
            'engagement': engagement,
            'concept_flow': concept_flow,
            'retention': retention,
            'novelty': novelty,
            'information_density': information_density,

            # Temporal data (for graphing)
            'temporal_metrics': temporal_metrics,

            # Problem detection
            'problem_segments': problem_segments,

            # Metadata
            'num_segments': len(embeddings),
            'timestamps': timestamps
        }

        self._print_summary(metrics)

        return metrics

    def _compute_cognitive_load(self, embeddings: np.ndarray, segment_texts: List[str]) -> float:
        """
        Cognitive load = mental effort required to process information

        Measured by text complexity: sentence length + word difficulty
        """
        if not segment_texts:
            # Fallback to reduced scaling if no text
            if len(embeddings) < 2:
                return 50.0
            changes = []
            for i in range(1, len(embeddings)):
                dist = cosine(embeddings[i-1], embeddings[i])
                changes.append(dist)
            avg_change = np.mean(changes)
            return float(min(100, avg_change * 100))

        scores = []
        for text in segment_texts:
            words = [w.strip('.,!?;:()[]{}\"\'') for w in text.split() if w.strip()]
            if not words:
                scores.append(50.0)
                continue

            word_count = len(words)
            if word_count <= 5:
                length_score = 15.0
            elif word_count <= 10:
                length_score = 30.0 + (word_count - 5) * 4
            elif word_count <= 20:
                length_score = 50.0 + (word_count - 10) * 3
            else:
                length_score = min(100, 80.0 + (word_count - 20) * 2)

            avg_word_len = np.mean([len(w) for w in words])
            if avg_word_len <= 4:
                word_score = 20.0
            elif avg_word_len <= 6:
                word_score = 40.0 + (avg_word_len - 4) * 10
            else:
                word_score = min(100, 60.0 + (avg_word_len - 6) * 15)

            segment_score = 0.6 * length_score + 0.4 * word_score
            scores.append(segment_score)

        return float(np.mean(scores))

    def _compute_engagement(self, embeddings: np.ndarray) -> float:
        """
        Engagement = diversity of topics covered

        Measured by: average pairwise distance between all segments
        """
        if len(embeddings) < 2:
            return 50.0

        distances = []
        for i in range(len(embeddings)):
            for j in range(i + 1, len(embeddings)):
                dist = cosine(embeddings[i], embeddings[j])
                distances.append(dist)

        if not distances:
            return 50.0

        avg_distance = np.mean(distances)
        score = min(100, avg_distance * 150)

        return float(score)

    def _compute_concept_flow(self, embeddings: np.ndarray) -> float:
        """
        Concept flow = smoothness of transitions between ideas

        Good flow occurs when each concept builds naturally on the previous one,
        with moderate (not abrupt) transitions.

        Measured by: similarity between consecutive embeddings
        """
        if len(embeddings) < 2:
            return 50.0

        similarities = []
        for i in range(1, len(embeddings)):
            sim = 1 - cosine(embeddings[i-1], embeddings[i])
            similarities.append(sim)

        avg_similarity = np.mean(similarities)

        # Scale to 0-100 (higher = smoother flow)
        # We want moderate similarity (not too high, not too low)
        # Optimal range: 0.6-0.8 similarity
        if avg_similarity > 0.8:
            # Too similar = repetitive
            score = 100 - (avg_similarity - 0.8) * 200
        elif avg_similarity < 0.6:
            # Too different = disjointed
            score = avg_similarity * 120
        else:
            # Optimal range
            score = 100

        return float(max(0, min(100, score)))

    def _compute_retention(self, embeddings: np.ndarray) -> float:
        """
        Retention = concept reinforcement through reactivation

        Good retention support occurs when important concepts are revisited,
        reinforcing learning through spaced repetition.

        Measured by: how often similar representations reappear
        """
        if len(embeddings) < 3:
            return 50.0

        reactivations = []

        # For each segment, find similar previous segments
        for i in range(1, len(embeddings)):
            max_similarity = 0
            for j in range(i):
                sim = 1 - cosine(embeddings[i], embeddings[j])
                if sim > max_similarity:
                    max_similarity = sim

            # High similarity = concept reactivation
            if max_similarity > 0.7:
                reactivations.append(max_similarity)

        if not reactivations:
            return 30.0  # Low retention support

        # Score based on frequency and strength of reactivations
        score = (len(reactivations) / len(embeddings)) * np.mean(reactivations) * 150

        return float(min(100, score))

    def _compute_novelty(self, embeddings: np.ndarray) -> float:
        """
        Novelty = introduction of new concepts

        Measured by: distance from the centroid of previous concepts
        """
        if len(embeddings) < 2:
            return 50.0

        novelties = []
        for i in range(1, len(embeddings)):
            previous_centroid = np.mean(embeddings[:i], axis=0)
            dist = cosine(embeddings[i], previous_centroid)
            novelties.append(dist)

        avg_novelty = np.mean(novelties)
        score = min(100, avg_novelty * 200)

        return float(score)

    def _compute_information_density(self, embeddings: np.ndarray) -> float:
        """
        Information density = conceptual change per segment

        Measures how much new information is introduced on average.
        """
        if len(embeddings) < 2:
            return 50.0

        distances = []
        for i in range(1, len(embeddings)):
            dist = cosine(embeddings[i-1], embeddings[i])
            distances.append(dist)

        avg_distance = np.mean(distances)
        score = min(100, avg_distance * 120)

        return float(score)

    def _compute_temporal_metrics(self, embeddings: np.ndarray, segment_texts: List[str]) -> Dict[str, List[float]]:
        """
        Compute metrics over time (for visualization).

        Returns per-segment values and transition trajectories.
        """
        result = {}

        if len(embeddings) < 2:
            return result

        # Per-segment cognitive load (text complexity)
        cognitive_load_per_segment = []
        for text in segment_texts:
            words = [w.strip('.,!?;:()[]{}\"\'') for w in text.split() if w.strip()]
            if not words:
                cognitive_load_per_segment.append(50.0)
                continue

            word_count = len(words)
            if word_count <= 5:
                length_score = 15.0
            elif word_count <= 10:
                length_score = 30.0 + (word_count - 5) * 4
            elif word_count <= 20:
                length_score = 50.0 + (word_count - 10) * 3
            else:
                length_score = min(100, 80.0 + (word_count - 20) * 2)

            avg_word_len = np.mean([len(w) for w in words])
            if avg_word_len <= 4:
                word_score = 20.0
            elif avg_word_len <= 6:
                word_score = 40.0 + (avg_word_len - 4) * 10
            else:
                word_score = min(100, 60.0 + (avg_word_len - 6) * 15)

            segment_score = 0.6 * length_score + 0.4 * word_score
            cognitive_load_per_segment.append(segment_score)

        # Topic shift trajectory (transitions)
        cognitive_load_trajectory = []
        novelty_trajectory = []

        for i in range(1, len(embeddings)):
            # Topic shift at each transition
            load = cosine(embeddings[i-1], embeddings[i]) * 80
            cognitive_load_trajectory.append(load)

            # Novelty at each point
            if i > 1:
                centroid = np.mean(embeddings[:i], axis=0)
                nov = cosine(embeddings[i], centroid) * 100
                novelty_trajectory.append(nov)

        return {
            'cognitive_load': cognitive_load_per_segment,
            'cognitive_load_trajectory': cognitive_load_trajectory,
            'novelty_trajectory': novelty_trajectory,
            'segment_indices': list(range(1, len(embeddings)))
        }

    def _identify_problem_segments(
        self,
        embeddings: np.ndarray,
        temporal_metrics: Dict[str, List[float]],
        segment_texts: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Identify segments with pedagogical issues.

        Returns list of problem segments with diagnoses.
        """
        problems = []

        if len(embeddings) < 2:
            return problems

        load_trajectory = temporal_metrics.get('cognitive_load_trajectory', [])

        # Check for cognitive overload (high transition cost)
        for i, load in enumerate(load_trajectory):
            if load > 60:  # High cognitive load threshold
                problems.append({
                    'segment_index': i + 1,
                    'type': 'cognitive_overload',
                    'severity': 'high' if load > 80 else 'medium',
                    'score': load,
                    'description': f'Segment {i+1} introduces too much new information',
                    'recommendation': 'Break this segment into smaller parts or add scaffolding',
                    'text': segment_texts[i+1] if i+1 < len(segment_texts) else None
                })

        # Check for abrupt transitions (concept flow issues)
        for i in range(1, len(embeddings)):
            similarity = 1 - cosine(embeddings[i-1], embeddings[i])
            if similarity < 0.4:  # Very low similarity
                problems.append({
                    'segment_index': i,
                    'type': 'abrupt_transition',
                    'severity': 'medium',
                    'score': similarity * 100,
                    'description': f'Abrupt conceptual jump at segment {i}',
                    'recommendation': 'Add transitional content to bridge these concepts',
                    'text': segment_texts[i] if i < len(segment_texts) else None
                })

        return problems

    def _compute_learning_score(self, metrics: Dict[str, float]) -> float:
        """
        Compute overall learning score using weighted combination.

        Formula from spec:
        Learning Score = 0.35 × Engagement
                       - 0.30 × Cognitive Load
                       + 0.20 × Conceptual Flow
                       + 0.10 × Retention
                       + 0.05 × Information Density

        Note: Cognitive load is negative (lower is better)
        """
        score = (
            0.35 * metrics['engagement'] +
            -0.30 * metrics['cognitive_load'] +  # Negative weight
            0.20 * metrics['concept_flow'] +
            0.10 * metrics['retention'] +
            0.05 * metrics['information_density']
        )

        # Normalize to 0-100 range
        # Theoretical range: -30 to 70, shift and scale
        normalized = ((score + 30) / 100) * 100

        return float(max(0, min(100, normalized)))

    def _print_summary(self, metrics: Dict[str, Any]):
        """Print a human-readable summary of metrics."""
        print("\n" + "="*50)
        print("EDUCATIONAL METRICS SUMMARY")
        print("="*50)
        print(f"\nOverall Learning Score: {metrics['learning_score']:.1f}/100")
        print(f"\nDetailed Metrics:")
        print(f"  Engagement:          {metrics['engagement']:.1f}/100")
        print(f"  Cognitive Load:      {metrics['cognitive_load']:.1f}/100 {'⚠️  HIGH' if metrics['cognitive_load'] > 70 else ''}")
        print(f"  Concept Flow:        {metrics['concept_flow']:.1f}/100")
        print(f"  Retention Support:   {metrics['retention']:.1f}/100")
        print(f"  Novelty:             {metrics['novelty']:.1f}/100")
        print(f"  Information Density: {metrics['information_density']:.1f}/100")

        if metrics['problem_segments']:
            print(f"\n⚠️  {len(metrics['problem_segments'])} Problem(s) Detected:")
            for problem in metrics['problem_segments'][:3]:  # Show first 3
                print(f"  - Segment {problem['segment_index']}: {problem['description']}")

        print("="*50 + "\n")
