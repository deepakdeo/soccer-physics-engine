"""Directional deceleration asymmetry metrics."""

from __future__ import annotations

import numpy as np


def compute_directional_deceleration_asymmetry(
    velocity_vectors: np.ndarray,
    acceleration_series: np.ndarray,
    deceleration_threshold_ms2: float = -2.5,
) -> dict[str, float]:
    """Compare leftward and rightward deceleration load."""
    velocities = np.asarray(velocity_vectors, dtype=float)
    accelerations = np.asarray(acceleration_series, dtype=float)
    if velocities.ndim != 2 or velocities.shape[1] != 2:
        raise ValueError("velocity_vectors must have shape (n_frames, 2).")
    if accelerations.shape[0] != velocities.shape[0]:
        raise ValueError("acceleration_series length must match velocity_vectors.")

    left_mask = (velocities[:, 1] < 0.0) & (accelerations <= deceleration_threshold_ms2)
    right_mask = (velocities[:, 1] > 0.0) & (accelerations <= deceleration_threshold_ms2)
    left_load = float(np.sum(np.abs(accelerations[left_mask])))
    right_load = float(np.sum(np.abs(accelerations[right_mask])))
    denominator = max(left_load + right_load, 1e-6)
    return {
        "left_load": left_load,
        "right_load": right_load,
        "asymmetry_ratio": abs(left_load - right_load) / denominator,
    }
