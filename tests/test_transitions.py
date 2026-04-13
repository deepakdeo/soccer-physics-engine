"""Tests for transition metrics."""

from __future__ import annotations

import numpy as np
from src.tactical.transitions import (
    compute_defensive_shape_recovery_time,
    compute_transition_speed,
    detect_possession_transitions,
)


def test_detect_possession_transitions_finds_team_changes() -> None:
    transitions = detect_possession_transitions(
        possession_teams=["home", "home", "away", "away", "home"],
        timestamps_s=[0.0, 0.04, 0.08, 0.12, 0.16],
    )

    assert transitions == [
        {"index": 2, "timestamp": 0.08, "from_team": "home", "to_team": "away"},
        {"index": 4, "timestamp": 0.16, "from_team": "away", "to_team": "home"},
    ]


def test_compute_transition_speed_returns_time_to_numbers_ahead() -> None:
    speed = compute_transition_speed([0, 1, 2, 3, 4], dt=0.5, required_players=3)

    assert speed == 1.5


def test_compute_defensive_shape_recovery_time_returns_first_recovery_point() -> None:
    recovery_time = compute_defensive_shape_recovery_time(
        compactness_series=[900.0, 820.0, 700.0, 640.0],
        target_compactness=700.0,
        dt=0.5,
    )

    assert np.isclose(recovery_time, 1.0)
