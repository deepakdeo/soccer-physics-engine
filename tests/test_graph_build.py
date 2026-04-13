"""Tests for Phase 5 graph construction."""

from __future__ import annotations

import numpy as np
from src.graph.build_graph import build_interaction_graph
from src.graph.edge_features import build_edge_feature_matrix, compute_edge_index
from src.graph.node_features import build_node_feature_matrix
from src.graph.nx_prototype import build_networkx_graph
from src.graph.temporal_graph import build_temporal_graph_sequence


def test_build_node_feature_matrix_returns_phase5_feature_width(
    frame_records: list[dict[str, float | str | bool]],
) -> None:
    features, node_ids = build_node_feature_matrix(frame_records)

    assert features.shape == (4, 12)
    assert node_ids == ["home_1", "home_2", "away_1", "ball"]


def test_compute_edge_index_connects_nearby_nodes(
    frame_records: list[dict[str, float | str | bool]],
) -> None:
    edge_index = compute_edge_index(frame_records, max_edge_distance=10.0, bidirectional=False)

    assert edge_index.shape[0] == 2
    assert edge_index.shape[1] >= 2


def test_build_edge_feature_matrix_has_expected_feature_count(
    frame_records: list[dict[str, float | str | bool]],
) -> None:
    edge_index = compute_edge_index(frame_records, max_edge_distance=15.0, bidirectional=False)
    edge_features = build_edge_feature_matrix(frame_records, edge_index)

    assert edge_features.shape[1] == 5
    assert np.all(edge_features[:, 0] >= 0.0)


def test_build_interaction_graph_returns_snapshot_with_metadata(
    frame_records: list[dict[str, float | str | bool]],
) -> None:
    snapshot = build_interaction_graph(frame_records, max_edge_distance=15.0)

    assert snapshot.node_features.shape[0] == len(frame_records)
    assert snapshot.edge_features.shape[0] == snapshot.edge_index.shape[1]
    assert snapshot.metadata["n_nodes"] == len(frame_records)


def test_build_temporal_graph_sequence_creates_one_snapshot_per_frame(
    frame_records: list[dict[str, float | str | bool]],
) -> None:
    next_frame = [dict(record, x=float(record["x"]) + 1.0) for record in frame_records]
    sequence = build_temporal_graph_sequence([frame_records, next_frame], max_edge_distance=15.0)

    assert len(sequence) == 2
    assert sequence[0].node_ids == sequence[1].node_ids


def test_build_networkx_graph_preserves_node_and_edge_counts(
    frame_records: list[dict[str, float | str | bool]],
) -> None:
    snapshot = build_interaction_graph(frame_records, max_edge_distance=15.0)
    graph = build_networkx_graph(snapshot)

    assert graph.number_of_nodes() == len(frame_records)
    assert graph.number_of_edges() == snapshot.edge_index.shape[1]
