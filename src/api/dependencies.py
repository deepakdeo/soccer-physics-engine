"""Dependency injection for the FastAPI service."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from src.load.metrics import (
    compute_change_of_direction_load,
    compute_high_intensity_distance,
    count_sharp_deceleration_events,
)
from src.models.registry import MLflowModelRegistryInterface
from src.utils.config import AppConfig, load_config

DEFAULT_CONFIG_PATH = Path("configs/default.yaml")
REGISTERED_MODEL_NAMES = (
    "state_scorer",
    "expected_threat_baseline",
    "recommendation_optimizer",
)


@dataclass(slots=True)
class _DemoPlayerSeries:
    """Synthetic player movement series used by the API demo layer."""

    positions: np.ndarray
    speed_series: np.ndarray
    acceleration_series: np.ndarray
    velocity_vectors: np.ndarray
    possession_flags: np.ndarray


@dataclass(slots=True)
class _DemoMatchData:
    """Synthetic match bundle used by the API demo layer."""

    match_id: str
    frame_sets: list[list[dict[str, Any]]]
    phase_frames: list[dict[str, Any]]
    ball_positions: np.ndarray
    events: list[dict[str, Any]]
    possession_teams: list[str]
    timestamps_s: list[float]
    players_ahead_of_ball: list[int]
    compactness_series: list[float]
    home_positions: np.ndarray
    away_positions: np.ndarray
    home_average_positions: np.ndarray
    away_average_positions: np.ndarray
    pass_events: list[dict[str, Any]]
    sequence_bank: dict[str, list[dict[str, float]]]
    sequence_metadata: dict[str, dict[str, str | float]]
    player_series: dict[str, _DemoPlayerSeries]
    team_reference_metrics: dict[str, dict[str, np.ndarray]]
    opponent_passes: int
    defensive_actions: int
    seconds_to_pressure: list[float]
    regain_times_s: list[float | None]


class DemoDataRepository:
    """Deterministic in-memory data access used by the API layer."""

    def __init__(self) -> None:
        """Initialize the repository with two demo matches."""
        self._matches = {
            "sample_game_1": _build_demo_match("sample_game_1", x_shift=0.0),
            "sample_game_2": _build_demo_match("sample_game_2", x_shift=4.0),
        }

    def get_match(self, match_id: str) -> _DemoMatchData:
        """Return one demo match bundle by id."""
        if match_id not in self._matches:
            raise KeyError(f"Unknown match_id '{match_id}'.")
        return self._matches[match_id]

    def get_frame_bundle(
        self,
        match_id: str,
        time_s: float,
    ) -> tuple[list[dict[str, Any]], dict[str, Any]]:
        """Return a frame bundle and phase snapshot for a requested time."""
        match = self.get_match(match_id)
        frame_index = min(int(time_s // 5.0), len(match.frame_sets) - 1)
        return list(match.frame_sets[frame_index]), dict(match.phase_frames[frame_index])

    def get_player_series(self, match_id: str, player_id: str) -> _DemoPlayerSeries:
        """Return one player's movement series."""
        match = self.get_match(match_id)
        if player_id not in match.player_series:
            raise KeyError(f"Unknown player_id '{player_id}'.")
        return match.player_series[player_id]

    def get_team_average_positions(self, match_id: str, team: str) -> np.ndarray:
        """Return average positions for one team."""
        match = self.get_match(match_id)
        if team == "home":
            return np.asarray(match.home_average_positions, dtype=float)
        if team == "away":
            return np.asarray(match.away_average_positions, dtype=float)
        raise KeyError(f"Unknown team '{team}'.")

    def get_team_positions(self, match_id: str, team: str) -> np.ndarray:
        """Return snapshot positions for one team."""
        match = self.get_match(match_id)
        if team == "home":
            return np.asarray(match.home_positions, dtype=float)
        if team == "away":
            return np.asarray(match.away_positions, dtype=float)
        raise KeyError(f"Unknown team '{team}'.")

    def get_team_player_ids(self, match_id: str, team: str) -> list[str]:
        """Return ordered player ids for one team."""
        match = self.get_match(match_id)
        if team == "home":
            return [player_id for player_id in match.player_series if player_id.startswith("home_")]
        if team == "away":
            return [player_id for player_id in match.player_series if player_id.startswith("away_")]
        raise KeyError(f"Unknown team '{team}'.")

    def get_player_team(self, player_id: str) -> str:
        """Infer team label from a demo player id."""
        if player_id.startswith("home_"):
            return "home"
        if player_id.startswith("away_"):
            return "away"
        raise KeyError(f"Unknown player_id '{player_id}'.")

    def get_team_reference_metrics(self, match_id: str, team: str) -> dict[str, np.ndarray]:
        """Return team reference metrics for load-flag thresholds."""
        match = self.get_match(match_id)
        if team not in match.team_reference_metrics:
            raise KeyError(f"Unknown team '{team}'.")
        return match.team_reference_metrics[team]

    def build_search_context(
        self,
        match_id: str,
        reference_time_s: float,
    ) -> tuple[
        list[dict[str, float]], dict[str, list[dict[str, float]]], dict[str, dict[str, Any]]
    ]:
        """Build the reference and candidate bank for sequence search."""
        reference_match = self.get_match(match_id)
        sequence_ids = sorted(reference_match.sequence_bank)
        sequence_index = min(int(reference_time_s // 10.0), len(sequence_ids) - 1)
        reference_sequence_id = sequence_ids[sequence_index]
        reference_sequence = list(reference_match.sequence_bank[reference_sequence_id])

        candidate_sequences: dict[str, list[dict[str, float]]] = {}
        candidate_metadata: dict[str, dict[str, Any]] = {}
        for candidate_match in self._matches.values():
            for sequence_id, sequence in candidate_match.sequence_bank.items():
                candidate_key = f"{candidate_match.match_id}:{sequence_id}"
                if candidate_match.match_id == match_id and sequence_id == reference_sequence_id:
                    continue
                candidate_sequences[candidate_key] = list(sequence)
                candidate_metadata[candidate_key] = {
                    "match_id": candidate_match.match_id,
                    **candidate_match.sequence_metadata[sequence_id],
                }
        return reference_sequence, candidate_sequences, candidate_metadata

    def resolve_player_match(self, player_id: str, match_id: str | None = None) -> tuple[str, str]:
        """Resolve a player and match combination for profile queries."""
        if match_id is not None:
            self.get_player_series(match_id, player_id)
            return match_id, player_id

        for candidate_match_id, match in self._matches.items():
            if player_id in match.player_series:
                return candidate_match_id, player_id
        raise KeyError(f"Unknown player_id '{player_id}'.")


def get_app_config() -> AppConfig:
    """Return the application configuration."""
    if DEFAULT_CONFIG_PATH.exists():
        return load_config(DEFAULT_CONFIG_PATH)
    return AppConfig()


@lru_cache(maxsize=1)
def get_model_registry() -> MLflowModelRegistryInterface:
    """Return the in-memory model registry preloaded with demo models."""
    registry = MLflowModelRegistryInterface()
    registry.register_model(
        "state_scorer",
        model_type="composite_rule_model",
        metadata={
            "feature_set": [
                "pitch_control_pct",
                "safe_passing_lanes",
                "support_distance_m",
                "pressure_count",
                "team_compactness_m2",
            ],
        },
    )
    registry.register_model(
        "expected_threat_baseline",
        model_type="logistic_regression",
        metadata={"label": "shot_or_territory_gain", "library": "scikit-learn"},
    )
    registry.register_model(
        "recommendation_optimizer",
        model_type="counterfactual_search",
        metadata={"search_mode": "single_and_multi_player", "confidence": "heuristic"},
    )
    return registry


@lru_cache(maxsize=1)
def get_demo_repository() -> DemoDataRepository:
    """Return the in-memory demo data repository."""
    return DemoDataRepository()


def _build_demo_match(match_id: str, x_shift: float) -> _DemoMatchData:
    home_average_positions = np.asarray(
        [
            [12.0 + x_shift, 14.0],
            [24.0 + x_shift, 28.0],
            [40.0 + x_shift, 26.0],
            [60.0 + x_shift, 46.0],
            [82.0 + x_shift, 34.0],
        ],
        dtype=float,
    )
    away_average_positions = np.asarray(
        [
            [93.0 - x_shift, 14.0],
            [81.0 - x_shift, 30.0],
            [66.0 - x_shift, 46.0],
            [45.0 - x_shift, 24.0],
            [22.0 - x_shift, 34.0],
        ],
        dtype=float,
    )
    frame_sets = [
        _build_frame_set(
            home_average_positions, away_average_positions, ball_owner="home_1", frame_shift=0.0
        ),
        _build_frame_set(
            home_average_positions, away_average_positions, ball_owner="home_2", frame_shift=2.0
        ),
        _build_frame_set(
            home_average_positions, away_average_positions, ball_owner="home_3", frame_shift=4.0
        ),
    ]
    phase_frames = [
        {"ball_x": 18.0 + x_shift, "pressing_trigger": False, "players_ahead_of_ball": 1},
        {"ball_x": 52.0 + x_shift, "pressing_trigger": False, "players_ahead_of_ball": 2},
        {
            "ball_x": 78.0 + x_shift,
            "pressing_trigger": False,
            "players_ahead_of_ball": 4,
            "attacking_pressure": 0.85,
        },
    ]
    ball_positions = np.asarray(
        [[18.0 + x_shift, 30.0], [54.0 + x_shift, 33.0], [84.0 + x_shift, 34.0]],
        dtype=float,
    )
    pass_events = [
        {
            "passer_id": "home_1",
            "receiver_id": "home_2",
            "start_x": 18.0 + x_shift,
            "end_x": 30.0 + x_shift,
        },
        {
            "passer_id": "home_2",
            "receiver_id": "home_3",
            "start_x": 30.0 + x_shift,
            "end_x": 44.0 + x_shift,
        },
        {
            "passer_id": "home_3",
            "receiver_id": "home_4",
            "start_x": 44.0 + x_shift,
            "end_x": 60.0 + x_shift,
        },
        {
            "passer_id": "home_4",
            "receiver_id": "home_5",
            "start_x": 60.0 + x_shift,
            "end_x": 82.0 + x_shift,
        },
        {
            "passer_id": "away_2",
            "receiver_id": "away_3",
            "start_x": 74.0 - x_shift,
            "end_x": 62.0 - x_shift,
        },
        {
            "passer_id": "away_3",
            "receiver_id": "away_4",
            "start_x": 62.0 - x_shift,
            "end_x": 48.0 - x_shift,
        },
    ]
    events = [
        {"team": "home", "timestamp": 1.0, "x": 18.0 + x_shift, "y": 30.0, "event_type": "pass"},
        {"team": "home", "timestamp": 4.0, "x": 44.0 + x_shift, "y": 33.0, "event_type": "pass"},
        {"team": "home", "timestamp": 7.0, "x": 88.0 + x_shift, "y": 34.0, "event_type": "shot"},
        {"team": "away", "timestamp": 12.0, "x": 58.0 - x_shift, "y": 28.0, "event_type": "pass"},
        {
            "team": "away",
            "timestamp": 16.0,
            "x": 36.0 - x_shift,
            "y": 26.0,
            "event_type": "turnover",
        },
    ]
    sequence_bank = {
        "build_up": [
            {
                "ball_x": 18.0 + x_shift,
                "ball_y": 30.0,
                "pitch_control_pct": 0.48,
                "pressure": 2.8,
                "state_score": 0.40,
            },
            {
                "ball_x": 26.0 + x_shift,
                "ball_y": 31.0,
                "pitch_control_pct": 0.52,
                "pressure": 2.3,
                "state_score": 0.46,
            },
            {
                "ball_x": 36.0 + x_shift,
                "ball_y": 32.0,
                "pitch_control_pct": 0.57,
                "pressure": 2.0,
                "state_score": 0.52,
            },
        ],
        "chance_creation": [
            {
                "ball_x": 54.0 + x_shift,
                "ball_y": 33.0,
                "pitch_control_pct": 0.60,
                "pressure": 1.6,
                "state_score": 0.58,
            },
            {
                "ball_x": 70.0 + x_shift,
                "ball_y": 34.0,
                "pitch_control_pct": 0.67,
                "pressure": 1.2,
                "state_score": 0.66,
            },
            {
                "ball_x": 84.0 + x_shift,
                "ball_y": 34.0,
                "pitch_control_pct": 0.74,
                "pressure": 0.8,
                "state_score": 0.74,
            },
        ],
        "recycle": [
            {
                "ball_x": 38.0 + x_shift,
                "ball_y": 26.0,
                "pitch_control_pct": 0.50,
                "pressure": 2.5,
                "state_score": 0.47,
            },
            {
                "ball_x": 32.0 + x_shift,
                "ball_y": 28.0,
                "pitch_control_pct": 0.49,
                "pressure": 2.7,
                "state_score": 0.45,
            },
            {
                "ball_x": 28.0 + x_shift,
                "ball_y": 30.0,
                "pitch_control_pct": 0.51,
                "pressure": 2.4,
                "state_score": 0.48,
            },
        ],
    }
    sequence_metadata: dict[str, dict[str, str | float]] = {
        "build_up": {"timestamp_s": 2.0, "phase": "build_up", "outcome": "territory_gain"},
        "chance_creation": {"timestamp_s": 7.0, "phase": "chance_creation", "outcome": "shot"},
        "recycle": {"timestamp_s": 14.0, "phase": "progression", "outcome": "circulation"},
    }
    player_series = _build_player_series(home_average_positions, away_average_positions)
    team_reference_metrics = {
        "home": _compute_team_reference_metrics(player_series, prefix="home_"),
        "away": _compute_team_reference_metrics(player_series, prefix="away_"),
    }
    return _DemoMatchData(
        match_id=match_id,
        frame_sets=frame_sets,
        phase_frames=phase_frames,
        ball_positions=ball_positions,
        events=events,
        possession_teams=["home", "home", "home", "away", "home"],
        timestamps_s=[0.0, 4.0, 8.0, 12.0, 18.0],
        players_ahead_of_ball=[1, 2, 3, 4, 4],
        compactness_series=[1800.0, 1650.0, 1400.0, 1250.0, 1180.0],
        home_positions=home_average_positions,
        away_positions=away_average_positions,
        home_average_positions=home_average_positions,
        away_average_positions=away_average_positions,
        pass_events=pass_events,
        sequence_bank=sequence_bank,
        sequence_metadata=sequence_metadata,
        player_series=player_series,
        team_reference_metrics=team_reference_metrics,
        opponent_passes=14,
        defensive_actions=5,
        seconds_to_pressure=[1.8, 2.2, 3.0, 5.6],
        regain_times_s=[3.2, None, 4.5, 6.0],
    )


def _build_frame_set(
    home_positions: np.ndarray,
    away_positions: np.ndarray,
    ball_owner: str,
    frame_shift: float,
) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for index, position in enumerate(home_positions, start=1):
        records.append(
            {
                "player_id": f"home_{index}",
                "team": "home",
                "x": float(position[0] + frame_shift),
                "y": float(position[1] + ((index % 2) * 1.5)),
                "vx": float(0.4 + (index * 0.1)),
                "vy": float(-0.2 + (index * 0.05)),
                "ax": float(0.02 * index),
                "ay": float(0.01 * ((-1) ** index)),
                "has_ball": ball_owner == f"home_{index}",
            }
        )
    for index, position in enumerate(away_positions, start=1):
        records.append(
            {
                "player_id": f"away_{index}",
                "team": "away",
                "x": float(position[0] - frame_shift),
                "y": float(position[1] - ((index % 2) * 1.0)),
                "vx": float(-0.5 - (index * 0.08)),
                "vy": float(0.15 - (index * 0.03)),
                "ax": float(-0.02 * index),
                "ay": float(0.01 * ((-1) ** (index + 1))),
                "has_ball": ball_owner == f"away_{index}",
            }
        )
    owner_record = next(record for record in records if record["player_id"] == ball_owner)
    records.append(
        {
            "player_id": "ball",
            "team": "ball",
            "x": float(owner_record["x"]) + 0.5,
            "y": float(owner_record["y"]),
            "vx": 3.0,
            "vy": 0.0,
            "ax": 0.0,
            "ay": 0.0,
            "has_ball": False,
        }
    )
    return records


def _build_player_series(
    home_average_positions: np.ndarray,
    away_average_positions: np.ndarray,
) -> dict[str, _DemoPlayerSeries]:
    player_series: dict[str, _DemoPlayerSeries] = {}
    for prefix, positions in (("home", home_average_positions), ("away", away_average_positions)):
        for index, base_position in enumerate(positions, start=1):
            direction = 1.0 if prefix == "home" else -1.0
            trajectory = np.asarray(
                [
                    [base_position[0], base_position[1]],
                    [base_position[0] + (3.0 * direction), base_position[1] + 1.5],
                    [base_position[0] + (6.0 * direction), base_position[1] + 3.0],
                    [base_position[0] + (8.0 * direction), base_position[1] + 4.0],
                ],
                dtype=float,
            )
            velocity_vectors = np.asarray(
                [
                    [4.2 * direction, 0.6],
                    [5.4 * direction, 0.9],
                    [6.1 * direction, 1.2],
                    [5.0 * direction, 0.8],
                ],
                dtype=float,
            )
            speed_series = np.linalg.norm(velocity_vectors, axis=1)
            acceleration_series = np.asarray(
                [0.8, -2.2 - (0.1 * index), -3.1 - (0.1 * index), -1.4],
                dtype=float,
            )
            possession_flags = np.asarray(
                [prefix == "home", False, False, prefix == "home"],
                dtype=bool,
            )
            player_series[f"{prefix}_{index}"] = _DemoPlayerSeries(
                positions=trajectory,
                speed_series=speed_series,
                acceleration_series=acceleration_series,
                velocity_vectors=velocity_vectors,
                possession_flags=possession_flags,
            )
    return player_series


def _compute_team_reference_metrics(
    player_series: dict[str, _DemoPlayerSeries],
    prefix: str,
) -> dict[str, np.ndarray]:
    hi_distance: list[float] = []
    decel_events: list[float] = []
    cod_load: list[float] = []
    for player_id, series in player_series.items():
        if not player_id.startswith(prefix):
            continue
        hi_distance.append(compute_high_intensity_distance(series.speed_series, dt=1.0))
        decel_events.append(float(count_sharp_deceleration_events(series.acceleration_series)))
        cod_load.append(compute_change_of_direction_load(series.velocity_vectors, dt=1.0))
    return {
        "hi_distance": np.asarray(hi_distance, dtype=float),
        "decel_events": np.asarray(decel_events, dtype=float),
        "cod_load": np.asarray(cod_load, dtype=float),
    }
