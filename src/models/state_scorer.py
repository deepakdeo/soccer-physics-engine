"""Composite tactical state scoring."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(slots=True)
class TacticalStateInputs:
    """Inputs used to compute a normalized tactical state score."""

    pitch_control_pct: float
    safe_passing_lanes: int
    support_distance_m: float
    pressure_count: float
    team_compactness_m2: float


def compute_state_components(inputs: TacticalStateInputs) -> dict[str, float]:
    """Normalize tactical components into comparable scores."""
    pitch_control_component = float(np.clip(inputs.pitch_control_pct, 0.0, 1.0))
    passing_component = float(np.clip(inputs.safe_passing_lanes / 6.0, 0.0, 1.0))
    support_component = float(np.clip(1.0 - (inputs.support_distance_m / 30.0), 0.0, 1.0))
    pressure_component = float(np.clip(1.0 - (inputs.pressure_count / 5.0), 0.0, 1.0))
    compactness_component = float(np.clip(1.0 - (inputs.team_compactness_m2 / 2500.0), 0.0, 1.0))
    return {
        "pitch_control": pitch_control_component,
        "passing_lanes": passing_component,
        "support": support_component,
        "pressure": pressure_component,
        "team_shape": compactness_component,
    }


def score_tactical_state(inputs: TacticalStateInputs) -> float:
    """Score a tactical state on a 0-1 scale from weighted components."""
    components = compute_state_components(inputs)
    weights = {
        "pitch_control": 0.3,
        "passing_lanes": 0.25,
        "support": 0.15,
        "pressure": 0.15,
        "team_shape": 0.15,
    }
    score = sum(components[name] * weight for name, weight in weights.items())
    return float(np.clip(score, 0.0, 1.0))
