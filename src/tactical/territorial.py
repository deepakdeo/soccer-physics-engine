"""Territorial control and possession-chain helpers."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

import numpy as np

from src.utils.constants import PITCH_LENGTH_M


def compute_ball_territory(ball_positions: np.ndarray) -> dict[str, float]:
    """Compute share of ball time spent in each pitch third."""
    positions = np.asarray(ball_positions, dtype=float)
    if positions.ndim != 2 or positions.shape[1] != 2:
        raise ValueError("ball_positions must have shape (n_frames, 2).")
    if positions.shape[0] == 0:
        raise ValueError("ball_positions cannot be empty.")

    x_values = positions[:, 0]
    defensive_share = float(np.mean(x_values < (PITCH_LENGTH_M / 3.0)))
    middle_share = float(
        np.mean((x_values >= (PITCH_LENGTH_M / 3.0)) & (x_values < (2.0 * PITCH_LENGTH_M / 3.0)))
    )
    attacking_share = float(np.mean(x_values >= (2.0 * PITCH_LENGTH_M / 3.0)))
    return {
        "defensive_third": defensive_share,
        "middle_third": middle_share,
        "attacking_third": attacking_share,
    }


def extract_possession_chains(events: Sequence[Mapping[str, Any]]) -> list[dict[str, Any]]:
    """Group adjacent same-team events into possession chains.

    Args:
        events: Sequence of event dictionaries containing at least `team` and
            `timestamp`, with optional `x`, `y`, and `event_type`.

    Returns:
        List of possession-chain summaries.
    """
    sorted_events = sorted(events, key=lambda event: float(event.get("timestamp", 0.0)))
    if not sorted_events:
        return []

    chains: list[dict[str, Any]] = []
    current_chain = _start_chain(sorted_events[0])
    for event in sorted_events[1:]:
        team = str(event.get("team", ""))
        if team == current_chain["team"]:
            current_chain = _extend_chain(current_chain, event)
            continue
        chains.append(current_chain)
        current_chain = _start_chain(event)
    chains.append(current_chain)
    return chains


def _start_chain(event: Mapping[str, Any]) -> dict[str, Any]:
    event_x = event.get("x")
    event_y = event.get("y")
    return {
        "team": str(event.get("team", "")),
        "start_time": float(event.get("timestamp", 0.0)),
        "end_time": float(event.get("timestamp", 0.0)),
        "start_x": float(event_x) if event_x is not None else None,
        "start_y": float(event_y) if event_y is not None else None,
        "end_x": float(event_x) if event_x is not None else None,
        "end_y": float(event_y) if event_y is not None else None,
        "event_count": 1,
        "event_types": [str(event.get("event_type", "unknown"))],
    }


def _extend_chain(chain: dict[str, Any], event: Mapping[str, Any]) -> dict[str, Any]:
    updated_chain = dict(chain)
    event_x = event.get("x")
    event_y = event.get("y")
    updated_chain["end_time"] = float(event.get("timestamp", updated_chain["end_time"]))
    updated_chain["end_x"] = float(event_x) if event_x is not None else updated_chain["end_x"]
    updated_chain["end_y"] = float(event_y) if event_y is not None else updated_chain["end_y"]
    updated_chain["event_count"] = int(updated_chain["event_count"]) + 1
    updated_chain["event_types"] = [
        *list(updated_chain["event_types"]),
        str(event.get("event_type", "unknown")),
    ]
    return updated_chain
