"""Progressive-pass identification."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any


def identify_progressive_passes(
    pass_events: Sequence[Mapping[str, Any]],
    attacking_direction: str = "positive",
    min_progress_m: float = 10.0,
) -> list[dict[str, Any]]:
    """Return passes that move the ball meaningfully toward goal."""
    direction = attacking_direction.lower()
    if direction not in {"positive", "negative"}:
        raise ValueError("attacking_direction must be 'positive' or 'negative'.")
    if min_progress_m <= 0:
        raise ValueError("min_progress_m must be positive.")

    progressive_passes: list[dict[str, Any]] = []
    for event in pass_events:
        start_x = float(event.get("start_x", 0.0))
        end_x = float(event.get("end_x", 0.0))
        progress = end_x - start_x if direction == "positive" else start_x - end_x
        if progress >= min_progress_m:
            progressive_passes.append(dict(event))
    return progressive_passes
