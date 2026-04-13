"""Smell-test evaluation over known tactical patterns."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

KNOWN_TACTICAL_CASE_STUDIES: tuple[dict[str, Any], ...] = (
    {
        "name": "wide overload release",
        "expected_direction": "wider",
        "minimum_improvement": 0.03,
        "required_keywords": ("wider", "lanes"),
        "recommendation": {
            "dx": 0.0,
            "dy": 4.0,
            "improvement": 0.06,
            "explanation": "Move wider because it opens extra lanes and stretches pressure.",
        },
    },
    {
        "name": "half-space underlap",
        "expected_direction": "forward_narrower",
        "minimum_improvement": 0.02,
        "required_keywords": ("narrower", "forward"),
        "recommendation": {
            "dx": 4.0,
            "dy": -3.0,
            "improvement": 0.05,
            "explanation": "Move forward and narrower to attack the half-space behind the line.",
        },
    },
    {
        "name": "outside overlap",
        "expected_direction": "forward_wider",
        "minimum_improvement": 0.02,
        "required_keywords": ("forward", "wider"),
        "recommendation": {
            "dx": 4.0,
            "dy": 4.0,
            "improvement": 0.05,
            "explanation": "Move forward and wider to create width around the ball side.",
        },
    },
    {
        "name": "build-up support drop",
        "expected_direction": "deeper",
        "minimum_improvement": 0.01,
        "required_keywords": ("deeper", "support"),
        "recommendation": {
            "dx": -4.0,
            "dy": 0.0,
            "improvement": 0.03,
            "explanation": "Move deeper to offer support and improve the buildup outlet.",
        },
    },
    {
        "name": "back-line stretch",
        "expected_direction": "forward",
        "minimum_improvement": 0.02,
        "required_keywords": ("forward", "stretch"),
        "recommendation": {
            "dx": 4.0,
            "dy": 0.0,
            "improvement": 0.04,
            "explanation": "Move forward to stretch the line and open depth behind pressure.",
        },
    },
    {
        "name": "counter-press collapse",
        "expected_direction": "narrower",
        "minimum_improvement": 0.01,
        "required_keywords": ("narrower", "pressure"),
        "recommendation": {
            "dx": 0.0,
            "dy": -4.0,
            "improvement": 0.03,
            "explanation": "Move narrower to tighten pressure around the turnover zone.",
        },
    },
    {
        "name": "weak-side switch option",
        "expected_direction": "wider",
        "minimum_improvement": 0.02,
        "required_keywords": ("wider", "switch"),
        "recommendation": {
            "dx": 0.0,
            "dy": 4.0,
            "improvement": 0.04,
            "explanation": "Move wider to stay available for the switch and preserve width.",
        },
    },
    {
        "name": "third-man support",
        "expected_direction": "forward",
        "minimum_improvement": 0.01,
        "required_keywords": ("forward", "support"),
        "recommendation": {
            "dx": 3.0,
            "dy": 1.0,
            "improvement": 0.03,
            "explanation": "Move forward to become the third-man support option between lines.",
        },
    },
    {
        "name": "rest-defense reset",
        "expected_direction": "deeper",
        "minimum_improvement": 0.01,
        "required_keywords": ("deeper", "cover"),
        "recommendation": {
            "dx": -3.0,
            "dy": 0.5,
            "improvement": 0.02,
            "explanation": (
                "Move deeper to recover cover behind the ball and stabilize rest defense."
            ),
        },
    },
    {
        "name": "box-arrival timing",
        "expected_direction": "forward",
        "minimum_improvement": 0.02,
        "required_keywords": ("forward", "box"),
        "recommendation": {
            "dx": 5.0,
            "dy": 0.0,
            "improvement": 0.05,
            "explanation": "Move forward to attack the box at the right moment after circulation.",
        },
    },
)


def get_default_case_studies() -> list[dict[str, Any]]:
    """Return the built-in library of Phase 8 tactical smell tests."""
    return [dict(case_study) for case_study in KNOWN_TACTICAL_CASE_STUDIES]


def evaluate_case_studies(
    case_studies: Sequence[Mapping[str, Any]] | None = None,
) -> dict[str, Any]:
    """Evaluate recommendation smell tests across known tactical patterns.

    Args:
        case_studies: Optional custom case-study dictionaries. Each case should
            define `expected_direction`, `minimum_improvement`,
            `required_keywords`, and `recommendation`.

    Returns:
        Aggregate pass/fail summary with per-case reasoning.
    """
    studies = list(case_studies) if case_studies is not None else get_default_case_studies()
    results: list[dict[str, Any]] = []
    passed_count = 0

    for case_study in studies:
        recommendation = dict(case_study.get("recommendation", {}))
        expected_direction = str(case_study.get("expected_direction", ""))
        required_keywords = tuple(
            str(keyword).lower() for keyword in case_study.get("required_keywords", ())
        )
        minimum_improvement = float(case_study.get("minimum_improvement", 0.0))
        explanation = str(recommendation.get("explanation", "")).lower()
        actual_direction = _bucket_direction(
            float(recommendation.get("dx", 0.0)),
            float(recommendation.get("dy", 0.0)),
        )
        direction_ok = actual_direction == expected_direction
        improvement_ok = float(recommendation.get("improvement", 0.0)) >= minimum_improvement
        keywords_ok = all(keyword in explanation for keyword in required_keywords)
        passed = direction_ok and improvement_ok and keywords_ok
        passed_count += int(passed)
        results.append(
            {
                "name": str(case_study.get("name", "")),
                "passed": passed,
                "expected_direction": expected_direction,
                "actual_direction": actual_direction,
                "improvement": float(recommendation.get("improvement", 0.0)),
                "required_keywords_present": keywords_ok,
            }
        )

    case_count = len(results)
    return {
        "case_count": case_count,
        "passed_count": passed_count,
        "pass_rate": (passed_count / case_count) if case_count > 0 else 0.0,
        "overall_pass": passed_count == case_count and case_count > 0,
        "results": results,
    }


def _bucket_direction(dx: float, dy: float) -> str:
    if abs(dx) <= 1.0 and abs(dy) > 1.0:
        return "wider" if dy > 0 else "narrower"
    if abs(dy) <= 1.0 and abs(dx) > 1.0:
        return "forward" if dx > 0 else "deeper"
    if dx > 0 and dy > 0:
        return "forward_wider"
    if dx > 0 and dy < 0:
        return "forward_narrower"
    if dx < 0 and dy > 0:
        return "deeper_wider"
    if dx < 0 and dy < 0:
        return "deeper_narrower"
    return "static"
