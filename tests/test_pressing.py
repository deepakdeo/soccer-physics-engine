"""Tests for pressing metrics."""

from __future__ import annotations

import numpy as np
from src.tactical.pressing import (
    compute_counter_press_speed,
    compute_ppda,
    compute_pressing_effectiveness,
    detect_pressing_triggers,
)


def test_compute_ppda_divides_passes_by_defensive_actions() -> None:
    assert compute_ppda(opponent_passes=12, defensive_actions=4) == 3.0


def test_detect_pressing_triggers_requires_multiple_active_pressers() -> None:
    distances = np.array(
        [
            [9.0, 8.0, 11.0, 12.0],
            [7.0, 8.0, 9.0, 14.0],
        ]
    )
    closing_speeds = np.array(
        [
            [1.1, 1.2, 1.3, 0.5],
            [1.4, 1.3, 1.1, 0.2],
        ]
    )

    triggers = detect_pressing_triggers(distances, closing_speeds)

    assert np.array_equal(triggers, np.array([False, True]))


def test_compute_counter_press_speed_averages_valid_pressure_times() -> None:
    speed = compute_counter_press_speed([1.8, 2.2, 5.5, 0.9], max_window_s=5.0)

    assert np.isclose(speed, (1.8 + 2.2 + 0.9) / 3.0)


def test_compute_pressing_effectiveness_counts_quick_regains() -> None:
    effectiveness = compute_pressing_effectiveness([2.0, None, 4.5, 7.0], window_s=5.0)

    assert effectiveness == 0.5
