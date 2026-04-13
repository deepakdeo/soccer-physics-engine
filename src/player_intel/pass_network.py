"""Pass-network summaries."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

import networkx as nx
import numpy as np


def build_pass_network_matrix(
    pass_events: Sequence[Mapping[str, Any]],
    player_ids: Sequence[str],
) -> np.ndarray:
    """Build a directed pass-frequency matrix."""
    index_by_player = {player_id: index for index, player_id in enumerate(player_ids)}
    matrix = np.zeros((len(player_ids), len(player_ids)), dtype=float)
    for event in pass_events:
        passer = str(event.get("passer_id", ""))
        receiver = str(event.get("receiver_id", ""))
        if passer not in index_by_player or receiver not in index_by_player:
            continue
        matrix[index_by_player[passer], index_by_player[receiver]] += 1.0
    return matrix


def compute_pass_network_centrality(pass_matrix: np.ndarray) -> np.ndarray:
    """Compute directed degree centrality from a pass matrix."""
    matrix = np.asarray(pass_matrix, dtype=float)
    if matrix.ndim != 2 or matrix.shape[0] != matrix.shape[1]:
        raise ValueError("pass_matrix must be square.")
    graph = nx.from_numpy_array(matrix, create_using=nx.DiGraph)
    centrality = nx.degree_centrality(graph)
    return np.asarray([centrality[index] for index in range(matrix.shape[0])], dtype=float)
