"""Node feature construction for graph snapshots."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

import numpy as np

from src.physics.spatial import compute_pressure

PRESSURE_RADIUS_M = 5.0


def build_node_feature_matrix(
    frame_data: Sequence[dict[str, Any]],
) -> tuple[np.ndarray, list[str]]:
    """Build the Phase 5 12-dimensional node feature matrix.

    Features: x, y, vx, vy, ax, ay, speed, team_home, team_away, has_ball,
    pressure, local_space.
    """
    if len(frame_data) == 0:
        raise ValueError("frame_data cannot be empty.")

    positions = np.asarray(
        [[float(record.get("x", 0.0)), float(record.get("y", 0.0))] for record in frame_data],
        dtype=float,
    )
    velocities = np.asarray(
        [[float(record.get("vx", 0.0)), float(record.get("vy", 0.0))] for record in frame_data],
        dtype=float,
    )
    accelerations = np.asarray(
        [[float(record.get("ax", 0.0)), float(record.get("ay", 0.0))] for record in frame_data],
        dtype=float,
    )

    node_features: list[list[float]] = []
    node_ids: list[str] = []
    for index, record in enumerate(frame_data):
        team = str(record.get("team", "unknown")).lower()
        position = positions[index]
        team_home = 1.0 if team == "home" else 0.0
        team_away = 1.0 if team == "away" else 0.0
        has_ball = 1.0 if bool(record.get("has_ball", False)) else 0.0
        speed = float(np.linalg.norm(velocities[index]))
        opponent_positions = np.asarray(
            [
                positions[other_index]
                for other_index, other_record in enumerate(frame_data)
                if str(other_record.get("team", "unknown")).lower() != team
                and str(other_record.get("team", "unknown")).lower() != "ball"
            ],
            dtype=float,
        )
        if opponent_positions.size == 0:
            pressure = 0.0
            local_space = 30.0
        else:
            pressure = compute_pressure(position, opponent_positions, radius=PRESSURE_RADIUS_M)
            local_space = float(np.min(np.linalg.norm(opponent_positions - position, axis=1)))

        node_features.append(
            [
                float(position[0]),
                float(position[1]),
                float(velocities[index, 0]),
                float(velocities[index, 1]),
                float(accelerations[index, 0]),
                float(accelerations[index, 1]),
                speed,
                team_home,
                team_away,
                has_ball,
                pressure,
                local_space,
            ]
        )
        node_ids.append(str(record.get("player_id", f"node_{index}")))

    return np.asarray(node_features, dtype=float), node_ids
