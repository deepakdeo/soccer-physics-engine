"""Sequence feature vectors and cosine similarity search."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

import numpy as np


def compute_sequence_feature_vector(sequence: Sequence[Mapping[str, Any]]) -> np.ndarray:
    """Compute a compact feature vector for a possession or sequence."""
    if len(sequence) == 0:
        raise ValueError("sequence cannot be empty.")

    ball_x = np.asarray([float(frame.get("ball_x", 0.0)) for frame in sequence], dtype=float)
    ball_y = np.asarray([float(frame.get("ball_y", 0.0)) for frame in sequence], dtype=float)
    pitch_control = np.asarray(
        [float(frame.get("pitch_control_pct", 0.0)) for frame in sequence], dtype=float
    )
    pressure = np.asarray([float(frame.get("pressure", 0.0)) for frame in sequence], dtype=float)
    state_score = np.asarray(
        [float(frame.get("state_score", 0.0)) for frame in sequence], dtype=float
    )

    return np.asarray(
        [
            float(np.mean(ball_x)),
            float(np.mean(ball_y)),
            float(np.mean(pitch_control)),
            float(np.mean(pressure)),
            float(np.mean(state_score)),
            float(ball_x[-1] - ball_x[0]),
            float(len(sequence)),
        ],
        dtype=float,
    )


def search_similar_sequences(
    reference_sequence: Sequence[Mapping[str, Any]],
    candidate_sequences: Mapping[str, Sequence[Mapping[str, Any]]],
    similarity_threshold: float = 0.8,
) -> list[dict[str, float | str]]:
    """Find sequences whose feature vectors are similar to a reference sequence."""
    if not 0.0 <= similarity_threshold <= 1.0:
        raise ValueError("similarity_threshold must be between 0 and 1.")

    reference_vector = compute_sequence_feature_vector(reference_sequence)
    reference_norm = float(np.linalg.norm(reference_vector))
    if reference_norm == 0.0:
        raise ValueError("reference_sequence feature vector must have non-zero norm.")

    matches: list[dict[str, float | str]] = []
    for sequence_id, sequence in candidate_sequences.items():
        candidate_vector = compute_sequence_feature_vector(sequence)
        candidate_norm = float(np.linalg.norm(candidate_vector))
        if candidate_norm == 0.0:
            continue
        similarity = float(
            np.dot(reference_vector, candidate_vector) / (reference_norm * candidate_norm)
        )
        if similarity >= similarity_threshold:
            matches.append({"sequence_id": sequence_id, "similarity": similarity})

    matches.sort(key=lambda match: float(match["similarity"]), reverse=True)
    return matches
