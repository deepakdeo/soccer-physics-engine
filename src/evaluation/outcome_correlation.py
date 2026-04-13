"""Outcome correlation checks for tactical state scores."""

from __future__ import annotations

from collections.abc import Collection, Mapping, Sequence
from typing import Any

import numpy as np

DEFAULT_POSITIVE_EVENT_TYPES = frozenset({"shot", "successful_pass", "territory_gain"})


def correlate_state_scores_with_outcomes(
    state_scores: Sequence[float],
    outcomes: Sequence[bool | int | float | Mapping[str, Any]],
    positive_event_types: Collection[str] = DEFAULT_POSITIVE_EVENT_TYPES,
) -> dict[str, float]:
    """Correlate tactical state scores with downstream positive outcomes.

    Args:
        state_scores: Ordered state scores for the situations being evaluated.
        outcomes: Ordered outcome labels. Each entry can be a boolean-like scalar
            or an event mapping containing `event_type`, `positive_outcome`, or
            `outcome`.
        positive_event_types: Event labels treated as positive outcomes when an
            event mapping is supplied.

    Returns:
        Summary metrics describing how strongly scores align with positive outcomes.
    """
    scores = np.asarray(state_scores, dtype=float)
    if scores.ndim != 1 or scores.size == 0:
        raise ValueError("state_scores must be a non-empty one-dimensional sequence.")
    if len(outcomes) != scores.size:
        raise ValueError("state_scores and outcomes must have the same length.")

    positive_types = {event_type.lower() for event_type in positive_event_types}
    binary_outcomes = np.asarray(
        [_coerce_outcome_label(outcome, positive_types) for outcome in outcomes],
        dtype=float,
    )

    correlation = _safe_correlation(scores, binary_outcomes)
    positive_mask = binary_outcomes >= 0.5
    negative_mask = ~positive_mask

    mean_positive_score = float(np.mean(scores[positive_mask])) if np.any(positive_mask) else 0.0
    mean_negative_score = float(np.mean(scores[negative_mask])) if np.any(negative_mask) else 0.0
    return {
        "pearson_correlation": correlation,
        "positive_rate": float(np.mean(binary_outcomes)),
        "mean_positive_score": mean_positive_score,
        "mean_negative_score": mean_negative_score,
        "score_gap": mean_positive_score - mean_negative_score,
    }


def _coerce_outcome_label(
    outcome: bool | int | float | Mapping[str, Any],
    positive_event_types: set[str],
) -> float:
    if isinstance(outcome, Mapping):
        if "positive_outcome" in outcome:
            return float(bool(outcome["positive_outcome"]))
        if "outcome" in outcome and not isinstance(outcome["outcome"], str):
            return float(bool(outcome["outcome"]))
        event_type = str(outcome.get("event_type", "")).lower()
        return float(event_type in positive_event_types)
    return float(bool(outcome))


def _safe_correlation(scores: np.ndarray, outcomes: np.ndarray) -> float:
    if np.allclose(scores, scores[0]) or np.allclose(outcomes, outcomes[0]):
        return 0.0
    correlation_matrix = np.corrcoef(scores, outcomes)
    return float(np.nan_to_num(correlation_matrix[0, 1], nan=0.0))
