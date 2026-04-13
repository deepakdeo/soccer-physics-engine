"""Metrica tracking data loading helpers."""

from __future__ import annotations

import inspect
import os
import re
from pathlib import Path
from typing import Any

import pandas as pd
import polars as pl

from src.io.schemas import validate_tracking_data
from src.utils.constants import PITCH_LENGTH_M, PITCH_WIDTH_M, TRACKING_FPS

MATCH_FILE_NAMES: dict[str, dict[str, str]] = {
    "sample_game_1": {
        "home_data": "Sample_Game_1_RawTrackingData_Home_Team.csv",
        "away_data": "Sample_Game_1_RawTrackingData_Away_Team.csv",
        "event_data": "Sample_Game_1_RawEventsData.csv",
    },
    "sample_game_2": {
        "home_data": "Sample_Game_2_RawTrackingData_Home_Team.csv",
        "away_data": "Sample_Game_2_RawTrackingData_Away_Team.csv",
        "event_data": "Sample_Game_2_RawEventsData.csv",
    },
}

LONG_COLUMN_RENAMES: dict[str, str] = {
    "frame": "frame_id",
    "frameid": "frame_id",
    "time": "timestamp",
    "time_s": "timestamp",
    "time [s]": "timestamp",
    "player": "player_id",
    "playerid": "player_id",
    "ballx": "ball_x",
    "bally": "ball_y",
}


def load_tracking_data(match_id: str) -> pl.DataFrame:
    """Load and normalize tracking data for one of the Metrica sample matches.

    Args:
        match_id: Logical match identifier, currently `sample_game_1` or
            `sample_game_2`.

    Returns:
        A validated Polars DataFrame with one row per player-frame observation.

    Raises:
        FileNotFoundError: If the expected Metrica source files are missing.
        ValueError: If `match_id` is unsupported or the resulting schema is invalid.
    """
    paths = _resolve_match_paths(match_id)
    dataset = _load_kloppy_dataset(paths)
    frame = _dataset_to_polars(dataset)
    return validate_tracking_data(frame)


def _resolve_match_paths(match_id: str) -> dict[str, Path]:
    normalized_match_id = match_id.lower()
    if normalized_match_id not in MATCH_FILE_NAMES:
        supported_matches = ", ".join(sorted(MATCH_FILE_NAMES))
        raise ValueError(
            f"Unsupported match_id '{match_id}'. Expected one of: {supported_matches}."
        )

    root = Path(os.getenv("METRICA_DATA_DIR", "data/raw/metrica"))
    resolved_paths = {
        key: root / filename for key, filename in MATCH_FILE_NAMES[normalized_match_id].items()
    }

    required_keys = ("home_data", "away_data")
    missing_paths = [
        resolved_paths[key] for key in required_keys if not resolved_paths[key].exists()
    ]
    if missing_paths:
        missing_str = ", ".join(str(path) for path in missing_paths)
        raise FileNotFoundError(
            "Missing Metrica tracking files. Place the sample data under "
            f"'{root}' or update METRICA_DATA_DIR. Missing: {missing_str}"
        )

    return resolved_paths


def _load_kloppy_dataset(paths: dict[str, Path]) -> Any:
    try:
        from kloppy import load_metrica_tracking_data
    except ModuleNotFoundError as exc:
        raise ModuleNotFoundError(
            "Kloppy is required to load Metrica tracking data. Install project dependencies first."
        ) from exc

    loader_signature = inspect.signature(load_metrica_tracking_data)
    candidate_kwargs: dict[str, Any] = {
        "home_data": str(paths["home_data"]),
        "away_data": str(paths["away_data"]),
    }
    if paths["event_data"].exists():
        candidate_kwargs["event_data"] = str(paths["event_data"])
    if "sample_rate" in loader_signature.parameters:
        candidate_kwargs["sample_rate"] = TRACKING_FPS

    valid_kwargs = {
        name: value
        for name, value in candidate_kwargs.items()
        if name in loader_signature.parameters
    }
    return load_metrica_tracking_data(**valid_kwargs)


def _dataset_to_polars(dataset: Any) -> pl.DataFrame:
    raw_frame = _coerce_dataset_to_pandas(dataset)
    normalized_frame = (
        _normalize_long_tracking_frame(raw_frame)
        if _has_required_long_columns(raw_frame)
        else _reshape_wide_tracking_frame(raw_frame)
    )
    return pl.DataFrame(normalized_frame.to_dict(orient="list"))


def _coerce_dataset_to_pandas(dataset: Any) -> pd.DataFrame:
    if isinstance(dataset, pd.DataFrame):
        return dataset.copy()
    if hasattr(dataset, "to_df"):
        frame = dataset.to_df()
        return frame.copy() if isinstance(frame, pd.DataFrame) else pd.DataFrame(frame)
    if hasattr(dataset, "to_pandas"):
        frame = dataset.to_pandas()
        return frame.copy() if isinstance(frame, pd.DataFrame) else pd.DataFrame(frame)
    raise TypeError("Unsupported Kloppy dataset type. Expected a pandas-compatible dataset.")


def _has_required_long_columns(frame: pd.DataFrame) -> bool:
    normalized_columns = {_normalize_column_name(column) for column in frame.columns}
    required = {"frame_id", "timestamp", "player_id", "team", "x", "y"}
    return required.issubset(normalized_columns)


def _normalize_long_tracking_frame(frame: pd.DataFrame) -> pd.DataFrame:
    renamed_columns = {
        column: LONG_COLUMN_RENAMES.get(
            _normalize_column_name(column), _normalize_column_name(column)
        )
        for column in frame.columns
    }
    normalized = frame.rename(columns=renamed_columns).copy()
    if "ball_x" not in normalized.columns:
        normalized["ball_x"] = pd.NA
    if "ball_y" not in normalized.columns:
        normalized["ball_y"] = pd.NA

    output = normalized[
        ["frame_id", "timestamp", "player_id", "team", "x", "y", "ball_x", "ball_y"]
    ].copy()
    output["team"] = output["team"].astype(str).str.lower()
    output["player_id"] = output["player_id"].astype(str)
    output["frame_id"] = output["frame_id"].astype(int)
    output["timestamp"] = output["timestamp"].astype(float)
    for column, scale in (
        ("x", PITCH_LENGTH_M),
        ("ball_x", PITCH_LENGTH_M),
        ("y", PITCH_WIDTH_M),
        ("ball_y", PITCH_WIDTH_M),
    ):
        output[column] = _scale_series_to_meters(output[column], scale)
    return output


def _reshape_wide_tracking_frame(frame: pd.DataFrame) -> pd.DataFrame:
    frame_id_series = _find_series(frame, ["frame_id", "frame", "frameid"])
    timestamp_series = _find_series(frame, ["timestamp", "time", "time_s", "time [s]"])
    if frame_id_series is None:
        frame_id_series = pd.Series(range(len(frame)), name="frame_id")
    if timestamp_series is None:
        timestamp_series = (
            pd.Series(range(len(frame)), name="timestamp", dtype=float) / TRACKING_FPS
        )

    ball_x_series = _find_series(frame, ["ball_x", "ballx"])
    ball_y_series = _find_series(frame, ["ball_y", "bally"])

    player_records: list[pd.DataFrame] = []
    for label in _discover_player_labels(frame.columns):
        x_column = f"{label}_x"
        y_column = f"{label}_y"
        if x_column not in frame.columns or y_column not in frame.columns:
            continue

        team = _infer_team_name(label)
        player_records.append(
            pd.DataFrame(
                {
                    "frame_id": frame_id_series.astype(int),
                    "timestamp": timestamp_series.astype(float),
                    "player_id": _format_player_id(label),
                    "team": team,
                    "x": _scale_series_to_meters(frame[x_column], PITCH_LENGTH_M),
                    "y": _scale_series_to_meters(frame[y_column], PITCH_WIDTH_M),
                    "ball_x": (
                        _scale_series_to_meters(ball_x_series, PITCH_LENGTH_M)
                        if ball_x_series is not None
                        else pd.Series(pd.NA, index=frame.index, dtype="float64")
                    ),
                    "ball_y": (
                        _scale_series_to_meters(ball_y_series, PITCH_WIDTH_M)
                        if ball_y_series is not None
                        else pd.Series(pd.NA, index=frame.index, dtype="float64")
                    ),
                }
            )
        )

    if not player_records:
        raise ValueError("Unable to locate player coordinate columns in the tracking data.")

    return pd.concat(player_records, ignore_index=True)


def _discover_player_labels(columns: pd.Index[str]) -> list[str]:
    labels: set[str] = set()
    for column in columns:
        match = re.match(r"(.+)_([xy])$", column, flags=re.IGNORECASE)
        if match is None:
            continue
        label = match.group(1)
        if _normalize_column_name(label) == "ball":
            continue
        labels.add(label)
    return sorted(labels)


def _find_series(frame: pd.DataFrame, aliases: list[str]) -> pd.Series[Any] | None:
    alias_set = set(aliases)
    for column in frame.columns:
        if _normalize_column_name(column) in alias_set:
            return frame[column]
    return None


def _normalize_column_name(column: str) -> str:
    lowered = column.strip().lower()
    normalized = re.sub(r"[\s\[\]-]+", "_", lowered)
    return normalized.strip("_")


def _format_player_id(label: str) -> str:
    return re.sub(r"\W+", "_", label.strip().lower()).strip("_")


def _infer_team_name(label: str) -> str:
    normalized = label.strip().lower()
    if normalized.startswith("home"):
        return "home"
    if normalized.startswith("away"):
        return "away"
    raise ValueError(f"Unable to infer team from column label '{label}'.")


def _scale_series_to_meters(series: pd.Series[Any], scale: float) -> pd.Series[Any]:
    numeric = pd.to_numeric(series, errors="coerce")
    finite_values = numeric.dropna()
    if finite_values.empty:
        return numeric.astype(float)
    return (
        numeric.astype(float) * scale if finite_values.abs().max() <= 1.5 else numeric.astype(float)
    )
