"""Formation inference based on average positions."""

from __future__ import annotations

import numpy as np
from sklearn.cluster import KMeans

from src.utils.constants import PITCH_LENGTH_M


def compute_average_positions(position_frames: np.ndarray) -> np.ndarray:
    """Compute average player positions over a sequence of frames.

    Args:
        position_frames: Array with shape `(n_frames, n_players, 2)`.

    Returns:
        Array with shape `(n_players, 2)` containing average positions.
    """
    frames = np.asarray(position_frames, dtype=float)
    if frames.ndim != 3 or frames.shape[2] != 2:
        raise ValueError("position_frames must have shape (n_frames, n_players, 2).")
    return np.asarray(np.mean(frames, axis=0), dtype=float)


def infer_formation_lines(
    average_positions: np.ndarray,
    defending_goal_x: float = 0.0,
) -> tuple[int, ...]:
    """Infer formation line counts from average outfield player positions.

    Args:
        average_positions: Average player positions with shape `(n_players, 2)`.
        defending_goal_x: X-coordinate of the team’s own goal line.

    Returns:
        Tuple of player counts ordered from the defensive line to the attacking
        line.
    """
    positions = _as_positions(average_positions)
    if positions.shape[0] < 3:
        raise ValueError("At least three players are required to infer a formation.")

    if positions.shape[0] > 10:
        positions = _drop_goalkeeper_candidate(positions, defending_goal_x)

    x_values = positions[:, 0:1]
    model = KMeans(n_clusters=3, n_init=10, random_state=7)
    labels = model.fit_predict(x_values)
    cluster_centers = model.cluster_centers_.ravel()
    cluster_order = np.argsort(np.abs(cluster_centers - defending_goal_x))
    return tuple(int(np.sum(labels == cluster_index)) for cluster_index in cluster_order)


def detect_formation(
    average_positions: np.ndarray,
    defending_goal_x: float = 0.0,
) -> str:
    """Detect a formation label such as `4-3-3` from average positions."""
    line_counts = infer_formation_lines(average_positions, defending_goal_x=defending_goal_x)
    return "-".join(str(count) for count in line_counts)


def _drop_goalkeeper_candidate(positions: np.ndarray, defending_goal_x: float) -> np.ndarray:
    distances_to_goal = np.abs(positions[:, 0] - defending_goal_x)
    goalkeeper_index = int(np.argmin(distances_to_goal))
    return np.delete(positions, goalkeeper_index, axis=0)


def _as_positions(values: np.ndarray) -> np.ndarray:
    positions = np.asarray(values, dtype=float)
    if positions.ndim != 2 or positions.shape[1] != 2:
        raise ValueError("average_positions must have shape (n_players, 2).")
    if np.any((positions[:, 0] < 0.0) | (positions[:, 0] > PITCH_LENGTH_M)):
        raise ValueError("average_positions contain x coordinates outside the pitch.")
    return positions
