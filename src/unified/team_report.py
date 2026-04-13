"""Unified team reporting helpers."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

import numpy as np

from src.player_intel.pass_network import build_pass_network_matrix, compute_pass_network_centrality
from src.tactical.team_shape import summarize_team_shape
from src.tactical.territorial import compute_ball_territory


def build_team_report(
    team_id: str,
    player_reports: Sequence[Mapping[str, Any]],
    team_positions: np.ndarray,
    ball_positions: np.ndarray,
    pass_events: Sequence[Mapping[str, Any]],
    player_ids: Sequence[str],
    defending_goal_x: float = 0.0,
) -> dict[str, Any]:
    """Build a team-level summary with player breakdowns."""
    pass_matrix = build_pass_network_matrix(pass_events, player_ids=player_ids)
    centrality = compute_pass_network_centrality(pass_matrix)

    centrality_by_player = {
        player_id: float(centrality[index]) for index, player_id in enumerate(player_ids)
    }
    player_breakdown: list[dict[str, Any]] = []
    for report in player_reports:
        player_id = str(report.get("player_id", ""))
        player_breakdown.append(
            {
                **dict(report),
                "team_pass_centrality": centrality_by_player.get(player_id, 0.0),
            }
        )

    tactical_values = np.asarray(
        [float(report.get("tactical_value", 0.0)) for report in player_reports],
        dtype=float,
    )
    experimental_efficiency = np.asarray(
        [float(report.get("experimental_movement_efficiency", 0.0)) for report in player_reports],
        dtype=float,
    )
    flagged_players = sum(
        1
        for report in player_reports
        if len(report.get("load_profile", {}).get("load_flags", [])) > 0
    )

    return {
        "team_id": team_id,
        "team_shape": summarize_team_shape(team_positions, defending_goal_x=defending_goal_x),
        "territory_report": compute_ball_territory(ball_positions),
        "pass_network": {
            "matrix": pass_matrix.tolist(),
            "centrality": centrality_by_player,
            "total_passes": float(np.sum(pass_matrix)),
        },
        "summary": {
            "player_count": len(player_reports),
            "average_tactical_value": float(np.mean(tactical_values))
            if tactical_values.size > 0
            else 0.0,
            "average_experimental_movement_efficiency": (
                float(np.mean(experimental_efficiency)) if experimental_efficiency.size > 0 else 0.0
            ),
            "flagged_player_count": flagged_players,
        },
        "player_breakdown": player_breakdown,
    }
