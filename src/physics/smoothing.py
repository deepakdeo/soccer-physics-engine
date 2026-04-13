"""Position smoothing helpers."""

from __future__ import annotations

import numpy as np
from scipy.signal import savgol_filter


def smooth_positions(
    positions: np.ndarray,
    window: int = 7,
    polyorder: int = 2,
) -> np.ndarray:
    """Smooth one-dimensional or multi-dimensional position samples.

    Args:
        positions: Position samples ordered by time. The first axis is time.
        window: Savitzky-Golay window length. It will be adjusted to a valid odd
            value when the input series is shorter than requested.
        polyorder: Polynomial order for the Savitzky-Golay filter.

    Returns:
        Smoothed position samples with NaNs imputed by linear interpolation.
    """
    if polyorder < 0:
        raise ValueError("polyorder must be non-negative.")
    if window < 1:
        raise ValueError("window must be at least 1.")

    position_array = np.asarray(positions, dtype=float)
    if position_array.ndim == 0:
        raise ValueError("Expected at least one position sample.")

    filled_positions = _interpolate_nan_values(position_array)
    window_length = _resolve_window_length(filled_positions.shape[0], window, polyorder)
    if window_length is None:
        return np.asarray(filled_positions.copy(), dtype=float)

    return np.asarray(
        savgol_filter(
            filled_positions,
            window_length=window_length,
            polyorder=polyorder,
            axis=0,
            mode="interp",
        ),
        dtype=float,
    )


def _resolve_window_length(series_length: int, window: int, polyorder: int) -> int | None:
    if series_length <= polyorder:
        return None

    window_length = min(window, series_length)
    if window_length % 2 == 0:
        window_length -= 1
    minimum_length = polyorder + 2 if (polyorder + 2) % 2 == 1 else polyorder + 3
    if window_length < minimum_length:
        return None
    return window_length


def _interpolate_nan_values(positions: np.ndarray) -> np.ndarray:
    if positions.ndim == 1:
        return np.asarray(_interpolate_nan_vector(positions), dtype=float)
    return np.asarray(np.apply_along_axis(_interpolate_nan_vector, 0, positions), dtype=float)


def _interpolate_nan_vector(values: np.ndarray) -> np.ndarray:
    vector = values.astype(float, copy=True)
    nan_mask = np.isnan(vector)
    if not nan_mask.any():
        return vector

    valid_indices = np.flatnonzero(~nan_mask)
    if valid_indices.size == 0:
        return np.zeros_like(vector)

    nan_indices = np.flatnonzero(nan_mask)
    vector[nan_mask] = np.interp(nan_indices, valid_indices, vector[~nan_mask])
    return vector
