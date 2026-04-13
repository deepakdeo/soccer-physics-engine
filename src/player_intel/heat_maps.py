"""Heat-map generation for player locations."""

from __future__ import annotations

import numpy as np
from numpy.linalg import LinAlgError
from scipy.stats import gaussian_kde

from src.utils.constants import PITCH_LENGTH_M, PITCH_WIDTH_M


def compute_player_heat_map(
    player_positions: np.ndarray,
    grid_size: tuple[int, int] = (20, 14),
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Compute a 2D player heat map with Gaussian KDE."""
    positions = np.asarray(player_positions, dtype=float)
    if positions.ndim != 2 or positions.shape[1] != 2:
        raise ValueError("player_positions must have shape (n_samples, 2).")
    if positions.shape[0] < 2:
        raise ValueError("player_positions must contain at least two samples.")

    x_grid = np.linspace(0.0, PITCH_LENGTH_M, grid_size[0])
    y_grid = np.linspace(0.0, PITCH_WIDTH_M, grid_size[1])
    grid_x, grid_y = np.meshgrid(x_grid, y_grid)
    kde = _build_kde(positions)
    density = kde(np.vstack([grid_x.ravel(), grid_y.ravel()])).reshape(grid_y.shape)
    return x_grid, y_grid, np.asarray(density, dtype=float)


def _build_kde(positions: np.ndarray) -> gaussian_kde:
    """Build a Gaussian KDE, adding negligible jitter if the sample is low rank."""
    try:
        return gaussian_kde(positions.T)
    except LinAlgError:
        offsets = np.linspace(-1.0, 1.0, positions.shape[0], dtype=float)
        jitter = np.column_stack([np.zeros_like(offsets), offsets * 1e-3])
        return gaussian_kde((positions + jitter).T)
