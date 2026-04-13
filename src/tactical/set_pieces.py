"""Set-piece classification and positioning analysis."""

from __future__ import annotations

import numpy as np


def classify_set_piece_event(event_type: str) -> str | None:
    """Map raw event labels to a set-piece category."""
    normalized_event = event_type.strip().lower()
    if normalized_event in {"corner", "corner_kick"}:
        return "corner"
    if normalized_event in {"free_kick", "freekick", "direct_free_kick"}:
        return "free_kick"
    if normalized_event in {"throw_in", "throwin"}:
        return "throw_in"
    return None


def analyze_set_piece_positioning(
    attacking_positions: np.ndarray,
    defending_positions: np.ndarray,
    ball_position: np.ndarray,
    marking_radius: float = 2.0,
) -> dict[str, object]:
    """Summarize marking assignments and free attackers at a set piece."""
    if marking_radius <= 0:
        raise ValueError("marking_radius must be positive.")

    attackers = _as_positions(attacking_positions, "attacking_positions")
    defenders = _as_positions(defending_positions, "defending_positions")
    ball = _as_point(ball_position, "ball_position")

    assignments: list[dict[str, float | int]] = []
    free_attackers = 0
    for attacker_index, attacker in enumerate(attackers):
        distances = np.linalg.norm(defenders - attacker, axis=1)
        nearest_defender_index = int(np.argmin(distances))
        nearest_distance = float(np.min(distances))
        if nearest_distance > marking_radius:
            free_attackers += 1
        assignments.append(
            {
                "attacker_index": attacker_index,
                "defender_index": nearest_defender_index,
                "distance": nearest_distance,
            }
        )

    attacker_distances_to_ball = np.linalg.norm(attackers - ball, axis=1)
    return {
        "free_attackers": free_attackers,
        "nearest_to_ball": int(np.argmin(attacker_distances_to_ball)),
        "marking_assignments": assignments,
    }


def _as_positions(values: np.ndarray, label: str) -> np.ndarray:
    positions = np.asarray(values, dtype=float)
    if positions.ndim != 2 or positions.shape[1] != 2:
        raise ValueError(f"{label} must have shape (n_players, 2).")
    if positions.shape[0] == 0:
        raise ValueError(f"{label} cannot be empty.")
    return positions


def _as_point(values: np.ndarray, label: str) -> np.ndarray:
    point = np.asarray(values, dtype=float)
    if point.shape != (2,):
        raise ValueError(f"{label} must have shape (2,).")
    return point
