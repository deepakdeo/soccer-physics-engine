"""Recommendation package."""

from src.recommend.candidate_moves import apply_candidate_move, generate_candidate_moves
from src.recommend.explain import attach_recommendation_explanations, explain_recommendation
from src.recommend.multi_player import greedy_multi_player_optimization
from src.recommend.optimizer import optimize_recommendations, select_top_movements
from src.recommend.scorer import FrameStateScore, evaluate_frame_state, score_candidate_moves

__all__ = [
    "FrameStateScore",
    "apply_candidate_move",
    "attach_recommendation_explanations",
    "evaluate_frame_state",
    "explain_recommendation",
    "generate_candidate_moves",
    "greedy_multi_player_optimization",
    "optimize_recommendations",
    "score_candidate_moves",
    "select_top_movements",
]
