"""Tests for additional Phase 3 tactical modules."""

from __future__ import annotations

import numpy as np
from src.tactical.dangerous_possessions import identify_dangerous_possessions
from src.tactical.overloads import detect_overload_zones
from src.tactical.territorial import compute_ball_territory, extract_possession_chains
from src.tactical.vulnerability import (
    detect_defensive_gaps,
    detect_exposed_flanks,
    find_unmarked_runners,
)


def test_compute_ball_territory_splits_ball_time_across_thirds() -> None:
    ball_positions = np.array(
        [
            [10.0, 34.0],
            [20.0, 34.0],
            [50.0, 34.0],
            [90.0, 34.0],
        ]
    )

    territory = compute_ball_territory(ball_positions)

    assert territory["defensive_third"] == 0.5
    assert territory["middle_third"] == 0.25
    assert territory["attacking_third"] == 0.25


def test_extract_possession_chains_groups_adjacent_same_team_events() -> None:
    events = [
        {"timestamp": 1.0, "team": "home", "event_type": "pass", "x": 10.0, "y": 30.0},
        {"timestamp": 2.0, "team": "home", "event_type": "carry", "x": 14.0, "y": 32.0},
        {"timestamp": 3.0, "team": "away", "event_type": "tackle", "x": 18.0, "y": 34.0},
    ]

    chains = extract_possession_chains(events)

    assert len(chains) == 2
    assert chains[0]["team"] == "home"
    assert chains[0]["event_count"] == 2
    assert chains[1]["team"] == "away"


def test_detect_overload_zones_flags_numerical_superiority() -> None:
    home_positions = np.array([[10.0, 10.0], [12.0, 12.0], [14.0, 14.0], [16.0, 16.0]])
    away_positions = np.array([[80.0, 50.0]])

    overloads = detect_overload_zones(home_positions, away_positions, x_bins=3, y_bins=2)

    assert any(zone["advantaged_team"] == "home" for zone in overloads)


def test_detect_defensive_gaps_finds_large_lateral_spacing() -> None:
    defenders = np.array([[20.0, 8.0], [21.0, 22.0], [22.0, 45.0], [20.0, 58.0]])

    gaps = detect_defensive_gaps(defenders, gap_threshold=15.0)

    assert gaps == [(1, 2, 23.0)]


def test_detect_exposed_flanks_reports_open_wings() -> None:
    defenders = np.array([[20.0, 18.0], [22.0, 28.0], [21.0, 38.0], [20.0, 50.0]])

    flanks = detect_exposed_flanks(defenders, flank_margin=10.0)

    assert flanks["left_exposed"] is True
    assert flanks["right_exposed"] is True


def test_find_unmarked_runners_identifies_attackers_without_nearby_defenders() -> None:
    attackers = np.array([[40.0, 20.0], [50.0, 34.0], [60.0, 50.0]])
    defenders = np.array([[41.0, 21.0], [49.0, 35.0]])

    unmarked = find_unmarked_runners(attackers, defenders, marking_radius=3.0)

    assert unmarked == [2]


def test_identify_dangerous_possessions_filters_penalty_box_entries_and_shots() -> None:
    possessions = [
        {"team": "home", "end_x": 92.0, "end_y": 34.0, "shot": False},
        {"team": "home", "end_x": 60.0, "end_y": 20.0, "shot": True},
        {"team": "away", "end_x": 40.0, "end_y": 34.0, "shot": False},
    ]

    dangerous = identify_dangerous_possessions(possessions)

    assert len(dangerous) == 2
    assert dangerous[0]["danger_reason"] == "penalty_area_entry"
    assert dangerous[1]["danger_reason"] == "shot"
