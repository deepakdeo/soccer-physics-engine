"""Evaluation helpers for binary tactical models."""

from __future__ import annotations

import numpy as np
from sklearn.metrics import brier_score_loss, precision_score, recall_score, roc_auc_score


def evaluate_binary_predictions(
    y_true: list[int],
    y_score: list[float],
    threshold: float = 0.5,
) -> dict[str, float]:
    """Evaluate binary classifier scores with core Phase 5 metrics."""
    if len(y_true) != len(y_score):
        raise ValueError("y_true and y_score must have the same length.")
    if len(y_true) == 0:
        raise ValueError("y_true and y_score cannot be empty.")

    true_array = np.asarray(y_true, dtype=int)
    score_array = np.asarray(y_score, dtype=float)
    predictions = (score_array >= threshold).astype(int)
    return {
        "auc": float(roc_auc_score(true_array, score_array)),
        "precision": float(precision_score(true_array, predictions, zero_division=0)),
        "recall": float(recall_score(true_array, predictions, zero_division=0)),
        "calibration_error": float(brier_score_loss(true_array, score_array)),
    }
