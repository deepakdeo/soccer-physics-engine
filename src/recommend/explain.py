"""Plain-English explanations for movement recommendations."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any


def explain_recommendation(recommendation: dict[str, Any]) -> str:
    """Generate a short explanation for one recommendation."""
    pitch_control_delta = float(recommendation["projected_metrics"]["pitch_control_pct"]) - float(
        recommendation["baseline_metrics"]["pitch_control_pct"]
    )
    passing_lane_delta = int(
        round(
            float(recommendation["projected_metrics"]["safe_passing_lanes"])
            - float(recommendation["baseline_metrics"]["safe_passing_lanes"])
        )
    )
    direction = _describe_direction(
        float(recommendation.get("dx", 0.0)), float(recommendation.get("dy", 0.0))
    )
    return (
        f"Move {direction} because it changes pitch control by {pitch_control_delta:+.1%} "
        f"and passing lanes by {passing_lane_delta:+d}."
    )


def attach_recommendation_explanations(
    recommendations: Sequence[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Attach explanation strings to recommendation dictionaries."""
    explained: list[dict[str, Any]] = []
    for recommendation in recommendations:
        explained.append({**recommendation, "explanation": explain_recommendation(recommendation)})
    return explained


def _describe_direction(dx: float, dy: float) -> str:
    if abs(dy) > abs(dx):
        return "wider" if dy > 0 else "narrower"
    if abs(dx) > abs(dy):
        return "forward" if dx > 0 else "deeper"
    if dx > 0 and dy > 0:
        return "forward and wider"
    if dx > 0 and dy < 0:
        return "forward and narrower"
    if dx < 0 and dy > 0:
        return "deeper and wider"
    if dx < 0 and dy < 0:
        return "deeper and narrower"
    return "slightly"
