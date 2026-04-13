"""Evaluation package."""

from src.evaluation.case_studies import evaluate_case_studies, get_default_case_studies
from src.evaluation.counterfactual_check import verify_counterfactual_improvements
from src.evaluation.outcome_correlation import correlate_state_scores_with_outcomes
from src.evaluation.perturbation import assess_recommendation_stability

__all__ = [
    "assess_recommendation_stability",
    "correlate_state_scores_with_outcomes",
    "evaluate_case_studies",
    "get_default_case_studies",
    "verify_counterfactual_improvements",
]
