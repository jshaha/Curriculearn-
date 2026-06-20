"""
Agent 2: Brain Simulator

Simulates brain responses to educational content using semantic embeddings
as a lightweight alternative to TRIBE.

Input: Structured lesson content from Agent 1
Output: Brain state representations (embeddings over time)
"""

import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any


class BrainSimulator:
    """
    Generates brain-like representations of lesson content using semantic embeddings.

    This is a lightweight proxy for TRIBE that uses sentence transformers to create
    a representational space that captures how concepts are processed.

    Each embedding dimension can be thought of as a "cognitive feature" similar to
    how TRIBE's voxels represent brain regions.
    """

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """
        Initialize the brain simulator.

        Args:
            model_name: Name of the sentence transformer model to use.
                       Default is 'all-MiniLM-L6-v2' (80MB, 384 dimensions)
        """
        print(f"Loading brain simulation model: {model_name}...")
        self.model = SentenceTransformer(model_name)
        self.model_name = model_name
        self.embedding_dim = self.model.get_embedding_dimension()
        print(f"Model loaded. Embedding dimension: {self.embedding_dim}")

    def simulate(self, lesson_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate brain state representations for a lesson.

        Args:
            lesson_content: Dictionary containing:
                - 'sections': List of lesson segments (from Agent 1)
                - 'metadata': Optional metadata about the lesson

        Returns:
            Dictionary containing:
                - 'embeddings': numpy array of shape (num_segments, embedding_dim)
                - 'timestamps': list of time indices
                - 'num_features': number of embedding dimensions
                - 'segment_texts': original text segments (for debugging)
                - 'representation_type': type of representation used
        """
        sections = lesson_content.get('sections', [])

        if not sections:
            raise ValueError("No lesson sections provided")

        # Extract text from sections
        # Sections might be strings or dicts with 'content' field
        texts = []
        for section in sections:
            if isinstance(section, str):
                texts.append(section)
            elif isinstance(section, dict) and 'content' in section:
                texts.append(section['content'])
            else:
                raise ValueError(f"Invalid section format: {section}")

        print(f"Simulating brain responses for {len(texts)} lesson segments...")

        # Generate embeddings (this is the "brain simulation")
        embeddings = self.model.encode(
            texts,
            show_progress_bar=True,
            convert_to_numpy=True
        )

        # Create brain state representation
        brain_states = {
            'embeddings': embeddings,
            'timestamps': list(range(len(texts))),
            'num_features': self.embedding_dim,
            'num_segments': len(texts),
            'segment_texts': texts,
            'representation_type': 'semantic_embeddings',
            'model_name': self.model_name
        }

        print(f"Brain simulation complete. Shape: {embeddings.shape}")

        return brain_states

    def simulate_from_text_list(self, texts: List[str]) -> Dict[str, Any]:
        """
        Convenience method to simulate directly from a list of text segments.

        Args:
            texts: List of text segments (slides, paragraphs, etc.)

        Returns:
            Brain state representation (same format as simulate())
        """
        lesson_content = {'sections': texts}
        return self.simulate(lesson_content)
