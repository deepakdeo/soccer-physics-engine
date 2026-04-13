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


@pytest.fixture
def recommendation_frame() -> list[dict[str, float | str | bool]]:
    """Create a frame with a few off-ball recommendation options."""
    return [
        {
            "player_id": "home_1",
            "team": "home",
            "x": 40.0,
            "y": 34.0,
            "vx": 0.8,
            "vy": 0.0,
            "ax": 0.0,
            "ay": 0.0,
            "has_ball": True,
        },
        {
            "player_id": "home_2",
            "team": "home",
            "x": 46.0,
            "y": 34.0,
            "vx": 0.4,
            "vy": 0.0,
            "ax": 0.0,
            "ay": 0.0,
            "has_ball": False,
        },
        {
            "player_id": "home_3",
            "team": "home",
            "x": 38.0,
            "y": 46.0,
            "vx": 0.3,
            "vy": -0.1,
            "ax": 0.0,
            "ay": 0.0,
            "has_ball": False,
        },
        {
            "player_id": "away_1",
            "team": "away",
            "x": 43.0,
            "y": 34.0,
            "vx": -0.5,
            "vy": 0.0,
            "ax": 0.0,
            "ay": 0.0,
            "has_ball": False,
        },
        {
            "player_id": "away_2",
            "team": "away",
            "x": 50.0,
            "y": 34.0,
            "vx": -0.4,
            "vy": 0.0,
            "ax": 0.0,
            "ay": 0.0,
            "has_ball": False,
        },
        {
            "player_id": "away_3",
            "team": "away",
            "x": 44.0,
            "y": 40.0,
            "vx": -0.2,
            "vy": -0.1,
            "ax": 0.0,
            "ay": 0.0,
            "has_ball": False,
        },
        {
            "player_id": "ball",
            "team": "ball",
            "x": 40.5,
            "y": 34.0,
            "vx": 3.0,
            "vy": 0.0,
            "ax": 0.0,
            "ay": 0.0,
            "has_ball": False,
        },
    ]


@pytest.fixture
def sequence_bank() -> dict[str, list[dict[str, float]]]:
    """Create short sequences for similarity-search tests."""
    return {
        "reference_like": [
            {
                "ball_x": 30.0,
                "ball_y": 30.0,
                "pitch_control_pct": 0.55,
                "pressure": 2.0,
                "state_score": 0.5,
            },
            {
                "ball_x": 36.0,
                "ball_y": 31.0,
                "pitch_control_pct": 0.58,
                "pressure": 1.8,
                "state_score": 0.56,
            },
            {
                "ball_x": 44.0,
                "ball_y": 32.0,
                "pitch_control_pct": 0.62,
                "pressure": 1.5,
                "state_score": 0.61,
            },
        ],
        "different": [
            {
                "ball_x": 10.0,
                "ball_y": 10.0,
                "pitch_control_pct": 0.20,
                "pressure": 4.0,
                "state_score": 0.2,
            },
            {
                "ball_x": 12.0,
                "ball_y": 12.0,
                "pitch_control_pct": 0.18,
                "pressure": 4.5,
                "state_score": 0.18,
            },
            {
                "ball_x": 14.0,
                "ball_y": 11.0,
                "pitch_control_pct": 0.16,
                "pressure": 4.8,
                "state_score": 0.15,
            },
        ],
    }
