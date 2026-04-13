"""Percentile-based load monitoring flags."""

from __future__ import annotations

from collections.abc import Mapping

import numpy as np


def generate_load_monitoring_flags(
    player_metrics: Mapping[str, float],
    team_reference_metrics: Mapping[str, np.ndarray],
    percentile_threshold: float = 90.0,
) -> list[str]:
    """Flag player metrics that exceed within-match team norms."""
    if not 0.0 < percentile_threshold < 100.0:
        raise ValueError("percentile_threshold must be between 0 and 100.")

    flags: list[str] = []
    for metric_name, player_value in player_metrics.items():
        if metric_name not in team_reference_metrics:
            continue
        reference = np.asarray(team_reference_metrics[metric_name], dtype=float)
        threshold = float(np.percentile(reference, percentile_threshold))
        if float(player_value) > threshold:
            flags.append(metric_name)
    return flags
