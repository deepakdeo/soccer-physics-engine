"""Kinematic computations for player trajectories."""

from __future__ import annotations

from typing import Any

import numpy as np

from src.physics.smoothing import smooth_positions


def compute_velocity(positions: np.ndarray, dt: float) -> np.ndarray:
    """Compute velocity from position samples with finite differences.

    Args:
        positions: One-dimensional or two-dimensional position samples ordered by time.
        dt: Sample period in seconds.

    Returns:
        Velocity samples with the same shape as `positions`.
    """
    if dt <= 0:
        raise ValueError("dt must be positive.")
    position_array = _as_float_array(positions)
    return np.asarray(np.gradient(position_array, dt, axis=0), dtype=float)


def compute_acceleration(velocity: np.ndarray, dt: float) -> np.ndarray:
    """Compute acceleration as the first derivative of velocity.

    Args:
        velocity: Velocity samples ordered by time.
        dt: Sample period in seconds.

    Returns:
        Acceleration samples with the same shape as `velocity`.
    """
    if dt <= 0:
        raise ValueError("dt must be positive.")
    velocity_array = _as_float_array(velocity)
    return np.asarray(np.gradient(velocity_array, dt, axis=0), dtype=float)


def compute_jerk(acceleration: np.ndarray, dt: float) -> np.ndarray:
    """Compute jerk as the first derivative of acceleration.

    Args:
        acceleration: Acceleration samples ordered by time.
        dt: Sample period in seconds.

    Returns:
        Jerk samples with the same shape as `acceleration`.
    """
    if dt <= 0:
        raise ValueError("dt must be positive.")
    acceleration_array = _as_float_array(acceleration)
    return np.asarray(np.gradient(acceleration_array, dt, axis=0), dtype=float)


def compute_speed(velocity: np.ndarray) -> np.ndarray:
    """Compute scalar speed from velocity vectors.

    Args:
        velocity: Velocity samples with shape `(n_frames,)` or `(n_frames, n_dims)`.

    Returns:
        Scalar speed for each frame.
    """
    velocity_array = _as_float_array(velocity)
    if velocity_array.ndim == 1:
        return np.asarray(np.abs(velocity_array), dtype=float)
    return np.asarray(np.linalg.norm(velocity_array, axis=1), dtype=float)


def compute_kinematic_profiles(
    x: np.ndarray, y: np.ndarray, fps: int = 25
) -> dict[str, np.ndarray]:
    """Build smoothed kinematic profiles from planar coordinates.

    The pipeline follows the project rules: smooth positions first, then derive
    velocity, acceleration, and jerk from the immediately preceding signal.

    Args:
        x: X-coordinate samples in meters.
        y: Y-coordinate samples in meters.
        fps: Tracking frame rate in frames per second.

    Returns:
        Dictionary containing smoothed positions and derived kinematic arrays.
    """
    if fps <= 0:
        raise ValueError("fps must be positive.")
    x_array = _as_float_array(x)
    y_array = _as_float_array(y)
    if x_array.shape != y_array.shape:
        raise ValueError("x and y must have the same shape.")

    positions = np.column_stack((x_array, y_array))
    smoothed_positions = smooth_positions(positions)
    dt = 1.0 / fps
    velocity = compute_velocity(smoothed_positions, dt)
    acceleration = compute_acceleration(velocity, dt)
    jerk = compute_jerk(acceleration, dt)
    speed = compute_speed(velocity)
    return {
        "positions": smoothed_positions,
        "velocity": velocity,
        "acceleration": acceleration,
        "jerk": jerk,
        "speed": speed,
    }


def _as_float_array(values: np.ndarray | list[float] | tuple[float, ...] | Any) -> np.ndarray:
    array = np.asarray(values, dtype=float)
    if array.ndim == 0:
        raise ValueError("Expected at least one sample.")
    return array
