"""Work-rate splits by possession state."""

from __future__ import annotations

import numpy as np


def compute_work_rate_by_possession(
    speed_series: np.ndarray,
    possession_flags: np.ndarray,
    dt: float,
) -> dict[str, float]:
    """Compute distance-per-minute in and out of possession."""
    if dt <= 0:
        raise ValueError("dt must be positive.")
    speeds = np.asarray(speed_series, dtype=float)
    possession = np.asarray(possession_flags, dtype=bool)
    if speeds.shape[0] != possession.shape[0]:
        raise ValueError("speed_series and possession_flags must have the same length.")

    in_distance = float(np.sum(speeds[possession]) * dt)
    out_distance = float(np.sum(speeds[~possession]) * dt)
    in_minutes = max(float(np.sum(possession) * dt / 60.0), 1e-6)
    out_minutes = max(float(np.sum(~possession) * dt / 60.0), 1e-6)
    return {
        "in_possession_distance_per_min": in_distance / in_minutes,
        "out_of_possession_distance_per_min": out_distance / out_minutes,
    }
