"""Passing lane safety models."""

from __future__ import annotations

import numpy as np

INTERCEPTION_CORRIDOR_M = 2.0
OPPONENT_BASE_SPEED_MS = 5.5


def compute_pass_probability(
    passer_pos: np.ndarray,
    receiver_pos: np.ndarray,
    opponent_positions: np.ndarray,
    opponent_velocities: np.ndarray,
    ball_speed: float = 15.0,
) -> float:
    """Estimate successful pass probability given nearby interception threats.

    Args:
        passer_pos: Ball-carrier position `(x, y)` in meters.
        receiver_pos: Target receiver position `(x, y)` in meters.
        opponent_positions: Opponent positions with shape `(n_opponents, 2)`.
        opponent_velocities: Opponent velocities with shape `(n_opponents, 2)`.
        ball_speed: Ball travel speed in meters per second.

    Returns:
        Estimated pass completion probability in `[0, 1]`.
    """
    if ball_speed <= 0:
        raise ValueError("ball_speed must be positive.")

    passer = _as_point(passer_pos, "passer_pos")
    receiver = _as_point(receiver_pos, "receiver_pos")
    opponent_pos, opponent_vel = _validate_opponent_state(opponent_positions, opponent_velocities)

    pass_vector = receiver - passer
    pass_length = float(np.linalg.norm(pass_vector))
    if pass_length == 0.0:
        return 0.0

    if opponent_pos.shape[0] == 0:
        return 1.0

    pass_direction = pass_vector / pass_length
    total_threat = 0.0
    for opponent_position, opponent_velocity in zip(opponent_pos, opponent_vel, strict=True):
        threat = _compute_interception_threat(
            passer,
            receiver,
            pass_direction,
            pass_length,
            opponent_position,
            opponent_velocity,
            ball_speed,
        )
        total_threat += threat

    probability = float(np.exp(-total_threat))
    return float(np.asarray(np.clip(probability, 0.0, 1.0), dtype=float))


def find_passing_options(
    ball_carrier_pos: np.ndarray,
    team_positions: np.ndarray,
    opponent_positions: np.ndarray,
    opponent_velocities: np.ndarray,
    min_probability: float = 0.3,
) -> list[dict[str, float | int]]:
    """List viable passing options for a ball carrier.

    Args:
        ball_carrier_pos: Ball-carrier position `(x, y)` in meters.
        team_positions: Candidate receiver positions with shape `(n_teammates, 2)`.
        opponent_positions: Opponent positions with shape `(n_opponents, 2)`.
        opponent_velocities: Opponent velocities with shape `(n_opponents, 2)`.
        min_probability: Minimum required completion probability.

    Returns:
        Sorted list of viable passing options with receiver index, receiver
        coordinates, probability, and pass distance.
    """
    if not 0.0 <= min_probability <= 1.0:
        raise ValueError("min_probability must be between 0 and 1.")

    ball_carrier = _as_point(ball_carrier_pos, "ball_carrier_pos")
    teammates = _as_points(team_positions, "team_positions")
    _validate_opponent_state(opponent_positions, opponent_velocities)

    options: list[dict[str, float | int]] = []
    for receiver_index, receiver in enumerate(teammates):
        if np.allclose(receiver, ball_carrier):
            continue
        probability = compute_pass_probability(
            ball_carrier,
            receiver,
            opponent_positions,
            opponent_velocities,
        )
        if probability < min_probability:
            continue
        options.append(
            {
                "receiver_index": receiver_index,
                "receiver_x": float(receiver[0]),
                "receiver_y": float(receiver[1]),
                "probability": probability,
                "distance": float(np.linalg.norm(receiver - ball_carrier)),
            }
        )

    return sorted(options, key=lambda option: float(option["probability"]), reverse=True)


def count_safe_passing_lanes(
    ball_carrier_pos: np.ndarray,
    team_positions: np.ndarray,
    opponent_positions: np.ndarray,
    opponent_velocities: np.ndarray,
    threshold: float = 0.5,
) -> int:
    """Count passing options at or above a given safety threshold."""
    options = find_passing_options(
        ball_carrier_pos,
        team_positions,
        opponent_positions,
        opponent_velocities,
        min_probability=threshold,
    )
    return len(options)


def _compute_interception_threat(
    passer: np.ndarray,
    receiver: np.ndarray,
    pass_direction: np.ndarray,
    pass_length: float,
    opponent_position: np.ndarray,
    opponent_velocity: np.ndarray,
    ball_speed: float,
) -> float:
    relative_vector = opponent_position - passer
    along_pass = float(np.dot(relative_vector, pass_direction))
    if along_pass <= 0.0 or along_pass >= pass_length:
        return 0.0

    closest_point = passer + (along_pass * pass_direction)
    lateral_distance = float(np.linalg.norm(opponent_position - closest_point))
    if lateral_distance > INTERCEPTION_CORRIDOR_M:
        return 0.0

    ball_time = along_pass / ball_speed
    opponent_speed = min(
        OPPONENT_BASE_SPEED_MS + max(float(np.linalg.norm(opponent_velocity)), 0.0),
        8.0,
    )
    opponent_time = lateral_distance / max(opponent_speed, 0.1)
    timing_margin = ball_time - opponent_time

    lateral_factor = 1.0 - (lateral_distance / INTERCEPTION_CORRIDOR_M)
    if timing_margin >= 0.0:
        return 1.5 + lateral_factor + min(timing_margin * 2.0, 2.0)
    return max(float(lateral_factor * np.exp(timing_margin)), 0.0)


def _as_point(values: np.ndarray, label: str) -> np.ndarray:
    point = np.asarray(values, dtype=float)
    if point.shape != (2,):
        raise ValueError(f"{label} must have shape (2,).")
    return point


def _as_points(values: np.ndarray, label: str) -> np.ndarray:
    points = np.asarray(values, dtype=float)
    if points.ndim != 2 or points.shape[1] != 2:
        raise ValueError(f"{label} must have shape (n_points, 2).")
    return points


def _validate_opponent_state(
    positions: np.ndarray,
    velocities: np.ndarray,
) -> tuple[np.ndarray, np.ndarray]:
    position_array = _as_points(positions, "opponent_positions")
    velocity_array = _as_points(velocities, "opponent_velocities")
    if position_array.shape != velocity_array.shape:
        raise ValueError("opponent_positions and opponent_velocities must have the same shape.")
    return position_array, velocity_array
