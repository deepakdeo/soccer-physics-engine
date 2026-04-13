"""Tests for team-shape metrics."""

from __future__ import annotations

import numpy as np
from src.tactical.team_shape import (
    compute_defensive_line_height,
    compute_inter_line_distance,
    compute_team_compactness,
    compute_team_depth,
    compute_team_width,
    summarize_team_shape,
)


def test_team_width_and_depth_match_extents() -> None:
    positions = np.array(
        [
            [10.0, 10.0],
            [15.0, 22.0],
            [20.0, 38.0],
            [25.0, 54.0],
        ]
    )

    assert compute_team_width(positions) == 44.0
    assert compute_team_depth(positions) == 15.0


def test_team_compactness_returns_convex_hull_area() -> None:
    positions = np.array(
        [
            [0.0, 0.0],
            [0.0, 10.0],
            [10.0, 0.0],
            [10.0, 10.0],
        ]
    )

    compactness = compute_team_compactness(positions)

    assert np.isclose(compactness, 100.0)


def test_defensive_line_height_uses_deepest_players() -> None:
    positions = np.array(
        [
            [12.0, 10.0],
            [14.0, 22.0],
            [16.0, 34.0],
            [18.0, 46.0],
            [35.0, 20.0],
            [38.0, 34.0],
        ]
    )

    line_height = compute_defensive_line_height(positions, defending_goal_x=0.0, line_size=4)

    assert line_height == 15.0


def test_inter_line_distance_measures_gap_between_defense_and_midfield() -> None:
    positions = np.array(
        [
            [10.0, 8.0],
            [12.0, 22.0],
            [11.0, 44.0],
            [13.0, 58.0],
            [30.0, 16.0],
            [31.0, 34.0],
            [29.0, 52.0],
            [50.0, 12.0],
            [52.0, 34.0],
            [49.0, 56.0],
        ]
    )

    distance = compute_inter_line_distance(positions, defending_goal_x=0.0)

    assert np.isclose(distance, 18.5)


def test_summarize_team_shape_returns_all_core_metrics() -> None:
    positions = np.array(
        [
            [10.0, 8.0],
            [12.0, 22.0],
            [11.0, 44.0],
            [13.0, 58.0],
            [30.0, 16.0],
            [31.0, 34.0],
            [29.0, 52.0],
            [50.0, 12.0],
            [52.0, 34.0],
            [49.0, 56.0],
        ]
    )

    summary = summarize_team_shape(positions, defending_goal_x=0.0)

    assert set(summary) == {
        "compactness",
        "width",
        "depth",
        "defensive_line_height",
        "inter_line_distance",
    }
    assert summary["width"] == 50.0
    assert summary["depth"] == 42.0
