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


def test_load_config_accepts_extended_aws_settings(tmp_path: Path) -> None:
    config_path = tmp_path / "aws_config.yaml"
    config_path.write_text(
        "\n".join(
            [
                "aws:",
                "  region: us-east-1",
                "  ecr_repository_arn: arn:aws:ecr:us-east-1:123456789012:repository/demo",
                "  ecs_cluster_arn: arn:aws:ecs:us-east-1:123456789012:cluster/demo",
                "  api_gateway_execution_arn: arn:aws:execute-api:us-east-1:123456789012:demo",
            ]
        ),
        encoding="utf-8",
    )

    config = load_config(config_path)

    assert config.aws.ecr_repository_arn.endswith(":repository/demo")
    assert config.aws.ecs_cluster_arn.endswith(":cluster/demo")
    assert config.aws.api_gateway_execution_arn.endswith(":demo")


def test_config_to_dict_serializes_dataclasses() -> None:
    config = load_config("configs/default.yaml")

    serialized = config_to_dict(config)

    assert serialized["app_name"] == "soccer-physics-engine"
    assert serialized["thresholds"]["high_intensity_threshold_ms"] == 5.5
