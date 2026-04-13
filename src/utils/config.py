"""YAML-backed application configuration."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

import yaml  # type: ignore[import-untyped]

DEFAULT_APP_NAME = "soccer-physics-engine"


@dataclass(slots=True)
class PathsConfig:
    """Filesystem paths used by the application."""

    data_root: str = "data"
    raw_tracking_root: str = "data/raw/metrica"
    processed_root: str = "data/processed"


@dataclass(slots=True)
class ThresholdConfig:
    """Numerical thresholds for the physics and load layers."""

    high_intensity_threshold_ms: float = 5.5
    sharp_decel_threshold_ms2: float = -3.0
    smoothing_window: int = 7
    smoothing_polyorder: int = 2


@dataclass(slots=True)
class AWSConfig:
    """AWS deployment settings."""

    region: str = "us-east-1"
    s3_bucket: str = "soccer-physics-engine-artifacts"


@dataclass(slots=True)
class AppConfig:
    """Root application configuration object."""

    app_name: str = DEFAULT_APP_NAME
    paths: PathsConfig = field(default_factory=PathsConfig)
    thresholds: ThresholdConfig = field(default_factory=ThresholdConfig)
    aws: AWSConfig = field(default_factory=AWSConfig)


def load_config(path: str | Path) -> AppConfig:
    """Load application configuration from a YAML file.

    Args:
        path: Path to the YAML configuration file.

    Returns:
        Parsed `AppConfig` instance with defaults filled for omitted values.
    """
    raw_config = _load_yaml_mapping(path)
    return AppConfig(
        app_name=str(raw_config.get("app_name", DEFAULT_APP_NAME)),
        paths=PathsConfig(**_as_mapping(raw_config.get("paths"))),
        thresholds=ThresholdConfig(**_as_mapping(raw_config.get("thresholds"))),
        aws=AWSConfig(**_as_mapping(raw_config.get("aws"))),
    )


def config_to_dict(config: AppConfig) -> dict[str, Any]:
    """Serialize a config dataclass tree into a dictionary."""
    return asdict(config)


def _load_yaml_mapping(path: str | Path) -> dict[str, Any]:
    config_path = Path(path)
    with config_path.open("r", encoding="utf-8") as file_handle:
        loaded = yaml.safe_load(file_handle) or {}
    if not isinstance(loaded, dict):
        raise ValueError("Configuration file must contain a YAML mapping at the top level.")
    return loaded


def _as_mapping(value: Any) -> dict[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise ValueError("Nested configuration sections must be mappings.")
    return value
