"""Rule-based phase-of-play detection."""

from __future__ import annotations

from collections import Counter
from collections.abc import Mapping, Sequence
from typing import Any

from src.utils.constants import PITCH_LENGTH_M

TACTICAL_PHASES = {
    "build_up",
    "progression",
    "chance_creation",
    "pressing",
    "counter_pressing",
    "defensive_recovery",
    "transition",
    "set_piece",
}


def classify_phase(frame_features: Mapping[str, Any]) -> str:
    """Classify one game-state snapshot into a tactical phase.

    Args:
        frame_features: Mapping of scalar tactical indicators. Supported keys
            include `is_set_piece`, `possession_change`, `seconds_since_turnover`,
            `pressing_trigger`, `recovering_shape`, `ball_x`, `team_in_possession`,
            `attacking_pressure`, and `players_ahead_of_ball`.

    Returns:
        One of the Phase 4 tactical phase labels.
    """
    if bool(frame_features.get("is_set_piece", False)):
        return "set_piece"

    possession_change = bool(frame_features.get("possession_change", False))
    seconds_since_turnover = float(frame_features.get("seconds_since_turnover", 999.0))
    recovering_shape = bool(frame_features.get("recovering_shape", False))
    pressing_trigger = bool(frame_features.get("pressing_trigger", False))
    ball_x = float(frame_features.get("ball_x", PITCH_LENGTH_M / 2.0))
    players_ahead_of_ball = int(frame_features.get("players_ahead_of_ball", 0))
    attacking_pressure = float(frame_features.get("attacking_pressure", 0.0))

    if possession_change and seconds_since_turnover <= 5.0:
        if pressing_trigger:
            return "counter_pressing"
        if players_ahead_of_ball >= 3:
            return "transition"
        if recovering_shape:
            return "defensive_recovery"

    if pressing_trigger:
        return "pressing"
    if recovering_shape:
        return "defensive_recovery"
    if ball_x <= (PITCH_LENGTH_M / 3.0):
        return "build_up"
    if ball_x >= (2.0 * PITCH_LENGTH_M / 3.0) or attacking_pressure >= 0.7:
        return "chance_creation"
    return "progression"


def classify_phase_sequence(frames: Sequence[Mapping[str, Any]]) -> list[str]:
    """Classify each frame in a sequence."""
    return [classify_phase(frame) for frame in frames]


def summarize_phase_counts(phases: Sequence[str]) -> dict[str, int]:
    """Count occurrences of each tactical phase."""
    invalid_phases = sorted(set(phases).difference(TACTICAL_PHASES))
    if invalid_phases:
        raise ValueError(f"Unknown phase labels provided: {', '.join(invalid_phases)}")
    return dict(Counter(phases))
