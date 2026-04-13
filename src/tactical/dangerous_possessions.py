"""Dangerous possession identification helpers."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from src.utils.constants import PITCH_LENGTH_M, PITCH_WIDTH_M

PENALTY_AREA_LENGTH_M = 16.5
PENALTY_AREA_WIDTH_M = 40.32


def identify_dangerous_possessions(
    possessions: Sequence[Mapping[str, Any]],
    attacking_direction: str = "positive",
) -> list[dict[str, Any]]:
    """Filter possessions that enter the penalty area or create a shot.

    Args:
        possessions: Sequence of possession summaries containing position and shot
            metadata such as `end_x`, `end_y`, `max_x`, `max_y`, and `shot`.
        attacking_direction: Team attacking direction, either `positive` or
            `negative` along the pitch x-axis.

    Returns:
        Possession dictionaries augmented with a `danger_reason` field when the
        possession is considered dangerous.
    """
    normalized_direction = attacking_direction.lower()
    if normalized_direction not in {"positive", "negative"}:
        raise ValueError("attacking_direction must be 'positive' or 'negative'.")

    dangerous_possessions: list[dict[str, Any]] = []
    for possession in possessions:
        shot_taken = bool(possession.get("shot", False))
        entered_penalty_area = _possession_enters_penalty_area(possession, normalized_direction)
        if not shot_taken and not entered_penalty_area:
            continue

        reason = "shot" if shot_taken else "penalty_area_entry"
        dangerous_possessions.append({**dict(possession), "danger_reason": reason})

    return dangerous_possessions


def _possession_enters_penalty_area(
    possession: Mapping[str, Any],
    attacking_direction: str,
) -> bool:
    candidate_points = [
        (possession.get("end_x"), possession.get("end_y")),
        (possession.get("max_x"), possession.get("max_y")),
    ]
    return any(
        _is_in_penalty_area(x_coord, y_coord, attacking_direction)
        for x_coord, y_coord in candidate_points
    )


def _is_in_penalty_area(x_coord: Any, y_coord: Any, attacking_direction: str) -> bool:
    if x_coord is None or y_coord is None:
        return False

    x_value = float(x_coord)
    y_value = float(y_coord)
    half_penalty_width = PENALTY_AREA_WIDTH_M / 2.0
    y_min = (PITCH_WIDTH_M / 2.0) - half_penalty_width
    y_max = (PITCH_WIDTH_M / 2.0) + half_penalty_width

    if attacking_direction == "positive":
        return (
            PITCH_LENGTH_M - PENALTY_AREA_LENGTH_M
        ) <= x_value <= PITCH_LENGTH_M and y_min <= y_value <= y_max
    return 0.0 <= x_value <= PENALTY_AREA_LENGTH_M and y_min <= y_value <= y_max
