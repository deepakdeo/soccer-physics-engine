"""Tests for Phase 8 unified reports."""

from __future__ import annotations

import numpy as np
from src.unified.match_report import build_match_report
from src.unified.player_report import build_player_report
from src.unified.team_report import build_team_report


def test_build_player_report_returns_tactical_and_load_sections() -> None:
    report = build_player_report(
        player_id="p3",
        player_positions=np.array([[30.0, 20.0], [34.0, 24.0], [38.0, 28.0]]),
        speed_series=np.array([4.0, 6.0, 7.0]),
        acceleration_series=np.array([1.0, -3.2, -4.1]),
        velocity_vectors=np.array([[4.0, 0.0], [5.0, 1.0], [6.0, 2.0]]),
        possession_flags=np.array([True, False, False]),
        pass_events=[
            {"passer_id": "p1", "receiver_id": "p3", "start_x": 10.0, "end_x": 24.0},
            {"passer_id": "p3", "receiver_id": "p4", "start_x": 24.0, "end_x": 38.0},
            {"passer_id": "p3", "receiver_id": "p5", "start_x": 32.0, "end_x": 46.0},
        ],
        team_average_positions=np.array(
            [
                [10.0, 14.0],
                [22.0, 30.0],
                [38.0, 26.0],
                [58.0, 44.0],
                [80.0, 34.0],
            ]
        ),
        team_player_ids=["p1", "p2", "p3", "p4", "p5"],
        defender_positions_before=np.array([[31.0, 20.0], [32.0, 24.0]]),
        defender_positions_after=np.array([[36.0, 22.0], [38.0, 28.0]]),
        team_reference_metrics={
            "hi_distance": np.array([5.0, 7.0, 9.0, 11.0]),
            "decel_events": np.array([0.0, 1.0, 1.0, 2.0]),
            "cod_load": np.array([5.0, 6.0, 7.0, 8.0]),
        },
    )

    assert report["player_id"] == "p3"
    assert report["progressive_pass_count"] == 2
    assert report["role_detected"] in {
        "center_back",
        "full_back",
        "midfielder",
        "winger",
        "forward",
    }
    assert 0.0 <= report["tactical_value"] <= 1.0
    assert 0.0 <= report["experimental_movement_efficiency"] <= 1.0
    assert "load_flags" in report["load_profile"]


def test_build_match_report_returns_combined_match_sections() -> None:
    report = build_match_report(
        match_id="match_001",
        phase_frames=[
            {"ball_x": 20.0, "pressing_trigger": False},
            {"ball_x": 74.0, "attacking_pressure": 0.8},
        ],
        ball_positions=np.array([[20.0, 30.0], [55.0, 34.0], [90.0, 35.0]]),
        events=[
            {"team": "home", "timestamp": 1.0, "x": 20.0, "y": 30.0, "event_type": "pass"},
            {"team": "home", "timestamp": 3.0, "x": 88.0, "y": 34.0, "event_type": "shot"},
            {"team": "away", "timestamp": 8.0, "x": 45.0, "y": 20.0, "event_type": "pass"},
        ],
        possession_teams=["home", "home", "away"],
        timestamps_s=[1.0, 3.0, 8.0],
        players_ahead_of_ball=[1, 2, 3, 4],
        compactness_series=[1800.0, 1500.0, 1200.0],
        team_positions=np.array(
            [
                [12.0, 12.0],
                [14.0, 28.0],
                [16.0, 46.0],
                [26.0, 15.0],
                [28.0, 34.0],
                [30.0, 53.0],
                [45.0, 18.0],
                [48.0, 34.0],
                [50.0, 50.0],
                [70.0, 34.0],
            ]
        ),
        opponent_passes=12,
        defensive_actions=4,
        seconds_to_pressure=[1.5, 2.0, 6.0],
        regain_times_s=[3.0, None, 4.0],
    )

    assert report["match_id"] == "match_001"
    assert report["phase_summary"]["build_up"] == 1
    assert report["phase_summary"]["chance_creation"] == 1
    assert report["pressing_report"]["ppda"] == 3.0
    assert len(report["possession_chains"]) == 2


def test_build_team_report_returns_player_breakdown() -> None:
    team_report = build_team_report(
        team_id="home",
        player_reports=[
            {
                "player_id": "p1",
                "tactical_value": 0.5,
                "experimental_movement_efficiency": 0.6,
                "load_profile": {"load_flags": []},
            },
            {
                "player_id": "p2",
                "tactical_value": 0.7,
                "experimental_movement_efficiency": 0.65,
                "load_profile": {"load_flags": ["hi_distance"]},
            },
        ],
        team_positions=np.array(
            [
                [10.0, 20.0],
                [15.0, 35.0],
                [22.0, 50.0],
                [35.0, 28.0],
                [45.0, 40.0],
            ]
        ),
        ball_positions=np.array([[20.0, 30.0], [60.0, 32.0], [80.0, 33.0]]),
        pass_events=[
            {"passer_id": "p1", "receiver_id": "p2"},
            {"passer_id": "p2", "receiver_id": "p1"},
            {"passer_id": "p2", "receiver_id": "p2"},
        ],
        player_ids=["p1", "p2"],
    )

    assert team_report["team_id"] == "home"
    assert team_report["summary"]["player_count"] == 2
    assert team_report["summary"]["flagged_player_count"] == 1
    assert len(team_report["player_breakdown"]) == 2
    assert "team_pass_centrality" in team_report["player_breakdown"][0]
