"""NetworkX prototype views of graph snapshots."""

from __future__ import annotations

import networkx as nx

from src.graph.build_graph import GraphSnapshot


def build_networkx_graph(snapshot: GraphSnapshot) -> nx.DiGraph:
    """Convert a `GraphSnapshot` into a NetworkX directed graph."""
    graph = nx.DiGraph()
    for node_index, node_id in enumerate(snapshot.node_ids):
        graph.add_node(node_id, features=snapshot.node_features[node_index].tolist())
    for edge_number, (source_index, target_index) in enumerate(snapshot.edge_index.T):
        graph.add_edge(
            snapshot.node_ids[int(source_index)],
            snapshot.node_ids[int(target_index)],
            features=snapshot.edge_features[edge_number].tolist(),
        )
    return graph
