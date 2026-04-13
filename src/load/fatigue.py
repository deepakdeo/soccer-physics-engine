"""Within-match fatigue summaries."""

from __future__ import annotations

import numpy as np


def compute_fatigue_curve(
    speed_series: np.ndarray,
    acceleration_series: np.ndarray,
    window_size: int,
    speed_threshold_ms: float = 5.5,
    acceleration_threshold_ms2: float = 2.5,
) -> list[dict[str, float]]:
    """Compute simple fatigue features across rolling windows."""
    if window_size < 1:
        raise ValueError("window_size must be at least 1.")
    speeds = np.asarray(speed_series, dtype=float)
    accelerations = np.asarray(acceleration_series, dtype=float)
    if speeds.shape != accelerations.shape:
        raise ValueError("speed_series and acceleration_series must have the same shape.")

    windows: list[dict[str, float]] = []
    for start in range(0, len(speeds), window_size):
        end = min(start + window_size, len(speeds))
        if start == end:
            continue
        window_speeds = speeds[start:end]
        window_accelerations = accelerations[start:end]
        windows.append(
            {
                "window_start": float(start),
                "window_end": float(end),
                "mean_speed": float(np.mean(window_speeds)),
                "high_intensity_fraction": float(np.mean(window_speeds >= speed_threshold_ms)),
                "accel_event_rate": float(
                    np.mean(np.abs(window_accelerations) >= acceleration_threshold_ms2)
                ),
            }
        )
    return windows
