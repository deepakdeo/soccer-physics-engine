"""Candidate movement generation for recommendation search."""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from typing import Any

import numpy as np

from src.utils.constants import PITCH_LENGTH_M, PITCH_WIDTH_M

DIRECTION_VECTORS = (
    np.array([1.0, 0.0]),
    np.array([-1.0, 0.0]),
    np.array([0.0, 1.0]),
    np.array([0.0, -1.0]),
    np.array([1.0, 1.0]) / np.sqrt(2.0),
    np.array([1.0, -1.0]) / np.sqrt(2.0),
    np.array([-1.0, 1.0]) / np.sqrt(2.0),
    np.array([-1.0, -1.0]) / np.sqrt(2.0),
)


def generate_candidate_moves(
    frame_data: Sequence[dict[str, Any]],
    focus_team: str = "home",
    shift_distances: tuple[float, ...] = (2.0, 4.0),
    excluded_player_ids: Iterable[str] | None = None,
) -> list[dict[str, Any]]:
    """Generate off-ball candidate movements in eight directions.

    Args:
        frame_data: Frame-level player records.
        focus_team: Team to optimize.
        shift_distances: Candidate movement magnitudes in meters.
        excluded_player_ids: Optional player IDs to skip.

    Returns:
        Candidate movement dictionaries containing source and destination points.
    """
    excluded = set(excluded_player_ids or [])
    candidates: list[dict[str, Any]] = []
    for index, record in enumerate(frame_data):
        team = str(record.get("team", "")).lower()
        player_id = str(record.get("player_id", f"player_{index}"))
        if team != focus_team or bool(record.get("has_ball", False)) or player_id in excluded:
            continue

        current_position = np.array([float(record.get("x", 0.0)), float(record.get("y", 0.0))])
        for shift_distance in shift_distances:
            if shift_distance <= 0:
                raise ValueError("shift_distances must all be positive.")
            for direction in DIRECTION_VECTORS:
                target_position = current_position + (direction * shift_distance)
                clipped_target = np.array(
                    [
                        np.clip(target_position[0], 0.0, PITCH_LENGTH_M),
                        np.clip(target_position[1], 0.0, PITCH_WIDTH_M),
                    ],
                    dtype=float,
                )
                delta = clipped_target - current_position
                candidates.append(
                    {
                        "player_id": player_id,
                        "player_index": index,
                        "team": team,
                        "from_x": float(current_position[0]),
                        "from_y": float(current_position[1]),
                        "to_x": float(clipped_target[0]),
                        "to_y": float(clipped_target[1]),
                        "dx": float(delta[0]),
                        "dy": float(delta[1]),
                        "distance": float(np.linalg.norm(delta)),
                    }
                )

    return candidates


def apply_candidate_move(
    frame_data: Sequence[dict[str, Any]],
    candidate: dict[str, Any],
) -> list[dict[str, Any]]:
    """Apply one candidate movement to a frame and return a new frame snapshot."""
    moved_frame: list[dict[str, Any]] = []
    target_player_id = str(candidate["player_id"])
    for record in frame_data:
        copied = dict(record)
        if str(copied.get("player_id")) == target_player_id:
            copied["x"] = float(candidate["to_x"])
            copied["y"] = float(candidate["to_y"])
        moved_frame.append(copied)
    return moved_frame
