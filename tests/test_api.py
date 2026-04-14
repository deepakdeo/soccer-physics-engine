"""Tests for the Phase 9 FastAPI service."""

from __future__ import annotations

from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


def test_health_endpoint_returns_ok_status() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["app_name"] == "soccer-physics-engine"


def test_model_info_endpoint_returns_registered_models() -> None:
    response = client.get("/model-info")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["models"]) == 3
    assert "pitch_control_pct" in payload["feature_set"]


def test_analyze_sequence_endpoint_returns_recommendations() -> None:
    response = client.post(
        "/analyze-sequence",
        json={
            "dataset": "metrica",
            "match_id": "sample_game_1",
            "start_time_s": 0.0,
            "end_time_s": 6.0,
            "focus_team": "home",
            "focus_player_id": "home_2",
            "mode": "single",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["state_score"] >= 0.0
    assert payload["phase_classification"] in {"build_up", "progression", "chance_creation"}
    assert len(payload["recommendations"]) >= 1
    assert payload["load_snapshot"]["player_id"] == "home_2"


def test_analyze_sequence_returns_404_for_unknown_focus_player() -> None:
    response = client.post(
        "/analyze-sequence",
        json={
            "dataset": "metrica",
            "match_id": "sample_game_1",
            "start_time_s": 0.0,
            "end_time_s": 6.0,
            "focus_team": "home",
            "focus_player_id": "home_99",
            "mode": "single",
        },
    )

    assert response.status_code == 404


def test_match_report_endpoint_returns_core_sections() -> None:
    response = client.post(
        "/match-report",
        json={"dataset": "metrica", "match_id": "sample_game_1"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["match_id"] == "sample_game_1"
    assert "phase_summary" in payload
    assert "player_load_profiles" in payload
    assert len(payload["formation_changes"]) == 2


def test_load_report_endpoint_can_filter_one_player() -> None:
    response = client.post(
        "/load-report",
        json={"dataset": "metrica", "match_id": "sample_game_1", "player_id": "home_3"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["player_load_profiles"]) == 1
    assert payload["player_load_profiles"][0]["player_id"] == "home_3"


def test_search_sequences_endpoint_returns_similarity_results() -> None:
    response = client.post(
        "/search-sequences",
        json={
            "dataset": "metrica",
            "match_id": "sample_game_1",
            "reference_time_s": 7.0,
            "similarity_threshold": 0.7,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["reference_match_id"] == "sample_game_1"
    assert len(payload["similar_sequences"]) >= 1
    assert "similarity_score" in payload["similar_sequences"][0]


def test_player_profile_endpoint_returns_heat_map() -> None:
    response = client.get("/player-profile/home_4", params={"match_id": "sample_game_1"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["player_id"] == "home_4"
    assert payload["movement_efficiency"] >= 0.0
    assert len(payload["heat_map_data"]["density"]) == 8


def test_unknown_match_returns_formatted_404_response() -> None:
    response = client.post(
        "/match-report",
        json={"dataset": "metrica", "match_id": "unknown_match"},
    )

    assert response.status_code == 404
    payload = response.json()
    assert payload["status_code"] == 404
    assert "request_id" in payload
