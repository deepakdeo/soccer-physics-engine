"""Transition and defensive recovery metrics."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

import numpy as np


def detect_possession_transitions(
    possession_teams: Sequence[str],
    timestamps_s: Sequence[float],
) -> list[dict[str, Any]]:
    """Detect possession changes across an ordered timeline."""
    if len(possession_teams) != len(timestamps_s):
        raise ValueError("possession_teams and timestamps_s must have the same length.")

    transitions: list[dict[str, Any]] = []
    for index in range(1, len(possession_teams)):
        previous_team = possession_teams[index - 1]
        current_team = possession_teams[index]
        if current_team == previous_team:
            continue
        transitions.append(
            {
                "index": index,
                "timestamp": float(timestamps_s[index]),
                "from_team": previous_team,
                "to_team": current_team,
            }
        )
    return transitions


def compute_transition_speed(
    players_ahead_of_ball: Sequence[int],
    dt: float = 0.04,
    required_players: int = 3,
) -> float:
    """Compute time needed to get a target number of players ahead of the ball."""
    if dt <= 0:
        raise ValueError("dt must be positive.")
    if required_players < 1:
        raise ValueError("required_players must be at least 1.")

    player_counts = np.asarray(players_ahead_of_ball, dtype=int)
    success_indices = np.flatnonzero(player_counts >= required_players)
    if success_indices.size == 0:
        return float("inf")
    return float(success_indices[0] * dt)


def compute_defensive_shape_recovery_time(
    compactness_series: Sequence[float],
    target_compactness: float,
    dt: float = 0.04,
) -> float:
    """Compute time to recover a compact defensive shape after losing possession."""
    if dt <= 0:
        raise ValueError("dt must be positive.")
    if target_compactness < 0:
        raise ValueError("target_compactness must be non-negative.")

    compactness = np.asarray(compactness_series, dtype=float)
    recovery_indices = np.flatnonzero(compactness <= target_compactness)
    if recovery_indices.size == 0:
        return float("inf")
    return float(recovery_indices[0] * dt)
