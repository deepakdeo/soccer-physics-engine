"""Pitch control models based on time-to-arrive influence."""

from __future__ import annotations

from typing import Any

import numpy as np

from src.utils.constants import PITCH_LENGTH_M, PITCH_WIDTH_M

MIN_PLAYER_SPEED = 0.1
REACTION_TIME_S = 0.7
CONTROL_LOGISTIC_TAU = 0.35


def compute_player_influence(
    player_pos: np.ndarray,
    player_vel: np.ndarray,
    target_points: np.ndarray,
    max_speed: float = 8.0,
) -> np.ndarray:
    """Estimate arrival times from one player to many target points.

    Args:
        player_pos: Player position as `(x, y)` in meters.
        player_vel: Player velocity vector `(vx, vy)` in meters per second.
        target_points: Array of target points with shape `(n_points, 2)`.
        max_speed: Maximum attainable player speed in meters per second.

    Returns:
        One-dimensional array of estimated arrival times for each target point.
    """
    if max_speed <= 0:
        raise ValueError("max_speed must be positive.")

    player_position = _as_point(player_pos, "player_pos")
    player_velocity = _as_point(player_vel, "player_vel")
    targets = _as_points(target_points, "target_points")

    displacements = targets - player_position
    distances = np.linalg.norm(displacements, axis=1)
    with np.errstate(divide="ignore", invalid="ignore"):
        direction_vectors = np.divide(
            displacements,
            distances[:, None],
            out=np.zeros_like(displacements),
            where=distances[:, None] > 0.0,
        )

    forward_speed = np.sum(direction_vectors * player_velocity, axis=1)
    effective_speed = np.clip(
        (0.5 * max_speed) + np.maximum(forward_speed, 0.0),
        MIN_PLAYER_SPEED,
        max_speed,
    )
    arrival_times = REACTION_TIME_S + (distances / effective_speed)
    arrival_times = np.where(distances == 0.0, 0.0, arrival_times)
    return np.asarray(arrival_times, dtype=float)


def compute_pitch_control(
    home_positions: np.ndarray,
    home_velocities: np.ndarray,
    away_positions: np.ndarray,
    away_velocities: np.ndarray,
    grid_resolution: int = 50,
) -> np.ndarray:
    """Compute a home-team pitch control surface over a regular pitch grid.

    Args:
        home_positions: Home player positions with shape `(n_home, 2)`.
        home_velocities: Home player velocities with shape `(n_home, 2)`.
        away_positions: Away player positions with shape `(n_away, 2)`.
        away_velocities: Away player velocities with shape `(n_away, 2)`.
        grid_resolution: Number of grid samples along each pitch dimension.

    Returns:
        A `(grid_resolution, grid_resolution)` array of home-team control
        probabilities in `[0, 1]`.
    """
    if grid_resolution < 2:
        raise ValueError("grid_resolution must be at least 2.")

    home_pos, home_vel = _validate_player_state(home_positions, home_velocities, "home")
    away_pos, away_vel = _validate_player_state(away_positions, away_velocities, "away")

    grid_points, x_count, y_count = _build_pitch_grid(grid_resolution)
    home_times = _compute_team_arrival_times(home_pos, home_vel, grid_points)
    away_times = _compute_team_arrival_times(away_pos, away_vel, grid_points)
    time_delta = home_times - away_times
    home_control = 1.0 / (1.0 + np.exp(time_delta / CONTROL_LOGISTIC_TAU))
    return np.asarray(home_control.reshape(y_count, x_count), dtype=float)


def compute_team_pitch_control_pct(pitch_control_grid: np.ndarray) -> float:
    """Compute the mean home-team control share across the grid."""
    grid = _as_grid(pitch_control_grid)
    return float(np.mean(grid))


def compute_zone_control(
    pitch_control_grid: np.ndarray,
    zones: list[tuple[Any, ...]],
) -> dict[str, float]:
    """Compute home-team control share inside named pitch zones.

    Each zone tuple can be either `(name, x_start, x_end, y_start, y_end)` or
    `(x_start, x_end, y_start, y_end)`. Coordinates are in meters.

    Args:
        pitch_control_grid: Home-team control probabilities over the pitch.
        zones: Zone boundaries in pitch coordinates.

    Returns:
        Mapping from zone name to mean home-team control within that slice.
    """
    grid = _as_grid(pitch_control_grid)
    y_count, x_count = grid.shape
    results: dict[str, float] = {}

    for index, zone in enumerate(zones):
        name, x_start, x_end, y_start, y_end = _parse_zone(zone, index)
        x_slice = _coordinate_slice(x_start, x_end, PITCH_LENGTH_M, x_count)
        y_slice = _coordinate_slice(y_start, y_end, PITCH_WIDTH_M, y_count)
        zone_values = grid[y_slice, x_slice]
        if zone_values.size == 0:
            raise ValueError(f"Zone '{name}' does not overlap the pitch control grid.")
        results[name] = float(np.mean(zone_values))

    return results


def _validate_player_state(
    positions: np.ndarray,
    velocities: np.ndarray,
    label: str,
) -> tuple[np.ndarray, np.ndarray]:
    position_array = _as_points(positions, f"{label}_positions")
    velocity_array = _as_points(velocities, f"{label}_velocities")
    if position_array.shape != velocity_array.shape:
        raise ValueError(f"{label} positions and velocities must have the same shape.")
    if position_array.shape[0] == 0:
        raise ValueError(f"{label} player state cannot be empty.")
    return position_array, velocity_array


def _compute_team_arrival_times(
    positions: np.ndarray,
    velocities: np.ndarray,
    grid_points: np.ndarray,
) -> np.ndarray:
    arrival_times = [
        compute_player_influence(player_pos, player_vel, grid_points)
        for player_pos, player_vel in zip(positions, velocities, strict=True)
    ]
    return np.asarray(np.min(np.vstack(arrival_times), axis=0), dtype=float)


def _build_pitch_grid(grid_resolution: int) -> tuple[np.ndarray, int, int]:
    x_coords = np.linspace(0.0, PITCH_LENGTH_M, grid_resolution)
    y_coords = np.linspace(0.0, PITCH_WIDTH_M, grid_resolution)
    grid_x, grid_y = np.meshgrid(x_coords, y_coords)
    grid_points = np.column_stack((grid_x.ravel(), grid_y.ravel()))
    return grid_points, len(x_coords), len(y_coords)


def _coordinate_slice(start: float, end: float, pitch_extent: float, grid_count: int) -> slice:
    clipped_start = min(max(start, 0.0), pitch_extent)
    clipped_end = min(max(end, 0.0), pitch_extent)
    if clipped_end <= clipped_start:
        raise ValueError("Zone end must be greater than zone start.")
    start_index = int(np.floor((clipped_start / pitch_extent) * grid_count))
    end_index = int(np.ceil((clipped_end / pitch_extent) * grid_count))
    start_index = min(max(start_index, 0), grid_count - 1)
    end_index = min(max(end_index, start_index + 1), grid_count)
    return slice(start_index, end_index)


def _parse_zone(zone: tuple[Any, ...], index: int) -> tuple[str, float, float, float, float]:
    if len(zone) == 5:
        name, x_start, x_end, y_start, y_end = zone
        return str(name), float(x_start), float(x_end), float(y_start), float(y_end)
    if len(zone) == 4:
        x_start, x_end, y_start, y_end = zone
        return f"zone_{index}", float(x_start), float(x_end), float(y_start), float(y_end)
    raise ValueError("Each zone must have 4 numeric values or a leading name plus 4 values.")


def _as_point(values: np.ndarray, label: str) -> np.ndarray:
    point = np.asarray(values, dtype=float)
    if point.shape != (2,):
        raise ValueError(f"{label} must have shape (2,).")
    return point


def _as_points(values: np.ndarray, label: str) -> np.ndarray:
    points = np.asarray(values, dtype=float)
    if points.ndim != 2 or points.shape[1] != 2:
        raise ValueError(f"{label} must have shape (n_points, 2).")
    return points


def _as_grid(values: np.ndarray) -> np.ndarray:
    grid = np.asarray(values, dtype=float)
    if grid.ndim != 2:
        raise ValueError("pitch_control_grid must be a 2D array.")
    return grid
