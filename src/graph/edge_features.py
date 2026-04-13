"""Edge construction and features for interaction graphs."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

import numpy as np


def compute_edge_index(
    frame_data: Sequence[dict[str, Any]],
    max_edge_distance: float = 35.0,
    bidirectional: bool = True,
) -> np.ndarray:
    """Compute directed graph edges between nearby entities in a frame."""
    if max_edge_distance <= 0:
        raise ValueError("max_edge_distance must be positive.")

    positions = _positions_from_frame(frame_data)
    edges: list[tuple[int, int]] = []
    for source_index in range(len(frame_data)):
        for target_index in range(source_index + 1, len(frame_data)):
            distance = float(np.linalg.norm(positions[source_index] - positions[target_index]))
            if distance > max_edge_distance:
                continue
            edges.append((source_index, target_index))
            if bidirectional:
                edges.append((target_index, source_index))

    if not edges:
        return np.zeros((2, 0), dtype=int)
    return np.asarray(edges, dtype=int).T


def build_edge_feature_matrix(
    frame_data: Sequence[dict[str, Any]],
    edge_index: np.ndarray,
) -> np.ndarray:
    """Build edge features for each graph connection.

    Edge features follow the Phase 5 plan: distance, angle, closing speed,
    passability, and same-team flag.
    """
    positions = _positions_from_frame(frame_data)
    velocities = _vector_array_from_frame(frame_data, "vx", "vy")
    teams = [str(record.get("team", "unknown")) for record in frame_data]

    if edge_index.size == 0:
        return np.zeros((0, 5), dtype=float)

    features: list[list[float]] = []
    for source_index, target_index in edge_index.T:
        displacement = positions[target_index] - positions[source_index]
        distance = float(np.linalg.norm(displacement))
        angle = float(np.arctan2(displacement[1], displacement[0])) if distance > 0 else 0.0
        direction = displacement / distance if distance > 0 else np.zeros(2, dtype=float)
        relative_velocity = velocities[target_index] - velocities[source_index]
        closing_speed = float(-np.dot(relative_velocity, direction))
        passability = float(max(0.0, 1.0 - min(distance / 40.0, 1.0)))
        same_team = 1.0 if teams[source_index] == teams[target_index] else 0.0
        features.append([distance, angle, closing_speed, passability, same_team])

    return np.asarray(features, dtype=float)


def _positions_from_frame(frame_data: Sequence[dict[str, Any]]) -> np.ndarray:
    return np.asarray(
        [[float(record.get("x", 0.0)), float(record.get("y", 0.0))] for record in frame_data],
        dtype=float,
    )


def _vector_array_from_frame(
    frame_data: Sequence[dict[str, Any]],
    x_key: str,
    y_key: str,
) -> np.ndarray:
    return np.asarray(
        [[float(record.get(x_key, 0.0)), float(record.get(y_key, 0.0))] for record in frame_data],
        dtype=float,
    )
