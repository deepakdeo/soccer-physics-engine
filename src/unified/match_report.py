"""Unified match reporting helpers."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

import numpy as np

from src.tactical.dangerous_possessions import identify_dangerous_possessions
from src.tactical.phase_detector import classify_phase_sequence, summarize_phase_counts
from src.tactical.pressing import (
    compute_counter_press_speed,
    compute_ppda,
    compute_pressing_effectiveness,
)
from src.tactical.team_shape import summarize_team_shape
from src.tactical.territorial import compute_ball_territory, extract_possession_chains
from src.tactical.transitions import (
    compute_defensive_shape_recovery_time,
    compute_transition_speed,
    detect_possession_transitions,
)


def build_match_report(
    match_id: str,
    phase_frames: Sequence[Mapping[str, Any]],
    ball_positions: np.ndarray,
    events: Sequence[Mapping[str, Any]],
    possession_teams: Sequence[str],
    timestamps_s: Sequence[float],
    players_ahead_of_ball: Sequence[int],
    compactness_series: Sequence[float],
    team_positions: np.ndarray,
    opponent_passes: int,
    defensive_actions: int,
    seconds_to_pressure: Sequence[float],
    regain_times_s: Sequence[float | None],
    defending_goal_x: float = 0.0,
    target_compactness: float | None = None,
    attacking_direction: str = "positive",
) -> dict[str, Any]:
    """Build a full-match report from tactical and physical summary inputs."""
    phases = classify_phase_sequence(phase_frames)
    phase_summary = summarize_phase_counts(phases)
    pressing_report = {
        "ppda": compute_ppda(opponent_passes, defensive_actions),
        "counter_press_speed_s": compute_counter_press_speed(seconds_to_pressure),
        "pressing_effectiveness": compute_pressing_effectiveness(regain_times_s),
    }

    transitions = detect_possession_transitions(possession_teams, timestamps_s)
    compactness = np.asarray(compactness_series, dtype=float)
    resolved_target_compactness = (
        float(target_compactness)
        if target_compactness is not None
        else float(np.median(compactness))
    )
    transition_report = {
        "transitions": transitions,
        "transition_speed_s": compute_transition_speed(players_ahead_of_ball),
        "defensive_shape_recovery_s": compute_defensive_shape_recovery_time(
            compactness.tolist(),
            target_compactness=resolved_target_compactness,
        ),
    }

    possession_chains = extract_possession_chains(events)
    dangerous_possessions = identify_dangerous_possessions(
        possession_chains,
        attacking_direction=attacking_direction,
    )
    return {
        "match_id": match_id,
        "phase_summary": phase_summary,
        "pressing_report": pressing_report,
        "transition_report": transition_report,
        "territory_report": compute_ball_territory(ball_positions),
        "possession_chains": possession_chains,
        "dangerous_possessions": dangerous_possessions,
        "team_shape_report": summarize_team_shape(
            team_positions, defending_goal_x=defending_goal_x
        ),
    }
