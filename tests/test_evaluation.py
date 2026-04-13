"""Tests for Phase 8 evaluation helpers."""

from __future__ import annotations

from src.evaluation.case_studies import evaluate_case_studies, get_default_case_studies
from src.evaluation.counterfactual_check import verify_counterfactual_improvements
from src.evaluation.outcome_correlation import correlate_state_scores_with_outcomes
from src.evaluation.perturbation import assess_recommendation_stability
from src.recommend.optimizer import optimize_recommendations


def test_correlate_state_scores_with_outcomes_finds_positive_score_gap() -> None:
    metrics = correlate_state_scores_with_outcomes(
        state_scores=[0.2, 0.3, 0.8, 0.9],
        outcomes=[
            {"event_type": "turnover"},
            {"event_type": "unsuccessful_pass"},
            {"event_type": "shot"},
            {"event_type": "territory_gain"},
        ],
    )

    assert metrics["pearson_correlation"] > 0.0
    assert metrics["mean_positive_score"] > metrics["mean_negative_score"]


def test_verify_counterfactual_improvements_reports_overall_pass(
    recommendation_frame: list[dict[str, float | str | bool]],
) -> None:
    optimization_result = optimize_recommendations(
        recommendation_frame, top_k=2, min_confidence=0.0
    )
    summary = verify_counterfactual_improvements(
        optimization_result["single_player"],
        multi_player_result=optimization_result["multi_player"],
    )

    assert summary["checked_recommendations"] >= 1
    assert summary["passes_single_player_check"] is True
    assert summary["passes_multi_player_check"] is True
    assert summary["overall_pass"] is True


def test_assess_recommendation_stability_returns_bounded_summary(
    recommendation_frame: list[dict[str, float | str | bool]],
) -> None:
    summary = assess_recommendation_stability(
        recommendation_frame,
        noise_radius_m=0.5,
        n_trials=5,
        random_seed=11,
    )

    assert summary["baseline_recommendation"] is not None
    assert summary["trials"] == 5
    assert 0.0 <= summary["stability_rate"] <= 1.0
    assert 0.0 <= summary["consistent_player_rate"] <= 1.0


def test_get_default_case_studies_contains_ten_patterns() -> None:
    case_studies = get_default_case_studies()

    assert len(case_studies) == 10


def test_evaluate_case_studies_passes_default_library() -> None:
    summary = evaluate_case_studies()

    assert summary["case_count"] == 10
    assert summary["overall_pass"] is True
