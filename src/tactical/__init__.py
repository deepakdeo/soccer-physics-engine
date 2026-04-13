"""Tactical analytics package."""

from src.tactical.dangerous_possessions import identify_dangerous_possessions
from src.tactical.formation import (
    compute_average_positions,
    detect_formation,
    infer_formation_lines,
)
from src.tactical.overloads import detect_overload_zones
from src.tactical.team_shape import (
    compute_defensive_line_height,
    compute_inter_line_distance,
    compute_team_compactness,
    compute_team_depth,
    compute_team_width,
    summarize_team_shape,
)
from src.tactical.territorial import compute_ball_territory, extract_possession_chains
from src.tactical.vulnerability import (
    detect_defensive_gaps,
    detect_exposed_flanks,
    find_unmarked_runners,
)

__all__ = [
    "compute_average_positions",
    "compute_ball_territory",
    "compute_defensive_line_height",
    "compute_inter_line_distance",
    "compute_team_compactness",
    "compute_team_depth",
    "compute_team_width",
    "detect_defensive_gaps",
    "detect_exposed_flanks",
    "detect_formation",
    "detect_overload_zones",
    "extract_possession_chains",
    "find_unmarked_runners",
    "identify_dangerous_possessions",
    "infer_formation_lines",
    "summarize_team_shape",
]
