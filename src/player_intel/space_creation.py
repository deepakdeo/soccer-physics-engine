"""Space-creation attribution helpers."""

from __future__ import annotations

import numpy as np


def compute_space_creation_score(
    attacker_position_before: np.ndarray,
    attacker_position_after: np.ndarray,
    defender_positions_before: np.ndarray,
    defender_positions_after: np.ndarray,
) -> float:
    """Estimate how much space an attacker run creates by moving defenders."""
    attacker_before = _as_point(attacker_position_before, "attacker_position_before")
    attacker_after = _as_point(attacker_position_after, "attacker_position_after")
    defenders_before = _as_positions(defender_positions_before, "defender_positions_before")
    defenders_after = _as_positions(defender_positions_after, "defender_positions_after")
    if defenders_before.shape != defenders_after.shape:
        raise ValueError("defender_positions_before and defender_positions_after must match.")

    defender_shift = float(np.mean(np.linalg.norm(defenders_after - defenders_before, axis=1)))
    space_before = float(np.min(np.linalg.norm(defenders_before - attacker_before, axis=1)))
    space_after = float(np.min(np.linalg.norm(defenders_after - attacker_after, axis=1)))
    return space_after - space_before + defender_shift


def _as_point(values: np.ndarray, label: str) -> np.ndarray:
    point = np.asarray(values, dtype=float)
    if point.shape != (2,):
        raise ValueError(f"{label} must have shape (2,).")
    return point


def _as_positions(values: np.ndarray, label: str) -> np.ndarray:
    positions = np.asarray(values, dtype=float)
    if positions.ndim != 2 or positions.shape[1] != 2:
        raise ValueError(f"{label} must have shape (n_players, 2).")
    return positions
