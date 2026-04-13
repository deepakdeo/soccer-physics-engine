"""Counterfactual consistency checks for recommendations."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

import numpy as np


def verify_counterfactual_improvements(
    single_player_recommendations: Sequence[Mapping[str, Any]],
    multi_player_result: Mapping[str, Any] | None = None,
    min_improvement: float = 0.0,
) -> dict[str, float | int | bool]:
    """Verify that recommendation outputs improve the simulated tactical state.

    Args:
        single_player_recommendations: Ranked recommendation dictionaries from
            the optimizer.
        multi_player_result: Optional greedy multi-player optimization output.
        min_improvement: Minimum required improvement for a check to pass.

    Returns:
        Summary of single-player and multi-player counterfactual consistency.
    """
    improvements = np.asarray(
        [
            float(recommendation.get("improvement", 0.0))
            for recommendation in single_player_recommendations
        ],
        dtype=float,
    )

    checked_recommendations = int(improvements.size)
    best_improvement = float(np.max(improvements)) if improvements.size > 0 else 0.0
    mean_improvement = float(np.mean(improvements)) if improvements.size > 0 else 0.0
    positive_rate = (
        float(np.mean(improvements >= min_improvement)) if improvements.size > 0 else 0.0
    )
    passes_single_player_check = best_improvement >= min_improvement and improvements.size > 0

    multi_player_improvement = 0.0
    passes_multi_player_check = False
    if multi_player_result is not None:
        if "total_improvement" in multi_player_result:
            multi_player_improvement = float(multi_player_result["total_improvement"])
        else:
            baseline_score = float(multi_player_result.get("baseline_score", 0.0))
            final_score = float(multi_player_result.get("final_score", baseline_score))
            multi_player_improvement = final_score - baseline_score
        passes_multi_player_check = multi_player_improvement >= min_improvement

    overall_pass = passes_single_player_check and (
        multi_player_result is None or passes_multi_player_check
    )
    return {
        "checked_recommendations": checked_recommendations,
        "best_improvement": best_improvement,
        "mean_improvement": mean_improvement,
        "positive_rate": positive_rate,
        "multi_player_improvement": multi_player_improvement,
        "passes_single_player_check": passes_single_player_check,
        "passes_multi_player_check": passes_multi_player_check,
        "overall_pass": overall_pass,
    }
