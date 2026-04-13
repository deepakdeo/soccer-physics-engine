"""Tests for position smoothing."""

from __future__ import annotations

import numpy as np
from src.physics.smoothing import smooth_positions


def test_smooth_positions_handles_short_arrays() -> None:
    positions = np.array([0.0, 1.0, 2.0])

    smoothed = smooth_positions(positions, window=7, polyorder=2)

    assert smoothed.shape == positions.shape


def test_smooth_positions_interpolates_nans_before_filtering() -> None:
    positions = np.array([0.0, np.nan, 2.0, 3.0, 4.0, 5.0, 6.0])

    smoothed = smooth_positions(positions)

    assert not np.isnan(smoothed).any()
