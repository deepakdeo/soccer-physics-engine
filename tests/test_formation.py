"""Tests for formation inference."""

from __future__ import annotations

import numpy as np
from src.tactical.formation import (
    compute_average_positions,
    detect_formation,
    infer_formation_lines,
)


def test_compute_average_positions_averages_across_frames() -> None:
    frames = np.array(
        [
            [[10.0, 20.0], [20.0, 30.0]],
            [[12.0, 24.0], [18.0, 32.0]],
        ]
    )

    averages = compute_average_positions(frames)

    assert np.allclose(averages, np.array([[11.0, 22.0], [19.0, 31.0]]))


def test_infer_formation_lines_detects_four_three_three_structure() -> None:
    average_positions = np.array(
        [
            [15.0, 10.0],
            [16.0, 24.0],
            [17.0, 44.0],
            [15.0, 58.0],
            [35.0, 14.0],
            [37.0, 34.0],
            [34.0, 54.0],
            [58.0, 12.0],
            [60.0, 34.0],
            [57.0, 56.0],
        ]
    )

    line_counts = infer_formation_lines(average_positions)

    assert line_counts == (4, 3, 3)


def test_detect_formation_formats_line_counts() -> None:
    average_positions = np.array(
        [
            [14.0, 12.0],
            [16.0, 26.0],
            [16.0, 42.0],
            [14.0, 56.0],
            [34.0, 20.0],
            [35.0, 34.0],
            [33.0, 48.0],
            [56.0, 14.0],
            [58.0, 34.0],
            [55.0, 54.0],
        ]
    )

    formation = detect_formation(average_positions)

    assert formation == "4-3-3"
