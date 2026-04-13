"""Baseline model for short-horizon state improvement."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from sklearn.ensemble import GradientBoostingClassifier


@dataclass(slots=True)
class BaselineImprovementModel:
    """Gradient-boosting baseline for tactical improvement classification."""

    classifier: GradientBoostingClassifier
    feature_names: tuple[str, ...]


def fit_baseline_improvement_model(
    samples: list[dict[str, float]],
    labels: list[int],
    feature_names: tuple[str, ...],
) -> BaselineImprovementModel:
    """Train a gradient-boosting baseline classifier."""
    if len(samples) == 0:
        raise ValueError("samples cannot be empty.")
    matrix = np.asarray(
        [[float(sample.get(feature, 0.0)) for feature in feature_names] for sample in samples],
        dtype=float,
    )
    classifier = GradientBoostingClassifier(random_state=7)
    classifier.fit(matrix, np.asarray(labels, dtype=int))
    return BaselineImprovementModel(classifier=classifier, feature_names=feature_names)


def predict_improvement_probability(
    model: BaselineImprovementModel,
    samples: list[dict[str, float]],
) -> np.ndarray:
    """Predict improvement probabilities from the baseline model."""
    matrix = np.asarray(
        [
            [float(sample.get(feature, 0.0)) for feature in model.feature_names]
            for sample in samples
        ],
        dtype=float,
    )
    return np.asarray(model.classifier.predict_proba(matrix)[:, 1], dtype=float)
