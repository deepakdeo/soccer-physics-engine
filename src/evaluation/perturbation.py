"""Perturbation-stability checks for recommendations."""

from __future__ import annotations

from typing import Any

import numpy as np

from src.recommend.optimizer import optimize_recommendations


def assess_recommendation_stability(
    frame_data: list[dict[str, Any]],
    focus_team: str = "home",
    noise_radius_m: float = 0.5,
    n_trials: int = 20,
    random_seed: int = 7,
) -> dict[str, Any]:
    """Check whether the top recommendation survives small spatial perturbations.

    Args:
        frame_data: Frame records for one tactical snapshot.
        focus_team: Team for which recommendations are generated.
        noise_radius_m: Maximum uniform perturbation applied in each axis.
        n_trials: Number of perturbation trials.
        random_seed: Seed used for deterministic perturbations.

    Returns:
        Baseline recommendation plus stability metrics under noisy re-evaluation.
    """
    if noise_radius_m < 0.0:
        raise ValueError("noise_radius_m must be non-negative.")
    if n_trials < 1:
        raise ValueError("n_trials must be at least 1.")

    baseline_result = optimize_recommendations(
        frame_data,
        focus_team=focus_team,
        top_k=1,
        min_confidence=0.0,
        include_multi_player=False,
    )
    baseline_recommendation = _extract_top_recommendation(baseline_result)
    if baseline_recommendation is None:
        return {
            "baseline_recommendation": None,
            "trials": n_trials,
            "completed_trials": 0,
            "stability_rate": 0.0,
            "consistent_player_rate": 0.0,
            "mean_trial_improvement": 0.0,
            "unique_recommendations": 0,
        }

    rng = np.random.default_rng(random_seed)
    baseline_signature = _recommendation_signature(baseline_recommendation)
    baseline_player_id = str(baseline_recommendation.get("player_id", ""))

    completed_trials = 0
    same_recommendation_count = 0
    same_player_count = 0
    trial_improvements: list[float] = []
    recommendation_signatures: set[tuple[str, float, float]] = set()

    for _ in range(n_trials):
        perturbed_frame = _perturb_frame(frame_data, noise_radius_m, rng)
        perturbed_result = optimize_recommendations(
            perturbed_frame,
            focus_team=focus_team,
            top_k=1,
            min_confidence=0.0,
            include_multi_player=False,
        )
        recommendation = _extract_top_recommendation(perturbed_result)
        if recommendation is None:
            continue

        completed_trials += 1
        recommendation_signatures.add(_recommendation_signature(recommendation))
        trial_improvements.append(float(recommendation.get("improvement", 0.0)))

        if _recommendation_signature(recommendation) == baseline_signature:
            same_recommendation_count += 1
        if str(recommendation.get("player_id", "")) == baseline_player_id:
            same_player_count += 1

    denominator = max(completed_trials, 1)
    return {
        "baseline_recommendation": dict(baseline_recommendation),
        "trials": n_trials,
        "completed_trials": completed_trials,
        "stability_rate": same_recommendation_count / denominator,
        "consistent_player_rate": same_player_count / denominator,
        "mean_trial_improvement": float(np.mean(trial_improvements)) if trial_improvements else 0.0,
        "unique_recommendations": len(recommendation_signatures),
    }


def _extract_top_recommendation(result: dict[str, Any]) -> dict[str, Any] | None:
    recommendations = list(result.get("single_player", []))
    return dict(recommendations[0]) if recommendations else None


def _recommendation_signature(recommendation: dict[str, Any]) -> tuple[str, float, float]:
    return (
        str(recommendation.get("player_id", "")),
        float(recommendation.get("dx", 0.0)),
        float(recommendation.get("dy", 0.0)),
    )


def _perturb_frame(
    frame_data: list[dict[str, Any]],
    noise_radius_m: float,
    rng: np.random.Generator,
) -> list[dict[str, Any]]:
    perturbed: list[dict[str, Any]] = []
    for record in frame_data:
        updated_record = dict(record)
        if str(updated_record.get("team", "")).lower() in {"home", "away"}:
            updated_record["x"] = float(updated_record.get("x", 0.0)) + float(
                rng.uniform(-noise_radius_m, noise_radius_m)
            )
            updated_record["y"] = float(updated_record.get("y", 0.0)) + float(
                rng.uniform(-noise_radius_m, noise_radius_m)
            )
        perturbed.append(updated_record)
    return perturbed
