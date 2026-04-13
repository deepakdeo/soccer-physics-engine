"""Unified player reporting helpers."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

import numpy as np

from src.load.asymmetry import compute_directional_deceleration_asymmetry
from src.load.fatigue import compute_fatigue_curve
from src.load.flags import generate_load_monitoring_flags
from src.load.metrics import (
    compute_change_of_direction_load,
    compute_high_intensity_distance,
    count_sharp_deceleration_events,
)
from src.load.sprint_profiles import compute_sprint_profiles
from src.load.work_rate import compute_work_rate_by_possession
from src.player_intel.off_ball_runs import classify_off_ball_run_sequence
from src.player_intel.pass_network import build_pass_network_matrix, compute_pass_network_centrality
from src.player_intel.progressive_passes import identify_progressive_passes
from src.player_intel.role_detection import detect_player_roles
from src.player_intel.space_creation import compute_space_creation_score


def build_player_report(
    player_id: str,
    player_positions: np.ndarray,
    speed_series: np.ndarray,
    acceleration_series: np.ndarray,
    velocity_vectors: np.ndarray,
    possession_flags: np.ndarray,
    pass_events: Sequence[Mapping[str, Any]],
    team_average_positions: np.ndarray,
    team_player_ids: Sequence[str],
    defender_positions_before: np.ndarray | None = None,
    defender_positions_after: np.ndarray | None = None,
    attacking_direction: str = "positive",
    dt: float = 1.0,
    team_reference_metrics: Mapping[str, np.ndarray] | None = None,
) -> dict[str, Any]:
    """Build a player-level report combining tactical and load summaries.

    Args:
        player_id: Identifier of the player being summarized.
        player_positions: Ordered position samples with shape `(n_frames, 2)`.
        speed_series: Per-frame player speed series.
        acceleration_series: Per-frame player acceleration series.
        velocity_vectors: Per-frame planar velocity vectors with shape `(n_frames, 2)`.
        possession_flags: Boolean possession flags aligned with `speed_series`.
        pass_events: Pass-event dictionaries for the player and teammates.
        team_average_positions: Team average positions used for role inference.
        team_player_ids: Ordered player ids aligned with `team_average_positions`.
        defender_positions_before: Optional defender positions before a player run.
        defender_positions_after: Optional defender positions after a player run.
        attacking_direction: Team attacking direction along the x-axis.
        dt: Frame duration in seconds.
        team_reference_metrics: Optional team distributions for load-flag thresholds.

    Returns:
        Unified player report with tactical, load, and experimental efficiency fields.
    """
    if dt <= 0.0:
        raise ValueError("dt must be positive.")

    positions = np.asarray(player_positions, dtype=float)
    speeds = np.asarray(speed_series, dtype=float)
    accelerations = np.asarray(acceleration_series, dtype=float)
    velocities = np.asarray(velocity_vectors, dtype=float)
    possession = np.asarray(possession_flags, dtype=bool)
    if positions.ndim != 2 or positions.shape[1] != 2:
        raise ValueError("player_positions must have shape (n_frames, 2).")
    if velocities.ndim != 2 or velocities.shape[1] != 2:
        raise ValueError("velocity_vectors must have shape (n_frames, 2).")
    if not (
        len(positions) == len(speeds) == len(accelerations) == len(velocities) == len(possession)
    ):
        raise ValueError(
            "player_positions, speed_series, acceleration_series, velocity_vectors, and "
            "possession_flags must have the same length."
        )
    if len(team_average_positions) != len(team_player_ids):
        raise ValueError("team_average_positions and team_player_ids must have the same length.")

    primary_run_type = classify_off_ball_run_sequence(
        positions, attacking_direction=attacking_direction
    )
    role_detected = _detect_player_role(player_id, team_average_positions, team_player_ids)
    player_passes = [
        dict(event) for event in pass_events if str(event.get("passer_id", "")) == player_id
    ]
    progressive_passes = identify_progressive_passes(
        player_passes,
        attacking_direction=attacking_direction,
        min_progress_m=10.0,
    )
    pass_matrix = build_pass_network_matrix(pass_events, player_ids=team_player_ids)
    pass_centrality = compute_pass_network_centrality(pass_matrix)
    player_index = team_player_ids.index(player_id)
    pass_centrality_score = float(pass_centrality[player_index])

    hi_distance = compute_high_intensity_distance(speeds, dt=dt)
    decel_events = count_sharp_deceleration_events(accelerations)
    cod_load = compute_change_of_direction_load(velocities, dt=dt)
    asymmetry = compute_directional_deceleration_asymmetry(velocities, accelerations)
    fatigue_curve = compute_fatigue_curve(
        speeds,
        accelerations,
        window_size=max(1, len(speeds) // 2),
    )
    sprint_profile = compute_sprint_profiles(speeds, dt=dt)
    work_rate = compute_work_rate_by_possession(speeds, possession, dt=dt)

    player_load_snapshot = {
        "hi_distance": hi_distance,
        "decel_events": float(decel_events),
        "cod_load": cod_load,
    }
    load_flags = (
        generate_load_monitoring_flags(player_load_snapshot, team_reference_metrics)
        if team_reference_metrics is not None
        else []
    )

    space_creation_score = 0.0
    if defender_positions_before is not None and defender_positions_after is not None:
        space_creation_score = compute_space_creation_score(
            attacker_position_before=positions[0],
            attacker_position_after=positions[-1],
            defender_positions_before=defender_positions_before,
            defender_positions_after=defender_positions_after,
        )

    tactical_value = _compute_tactical_value(
        progressive_pass_count=len(progressive_passes),
        space_creation_score=space_creation_score,
        pass_centrality_score=pass_centrality_score,
    )
    experimental_movement_efficiency = _compute_experimental_efficiency(
        tactical_value=tactical_value,
        hi_distance=hi_distance,
        decel_events=decel_events,
        cod_load=cod_load,
    )
    return {
        "player_id": player_id,
        "role_detected": role_detected,
        "primary_run_type": primary_run_type,
        "progressive_pass_count": len(progressive_passes),
        "space_creation_score": space_creation_score,
        "pass_centrality": pass_centrality_score,
        "tactical_value": tactical_value,
        "experimental_movement_efficiency": experimental_movement_efficiency,
        "movement_efficiency_note": (
            "Experimental composite blending tactical contribution with load burden."
        ),
        "load_profile": {
            "high_intensity_distance": hi_distance,
            "sharp_deceleration_events": decel_events,
            "change_of_direction_load": cod_load,
            "directional_asymmetry": asymmetry,
            "fatigue_curve": fatigue_curve,
            "sprint_profile": sprint_profile,
            "work_rate": work_rate,
            "load_flags": load_flags,
        },
    }


def _detect_player_role(
    player_id: str,
    team_average_positions: np.ndarray,
    team_player_ids: Sequence[str],
) -> str:
    if player_id not in team_player_ids:
        raise ValueError("player_id must be present in team_player_ids.")
    positions = np.asarray(team_average_positions, dtype=float)
    if positions.ndim != 2 or positions.shape[1] != 2:
        raise ValueError("team_average_positions must have shape (n_players, 2).")

    n_roles = min(5, len(team_player_ids))
    if n_roles < 1:
        return "unknown"
    roles = detect_player_roles(positions, n_roles=n_roles)
    return str(roles[team_player_ids.index(player_id)])


def _compute_tactical_value(
    progressive_pass_count: int,
    space_creation_score: float,
    pass_centrality_score: float,
) -> float:
    progressive_component = np.clip(progressive_pass_count / 5.0, 0.0, 1.0)
    space_component = np.clip(space_creation_score / 10.0, 0.0, 1.0)
    centrality_component = np.clip(pass_centrality_score, 0.0, 1.0)
    return float(
        (0.4 * progressive_component) + (0.35 * space_component) + (0.25 * centrality_component)
    )


def _compute_experimental_efficiency(
    tactical_value: float,
    hi_distance: float,
    decel_events: int,
    cod_load: float,
) -> float:
    load_burden = float(
        (0.4 * np.clip(hi_distance / 600.0, 0.0, 1.0))
        + (0.3 * np.clip(decel_events / 15.0, 0.0, 1.0))
        + (0.3 * np.clip(cod_load / 120.0, 0.0, 1.0))
    )
    return float(np.clip((0.65 * tactical_value) + (0.35 * (1.0 - load_burden)), 0.0, 1.0))
