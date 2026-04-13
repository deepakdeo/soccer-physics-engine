"""Tests for pitch control models."""

from __future__ import annotations

import numpy as np
from src.physics.pitch_control import (
    compute_pitch_control,
    compute_player_influence,
    compute_team_pitch_control_pct,
    compute_zone_control,
)
from src.utils.constants import PITCH_LENGTH_M, PITCH_WIDTH_M


def test_player_influence_favors_targets_in_current_direction() -> None:
    player_pos = np.array([20.0, 34.0])
    player_vel = np.array([3.0, 0.0])
    targets = np.array([[30.0, 34.0], [10.0, 34.0]])

    arrival_times = compute_player_influence(player_pos, player_vel, targets)

    assert arrival_times[0] < arrival_times[1]


def test_pitch_control_reflects_reasonable_team_influence_regions() -> None:
    home_positions = np.array([[20.0, 34.0]])
    home_velocities = np.array([[0.0, 0.0]])
    away_positions = np.array([[85.0, 34.0]])
    away_velocities = np.array([[0.0, 0.0]])

    control_grid = compute_pitch_control(
        home_positions,
        home_velocities,
        away_positions,
        away_velocities,
        grid_resolution=25,
    )

    assert control_grid[:, 0].mean() > 0.9
    assert control_grid[:, -1].mean() < 0.1


def test_team_pitch_control_percentages_sum_to_one_with_complement() -> None:
    home_positions = np.array([[25.0, 34.0], [35.0, 24.0]])
    home_velocities = np.zeros((2, 2))
    away_positions = np.array([[80.0, 34.0], [70.0, 44.0]])
    away_velocities = np.zeros((2, 2))

    control_grid = compute_pitch_control(
        home_positions,
        home_velocities,
        away_positions,
        away_velocities,
        grid_resolution=20,
    )
    home_pct = compute_team_pitch_control_pct(control_grid)
    away_pct = float(np.mean(1.0 - control_grid))

    assert np.isclose(home_pct + away_pct, 1.0, atol=1e-6)


def test_zone_control_returns_named_zone_percentages() -> None:
    home_positions = np.array([[15.0, 34.0]])
    home_velocities = np.zeros((1, 2))
    away_positions = np.array([[95.0, 34.0]])
    away_velocities = np.zeros((1, 2))

    control_grid = compute_pitch_control(
        home_positions,
        home_velocities,
        away_positions,
        away_velocities,
        grid_resolution=30,
    )
    zones = [
        ("defensive_third", 0.0, PITCH_LENGTH_M / 3.0, 0.0, PITCH_WIDTH_M),
        ("middle_third", PITCH_LENGTH_M / 3.0, 2.0 * PITCH_LENGTH_M / 3.0, 0.0, PITCH_WIDTH_M),
        ("attacking_third", 2.0 * PITCH_LENGTH_M / 3.0, PITCH_LENGTH_M, 0.0, PITCH_WIDTH_M),
    ]

    zone_control = compute_zone_control(control_grid, zones)

    assert set(zone_control) == {"defensive_third", "middle_third", "attacking_third"}
    assert zone_control["defensive_third"] > zone_control["middle_third"]
    assert zone_control["middle_third"] > zone_control["attacking_third"]
