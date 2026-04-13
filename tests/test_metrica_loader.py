"""Tests for the Metrica tracking loader."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd
import polars as pl
from src.io import metrica_loader


class FakeDataset:
    """Minimal dataset double exposing a pandas conversion method."""

    def __init__(self, frame: pd.DataFrame) -> None:
        self._frame = frame

    def to_pandas(self) -> pd.DataFrame:
        """Return the underlying pandas DataFrame."""
        return self._frame


def test_load_tracking_data_converts_wide_frame_to_long(monkeypatch: Any) -> None:
    wide_frame = pd.DataFrame(
        {
            "Frame": [1, 2],
            "Time [s]": [0.0, 0.04],
            "Home_1_x": [0.1, 0.2],
            "Home_1_y": [0.2, 0.3],
            "Away_1_x": [0.8, 0.7],
            "Away_1_y": [0.7, 0.6],
            "ball_x": [0.5, 0.55],
            "ball_y": [0.5, 0.45],
        }
    )

    monkeypatch.setattr(
        metrica_loader,
        "_resolve_match_paths",
        lambda _match_id: {
            "home_data": Path("home.csv"),
            "away_data": Path("away.csv"),
            "event_data": Path("events.csv"),
        },
    )
    monkeypatch.setattr(
        metrica_loader,
        "_load_kloppy_dataset",
        lambda _paths: FakeDataset(wide_frame),
    )

    loaded = metrica_loader.load_tracking_data("sample_game_1")

    assert isinstance(loaded, pl.DataFrame)
    assert loaded.height == 4
    assert set(loaded["team"].to_list()) == {"home", "away"}
    assert loaded["x"].max() == 84.0
    assert loaded["ball_y"].min() == 30.6
