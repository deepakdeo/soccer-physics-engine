"""Spatial helper functions for tactical features."""

from __future__ import annotations

import numpy as np


def compute_pressure(
    player_pos: np.ndarray,
    opponent_positions: np.ndarray,
    radius: float = 5.0,
) -> float:
    """Count opponents applying local pressure inside a radius.

    Args:
        player_pos: Target player position with shape `(2,)`.
        opponent_positions: Opponent positions with shape `(n_opponents, 2)`.
        radius: Pressure radius in meters.

    Returns:
        Number of opponents within `radius`.
    """
    if radius < 0:
        raise ValueError("radius must be non-negative.")
    player = np.asarray(player_pos, dtype=float)
    opponents = np.asarray(opponent_positions, dtype=float)
    if opponents.size == 0:
        return 0.0
    distances = np.linalg.norm(opponents - player, axis=1)
    return float(np.count_nonzero(distances <= radius))


def compute_nearest_teammates(
    player_pos: np.ndarray,
    team_positions: np.ndarray,
    k: int = 3,
) -> np.ndarray:
    """Return distances to the nearest teammates.

    Args:
        player_pos: Target player position with shape `(2,)`.
        team_positions: Team positions with shape `(n_teammates, 2)`.
        k: Number of nearest teammates to return.

    Returns:
        Sorted distances to the nearest `k` teammates, excluding zero-distance
        self matches when present.
    """
    if k < 1:
        raise ValueError("k must be at least 1.")
    player = np.asarray(player_pos, dtype=float)
    teammates = np.asarray(team_positions, dtype=float)
    if teammates.size == 0:
        return np.array([], dtype=float)

    distances = np.linalg.norm(teammates - player, axis=1)
    non_self_distances = distances[distances > 0.0]
    if non_self_distances.size == 0:
        return np.array([], dtype=float)
    return np.asarray(np.sort(non_self_distances)[:k], dtype=float)


def compute_distance_matrix(positions: np.ndarray) -> np.ndarray:
    """Compute a pairwise Euclidean distance matrix.

    Args:
        positions: Positions with shape `(n_points, n_dims)`.

    Returns:
        Matrix of pairwise distances with shape `(n_points, n_points)`.
    """
    position_array = np.asarray(positions, dtype=float)
    if position_array.ndim != 2:
        raise ValueError("positions must be a 2D array.")
    deltas = position_array[:, None, :] - position_array[None, :, :]
    return np.asarray(np.linalg.norm(deltas, axis=2), dtype=float)
