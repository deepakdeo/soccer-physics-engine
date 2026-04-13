"""Tests for YAML-backed configuration."""

from __future__ import annotations

from pathlib import Path

from src.utils.config import config_to_dict, load_config


def test_load_config_reads_nested_sections(tmp_path: Path) -> None:
    config_path = tmp_path / "config.yaml"
    config_path.write_text(
        "\n".join(
            [
                "app_name: demo-app",
                "paths:",
                "  data_root: custom-data",
                "thresholds:",
                "  smoothing_window: 9",
                "aws:",
                "  region: us-west-2",
            ]
        ),
        encoding="utf-8",
    )

    config = load_config(config_path)

    assert config.app_name == "demo-app"
    assert config.paths.data_root == "custom-data"
    assert config.thresholds.smoothing_window == 9
    assert config.aws.region == "us-west-2"


def test_config_to_dict_serializes_dataclasses() -> None:
    config = load_config("configs/default.yaml")

    serialized = config_to_dict(config)

    assert serialized["app_name"] == "soccer-physics-engine"
    assert serialized["thresholds"]["high_intensity_threshold_ms"] == 5.5
