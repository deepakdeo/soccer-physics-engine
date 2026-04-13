"""Sprint-profile summaries."""

from __future__ import annotations

import numpy as np


def compute_sprint_profiles(
    speed_series: np.ndarray,
    dt: float,
    sprint_threshold_ms: float = 5.5,
) -> dict[str, float]:
    """Compute a simple sprint profile from a speed time series."""
    if dt <= 0:
        raise ValueError("dt must be positive.")
    speeds = np.asarray(speed_series, dtype=float)
    max_speed = float(np.max(speeds))
    max_index = int(np.argmax(speeds))
    sprint_mask = speeds >= sprint_threshold_ms
    sprint_starts = np.flatnonzero(sprint_mask)
    first_sprint_index = int(sprint_starts[0]) if sprint_starts.size > 0 else max_index
    time_to_max = max(0.0, (max_index - first_sprint_index) * dt)
    decel_from_max = (
        0.0 if max_index == len(speeds) - 1 else float(max_speed - np.min(speeds[max_index:]))
    )
    return {
        "max_speed": max_speed,
        "time_to_max_speed_s": time_to_max,
        "deceleration_from_max": decel_from_max,
    }
