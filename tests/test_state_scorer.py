"""Tests for Phase 5 state scoring and baseline models."""

from __future__ import annotations

import numpy as np
from src.models.baseline import fit_baseline_improvement_model, predict_improvement_probability
from src.models.evaluate import evaluate_binary_predictions
from src.models.expected_threat import fit_expected_threat_model, predict_expected_threat
from src.models.registry import MLflowModelRegistryInterface
from src.models.state_scorer import (
    TacticalStateInputs,
    compute_state_components,
    score_tactical_state,
)
from src.models.train import train_phase5_models


def test_compute_state_components_normalizes_inputs() -> None:
    components = compute_state_components(
        TacticalStateInputs(
            pitch_control_pct=0.7,
            safe_passing_lanes=3,
            support_distance_m=10.0,
            pressure_count=1.0,
            team_compactness_m2=1000.0,
        )
    )

    assert set(components) == {
        "pitch_control",
        "passing_lanes",
        "support",
        "pressure",
        "team_shape",
    }
    assert all(0.0 <= value <= 1.0 for value in components.values())


def test_score_tactical_state_rewards_stronger_inputs() -> None:
    weaker_score = score_tactical_state(
        TacticalStateInputs(
            pitch_control_pct=0.35,
            safe_passing_lanes=1,
            support_distance_m=22.0,
            pressure_count=4.0,
            team_compactness_m2=2100.0,
        )
    )
    stronger_score = score_tactical_state(
        TacticalStateInputs(
            pitch_control_pct=0.75,
            safe_passing_lanes=4,
            support_distance_m=8.0,
            pressure_count=1.0,
            team_compactness_m2=900.0,
        )
    )

    assert stronger_score > weaker_score


def test_expected_threat_model_fits_and_predicts(
    model_samples: list[dict[str, float]],
    model_labels: list[int],
) -> None:
    model = fit_expected_threat_model(model_samples, model_labels)
    predictions = predict_expected_threat(model, model_samples)

    assert predictions.shape == (len(model_samples),)
    assert np.all((predictions >= 0.0) & (predictions <= 1.0))


def test_baseline_model_fits_and_predicts(
    model_samples: list[dict[str, float]],
    model_labels: list[int],
) -> None:
    feature_names = (
        "pitch_control_pct",
        "safe_passing_lanes",
        "support_distance",
        "pressure",
        "compactness",
    )
    model = fit_baseline_improvement_model(model_samples, model_labels, feature_names)
    predictions = predict_improvement_probability(model, model_samples)

    assert predictions.shape == (len(model_samples),)
    assert np.all((predictions >= 0.0) & (predictions <= 1.0))


def test_evaluate_binary_predictions_returns_core_metrics() -> None:
    metrics = evaluate_binary_predictions([0, 0, 1, 1], [0.1, 0.3, 0.7, 0.9])

    assert set(metrics) == {"auc", "precision", "recall", "calibration_error"}
    assert metrics["auc"] > 0.9


def test_train_phase5_models_returns_bundle_with_metrics(
    model_samples: list[dict[str, float]],
    model_labels: list[int],
) -> None:
    feature_names = (
        "pitch_control_pct",
        "safe_passing_lanes",
        "support_distance",
        "pressure",
        "compactness",
    )
    bundle = train_phase5_models(model_samples, model_labels, feature_names)

    assert "auc" in bundle.metrics
    assert bundle.baseline_model.feature_names == feature_names


def test_model_registry_tracks_versions() -> None:
    registry = MLflowModelRegistryInterface()
    first = registry.register_model("state-scorer", model_type="baseline", metadata={"phase": 5})
    second = registry.register_model("state-scorer", model_type="baseline", metadata={"phase": 5})

    assert first.version == 1
    assert second.version == 2
    assert registry.get_model_info("state-scorer").version == 2
