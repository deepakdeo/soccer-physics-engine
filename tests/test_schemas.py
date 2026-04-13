"""Tests for tracking data validation."""

from __future__ import annotations

import polars as pl
import pytest
from src.io.schemas import validate_tracking_data


def test_validate_tracking_data_accepts_valid_frame() -> None:
    frame = pl.DataFrame(
        {
            "frame_id": [1, 1],
            "timestamp": [0.0, 0.0],
            "player_id": ["home_1", "away_1"],
            "team": ["home", "away"],
            "x": [10.0, 95.0],
            "y": [20.0, 40.0],
        }
    )

    validated = validate_tracking_data(frame)

    assert validated.equals(frame)


def test_validate_tracking_data_rejects_out_of_bounds_values() -> None:
    frame = pl.DataFrame(
        {
            "frame_id": [1],
            "timestamp": [0.0],
            "player_id": ["home_1"],
            "team": ["home"],
            "x": [120.0],
            "y": [20.0],
        }
    )

    with pytest.raises(ValueError, match="schema validation"):
        validate_tracking_data(frame)


def test_validate_tracking_data_rejects_null_required_values() -> None:
    frame = pl.DataFrame(
        {
            "frame_id": [1],
            "timestamp": [0.0],
            "player_id": ["home_1"],
            "team": ["home"],
            "x": [None],
            "y": [20.0],
        }
    )

    with pytest.raises(ValueError, match="null values"):
        validate_tracking_data(frame)
