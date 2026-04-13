"""Tactical analytics package."""

from src.tactical.dangerous_possessions import identify_dangerous_possessions
from src.tactical.formation import (
    compute_average_positions,
    detect_formation,
    infer_formation_lines,
)
from src.tactical.overloads import detect_overload_zones
from src.tactical.phase_detector import (
    classify_phase,
    classify_phase_sequence,
    summarize_phase_counts,
)
from src.tactical.pressing import (
    compute_counter_press_speed,
    compute_ppda,
    compute_pressing_effectiveness,
    detect_pressing_triggers,
)
from src.tactical.set_pieces import analyze_set_piece_positioning, classify_set_piece_event
from src.tactical.team_shape import (
    compute_defensive_line_height,
    compute_inter_line_distance,
    compute_team_compactness,
    compute_team_depth,
    compute_team_width,
    summarize_team_shape,
)
from src.tactical.territorial import compute_ball_territory, extract_possession_chains
from src.tactical.transitions import (
    compute_defensive_shape_recovery_time,
    compute_transition_speed,
    detect_possession_transitions,
)
from src.tactical.vulnerability import (
    detect_defensive_gaps,
    detect_exposed_flanks,
    find_unmarked_runners,
)

__all__ = [
    "compute_average_positions",
    "compute_ball_territory",
    "compute_counter_press_speed",
    "compute_defensive_line_height",
    "compute_defensive_shape_recovery_time",
    "compute_inter_line_distance",
    "compute_ppda",
    "compute_pressing_effectiveness",
    "compute_team_compactness",
    "compute_team_depth",
    "compute_team_width",
    "compute_transition_speed",
    "analyze_set_piece_positioning",
    "classify_phase",
    "classify_phase_sequence",
    "classify_set_piece_event",
    "detect_defensive_gaps",
    "detect_exposed_flanks",
    "detect_formation",
    "detect_overload_zones",
    "detect_possession_transitions",
    "detect_pressing_triggers",
    "extract_possession_chains",
    "find_unmarked_runners",
    "identify_dangerous_possessions",
    "infer_formation_lines",
    "summarize_team_shape",
    "summarize_phase_counts",
]
