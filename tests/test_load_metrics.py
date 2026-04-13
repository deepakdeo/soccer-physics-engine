"""Tests for Phase 7 load-monitoring helpers."""

from __future__ import annotations

import numpy as np
from src.load.asymmetry import compute_directional_deceleration_asymmetry
from src.load.fatigue import compute_fatigue_curve
from src.load.flags import generate_load_monitoring_flags
from src.load.metrics import (
    compute_change_of_direction_load,
    compute_high_intensity_distance,
    count_sharp_deceleration_events,
)
from src.load.sprint_profiles import compute_sprint_profiles
from src.load.work_rate import compute_work_rate_by_possession


def test_compute_high_intensity_distance_integrates_speed_above_threshold() -> None:
    distance = compute_high_intensity_distance(np.array([4.0, 6.0, 7.0]), dt=1.0, threshold_ms=5.5)

    assert distance == 13.0


def test_count_sharp_deceleration_events_counts_threshold_crossings() -> None:
    event_count = count_sharp_deceleration_events(
        np.array([-1.0, -3.2, -4.0, 0.5]), threshold_ms2=-3.0
    )

    assert event_count == 2


def test_compute_change_of_direction_load_increases_with_turning_motion() -> None:
    velocity_vectors = np.array([[5.0, 0.0], [4.0, 3.0], [0.0, 5.0]])

    cod_load = compute_change_of_direction_load(velocity_vectors, dt=1.0)

    assert cod_load > 0.0


def test_compute_directional_deceleration_asymmetry_reports_ratio() -> None:
    asymmetry = compute_directional_deceleration_asymmetry(
        velocity_vectors=np.array([[1.0, -1.0], [1.0, 1.0], [1.0, -2.0], [1.0, 2.0]]),
        acceleration_series=np.array([-3.0, -2.0, -4.0, -5.0]),
        deceleration_threshold_ms2=-2.5,
    )

    assert asymmetry["left_load"] > 0.0
    assert asymmetry["right_load"] > 0.0
    assert 0.0 <= asymmetry["asymmetry_ratio"] <= 1.0


def test_compute_fatigue_curve_returns_windowed_metrics() -> None:
    curve = compute_fatigue_curve(
        speed_series=np.array([4.0, 6.0, 7.0, 5.0]),
        acceleration_series=np.array([1.0, 3.0, 2.0, 4.0]),
        window_size=2,
    )

    assert len(curve) == 2
    assert "mean_speed" in curve[0]


def test_compute_sprint_profiles_returns_core_summary() -> None:
    profile = compute_sprint_profiles(
        np.array([3.0, 5.8, 7.0, 6.5, 4.0]), dt=1.0, sprint_threshold_ms=5.5
    )

    assert profile["max_speed"] == 7.0
    assert profile["time_to_max_speed_s"] == 1.0


def test_compute_work_rate_by_possession_splits_distance_per_min() -> None:
    work_rate = compute_work_rate_by_possession(
        speed_series=np.array([3.0, 4.0, 5.0, 6.0]),
        possession_flags=np.array([True, True, False, False]),
        dt=30.0,
    )

    assert work_rate["in_possession_distance_per_min"] == 210.0
    assert work_rate["out_of_possession_distance_per_min"] == 330.0


def test_generate_load_monitoring_flags_uses_percentile_thresholds() -> None:
    flags = generate_load_monitoring_flags(
        player_metrics={"hi_distance": 500.0, "decel_events": 12.0},
        team_reference_metrics={
            "hi_distance": np.array([200.0, 250.0, 300.0, 350.0]),
            "decel_events": np.array([5.0, 7.0, 8.0, 9.0]),
        },
        percentile_threshold=75.0,
    )

    assert "hi_distance" in flags
    assert "decel_events" in flags
