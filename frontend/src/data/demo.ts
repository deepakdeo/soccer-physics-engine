import type {
  AnalyzeSequenceResponse,
  ComparisonRow,
  DashboardData,
  EfficiencyPoint,
  HealthResponse,
  LoadReportResponse,
  MatchReportResponse,
  ModelInfoResponse,
  PitchLane,
  PitchPlayer,
  PitchRecommendation,
  PitchZone,
  PlayerProfileResponse,
  RunBreakdownRow,
  SearchSequencesResponse,
  TeamShapeOverlay,
} from "@/types";

export const demoHealth: HealthResponse = {
  status: "ok",
  app_name: "soccer-physics-engine",
  version: "0.1.0",
};

export const demoModelInfo: ModelInfoResponse = {
  models: [
    {
      name: "state_scorer",
      version: 1,
      model_type: "composite_rule_model",
      metadata: { status: "active" },
    },
    {
      name: "expected_threat_baseline",
      version: 1,
      model_type: "logistic_regression",
      metadata: { label: "shot_or_territory_gain" },
    },
    {
      name: "recommendation_optimizer",
      version: 1,
      model_type: "counterfactual_search",
      metadata: { mode: "single_and_multi" },
    },
  ],
  feature_set: [
    "pitch_control_pct",
    "safe_passing_lanes",
    "support_distance_m",
    "pressure_count",
    "team_compactness_m2",
  ],
  training_metadata: {
    evaluation_layer: "phase_8",
    service_layer: "phase_9",
  },
};

export const demoAnalyzeSequence: AnalyzeSequenceResponse = {
  state_score: 0.67,
  pitch_control: 0.61,
  recommendations: [
    {
      player_id: "home_4",
      dx: 3.8,
      dy: 2.5,
      improvement: 0.07,
      confidence: 0.83,
      explanation:
        "Move forward and wider to stretch the back line and create a stronger switch angle.",
    },
    {
      player_id: "home_3",
      dx: -2.0,
      dy: 3.6,
      improvement: 0.04,
      confidence: 0.71,
      explanation:
        "Shift wider to receive outside pressure and open the half-space lane for the ball side eight.",
    },
  ],
  predicted_improvement: 0.07,
  explanation:
    "The strongest movement widens the final line, increases lane quality, and improves territorial leverage.",
  load_snapshot: {
    player_id: "home_4",
    high_intensity_distance: 348,
    sharp_deceleration_events: 9,
    change_of_direction_load: 42,
    load_flags: ["hi_distance"],
  },
  phase_classification: "chance_creation",
  confidence: 0.83,
};

export const demoMatchReport: MatchReportResponse = {
  match_id: "sample_game_1",
  phase_summary: {
    build_up: 6,
    progression: 11,
    chance_creation: 8,
    pressing: 4,
    transition: 5,
  },
  possession_chains: [
    {
      team: "home",
      start_time: 1,
      end_time: 8,
      start_x: 18,
      end_x: 84,
      event_count: 3,
    },
    {
      team: "away",
      start_time: 12,
      end_time: 16,
      start_x: 58,
      end_x: 36,
      event_count: 2,
    },
  ],
  pressing_report: {
    ppda: 2.8,
    counter_press_speed_s: 2.1,
    pressing_effectiveness: 0.67,
  },
  transition_report: {
    transition_speed_s: 2.8,
    defensive_shape_recovery_s: 3.5,
  },
  team_shape_report: {
    compactness: 1320,
    width: 41,
    depth: 54,
    defensive_line_height: 24,
    inter_line_distance: 14,
  },
  player_load_profiles: [
    {
      player_id: "home_1",
      high_intensity_distance: 240,
      sharp_deceleration_events: 5,
      change_of_direction_load: 25,
      directional_asymmetry: { left_load: 8, right_load: 12, asymmetry_ratio: 0.2 },
      fatigue_curve: [
        { window_start: 0, window_end: 1, mean_speed: 4.2, high_intensity_fraction: 0.22, accel_event_rate: 0.31 },
        { window_start: 1, window_end: 2, mean_speed: 4.7, high_intensity_fraction: 0.27, accel_event_rate: 0.36 },
      ],
      load_flags: [],
    },
    {
      player_id: "home_4",
      high_intensity_distance: 348,
      sharp_deceleration_events: 9,
      change_of_direction_load: 42,
      directional_asymmetry: { left_load: 14, right_load: 18, asymmetry_ratio: 0.13 },
      fatigue_curve: [
        { window_start: 0, window_end: 1, mean_speed: 5.0, high_intensity_fraction: 0.33, accel_event_rate: 0.38 },
        { window_start: 1, window_end: 2, mean_speed: 5.4, high_intensity_fraction: 0.41, accel_event_rate: 0.44 },
      ],
      load_flags: ["hi_distance"],
    },
    {
      player_id: "home_5",
      high_intensity_distance: 302,
      sharp_deceleration_events: 11,
      change_of_direction_load: 47,
      directional_asymmetry: { left_load: 12, right_load: 19, asymmetry_ratio: 0.23 },
      fatigue_curve: [
        { window_start: 0, window_end: 1, mean_speed: 4.8, high_intensity_fraction: 0.29, accel_event_rate: 0.35 },
        { window_start: 1, window_end: 2, mean_speed: 5.2, high_intensity_fraction: 0.39, accel_event_rate: 0.47 },
      ],
      load_flags: ["decel_events"],
    },
  ],
  fatigue_curves: {},
  formation_changes: [
    { team: "home", timestamp_s: 0, formation: "2-2-1" },
    { team: "away", timestamp_s: 0, formation: "2-2-1" },
  ],
};

demoMatchReport.fatigue_curves = Object.fromEntries(
  demoMatchReport.player_load_profiles.map((profile) => [profile.player_id, profile.fatigue_curve]),
);

export const demoLoadReport: LoadReportResponse = {
  match_id: "sample_game_1",
  player_load_profiles: demoMatchReport.player_load_profiles,
};

export const demoSearchSequences: SearchSequencesResponse = {
  reference_match_id: "sample_game_1",
  similar_sequences: [
    {
      match_id: "sample_game_2",
      time: 7,
      similarity_score: 0.91,
      phase: "chance_creation",
      outcome: "shot",
    },
    {
      match_id: "sample_game_2",
      time: 14,
      similarity_score: 0.84,
      phase: "progression",
      outcome: "territory_gain",
    },
  ],
};

export const demoPlayerProfile: PlayerProfileResponse = {
  player_id: "home_4",
  role_detected: "winger",
  run_types: ["overlap", "stretching"],
  space_creation_score: 4.8,
  movement_efficiency: 0.76,
  heat_map_data: {
    x_grid: Array.from({ length: 10 }, (_, index) => index * 10),
    y_grid: Array.from({ length: 8 }, (_, index) => index * 8.5),
    density: Array.from({ length: 8 }, (_, row) =>
      Array.from({ length: 10 }, (_, column) =>
        Number(Math.max(0, 1 - Math.abs(column - 6) * 0.16 - Math.abs(row - 4) * 0.13).toFixed(2)),
      ),
    ),
  },
  off_ball_value: 0.81,
};

export const demoPitchPlayers: PitchPlayer[] = [
  { id: "home_1", label: "1", x: 18, y: 30, team: "home", role: "pivot", hasBall: true },
  { id: "home_2", label: "2", x: 30, y: 18, team: "home", role: "full_back" },
  { id: "home_3", label: "3", x: 39, y: 48, team: "home", role: "midfielder" },
  { id: "home_4", label: "4", x: 59, y: 16, team: "home", role: "winger" },
  { id: "home_5", label: "5", x: 79, y: 34, team: "home", role: "forward" },
  { id: "away_1", label: "1", x: 46, y: 27, team: "away", role: "defender" },
  { id: "away_2", label: "2", x: 61, y: 20, team: "away", role: "defender" },
  { id: "away_3", label: "3", x: 66, y: 45, team: "away", role: "midfielder" },
  { id: "away_4", label: "4", x: 82, y: 22, team: "away", role: "defender" },
  { id: "away_5", label: "5", x: 86, y: 47, team: "away", role: "defender" },
];

export const demoPitchPassingLanes: PitchLane[] = [
  { from: [18, 30], to: [39, 48], probability: 0.86 },
  { from: [18, 30], to: [59, 16], probability: 0.74 },
  { from: [18, 30], to: [79, 34], probability: 0.61 },
];

export const demoPitchRecommendations: PitchRecommendation[] = [
  {
    player_id: "home_4",
    start: [59, 16],
    end: [63, 19],
    explanation: demoAnalyzeSequence.recommendations[0].explanation,
    confidence: 0.83,
  },
  {
    player_id: "home_3",
    start: [39, 48],
    end: [37, 52],
    explanation: demoAnalyzeSequence.recommendations[1].explanation,
    confidence: 0.71,
  },
];

export const demoPitchOverloads: PitchZone[] = [
  { x: 58, y: 8, width: 24, height: 20, team: "home", label: "Wide overload" },
  { x: 34, y: 40, width: 18, height: 18, team: "home", label: "Third-man pocket" },
];

export const demoTeamShapeOverlay: TeamShapeOverlay = {
  homeHull: [
    [18, 30],
    [30, 18],
    [59, 16],
    [79, 34],
    [39, 48],
  ],
  awayHull: [
    [46, 27],
    [61, 20],
    [82, 22],
    [86, 47],
    [66, 45],
  ],
  homeLines: [22, 38, 63],
  awayLines: [50, 68, 84],
};

export const demoHeatMapGrid: number[][] = Array.from({ length: 8 }, (_, row) =>
  Array.from({ length: 12 }, (_, column) =>
    Number(Math.max(0.05, 0.9 - Math.abs(column - 7) * 0.09 - Math.abs(row - 3) * 0.08).toFixed(2)),
  ),
);

export const demoEfficiencyScatter: EfficiencyPoint[] = [
  { playerId: "home_1", tacticalValue: 0.51, movementEfficiency: 0.62, role: "pivot", team: "home" },
  { playerId: "home_2", tacticalValue: 0.58, movementEfficiency: 0.69, role: "full_back", team: "home" },
  { playerId: "home_3", tacticalValue: 0.64, movementEfficiency: 0.71, role: "midfielder", team: "home" },
  { playerId: "home_4", tacticalValue: 0.79, movementEfficiency: 0.76, role: "winger", team: "home" },
  { playerId: "home_5", tacticalValue: 0.74, movementEfficiency: 0.68, role: "forward", team: "home" },
];

export const demoRunBreakdown: RunBreakdownRow[] = [
  { runType: "Overlap", count: 8, share: 0.32 },
  { runType: "Stretching", count: 6, share: 0.24 },
  { runType: "Diagonal", count: 5, share: 0.2 },
  { runType: "Support", count: 4, share: 0.16 },
  { runType: "Dropping", count: 2, share: 0.08 },
];

export const demoComparisonRows: ComparisonRow[] = [
  { playerId: "home_3", role: "midfielder", tacticalValue: 0.64, movementEfficiency: 0.71, offBallValue: 0.68, loadFlagCount: 0 },
  { playerId: "home_4", role: "winger", tacticalValue: 0.79, movementEfficiency: 0.76, offBallValue: 0.81, loadFlagCount: 1 },
  { playerId: "home_5", role: "forward", tacticalValue: 0.74, movementEfficiency: 0.68, offBallValue: 0.72, loadFlagCount: 1 },
];

export const demoDashboardData: DashboardData = {
  health: demoHealth,
  modelInfo: demoModelInfo,
  analyzeSequence: demoAnalyzeSequence,
  matchReport: demoMatchReport,
  loadReport: demoLoadReport,
  searchSequences: demoSearchSequences,
  playerProfile: demoPlayerProfile,
  pitchPlayers: demoPitchPlayers,
  pitchHeatMap: demoHeatMapGrid,
  pitchPassingLanes: demoPitchPassingLanes,
  pitchRecommendations: demoPitchRecommendations,
  pitchOverloads: demoPitchOverloads,
  teamShapeOverlay: demoTeamShapeOverlay,
  efficiencyScatter: demoEfficiencyScatter,
  runBreakdown: demoRunBreakdown,
  comparisonRows: demoComparisonRows,
};
