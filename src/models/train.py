"""Training entry points for Phase 5 baseline models."""

from __future__ import annotations

from dataclasses import dataclass

from src.models.baseline import BaselineImprovementModel, fit_baseline_improvement_model
from src.models.evaluate import evaluate_binary_predictions
from src.models.expected_threat import ExpectedThreatModel, fit_expected_threat_model


@dataclass(slots=True)
class ModelTrainingBundle:
    """Bundle of trained baseline models and evaluation metadata."""

    expected_threat_model: ExpectedThreatModel
    baseline_model: BaselineImprovementModel
    metrics: dict[str, float]


def train_phase5_models(
    samples: list[dict[str, float]],
    labels: list[int],
    baseline_feature_names: tuple[str, ...],
    track_with_mlflow: bool = False,
) -> ModelTrainingBundle:
    """Train the Phase 5 baseline models and optionally log metrics to MLflow."""
    x_t_model = fit_expected_threat_model(samples, labels)
    baseline_model = fit_baseline_improvement_model(samples, labels, baseline_feature_names)
    y_score = baseline_model.classifier.predict_proba(
        [
            [float(sample.get(feature, 0.0)) for feature in baseline_feature_names]
            for sample in samples
        ]
    )[:, 1].tolist()
    metrics = evaluate_binary_predictions(labels, y_score)

    if track_with_mlflow:
        import mlflow

        with mlflow.start_run(run_name="phase5_baseline_training"):
            mlflow.log_params({"baseline_features": ",".join(baseline_feature_names)})
            mlflow.log_metrics(metrics)

    return ModelTrainingBundle(
        expected_threat_model=x_t_model,
        baseline_model=baseline_model,
        metrics=metrics,
    )
