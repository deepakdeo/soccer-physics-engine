"""Tests for Phase 7 player intelligence."""

from __future__ import annotations

import numpy as np
from src.player_intel.heat_maps import compute_player_heat_map
from src.player_intel.off_ball_runs import classify_off_ball_run, classify_off_ball_run_sequence
from src.player_intel.pass_network import build_pass_network_matrix, compute_pass_network_centrality
from src.player_intel.progressive_passes import identify_progressive_passes
from src.player_intel.role_detection import detect_player_roles
from src.player_intel.space_creation import compute_space_creation_score


def test_classify_off_ball_run_detects_overlap() -> None:
    run_type = classify_off_ball_run(
        start_position=np.array([30.0, 20.0]),
        end_position=np.array([38.0, 26.0]),
        attacking_direction="positive",
    )

    assert run_type == "overlap"


def test_classify_off_ball_run_sequence_detects_dropping() -> None:
    positions = np.array([[40.0, 34.0], [38.0, 34.0], [34.0, 33.0]])

    run_type = classify_off_ball_run_sequence(positions, attacking_direction="positive")

    assert run_type == "dropping"


def test_compute_space_creation_score_rewards_defender_displacement() -> None:
    score = compute_space_creation_score(
        attacker_position_before=np.array([40.0, 30.0]),
        attacker_position_after=np.array([48.0, 34.0]),
        defender_positions_before=np.array([[42.0, 30.0], [43.0, 34.0]]),
        defender_positions_after=np.array([[47.0, 30.0], [48.0, 36.0]]),
    )

    assert score > 0.0


def test_detect_player_roles_returns_one_role_per_player() -> None:
    average_positions = np.array(
        [
            [10.0, 14.0],
            [12.0, 30.0],
            [14.0, 48.0],
            [26.0, 14.0],
            [30.0, 34.0],
            [32.0, 54.0],
            [50.0, 12.0],
            [54.0, 34.0],
            [52.0, 56.0],
            [78.0, 34.0],
        ]
    )

    roles = detect_player_roles(average_positions, n_roles=5)

    assert len(roles) == len(average_positions)
    assert "forward" in roles


def test_compute_player_heat_map_returns_density_grid() -> None:
    positions = np.array(
        [
            [20.0, 20.0],
            [22.0, 22.0],
            [24.0, 24.0],
            [26.0, 26.0],
        ]
    )

    x_grid, y_grid, density = compute_player_heat_map(positions, grid_size=(10, 8))

    assert x_grid.shape == (10,)
    assert y_grid.shape == (8,)
    assert density.shape == (8, 10)


def test_build_pass_network_matrix_and_centrality() -> None:
    pass_events = [
        {"passer_id": "p1", "receiver_id": "p2"},
        {"passer_id": "p2", "receiver_id": "p3"},
        {"passer_id": "p1", "receiver_id": "p3"},
    ]
    matrix = build_pass_network_matrix(pass_events, player_ids=["p1", "p2", "p3"])
    centrality = compute_pass_network_centrality(matrix)

    assert matrix[0, 1] == 1.0
    assert centrality.shape == (3,)


def test_identify_progressive_passes_filters_by_forward_progress() -> None:
    pass_events = [
        {"start_x": 20.0, "end_x": 35.0, "passer_id": "p1"},
        {"start_x": 40.0, "end_x": 45.0, "passer_id": "p2"},
    ]

    progressive = identify_progressive_passes(
        pass_events, attacking_direction="positive", min_progress_m=10.0
    )

    assert len(progressive) == 1
    assert progressive[0]["passer_id"] == "p1"
