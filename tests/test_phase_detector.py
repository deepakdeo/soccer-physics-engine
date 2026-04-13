"""Tests for tactical phase detection."""

from __future__ import annotations

from src.tactical.phase_detector import (
    classify_phase,
    classify_phase_sequence,
    summarize_phase_counts,
)


def test_classify_phase_identifies_set_piece() -> None:
    phase = classify_phase({"is_set_piece": True, "ball_x": 50.0})

    assert phase == "set_piece"


def test_classify_phase_identifies_counter_pressing_after_turnover() -> None:
    phase = classify_phase(
        {
            "possession_change": True,
            "seconds_since_turnover": 2.0,
            "pressing_trigger": True,
            "players_ahead_of_ball": 1,
        }
    )

    assert phase == "counter_pressing"


def test_classify_phase_identifies_transition_from_numbers_ahead_of_ball() -> None:
    phase = classify_phase(
        {
            "possession_change": True,
            "seconds_since_turnover": 3.0,
            "players_ahead_of_ball": 4,
            "ball_x": 52.0,
        }
    )

    assert phase == "transition"


def test_classify_phase_sequence_and_summary_cover_multiple_labels() -> None:
    phases = classify_phase_sequence(
        [
            {"ball_x": 20.0},
            {"ball_x": 55.0},
            {"ball_x": 85.0, "attacking_pressure": 0.8},
        ]
    )

    summary = summarize_phase_counts(phases)

    assert phases == ["build_up", "progression", "chance_creation"]
    assert summary["build_up"] == 1
    assert summary["progression"] == 1
    assert summary["chance_creation"] == 1
