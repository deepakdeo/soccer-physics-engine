"""Pydantic schemas for the FastAPI service."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ApiSchema(BaseModel):
    """Base schema with strict extra-field handling."""

    model_config = ConfigDict(extra="forbid")


class ErrorResponse(ApiSchema):
    """Formatted API error response."""

    detail: str
    status_code: int
    request_id: str | None = None


class AnalyzeSequenceRequest(ApiSchema):
    """Request payload for `POST /analyze-sequence`."""

    dataset: str = Field(default="metrica")
    match_id: str
    start_time_s: float = Field(ge=0.0)
    end_time_s: float = Field(ge=0.0)
    focus_team: str = Field(default="home", pattern="^(home|away)$")
    focus_player_id: str | None = None
    mode: str = Field(default="single", pattern="^(single|multi)$")

    @model_validator(mode="after")
    def validate_time_window(self) -> AnalyzeSequenceRequest:
        """Ensure the analyzed time window is valid."""
        if self.end_time_s < self.start_time_s:
            raise ValueError("end_time_s must be greater than or equal to start_time_s.")
        return self


class RecommendationResponse(ApiSchema):
    """One recommended movement adjustment."""

    player_id: str
    dx: float
    dy: float
    improvement: float
    confidence: float
    explanation: str


class LoadSnapshotResponse(ApiSchema):
    """Compact load-monitoring snapshot for one player."""

    player_id: str
    high_intensity_distance: float
    sharp_deceleration_events: int
    change_of_direction_load: float
    load_flags: list[str] = Field(default_factory=list)


class AnalyzeSequenceResponse(ApiSchema):
    """Response payload for `POST /analyze-sequence`."""

    state_score: float
    pitch_control: float
    recommendations: list[RecommendationResponse]
    predicted_improvement: float
    explanation: str
    load_snapshot: LoadSnapshotResponse
    phase_classification: str
    confidence: float


class MatchReportRequest(ApiSchema):
    """Request payload for `POST /match-report`."""

    dataset: str = Field(default="metrica")
    match_id: str


class FatigueWindowResponse(ApiSchema):
    """One window in a fatigue curve."""

    window_start: float
    window_end: float
    mean_speed: float
    high_intensity_fraction: float
    accel_event_rate: float


class PlayerLoadProfileResponse(ApiSchema):
    """Load-monitoring profile for one player."""

    player_id: str
    high_intensity_distance: float
    sharp_deceleration_events: int
    change_of_direction_load: float
    directional_asymmetry: dict[str, float]
    fatigue_curve: list[FatigueWindowResponse]
    load_flags: list[str] = Field(default_factory=list)


class FormationChangeResponse(ApiSchema):
    """Formation snapshot or change event."""

    team: str
    timestamp_s: float
    formation: str


class MatchReportResponse(ApiSchema):
    """Response payload for `POST /match-report`."""

    match_id: str
    phase_summary: dict[str, int]
    possession_chains: list[dict[str, Any]]
    pressing_report: dict[str, float]
    transition_report: dict[str, Any]
    team_shape_report: dict[str, float]
    player_load_profiles: list[PlayerLoadProfileResponse]
    fatigue_curves: dict[str, list[FatigueWindowResponse]]
    formation_changes: list[FormationChangeResponse]


class LoadReportRequest(ApiSchema):
    """Request payload for `POST /load-report`."""

    dataset: str = Field(default="metrica")
    match_id: str
    player_id: str | None = None


class LoadReportResponse(ApiSchema):
    """Response payload for `POST /load-report`."""

    match_id: str
    player_load_profiles: list[PlayerLoadProfileResponse]


class SearchSequencesRequest(ApiSchema):
    """Request payload for `POST /search-sequences`."""

    dataset: str = Field(default="metrica")
    match_id: str
    reference_time_s: float = Field(ge=0.0)
    similarity_threshold: float = Field(default=0.8, ge=0.0, le=1.0)


class SimilarSequenceResponse(ApiSchema):
    """One tactically similar sequence result."""

    match_id: str
    time: float
    similarity_score: float
    phase: str
    outcome: str


class SearchSequencesResponse(ApiSchema):
    """Response payload for `POST /search-sequences`."""

    reference_match_id: str
    similar_sequences: list[SimilarSequenceResponse]


class HeatMapDataResponse(ApiSchema):
    """Serialized heat-map arrays for a player profile."""

    x_grid: list[float]
    y_grid: list[float]
    density: list[list[float]]


class PlayerProfileResponse(ApiSchema):
    """Response payload for `GET /player-profile/{player_id}`."""

    player_id: str
    role_detected: str
    run_types: list[str]
    space_creation_score: float
    movement_efficiency: float
    heat_map_data: HeatMapDataResponse
    off_ball_value: float


class HealthResponse(ApiSchema):
    """Response payload for `GET /health`."""

    status: str
    app_name: str
    version: str


class ModelVersionResponse(ApiSchema):
    """One registered model summary."""

    name: str
    version: int
    model_type: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ModelInfoResponse(ApiSchema):
    """Response payload for `GET /model-info`."""

    models: list[ModelVersionResponse]
    feature_set: list[str]
    training_metadata: dict[str, Any] = Field(default_factory=dict)
