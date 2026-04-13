"""Greedy multi-player recommendation search."""

from __future__ import annotations

from typing import Any

from src.recommend.candidate_moves import apply_candidate_move, generate_candidate_moves
from src.recommend.scorer import evaluate_frame_state, score_candidate_moves


def greedy_multi_player_optimization(
    frame_data: list[dict[str, Any]],
    focus_team: str = "home",
    max_players: int = 3,
) -> dict[str, Any]:
    """Greedy optimization over multiple off-ball player moves."""
    if max_players < 1:
        raise ValueError("max_players must be at least 1.")

    current_frame = [dict(record) for record in frame_data]
    moved_player_ids: set[str] = set()
    selected_moves: list[dict[str, Any]] = []
    baseline_score = evaluate_frame_state(current_frame, focus_team=focus_team).score

    for _ in range(max_players):
        candidates = generate_candidate_moves(
            current_frame,
            focus_team=focus_team,
            excluded_player_ids=moved_player_ids,
        )
        if not candidates:
            break
        scored_candidates = score_candidate_moves(current_frame, candidates, focus_team=focus_team)
        best_move = max(scored_candidates, key=lambda candidate: float(candidate["improvement"]))
        if float(best_move["improvement"]) <= 0.0:
            break
        selected_moves.append(best_move)
        moved_player_ids.add(str(best_move["player_id"]))
        current_frame = apply_candidate_move(current_frame, best_move)

    final_score = evaluate_frame_state(current_frame, focus_team=focus_team).score
    return {
        "selected_moves": selected_moves,
        "baseline_score": baseline_score,
        "final_score": final_score,
        "total_improvement": final_score - baseline_score,
        "final_frame": current_frame,
    }
