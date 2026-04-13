"""Expected-threat baseline model."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from sklearn.linear_model import LogisticRegression


@dataclass(slots=True)
class ExpectedThreatModel:
    """Wrapper around a logistic-regression expected-threat baseline."""

    classifier: LogisticRegression
    feature_names: tuple[str, ...]


def fit_expected_threat_model(
    samples: list[dict[str, float]],
    labels: list[int],
    feature_names: tuple[str, ...] = ("ball_x", "ball_y", "pitch_control_pct", "pressure"),
) -> ExpectedThreatModel:
    """Train a logistic-regression expected-threat baseline."""
    matrix = _records_to_matrix(samples, feature_names)
    classifier = LogisticRegression(max_iter=500, random_state=7)
    classifier.fit(matrix, np.asarray(labels, dtype=int))
    return ExpectedThreatModel(classifier=classifier, feature_names=feature_names)


def predict_expected_threat(
    model: ExpectedThreatModel,
    samples: list[dict[str, float]],
) -> np.ndarray:
    """Predict expected-threat probabilities for samples."""
    matrix = _records_to_matrix(samples, model.feature_names)
    return np.asarray(model.classifier.predict_proba(matrix)[:, 1], dtype=float)


def _records_to_matrix(
    samples: list[dict[str, float]],
    feature_names: tuple[str, ...],
) -> np.ndarray:
    if len(samples) == 0:
        raise ValueError("samples cannot be empty.")
    return np.asarray(
        [[float(sample.get(feature, 0.0)) for feature in feature_names] for sample in samples],
        dtype=float,
    )
