"""Tests for set-piece helpers."""

from __future__ import annotations

import numpy as np
from src.tactical.set_pieces import analyze_set_piece_positioning, classify_set_piece_event


def test_classify_set_piece_event_maps_common_event_names() -> None:
    assert classify_set_piece_event("corner_kick") == "corner"
    assert classify_set_piece_event("free_kick") == "free_kick"
    assert classify_set_piece_event("open_play") is None


def test_analyze_set_piece_positioning_reports_free_attackers_and_assignments() -> None:
    attackers = np.array([[100.0, 30.0], [102.0, 34.0], [95.0, 40.0]])
    defenders = np.array([[100.5, 30.5], [102.5, 34.5], [88.0, 15.0]])
    ball = np.array([104.0, 34.0])

    analysis = analyze_set_piece_positioning(attackers, defenders, ball, marking_radius=2.0)

    assert analysis["free_attackers"] == 1
    assert analysis["nearest_to_ball"] == 1
    assert len(analysis["marking_assignments"]) == 3
