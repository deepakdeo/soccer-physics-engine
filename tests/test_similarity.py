"""Tests for sequence similarity search."""

from __future__ import annotations

import numpy as np
from src.search.similarity import compute_sequence_feature_vector, search_similar_sequences


def test_compute_sequence_feature_vector_returns_fixed_width_vector(
    sequence_bank: dict[str, list[dict[str, float]]],
) -> None:
    vector = compute_sequence_feature_vector(sequence_bank["reference_like"])

    assert vector.shape == (7,)
    assert np.isclose(vector[-1], 3.0)


def test_search_similar_sequences_returns_only_sequences_above_threshold(
    sequence_bank: dict[str, list[dict[str, float]]],
) -> None:
    matches = search_similar_sequences(
        reference_sequence=sequence_bank["reference_like"],
        candidate_sequences=sequence_bank,
        similarity_threshold=0.95,
    )

    assert matches[0]["sequence_id"] == "reference_like"
    assert all(float(match["similarity"]) >= 0.95 for match in matches)
