"""Tests for passing lane safety models."""

from __future__ import annotations

import numpy as np
from src.physics.passing_lanes import (
    compute_pass_probability,
    count_safe_passing_lanes,
    find_passing_options,
)


def test_pass_probability_without_opponents_is_near_one() -> None:
    passer = np.array([10.0, 34.0])
    receiver = np.array([30.0, 34.0])
    opponents = np.empty((0, 2))
    opponent_velocities = np.empty((0, 2))

    probability = compute_pass_probability(
        passer,
        receiver,
        opponents,
        opponent_velocities,
    )

    assert probability == 1.0


def test_pass_probability_drops_for_opponent_directly_in_path() -> None:
    passer = np.array([10.0, 34.0])
    receiver = np.array([30.0, 34.0])
    opponents = np.array([[20.0, 34.2]])
    opponent_velocities = np.array([[0.0, 0.0]])

    probability = compute_pass_probability(
        passer,
        receiver,
        opponents,
        opponent_velocities,
    )

    assert probability < 0.25


def test_find_passing_options_filters_and_sorts_candidates() -> None:
    ball_carrier = np.array([10.0, 34.0])
    teammates = np.array(
        [
            [10.0, 34.0],
            [24.0, 34.0],
            [22.0, 45.0],
        ]
    )
    opponents = np.array([[17.0, 34.1]])
    opponent_velocities = np.array([[0.0, 0.0]])

    options = find_passing_options(
        ball_carrier,
        teammates,
        opponents,
        opponent_velocities,
        min_probability=0.3,
    )

    assert len(options) == 1
    assert options[0]["receiver_index"] == 2
    assert float(options[0]["probability"]) >= 0.3


def test_count_safe_passing_lanes_counts_viable_options() -> None:
    ball_carrier = np.array([10.0, 34.0])
    teammates = np.array(
        [
            [10.0, 34.0],
            [20.0, 34.0],
            [20.0, 46.0],
            [32.0, 34.0],
        ]
    )
    opponents = np.array([[15.0, 34.0], [28.0, 34.0]])
    opponent_velocities = np.zeros((2, 2))

    safe_lane_count = count_safe_passing_lanes(
        ball_carrier,
        teammates,
        opponents,
        opponent_velocities,
        threshold=0.3,
    )

    assert safe_lane_count == 1
