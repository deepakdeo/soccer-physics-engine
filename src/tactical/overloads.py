"""Overload detection across pitch zones."""

from __future__ import annotations

import numpy as np

from src.utils.constants import PITCH_LENGTH_M, PITCH_WIDTH_M


def detect_overload_zones(
    home_positions: np.ndarray,
    away_positions: np.ndarray,
    x_bins: int = 6,
    y_bins: int = 4,
    min_superiority: int = 2,
) -> list[dict[str, float | int | str]]:
    """Detect zones with clear numerical superiority for one team.

    Args:
        home_positions: Home player positions with shape `(n_home, 2)`.
        away_positions: Away player positions with shape `(n_away, 2)`.
        x_bins: Number of pitch bins along the length.
        y_bins: Number of pitch bins along the width.
        min_superiority: Minimum player-count edge required to flag an overload.

    Returns:
        List of overload zone summaries with grid indices and team advantage.
    """
    if x_bins < 1 or y_bins < 1:
        raise ValueError("x_bins and y_bins must be positive integers.")
    if min_superiority < 1:
        raise ValueError("min_superiority must be at least 1.")

    home = _as_positions(home_positions, "home_positions")
    away = _as_positions(away_positions, "away_positions")
    x_edges = np.linspace(0.0, PITCH_LENGTH_M, x_bins + 1)
    y_edges = np.linspace(0.0, PITCH_WIDTH_M, y_bins + 1)
    home_counts = _count_players_by_zone(home, x_edges, y_edges)
    away_counts = _count_players_by_zone(away, x_edges, y_edges)

    overloads: list[dict[str, float | int | str]] = []
    for y_index in range(y_bins):
        for x_index in range(x_bins):
            superiority = int(home_counts[y_index, x_index] - away_counts[y_index, x_index])
            if abs(superiority) < min_superiority:
                continue
            overloads.append(
                {
                    "x_bin": x_index,
                    "y_bin": y_index,
                    "home_count": int(home_counts[y_index, x_index]),
                    "away_count": int(away_counts[y_index, x_index]),
                    "superiority": superiority,
                    "advantaged_team": "home" if superiority > 0 else "away",
                }
            )

    return overloads


def _count_players_by_zone(
    positions: np.ndarray,
    x_edges: np.ndarray,
    y_edges: np.ndarray,
) -> np.ndarray:
    counts, _, _ = np.histogram2d(
        positions[:, 1],
        positions[:, 0],
        bins=(y_edges, x_edges),
    )
    return np.asarray(counts, dtype=int)


def _as_positions(values: np.ndarray, label: str) -> np.ndarray:
    positions = np.asarray(values, dtype=float)
    if positions.ndim != 2 or positions.shape[1] != 2:
        raise ValueError(f"{label} must have shape (n_players, 2).")
    return positions
