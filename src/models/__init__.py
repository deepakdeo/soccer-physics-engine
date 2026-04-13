"""Model package."""

from src.models.baseline import BaselineImprovementModel, fit_baseline_improvement_model
from src.models.evaluate import evaluate_binary_predictions
from src.models.expected_threat import ExpectedThreatModel, fit_expected_threat_model
from src.models.registry import MLflowModelRegistryInterface, RegisteredModelInfo
from src.models.state_scorer import (
    TacticalStateInputs,
    compute_state_components,
    score_tactical_state,
)
from src.models.train import ModelTrainingBundle, train_phase5_models

__all__ = [
    "BaselineImprovementModel",
    "ExpectedThreatModel",
    "MLflowModelRegistryInterface",
    "ModelTrainingBundle",
    "RegisteredModelInfo",
    "TacticalStateInputs",
    "compute_state_components",
    "evaluate_binary_predictions",
    "fit_baseline_improvement_model",
    "fit_expected_threat_model",
    "score_tactical_state",
    "train_phase5_models",
]
