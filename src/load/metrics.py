"""Core biomechanical load metrics."""

from __future__ import annotations

import numpy as np


def compute_high_intensity_distance(
    speed_series: np.ndarray,
    dt: float,
    threshold_ms: float = 5.5,
) -> float:
    """Integrate distance covered above a speed threshold."""
    if dt <= 0:
        raise ValueError("dt must be positive.")
    speeds = np.asarray(speed_series, dtype=float)
    high_intensity_speeds = speeds[speeds >= threshold_ms]
    return float(np.sum(high_intensity_speeds) * dt)


def count_sharp_deceleration_events(
    acceleration_series: np.ndarray,
    threshold_ms2: float = -3.0,
) -> int:
    """Count frames containing sharp deceleration events."""
    accelerations = np.asarray(acceleration_series, dtype=float)
    return int(np.count_nonzero(accelerations <= threshold_ms2))


def compute_change_of_direction_load(
    velocity_vectors: np.ndarray,
    dt: float,
) -> float:
    """Compute a simple change-of-direction load metric."""
    if dt <= 0:
        raise ValueError("dt must be positive.")
    velocities = np.asarray(velocity_vectors, dtype=float)
    if velocities.ndim != 2 or velocities.shape[1] != 2:
        raise ValueError("velocity_vectors must have shape (n_frames, 2).")
    if velocities.shape[0] < 2:
        return 0.0

    headings = np.unwrap(np.arctan2(velocities[:, 1], velocities[:, 0]))
    angular_velocity = np.gradient(headings, dt)
    speeds = np.linalg.norm(velocities, axis=1)
    return float(np.sum(np.abs(angular_velocity) * np.square(speeds)) * dt)
