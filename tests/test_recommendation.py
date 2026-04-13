"""Tests for the Phase 6 recommendation engine."""

from __future__ import annotations

from src.recommend.candidate_moves import apply_candidate_move, generate_candidate_moves
from src.recommend.explain import attach_recommendation_explanations, explain_recommendation
from src.recommend.multi_player import greedy_multi_player_optimization
from src.recommend.optimizer import optimize_recommendations, select_top_movements
from src.recommend.scorer import evaluate_frame_state, score_candidate_moves


def test_generate_candidate_moves_creates_eight_directions_for_each_distance(
    recommendation_frame: list[dict[str, float | str | bool]],
) -> None:
    candidates = generate_candidate_moves(recommendation_frame, focus_team="home")

    assert len(candidates) == 32
    assert all(candidate["player_id"] in {"home_2", "home_3"} for candidate in candidates)


def test_apply_candidate_move_updates_only_target_player(
    recommendation_frame: list[dict[str, float | str | bool]],
) -> None:
    candidate = generate_candidate_moves(recommendation_frame, focus_team="home")[0]
    moved_frame = apply_candidate_move(recommendation_frame, candidate)

    assert moved_frame[int(candidate["player_index"])]["x"] == candidate["to_x"]
    assert moved_frame[0]["x"] == recommendation_frame[0]["x"]


def test_evaluate_frame_state_returns_normalized_score(
    recommendation_frame: list[dict[str, float | str | bool]],
) -> None:
    frame_state = evaluate_frame_state(recommendation_frame, focus_team="home")

    assert 0.0 <= frame_state.score <= 1.0
    assert "pitch_control_pct" in frame_state.metrics


def test_score_candidate_moves_returns_improvements_and_metrics(
    recommendation_frame: list[dict[str, float | str | bool]],
) -> None:
    candidates = generate_candidate_moves(recommendation_frame, focus_team="home")
    scored = score_candidate_moves(recommendation_frame, candidates[:4], focus_team="home")

    assert len(scored) == 4
    assert all("improvement" in candidate for candidate in scored)
    assert all("projected_metrics" in candidate for candidate in scored)


def test_select_top_movements_sorts_candidates_and_adds_explanations(
    recommendation_frame: list[dict[str, float | str | bool]],
) -> None:
    candidates = generate_candidate_moves(recommendation_frame, focus_team="home")
    scored = score_candidate_moves(recommendation_frame, candidates, focus_team="home")
    top_moves = select_top_movements(scored, top_k=3, min_confidence=0.0)

    assert len(top_moves) == 3
    assert "explanation" in top_moves[0]
    assert float(top_moves[0]["improvement"]) >= float(top_moves[-1]["improvement"])


def test_explain_recommendation_formats_pitch_control_and_lane_changes() -> None:
    explanation = explain_recommendation(
        {
            "dx": 0.0,
            "dy": 2.0,
            "baseline_metrics": {"pitch_control_pct": 0.50, "safe_passing_lanes": 2.0},
            "projected_metrics": {"pitch_control_pct": 0.57, "safe_passing_lanes": 3.0},
        }
    )

    assert "wider" in explanation
    assert "passing lanes by +1" in explanation


def test_attach_recommendation_explanations_adds_explanation_key() -> None:
    explained = attach_recommendation_explanations(
        [
            {
                "dx": 1.0,
                "dy": 0.0,
                "baseline_metrics": {"pitch_control_pct": 0.5, "safe_passing_lanes": 1.0},
                "projected_metrics": {"pitch_control_pct": 0.55, "safe_passing_lanes": 2.0},
            }
        ]
    )

    assert "explanation" in explained[0]


def test_greedy_multi_player_optimization_returns_selected_moves(
    recommendation_frame: list[dict[str, float | str | bool]],
) -> None:
    optimization = greedy_multi_player_optimization(
        recommendation_frame,
        focus_team="home",
        max_players=2,
    )

    assert len(optimization["selected_moves"]) <= 2
    assert optimization["final_score"] >= optimization["baseline_score"]


def test_optimize_recommendations_returns_single_and_multi_player_results(
    recommendation_frame: list[dict[str, float | str | bool]],
) -> None:
    optimized = optimize_recommendations(
        recommendation_frame,
        focus_team="home",
        top_k=2,
        min_confidence=0.0,
    )

    assert len(optimized["single_player"]) == 2
    assert "multi_player" in optimized
