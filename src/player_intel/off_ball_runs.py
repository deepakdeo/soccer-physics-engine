"""Off-ball run classification helpers."""

from __future__ import annotations

import numpy as np


def classify_off_ball_run(
    start_position: np.ndarray,
    end_position: np.ndarray,
    attacking_direction: str = "positive",
) -> str:
    """Classify one off-ball run from its displacement vector."""
    direction = attacking_direction.lower()
    if direction not in {"positive", "negative"}:
        raise ValueError("attacking_direction must be 'positive' or 'negative'.")

    start = _as_point(start_position, "start_position")
    end = _as_point(end_position, "end_position")
    displacement = end - start
    forward_delta = float(displacement[0] if direction == "positive" else -displacement[0])
    lateral_delta = float(displacement[1])

    if forward_delta <= -4.0:
        return "dropping"
    if forward_delta >= 6.0 and abs(lateral_delta) <= 3.0:
        return "stretching"
    if forward_delta >= 4.0 and lateral_delta >= 4.0:
        return "overlap"
    if forward_delta >= 4.0 and lateral_delta <= -4.0:
        return "underlap"
    if abs(forward_delta) >= 4.0 and abs(lateral_delta) >= 4.0:
        return "diagonal"
    return "support"


def classify_off_ball_run_sequence(
    positions: np.ndarray,
    attacking_direction: str = "positive",
) -> str:
    """Classify an off-ball run from a sequence of positions."""
    sequence = np.asarray(positions, dtype=float)
    if sequence.ndim != 2 or sequence.shape[1] != 2:
        raise ValueError("positions must have shape (n_frames, 2).")
    if sequence.shape[0] < 2:
        raise ValueError("positions must contain at least two samples.")
    return classify_off_ball_run(sequence[0], sequence[-1], attacking_direction=attacking_direction)


def _as_point(values: np.ndarray, label: str) -> np.ndarray:
    point = np.asarray(values, dtype=float)
    if point.shape != (2,):
        raise ValueError(f"{label} must have shape (2,).")
    return point
