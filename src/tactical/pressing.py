"""Pressing and counter-pressing metrics."""

from __future__ import annotations

from collections.abc import Sequence

import numpy as np


def compute_ppda(opponent_passes: int, defensive_actions: int) -> float:
    """Compute passes allowed per defensive action."""
    if opponent_passes < 0 or defensive_actions < 0:
        raise ValueError("opponent_passes and defensive_actions must be non-negative.")
    if defensive_actions == 0:
        return float("inf")
    return float(opponent_passes / defensive_actions)


def detect_pressing_triggers(
    ball_carrier_distances: np.ndarray,
    closing_speeds: np.ndarray,
    distance_threshold: float = 10.0,
    closing_speed_threshold: float = 1.0,
    min_pressers: int = 3,
) -> np.ndarray:
    """Detect frames where coordinated pressure is triggered.

    Args:
        ball_carrier_distances: Distances from defenders to the ball carrier with
            shape `(n_frames, n_players)`.
        closing_speeds: Closing speeds toward the ball carrier with the same shape.
        distance_threshold: Maximum distance to count as an active presser.
        closing_speed_threshold: Minimum closing speed to count as a pressing action.
        min_pressers: Minimum number of simultaneous pressers required.

    Returns:
        Boolean array of length `n_frames` marking pressing-trigger frames.
    """
    if min_pressers < 1:
        raise ValueError("min_pressers must be at least 1.")
    distances = _as_matrix(ball_carrier_distances, "ball_carrier_distances")
    speeds = _as_matrix(closing_speeds, "closing_speeds")
    if distances.shape != speeds.shape:
        raise ValueError("ball_carrier_distances and closing_speeds must have the same shape.")

    active_pressers = (distances <= distance_threshold) & (speeds >= closing_speed_threshold)
    return np.asarray(np.sum(active_pressers, axis=1) >= min_pressers, dtype=bool)


def compute_counter_press_speed(
    seconds_to_pressure: Sequence[float],
    max_window_s: float = 5.0,
) -> float:
    """Compute mean time to reapply pressure after a turnover."""
    if max_window_s <= 0:
        raise ValueError("max_window_s must be positive.")
    pressure_times = np.asarray(seconds_to_pressure, dtype=float)
    if pressure_times.size == 0:
        return float("nan")
    valid_times = pressure_times[(pressure_times >= 0.0) & (pressure_times <= max_window_s)]
    if valid_times.size == 0:
        return float("nan")
    return float(np.mean(valid_times))


def compute_pressing_effectiveness(
    regain_times_s: Sequence[float | None],
    window_s: float = 5.0,
) -> float:
    """Compute share of presses that regain the ball inside a time window."""
    if window_s <= 0:
        raise ValueError("window_s must be positive.")
    if len(regain_times_s) == 0:
        return 0.0

    successful_regains = 0
    for regain_time in regain_times_s:
        if regain_time is None:
            continue
        if 0.0 <= float(regain_time) <= window_s:
            successful_regains += 1
    return float(successful_regains / len(regain_times_s))


def _as_matrix(values: np.ndarray, label: str) -> np.ndarray:
    matrix = np.asarray(values, dtype=float)
    if matrix.ndim != 2:
        raise ValueError(f"{label} must have shape (n_frames, n_players).")
    return matrix
