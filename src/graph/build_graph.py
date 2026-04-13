"""Graph construction for player interaction snapshots."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np

from src.graph.edge_features import build_edge_feature_matrix, compute_edge_index
from src.graph.node_features import build_node_feature_matrix


@dataclass(slots=True)
class GraphSnapshot:
    """Container for one frame-level player interaction graph."""

    node_ids: list[str]
    node_features: np.ndarray
    edge_index: np.ndarray
    edge_features: np.ndarray
    metadata: dict[str, Any] = field(default_factory=dict)


def build_interaction_graph(
    frame_data: list[dict[str, Any]],
    max_edge_distance: float = 35.0,
    bidirectional: bool = True,
) -> GraphSnapshot:
    """Build a player interaction graph for a single frame.

    Args:
        frame_data: Sequence of player and ball records for a single frame.
        max_edge_distance: Maximum pairwise distance for connecting two nodes.
        bidirectional: Whether to include both edge directions.

    Returns:
        `GraphSnapshot` containing node features, edge connectivity, and edge
        features for the frame.
    """
    node_features, node_ids = build_node_feature_matrix(frame_data)
    edge_index = compute_edge_index(
        frame_data,
        max_edge_distance=max_edge_distance,
        bidirectional=bidirectional,
    )
    edge_features = build_edge_feature_matrix(frame_data, edge_index)
    metadata = {
        "n_nodes": node_features.shape[0],
        "n_edges": edge_index.shape[1],
        "max_edge_distance": max_edge_distance,
    }
    return GraphSnapshot(
        node_ids=node_ids,
        node_features=node_features,
        edge_index=edge_index,
        edge_features=edge_features,
        metadata=metadata,
    )
