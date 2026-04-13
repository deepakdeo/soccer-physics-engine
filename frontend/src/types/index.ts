export type TabKey = "match-analysis" | "load-monitor" | "player-intelligence";

export interface Recommendation {
  player_id: string;
  dx: number;
  dy: number;
  improvement: number;
  confidence: number;
  explanation: string;
}

export interface LoadSnapshot {
  player_id: string;
  high_intensity_distance: number;
  sharp_deceleration_events: number;
  change_of_direction_load: number;
  load_flags: string[];
}

export interface AnalyzeSequenceResponse {
  state_score: number;
  pitch_control: number;
  recommendations: Recommendation[];
  predicted_improvement: number;
  explanation: string;
  load_snapshot: LoadSnapshot;
  phase_classification: string;
  confidence: number;
}

export interface FatigueWindow {
  window_start: number;
  window_end: number;
  mean_speed: number;
  high_intensity_fraction: number;
  accel_event_rate: number;
}

export interface PlayerLoadProfile {
  player_id: string;
  high_intensity_distance: number;
  sharp_deceleration_events: number;
  change_of_direction_load: number;
  directional_asymmetry: Record<string, number>;
  fatigue_curve: FatigueWindow[];
  load_flags: string[];
}

export interface FormationChange {
  team: string;
  timestamp_s: number;
  formation: string;
}

export interface MatchReportResponse {
  match_id: string;
  phase_summary: Record<string, number>;
  possession_chains: Array<Record<string, unknown>>;
  pressing_report: Record<string, number>;
  transition_report: Record<string, unknown>;
  team_shape_report: Record<string, number>;
  player_load_profiles: PlayerLoadProfile[];
  fatigue_curves: Record<string, FatigueWindow[]>;
  formation_changes: FormationChange[];
}

export interface LoadReportResponse {
  match_id: string;
  player_load_profiles: PlayerLoadProfile[];
}

export interface SimilarSequence {
  match_id: string;
  time: number;
  similarity_score: number;
  phase: string;
  outcome: string;
}

export interface SearchSequencesResponse {
  reference_match_id: string;
  similar_sequences: SimilarSequence[];
}

export interface HeatMapData {
  x_grid: number[];
  y_grid: number[];
  density: number[][];
}

export interface PlayerProfileResponse {
  player_id: string;
  role_detected: string;
  run_types: string[];
  space_creation_score: number;
  movement_efficiency: number;
  heat_map_data: HeatMapData;
  off_ball_value: number;
}

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
}

export interface ModelVersion {
  name: string;
  version: number;
  model_type: string;
  metadata: Record<string, unknown>;
}

export interface ModelInfoResponse {
  models: ModelVersion[];
  feature_set: string[];
  training_metadata: Record<string, unknown>;
}

export interface PitchPlayer {
  id: string;
  label: string;
  x: number;
  y: number;
  team: "home" | "away";
  role?: string;
  hasBall?: boolean;
}

export interface PitchLane {
  from: [number, number];
  to: [number, number];
  probability: number;
}

export interface PitchRecommendation {
  player_id: string;
  start: [number, number];
  end: [number, number];
  explanation: string;
  confidence: number;
}

export interface PitchZone {
  x: number;
  y: number;
  width: number;
  height: number;
  team: "home" | "away";
  label: string;
}

export interface TeamShapeOverlay {
  homeHull: Array<[number, number]>;
  awayHull: Array<[number, number]>;
  homeLines: number[];
  awayLines: number[];
}

export interface EfficiencyPoint {
  playerId: string;
  tacticalValue: number;
  movementEfficiency: number;
  role: string;
  team: "home" | "away";
}

export interface RunBreakdownRow {
  runType: string;
  count: number;
  share: number;
}

export interface ComparisonRow {
  playerId: string;
  role: string;
  tacticalValue: number;
  movementEfficiency: number;
  offBallValue: number;
  loadFlagCount: number;
}

export interface DashboardData {
  health: HealthResponse;
  modelInfo: ModelInfoResponse;
  analyzeSequence: AnalyzeSequenceResponse;
  matchReport: MatchReportResponse;
  loadReport: LoadReportResponse;
  searchSequences: SearchSequencesResponse;
  playerProfile: PlayerProfileResponse;
  pitchPlayers: PitchPlayer[];
  pitchHeatMap: number[][];
  pitchPassingLanes: PitchLane[];
  pitchRecommendations: PitchRecommendation[];
  pitchOverloads: PitchZone[];
  teamShapeOverlay: TeamShapeOverlay;
  efficiencyScatter: EfficiencyPoint[];
  runBreakdown: RunBreakdownRow[];
  comparisonRows: ComparisonRow[];
}
