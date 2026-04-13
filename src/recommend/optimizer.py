"""Recommendation selection and orchestration helpers."""

from __future__ import annotations

from typing import Any

from src.recommend.candidate_moves import generate_candidate_moves
from src.recommend.explain import attach_recommendation_explanations
from src.recommend.multi_player import greedy_multi_player_optimization
from src.recommend.scorer import score_candidate_moves


def select_top_movements(
    scored_candidates: list[dict[str, Any]],
    top_k: int = 3,
    min_confidence: float = 0.1,
) -> list[dict[str, Any]]:
    """Select the highest-improvement movements above a confidence threshold."""
    if top_k < 1:
        raise ValueError("top_k must be at least 1.")
    if not 0.0 <= min_confidence <= 1.0:
        raise ValueError("min_confidence must be between 0 and 1.")

    filtered_candidates: list[dict[str, Any]] = []
    for candidate in scored_candidates:
        confidence = _compute_confidence(candidate)
        if confidence < min_confidence:
            continue
        filtered_candidates.append({**candidate, "confidence": confidence})

    filtered_candidates.sort(
        key=lambda candidate: (float(candidate["improvement"]), float(candidate["confidence"])),
        reverse=True,
    )
    return attach_recommendation_explanations(filtered_candidates[:top_k])


def optimize_recommendations(
    frame_data: list[dict[str, Any]],
    focus_team: str = "home",
    top_k: int = 3,
    min_confidence: float = 0.1,
    include_multi_player: bool = True,
) -> dict[str, Any]:
    """Run the Phase 6 recommendation workflow for a frame."""
    candidates = generate_candidate_moves(frame_data, focus_team=focus_team)
    scored_candidates = score_candidate_moves(frame_data, candidates, focus_team=focus_team)
    single_player_recommendations = select_top_movements(
        scored_candidates,
        top_k=top_k,
        min_confidence=min_confidence,
    )
    result: dict[str, Any] = {"single_player": single_player_recommendations}
    if include_multi_player:
        result["multi_player"] = greedy_multi_player_optimization(frame_data, focus_team=focus_team)
    return result


def _compute_confidence(candidate: dict[str, Any]) -> float:
    pitch_control_delta = float(candidate["projected_metrics"]["pitch_control_pct"]) - float(
        candidate["baseline_metrics"]["pitch_control_pct"]
    )
    passing_delta = float(candidate["projected_metrics"]["safe_passing_lanes"]) - float(
        candidate["baseline_metrics"]["safe_passing_lanes"]
    )
    raw_confidence = (
        float(candidate["improvement"]) * 5.0 + (pitch_control_delta * 2.0) + (passing_delta * 0.1)
    )
    return max(0.0, min(1.0, raw_confidence))
