"""Team-shape metrics derived from player positions."""

from __future__ import annotations

import numpy as np
from scipy.spatial import ConvexHull


def compute_team_compactness(player_positions: np.ndarray) -> float:
    """Compute team compactness as the convex hull area of the player shape."""
    positions = _as_positions(player_positions)
    if positions.shape[0] < 3:
        return 0.0

    try:
        hull = ConvexHull(positions)
    except Exception:
        return 0.0
    return float(hull.volume)


def compute_team_width(player_positions: np.ndarray) -> float:
    """Compute team width as the max minus min y-coordinate."""
    positions = _as_positions(player_positions)
    return float(np.max(positions[:, 1]) - np.min(positions[:, 1]))


def compute_team_depth(player_positions: np.ndarray) -> float:
    """Compute team depth as the max minus min x-coordinate."""
    positions = _as_positions(player_positions)
    return float(np.max(positions[:, 0]) - np.min(positions[:, 0]))


def compute_defensive_line_height(
    player_positions: np.ndarray,
    defending_goal_x: float = 0.0,
    line_size: int = 4,
) -> float:
    """Estimate defensive line height from the deepest players.

    Args:
        player_positions: Player positions with shape `(n_players, 2)`.
        defending_goal_x: X-coordinate of the team’s own goal line.
        line_size: Number of deepest players to average.

    Returns:
        Mean x-coordinate of the defensive line.
    """
    positions = _as_positions(player_positions)
    if line_size < 1:
        raise ValueError("line_size must be at least 1.")

    x_positions = positions[:, 0]
    if defending_goal_x <= np.mean(x_positions):
        defensive_indices = np.argsort(x_positions)[: min(line_size, positions.shape[0])]
    else:
        defensive_indices = np.argsort(x_positions)[-min(line_size, positions.shape[0]) :]
    return float(np.mean(x_positions[defensive_indices]))


def compute_inter_line_distance(
    player_positions: np.ndarray,
    defending_goal_x: float = 0.0,
) -> float:
    """Compute the distance between defensive and midfield centroids."""
    positions = _as_positions(player_positions)
    if positions.shape[0] < 7:
        return 0.0

    ordered = _order_positions_by_defensive_depth(positions, defending_goal_x)
    defensive_group = ordered[:4]
    midfield_group = ordered[4:7]
    return float(abs(np.mean(midfield_group[:, 0]) - np.mean(defensive_group[:, 0])))


def summarize_team_shape(
    player_positions: np.ndarray,
    defending_goal_x: float = 0.0,
) -> dict[str, float]:
    """Compute the core Phase 3 team-shape metrics in one call."""
    positions = _as_positions(player_positions)
    return {
        "compactness": compute_team_compactness(positions),
        "width": compute_team_width(positions),
        "depth": compute_team_depth(positions),
        "defensive_line_height": compute_defensive_line_height(
            positions,
            defending_goal_x=defending_goal_x,
        ),
        "inter_line_distance": compute_inter_line_distance(
            positions,
            defending_goal_x=defending_goal_x,
        ),
    }


def _order_positions_by_defensive_depth(
    positions: np.ndarray,
    defending_goal_x: float,
) -> np.ndarray:
    if defending_goal_x <= np.mean(positions[:, 0]):
        ordering = np.argsort(positions[:, 0])
    else:
        ordering = np.argsort(-positions[:, 0])
    return positions[ordering]


def _as_positions(values: np.ndarray) -> np.ndarray:
    positions = np.asarray(values, dtype=float)
    if positions.ndim != 2 or positions.shape[1] != 2:
        raise ValueError("player_positions must have shape (n_players, 2).")
    if positions.shape[0] == 0:
        raise ValueError("player_positions cannot be empty.")
    return positions
