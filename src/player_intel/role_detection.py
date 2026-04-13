"""Role inference from positional tendencies."""

from __future__ import annotations

import numpy as np
from sklearn.cluster import KMeans

ROLE_LABELS = ("center_back", "full_back", "midfielder", "winger", "forward")


def detect_player_roles(
    average_positions: np.ndarray,
    n_roles: int = 5,
) -> list[str]:
    """Infer player roles from average pitch positions."""
    positions = np.asarray(average_positions, dtype=float)
    if positions.ndim != 2 or positions.shape[1] != 2:
        raise ValueError("average_positions must have shape (n_players, 2).")
    if positions.shape[0] < n_roles:
        raise ValueError("average_positions must include at least n_roles players.")

    model = KMeans(n_clusters=n_roles, n_init=10, random_state=7)
    cluster_ids = model.fit_predict(positions)
    centers = model.cluster_centers_
    ordered_clusters = np.argsort(centers[:, 0])
    cluster_to_role = {
        int(cluster_id): ROLE_LABELS[min(index, len(ROLE_LABELS) - 1)]
        for index, cluster_id in enumerate(ordered_clusters)
    }
    return [cluster_to_role[int(cluster_id)] for cluster_id in cluster_ids]
