"""Candidate scoring via tactical state recomputation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

from src.models.state_scorer import (
    TacticalStateInputs,
    compute_state_components,
    score_tactical_state,
)
from src.physics.passing_lanes import count_safe_passing_lanes
from src.physics.pitch_control import compute_pitch_control, compute_team_pitch_control_pct
from src.physics.spatial import compute_nearest_teammates, compute_pressure
from src.recommend.candidate_moves import apply_candidate_move
from src.tactical.team_shape import compute_team_compactness


@dataclass(slots=True)
class FrameStateScore:
    """Scored tactical state for one frame."""

    score: float
    components: dict[str, float]
    metrics: dict[str, float]


def evaluate_frame_state(
    frame_data: list[dict[str, Any]],
    focus_team: str = "home",
    grid_resolution: int = 18,
) -> FrameStateScore:
    """Evaluate the tactical state of a frame for one team."""
    player_records = [
        record for record in frame_data if str(record.get("team", "")).lower() in {"home", "away"}
    ]
    if len(player_records) == 0:
        raise ValueError("frame_data must include home or away player records.")

    home_records = [
        record for record in player_records if str(record.get("team", "")).lower() == "home"
    ]
    away_records = [
        record for record in player_records if str(record.get("team", "")).lower() == "away"
    ]
    if len(home_records) == 0 or len(away_records) == 0:
        raise ValueError("frame_data must include both home and away players.")

    focus_records = home_records if focus_team == "home" else away_records
    opponent_records = away_records if focus_team == "home" else home_records

    ball_carrier = _select_ball_carrier(frame_data, focus_records)
    ball_carrier_position = _position_array([ball_carrier])[0]
    teammate_positions = _position_array(focus_records)
    opponent_positions = _position_array(opponent_records)
    support_distances = compute_nearest_teammates(ball_carrier_position, teammate_positions, k=2)
    support_distance = float(np.mean(support_distances)) if support_distances.size > 0 else 30.0

    safe_passing_lanes = count_safe_passing_lanes(
        ball_carrier_position,
        teammate_positions,
        opponent_positions,
        _velocity_array(opponent_records),
        threshold=0.5,
    )
    pressure = compute_pressure(ball_carrier_position, opponent_positions, radius=5.0)
    pitch_control_grid = compute_pitch_control(
        _position_array(home_records),
        _velocity_array(home_records),
        _position_array(away_records),
        _velocity_array(away_records),
        grid_resolution=grid_resolution,
    )
    home_pitch_control = compute_team_pitch_control_pct(pitch_control_grid)
    pitch_control_pct = (
        home_pitch_control if focus_team == "home" else float(1.0 - home_pitch_control)
    )
    compactness = compute_team_compactness(teammate_positions)

    inputs = TacticalStateInputs(
        pitch_control_pct=pitch_control_pct,
        safe_passing_lanes=safe_passing_lanes,
        support_distance_m=support_distance,
        pressure_count=pressure,
        team_compactness_m2=compactness,
    )
    components = compute_state_components(inputs)
    metrics = {
        "pitch_control_pct": pitch_control_pct,
        "safe_passing_lanes": float(safe_passing_lanes),
        "support_distance_m": support_distance,
        "pressure_count": pressure,
        "team_compactness_m2": compactness,
    }
    return FrameStateScore(
        score=score_tactical_state(inputs),
        components=components,
        metrics=metrics,
    )


def score_candidate_moves(
    frame_data: list[dict[str, Any]],
    candidates: list[dict[str, Any]],
    focus_team: str = "home",
) -> list[dict[str, Any]]:
    """Score candidate moves by recomputing the tactical state."""
    baseline = evaluate_frame_state(frame_data, focus_team=focus_team)
    scored_candidates: list[dict[str, Any]] = []
    for candidate in candidates:
        moved_frame = apply_candidate_move(frame_data, candidate)
        projected = evaluate_frame_state(moved_frame, focus_team=focus_team)
        scored_candidates.append(
            {
                **candidate,
                "baseline_score": baseline.score,
                "projected_score": projected.score,
                "improvement": projected.score - baseline.score,
                "baseline_metrics": baseline.metrics,
                "projected_metrics": projected.metrics,
                "baseline_components": baseline.components,
                "projected_components": projected.components,
            }
        )
    return scored_candidates


def _select_ball_carrier(
    frame_data: list[dict[str, Any]],
    focus_records: list[dict[str, Any]],
) -> dict[str, Any]:
    for record in frame_data:
        if bool(record.get("has_ball", False)) and str(record.get("team", "")).lower() in {
            "home",
            "away",
        }:
            return record
    return focus_records[0]


def _position_array(records: list[dict[str, Any]]) -> np.ndarray:
    return np.asarray(
        [[float(record.get("x", 0.0)), float(record.get("y", 0.0))] for record in records],
        dtype=float,
    )


def _velocity_array(records: list[dict[str, Any]]) -> np.ndarray:
    return np.asarray(
        [[float(record.get("vx", 0.0)), float(record.get("vy", 0.0))] for record in records],
        dtype=float,
    )
