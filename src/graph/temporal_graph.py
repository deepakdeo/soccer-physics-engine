"""Temporal graph sequences built from frame snapshots."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from src.graph.build_graph import GraphSnapshot, build_interaction_graph


def build_temporal_graph_sequence(
    frames: Sequence[list[dict[str, Any]]],
    max_edge_distance: float = 35.0,
    bidirectional: bool = True,
) -> list[GraphSnapshot]:
    """Build graph snapshots for an ordered sequence of frames."""
    return [
        build_interaction_graph(
            frame,
            max_edge_distance=max_edge_distance,
            bidirectional=bidirectional,
        )
        for frame in frames
    ]
