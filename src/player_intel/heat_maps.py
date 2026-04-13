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
    try:
        kde = _build_kde(positions)
        density = kde(np.vstack([grid_x.ravel(), grid_y.ravel()])).reshape(grid_y.shape)
    except LinAlgError:
        density = _compute_fallback_density(positions, grid_x, grid_y)
    return x_grid, y_grid, np.asarray(density, dtype=float)


def _build_kde(positions: np.ndarray) -> gaussian_kde:
    """Build a Gaussian KDE, adding negligible jitter if the sample is low rank."""
    try:
        return gaussian_kde(positions.T)
    except LinAlgError:
        offsets = np.linspace(-1.0, 1.0, positions.shape[0], dtype=float)
        jitter = np.column_stack([offsets * 1e-3, offsets[::-1] * 1e-3])
        return gaussian_kde((positions + jitter).T)


def _compute_fallback_density(
    positions: np.ndarray,
    grid_x: np.ndarray,
    grid_y: np.ndarray,
) -> np.ndarray:
    """Compute a stable isotropic density surface when KDE covariance is singular."""
    x_spread = float(np.std(positions[:, 0]))
    y_spread = float(np.std(positions[:, 1]))
    bandwidth = max(1.5, x_spread, y_spread)

    dx = grid_x[None, :, :] - positions[:, 0][:, None, None]
    dy = grid_y[None, :, :] - positions[:, 1][:, None, None]
    squared_distance = dx**2 + dy**2
    density = np.exp(-0.5 * squared_distance / (bandwidth**2)).sum(axis=0)
    total_density = float(density.sum())
    if total_density > 0.0:
        density /= total_density
    return np.asarray(density, dtype=float)
