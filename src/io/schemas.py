"""Validation schemas for provider data."""

from __future__ import annotations

import pandas as pd
import pandera.pandas as pa
import polars as pl
from pandera.errors import SchemaError, SchemaErrors

from src.utils.constants import PITCH_LENGTH_M, PITCH_WIDTH_M

TRACKING_DATA_SCHEMA = pa.DataFrameSchema(
    {
        "frame_id": pa.Column(int, nullable=False),
        "timestamp": pa.Column(float, checks=pa.Check.ge(0.0), nullable=False, coerce=True),
        "player_id": pa.Column(str, nullable=False),
        "team": pa.Column(
            str,
            checks=pa.Check.isin(["home", "away"]),
            nullable=False,
            coerce=True,
        ),
        "x": pa.Column(
            float,
            checks=[pa.Check.ge(0.0), pa.Check.le(PITCH_LENGTH_M)],
            nullable=False,
            coerce=True,
        ),
        "y": pa.Column(
            float,
            checks=[pa.Check.ge(0.0), pa.Check.le(PITCH_WIDTH_M)],
            nullable=False,
            coerce=True,
        ),
    },
    strict=False,
    coerce=True,
)


def validate_tracking_data(frame: pl.DataFrame) -> pl.DataFrame:
    """Validate tracking data shape, nulls, and pitch bounds.

    Args:
        frame: Long-form tracking observations as a Polars DataFrame.

    Returns:
        The validated input frame.

    Raises:
        ValueError: If required columns are missing, null, or out of bounds.
    """
    required_columns = {"frame_id", "timestamp", "player_id", "team", "x", "y"}
    missing_columns = required_columns.difference(frame.columns)
    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        raise ValueError(f"Tracking data is missing required columns: {missing}")

    subset = frame.select(sorted(required_columns))
    null_counts = subset.null_count().row(0)
    if any(count > 0 for count in null_counts):
        raise ValueError("Tracking data contains null values in required columns.")

    pandas_frame = pd.DataFrame(subset.to_dict(as_series=False))
    try:
        TRACKING_DATA_SCHEMA.validate(pandas_frame, lazy=True)
    except SchemaError as exc:
        raise ValueError(f"Tracking data failed schema validation: {exc}") from exc
    except SchemaErrors as exc:
        raise ValueError(f"Tracking data failed schema validation: {exc}") from exc
    return frame
