"""Tests for spatial helper functions."""

from __future__ import annotations

import numpy as np
from src.physics.spatial import (
    compute_distance_matrix,
    compute_nearest_teammates,
    compute_pressure,
)


def test_pressure_counts_opponents_within_radius() -> None:
    player_pos = np.array([10.0, 10.0])
    opponents = np.array([[12.0, 10.0], [14.0, 13.0], [25.0, 25.0]])

    pressure = compute_pressure(player_pos, opponents, radius=5.0)

    assert pressure == 2.0


def test_nearest_teammates_returns_hand_computed_distances() -> None:
    player_pos = np.array([0.0, 0.0])
    teammates = np.array([[0.0, 0.0], [3.0, 4.0], [6.0, 8.0], [5.0, 0.0]])

    nearest = compute_nearest_teammates(player_pos, teammates, k=2)

    assert np.allclose(nearest, np.array([5.0, 5.0]))


def test_distance_matrix_returns_pairwise_distances() -> None:
    positions = np.array([[0.0, 0.0], [3.0, 4.0], [6.0, 8.0]])

    distances = compute_distance_matrix(positions)

    expected = np.array([[0.0, 5.0, 10.0], [5.0, 0.0, 5.0], [10.0, 5.0, 0.0]])
    assert np.allclose(distances, expected)
