"""Tests for kinematic computations."""

from __future__ import annotations

import numpy as np
from src.physics.kinematics import (
    compute_acceleration,
    compute_kinematic_profiles,
    compute_speed,
    compute_velocity,
)


def test_constant_position_yields_zero_velocity_and_acceleration() -> None:
    positions = np.zeros((6, 2), dtype=float)

    velocity = compute_velocity(positions, dt=1.0)
    acceleration = compute_acceleration(velocity, dt=1.0)

    assert np.allclose(velocity, 0.0)
    assert np.allclose(acceleration, 0.0)


def test_constant_velocity_yields_zero_acceleration() -> None:
    positions = np.array([0.0, 1.0, 2.0, 3.0, 4.0])

    velocity = compute_velocity(positions, dt=1.0)
    acceleration = compute_acceleration(velocity, dt=1.0)

    assert np.allclose(velocity, 1.0)
    assert np.allclose(acceleration, 0.0)


def test_linear_motion_velocity_matches_expected_difference() -> None:
    positions = np.array([0.0, 1.0, 2.0, 3.0, 4.0])

    velocity = compute_velocity(positions, dt=1.0)

    assert np.allclose(velocity, np.ones_like(positions))


def test_compute_speed_returns_vector_magnitudes() -> None:
    velocity = np.array([[3.0, 4.0], [5.0, 12.0]])

    speed = compute_speed(velocity)

    assert np.allclose(speed, np.array([5.0, 13.0]))


def test_compute_kinematic_profiles_runs_full_pipeline(
    linear_xy_positions: tuple[np.ndarray, np.ndarray],
) -> None:
    x, y = linear_xy_positions

    profiles = compute_kinematic_profiles(x, y, fps=25)

    assert set(profiles) == {"positions", "velocity", "acceleration", "jerk", "speed"}
    assert profiles["positions"].shape == (5, 2)
    assert profiles["velocity"].shape == (5, 2)
    assert profiles["speed"].shape == (5,)
