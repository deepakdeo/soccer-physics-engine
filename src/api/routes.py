"""FastAPI route implementations."""

from __future__ import annotations

from typing import Annotated, Any

import numpy as np
from fastapi import APIRouter, Depends, HTTPException, Query

from src.api.dependencies import (
    REGISTERED_MODEL_NAMES,
    DemoDataRepository,
    get_app_config,
    get_demo_repository,
    get_model_registry,
)
from src.api.schemas import (
    AnalyzeSequenceRequest,
    AnalyzeSequenceResponse,
    FatigueWindowResponse,
    FormationChangeResponse,
    HealthResponse,
    HeatMapDataResponse,
    LoadReportRequest,
    LoadReportResponse,
    LoadSnapshotResponse,
    MatchReportRequest,
    MatchReportResponse,
    ModelInfoResponse,
    ModelVersionResponse,
    PlayerLoadProfileResponse,
    PlayerProfileResponse,
    RecommendationResponse,
    SearchSequencesRequest,
    SearchSequencesResponse,
    SimilarSequenceResponse,
)
from src.models.registry import MLflowModelRegistryInterface
from src.player_intel.heat_maps import compute_player_heat_map
from src.recommend.optimizer import optimize_recommendations
from src.recommend.scorer import evaluate_frame_state
from src.search.similarity import search_similar_sequences
from src.tactical.formation import detect_formation
from src.tactical.phase_detector import classify_phase
from src.unified.match_report import build_match_report
from src.unified.player_report import build_player_report

router = APIRouter()

ConfigDep = Annotated[Any, Depends(get_app_config)]
RepoDep = Annotated[DemoDataRepository, Depends(get_demo_repository)]
RegistryDep = Annotated[MLflowModelRegistryInterface, Depends(get_model_registry)]


@router.post(
    "/analyze-sequence",
    response_model=AnalyzeSequenceResponse,
)
def analyze_sequence(
    request: AnalyzeSequenceRequest,
    repository: RepoDep,
) -> AnalyzeSequenceResponse:
    """Analyze one sequence and return the top movement recommendation."""
    try:
        frame_data, phase_features = repository.get_frame_bundle(
            request.match_id,
            time_s=(request.start_time_s + request.end_time_s) / 2.0,
        )
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    state = evaluate_frame_state(frame_data, focus_team=request.focus_team)
    recommendations_result = optimize_recommendations(
        frame_data,
        focus_team=request.focus_team,
        include_multi_player=request.mode == "multi",
        min_confidence=0.0,
        top_k=3,
    )

    if request.mode == "multi":
        recommendation_source = list(recommendations_result["multi_player"]["selected_moves"])
        predicted_improvement = float(recommendations_result["multi_player"]["total_improvement"])
    else:
        recommendation_source = list(recommendations_result["single_player"])
        predicted_improvement = (
            float(recommendation_source[0]["improvement"]) if recommendation_source else 0.0
        )

    if request.focus_player_id is not None:
        filtered = [
            recommendation
            for recommendation in recommendation_source
            if str(recommendation.get("player_id", "")) == request.focus_player_id
        ]
        if filtered:
            recommendation_source = filtered

    recommendations = [
        _serialize_recommendation(recommendation) for recommendation in recommendation_source[:3]
    ]
    primary_recommendation = recommendations[0] if recommendations else None
    snapshot_player_id = (
        request.focus_player_id
        if request.focus_player_id is not None
        else (primary_recommendation.player_id if primary_recommendation is not None else "home_1")
    )
    player_report = _build_player_report_for_player(
        repository, request.match_id, snapshot_player_id
    )
    return AnalyzeSequenceResponse(
        state_score=float(state.score),
        pitch_control=float(state.metrics["pitch_control_pct"]),
        recommendations=recommendations,
        predicted_improvement=predicted_improvement,
        explanation=primary_recommendation.explanation
        if primary_recommendation is not None
        else "",
        load_snapshot=_load_snapshot_from_player_report(player_report),
        phase_classification=classify_phase(phase_features),
        confidence=primary_recommendation.confidence if primary_recommendation is not None else 0.0,
    )


@router.post(
    "/match-report",
    response_model=MatchReportResponse,
)
def get_match_report(
    request: MatchReportRequest,
    repository: RepoDep,
) -> MatchReportResponse:
    """Return a full-match tactical and load report."""
    try:
        match = repository.get_match(request.match_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    base_report = build_match_report(
        match_id=match.match_id,
        phase_frames=match.phase_frames,
        ball_positions=match.ball_positions,
        events=match.events,
        possession_teams=match.possession_teams,
        timestamps_s=match.timestamps_s,
        players_ahead_of_ball=match.players_ahead_of_ball,
        compactness_series=match.compactness_series,
        team_positions=match.home_positions,
        opponent_passes=match.opponent_passes,
        defensive_actions=match.defensive_actions,
        seconds_to_pressure=match.seconds_to_pressure,
        regain_times_s=match.regain_times_s,
    )

    player_load_profiles = [
        _player_load_profile_from_report(
            _build_player_report_for_player(repository, request.match_id, player_id)
        )
        for player_id in sorted(match.player_series)
    ]
    fatigue_curves = {profile.player_id: profile.fatigue_curve for profile in player_load_profiles}
    formation_changes = [
        FormationChangeResponse(
            team="home",
            timestamp_s=0.0,
            formation=detect_formation(match.home_average_positions),
        ),
        FormationChangeResponse(
            team="away",
            timestamp_s=0.0,
            formation=detect_formation(match.away_average_positions, defending_goal_x=105.0),
        ),
    ]
    return MatchReportResponse(
        match_id=match.match_id,
        phase_summary={key: int(value) for key, value in base_report["phase_summary"].items()},
        possession_chains=[dict(chain) for chain in base_report["possession_chains"]],
        pressing_report={
            key: float(value) for key, value in base_report["pressing_report"].items()
        },
        transition_report=dict(base_report["transition_report"]),
        team_shape_report={
            key: float(value) for key, value in base_report["team_shape_report"].items()
        },
        player_load_profiles=player_load_profiles,
        fatigue_curves=fatigue_curves,
        formation_changes=formation_changes,
    )


@router.post(
    "/load-report",
    response_model=LoadReportResponse,
)
def get_load_report(
    request: LoadReportRequest,
    repository: RepoDep,
) -> LoadReportResponse:
    """Return biomechanical load-monitoring profiles."""
    try:
        match = repository.get_match(request.match_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    player_ids = (
        [request.player_id] if request.player_id is not None else sorted(match.player_series)
    )
    player_load_profiles: list[PlayerLoadProfileResponse] = []
    for player_id in player_ids:
        try:
            player_report = _build_player_report_for_player(repository, request.match_id, player_id)
        except KeyError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error
        player_load_profiles.append(_player_load_profile_from_report(player_report))

    return LoadReportResponse(
        match_id=match.match_id,
        player_load_profiles=player_load_profiles,
    )


@router.post(
    "/search-sequences",
    response_model=SearchSequencesResponse,
)
def search_sequences(
    request: SearchSequencesRequest,
    repository: RepoDep,
) -> SearchSequencesResponse:
    """Search for tactically similar sequences across matches."""
    try:
        reference_sequence, candidates, metadata = repository.build_search_context(
            request.match_id,
            reference_time_s=request.reference_time_s,
        )
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    matches = search_similar_sequences(
        reference_sequence,
        candidates,
        similarity_threshold=request.similarity_threshold,
    )
    similar_sequences = [
        SimilarSequenceResponse(
            match_id=str(metadata[str(match["sequence_id"])]["match_id"]),
            time=float(metadata[str(match["sequence_id"])]["timestamp_s"]),
            similarity_score=float(match["similarity"]),
            phase=str(metadata[str(match["sequence_id"])]["phase"]),
            outcome=str(metadata[str(match["sequence_id"])]["outcome"]),
        )
        for match in matches
    ]
    return SearchSequencesResponse(
        reference_match_id=request.match_id,
        similar_sequences=similar_sequences,
    )


@router.get(
    "/player-profile/{player_id}",
    response_model=PlayerProfileResponse,
)
def get_player_profile(
    player_id: str,
    repository: RepoDep,
    match_id: str | None = Query(default=None),
) -> PlayerProfileResponse:
    """Return a unified player-intelligence profile."""
    try:
        resolved_match_id, resolved_player_id = repository.resolve_player_match(
            player_id, match_id=match_id
        )
        player_report = _build_player_report_for_player(
            repository, resolved_match_id, resolved_player_id
        )
        player_series = repository.get_player_series(resolved_match_id, resolved_player_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    x_grid, y_grid, density = compute_player_heat_map(player_series.positions, grid_size=(12, 8))
    off_ball_value = float(
        np.clip(
            (0.7 * float(player_report["tactical_value"]))
            + (0.3 * np.clip(float(player_report["space_creation_score"]) / 10.0, 0.0, 1.0)),
            0.0,
            1.0,
        )
    )
    return PlayerProfileResponse(
        player_id=resolved_player_id,
        role_detected=str(player_report["role_detected"]),
        run_types=[str(player_report["primary_run_type"])],
        space_creation_score=float(player_report["space_creation_score"]),
        movement_efficiency=float(player_report["experimental_movement_efficiency"]),
        heat_map_data=HeatMapDataResponse(
            x_grid=[float(value) for value in x_grid.tolist()],
            y_grid=[float(value) for value in y_grid.tolist()],
            density=[[float(value) for value in row] for row in density.tolist()],
        ),
        off_ball_value=off_ball_value,
    )


@router.get(
    "/health",
    response_model=HealthResponse,
)
def health_check(config: ConfigDep) -> HealthResponse:
    """Return a basic service health response."""
    return HealthResponse(
        status="ok",
        app_name=str(config.app_name),
        version="0.1.0",
    )


@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
)
def get_model_info(registry: RegistryDep) -> ModelInfoResponse:
    """Return model registry metadata for the service."""
    models = [
        ModelVersionResponse(
            name=info.name,
            version=int(info.version),
            model_type=info.model_type,
            metadata=dict(info.metadata),
        )
        for info in (registry.get_model_info(name) for name in REGISTERED_MODEL_NAMES)
    ]
    return ModelInfoResponse(
        models=models,
        feature_set=[
            "pitch_control_pct",
            "safe_passing_lanes",
            "support_distance_m",
            "pressure_count",
            "team_compactness_m2",
        ],
        training_metadata={
            "registry_uri": registry.registry_uri,
            "evaluation_layer": "phase_8",
            "service_layer": "phase_9",
        },
    )


def _serialize_recommendation(recommendation: dict[str, Any]) -> RecommendationResponse:
    return RecommendationResponse(
        player_id=str(recommendation.get("player_id", "")),
        dx=float(recommendation.get("dx", 0.0)),
        dy=float(recommendation.get("dy", 0.0)),
        improvement=float(recommendation.get("improvement", 0.0)),
        confidence=float(recommendation.get("confidence", 0.0)),
        explanation=str(recommendation.get("explanation", "")),
    )


def _load_snapshot_from_player_report(player_report: dict[str, Any]) -> LoadSnapshotResponse:
    load_profile = dict(player_report["load_profile"])
    return LoadSnapshotResponse(
        player_id=str(player_report["player_id"]),
        high_intensity_distance=float(load_profile["high_intensity_distance"]),
        sharp_deceleration_events=int(load_profile["sharp_deceleration_events"]),
        change_of_direction_load=float(load_profile["change_of_direction_load"]),
        load_flags=[str(flag) for flag in load_profile["load_flags"]],
    )


def _player_load_profile_from_report(player_report: dict[str, Any]) -> PlayerLoadProfileResponse:
    load_profile = dict(player_report["load_profile"])
    fatigue_curve = [
        FatigueWindowResponse(
            window_start=float(window["window_start"]),
            window_end=float(window["window_end"]),
            mean_speed=float(window["mean_speed"]),
            high_intensity_fraction=float(window["high_intensity_fraction"]),
            accel_event_rate=float(window["accel_event_rate"]),
        )
        for window in list(load_profile["fatigue_curve"])
    ]
    return PlayerLoadProfileResponse(
        player_id=str(player_report["player_id"]),
        high_intensity_distance=float(load_profile["high_intensity_distance"]),
        sharp_deceleration_events=int(load_profile["sharp_deceleration_events"]),
        change_of_direction_load=float(load_profile["change_of_direction_load"]),
        directional_asymmetry={
            key: float(value) for key, value in dict(load_profile["directional_asymmetry"]).items()
        },
        fatigue_curve=fatigue_curve,
        load_flags=[str(flag) for flag in list(load_profile["load_flags"])],
    )


def _build_player_report_for_player(
    repository: DemoDataRepository,
    match_id: str,
    player_id: str,
) -> dict[str, Any]:
    match = repository.get_match(match_id)
    player_series = repository.get_player_series(match_id, player_id)
    team = repository.get_player_team(player_id)
    team_average_positions = repository.get_team_average_positions(match_id, team)
    team_player_ids = repository.get_team_player_ids(match_id, team)
    opponent_team = "away" if team == "home" else "home"
    opponent_positions = repository.get_team_average_positions(match_id, opponent_team)

    defender_positions_before = np.asarray(opponent_positions[:2], dtype=float)
    defender_positions_after = np.asarray(opponent_positions[:2], dtype=float) + np.asarray(
        [[1.5, 0.5], [2.0, 1.0]],
        dtype=float,
    )
    return build_player_report(
        player_id=player_id,
        player_positions=player_series.positions,
        speed_series=player_series.speed_series,
        acceleration_series=player_series.acceleration_series,
        velocity_vectors=player_series.velocity_vectors,
        possession_flags=player_series.possession_flags,
        pass_events=match.pass_events,
        team_average_positions=team_average_positions,
        team_player_ids=team_player_ids,
        defender_positions_before=defender_positions_before,
        defender_positions_after=defender_positions_after,
        attacking_direction="positive" if team == "home" else "negative",
        dt=1.0,
        team_reference_metrics=repository.get_team_reference_metrics(match_id, team),
    )
