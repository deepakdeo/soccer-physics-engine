"""Shared pytest fixtures."""

from __future__ import annotations

import numpy as np
import pytest


@pytest.fixture
def linear_xy_positions() -> tuple[np.ndarray, np.ndarray]:
    """Create a simple linear trajectory in two dimensions."""
    x = np.array([0.0, 1.0, 2.0, 3.0, 4.0])
    y = np.array([0.0, 0.5, 1.0, 1.5, 2.0])
    return x, y


@pytest.fixture
def frame_records() -> list[dict[str, float | str | bool]]:
    """Create a small synthetic frame for graph and model tests."""
    return [
        {
            "player_id": "home_1",
            "team": "home",
            "x": 20.0,
            "y": 20.0,
            "vx": 1.0,
            "vy": 0.0,
            "ax": 0.1,
            "ay": 0.0,
            "has_ball": True,
        },
        {
            "player_id": "home_2",
            "team": "home",
            "x": 28.0,
            "y": 24.0,
            "vx": 0.5,
            "vy": 0.2,
            "ax": 0.0,
            "ay": 0.0,
            "has_ball": False,
        },
        {
            "player_id": "away_1",
            "team": "away",
            "x": 24.0,
            "y": 21.0,
            "vx": -0.5,
            "vy": 0.1,
            "ax": 0.0,
            "ay": 0.0,
            "has_ball": False,
        },
        {
            "player_id": "ball",
            "team": "ball",
            "x": 20.5,
            "y": 20.0,
            "vx": 3.0,
            "vy": 0.0,
            "ax": 0.0,
            "ay": 0.0,
            "has_ball": False,
        },
    ]


@pytest.fixture
def model_samples() -> list[dict[str, float]]:
    """Create simple samples for baseline model tests."""
    return [
        {
            "ball_x": 15.0,
            "ball_y": 20.0,
            "pitch_control_pct": 0.35,
            "pressure": 3.0,
            "safe_passing_lanes": 1.0,
            "support_distance": 18.0,
            "compactness": 1700.0,
        },
        {
            "ball_x": 35.0,
            "ball_y": 30.0,
            "pitch_control_pct": 0.48,
            "pressure": 2.0,
            "safe_passing_lanes": 2.0,
            "support_distance": 15.0,
            "compactness": 1450.0,
        },
        {
            "ball_x": 60.0,
            "ball_y": 34.0,
            "pitch_control_pct": 0.58,
            "pressure": 1.0,
            "safe_passing_lanes": 3.0,
            "support_distance": 11.0,
            "compactness": 1200.0,
        },
        {
            "ball_x": 82.0,
            "ball_y": 30.0,
            "pitch_control_pct": 0.72,
            "pressure": 1.0,
            "safe_passing_lanes": 4.0,
            "support_distance": 9.0,
            "compactness": 950.0,
        },
        {
            "ball_x": 88.0,
            "ball_y": 36.0,
            "pitch_control_pct": 0.78,
            "pressure": 0.0,
            "safe_passing_lanes": 5.0,
            "support_distance": 7.0,
            "compactness": 900.0,
        },
        {
            "ball_x": 92.0,
            "ball_y": 34.0,
            "pitch_control_pct": 0.84,
            "pressure": 0.0,
            "safe_passing_lanes": 5.0,
            "support_distance": 6.0,
            "compactness": 820.0,
        },
    ]


@pytest.fixture
def model_labels() -> list[int]:
    """Create binary labels for Phase 5 baseline tests."""
    return [0, 0, 0, 1, 1, 1]
