import { demoHealth, demoModelInfo } from "@/data/demo";
import type {
  AnalyzeSequenceResponse,
  ComparisonRow,
  DashboardData,
  EfficiencyPoint,
  FatigueWindow,
  FormationChange,
  LoadReportResponse,
  MatchOption,
  MatchReportResponse,
  PhaseWindow,
  PitchLane,
  PitchPlayer,
  PitchRecommendation,
  PitchZone,
  PlayerLoadProfile,
  PlayerProfileResponse,
  RunBreakdownRow,
  SearchSequencesResponse,
  TeamShapeOverlay,
} from "@/types";

interface RecommendationSeed {
  playerId: string;
  dx: number;
  dy: number;
  improvement: number;
  confidence: number;
  explanation: string;
}

interface LaneSeed {
  from: string;
  to: string;
  probability: number;
}

interface PhaseScenarioSeed {
  window: PhaseWindow;
  players: PitchPlayer[];
  lanes: LaneSeed[];
  recommendations: RecommendationSeed[];
  overloads: PitchZone[];
  heatMap: number[][];
  lineHeights: {
    home: number[];
    away: number[];
  };
  analyzeSequence: AnalyzeSequenceResponse;
  searchSequences: SearchSequencesResponse;
  pressingReport: Record<string, number>;
  transitionReport: Record<string, unknown>;
  teamShapeReport: Record<string, number>;
  possessionChains: Array<Record<string, unknown>>;
  formationChanges: FormationChange[];
}

interface PhaseScenario extends PhaseScenarioSeed {
  passingLanes: PitchLane[];
  pitchRecommendations: PitchRecommendation[];
  teamShapeOverlay: TeamShapeOverlay;
}

interface MatchScenario {
  label: string;
  defaultPlayerId: string;
  defaultWindowId: string;
  phaseSummary: Record<string, number>;
  loadReport: LoadReportResponse;
  playerProfiles: Record<string, PlayerProfileResponse>;
  efficiencyScatter: EfficiencyPoint[];
  runBreakdown: RunBreakdownRow[];
  comparisonRows: ComparisonRow[];
  phases: Record<string, PhaseScenario>;
}

const HOME_ROLE_MAP: Record<string, string> = {
  home_1: "pivot",
  home_2: "full_back",
  home_3: "midfielder",
  home_4: "winger",
  home_5: "forward",
};

const AWAY_ROLE_MAP: Record<string, string> = {
  away_1: "defender",
  away_2: "defender",
  away_3: "midfielder",
  away_4: "defender",
  away_5: "defender",
};

const MATCH_SCENARIO_ORDER: string[] = ["sample_game_1", "sample_game_2"];

export const MATCH_OPTIONS: MatchOption[] = [
  { value: "sample_game_1", label: "Sample Game 1" },
  { value: "sample_game_2", label: "Sample Game 2" },
];

export const DEFAULT_MATCH_ID = "sample_game_1";

function createPlayers(
  coordinates: Array<{
    id: string;
    x: number;
    y: number;
    team: "home" | "away";
  }>,
  ballHolderId: string,
): PitchPlayer[] {
  return coordinates.map(({ id, x, y, team }) => ({
    id,
    label: id.split("_")[1] ?? id,
    x,
    y,
    team,
    role: team === "home" ? HOME_ROLE_MAP[id] : AWAY_ROLE_MAP[id],
    hasBall: id === ballHolderId,
  }));
}

function findPlayer(players: PitchPlayer[], playerId: string): PitchPlayer {
  const player = players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error(`Unknown player ${playerId}.`);
  }
  return player;
}

function createHeatMap(centerColumn: number, centerRow: number): number[][] {
  return Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 12 }, (_, column) =>
      Number(
        Math.max(
          0.05,
          0.95 - Math.abs(column - centerColumn) * 0.1 - Math.abs(row - centerRow) * 0.12,
        ).toFixed(2),
      ),
    ),
  );
}

function createPlayerHeatMap(centerColumn: number, centerRow: number): PlayerProfileResponse["heat_map_data"] {
  return {
    x_grid: Array.from({ length: 10 }, (_, index) => index * 10),
    y_grid: Array.from({ length: 8 }, (_, index) => index * 8.5),
    density: Array.from({ length: 8 }, (_, row) =>
      Array.from({ length: 10 }, (_, column) =>
        Number(
          Math.max(
            0.04,
            0.96 - Math.abs(column - centerColumn) * 0.13 - Math.abs(row - centerRow) * 0.14,
          ).toFixed(2),
        ),
      ),
    ),
  };
}

function createPlayerProfile(
  playerId: string,
  role: string,
  movementEfficiency: number,
  offBallValue: number,
  spaceCreationScore: number,
  runTypes: string[],
  heatMapCenter: [number, number],
): PlayerProfileResponse {
  return {
    player_id: playerId,
    role_detected: role,
    run_types: runTypes,
    space_creation_score: spaceCreationScore,
    movement_efficiency: movementEfficiency,
    heat_map_data: createPlayerHeatMap(heatMapCenter[0], heatMapCenter[1]),
    off_ball_value: offBallValue,
  };
}

function createPassingLanes(players: PitchPlayer[], laneSeeds: LaneSeed[]): PitchLane[] {
  return laneSeeds.map((lane) => ({
    from: [findPlayer(players, lane.from).x, findPlayer(players, lane.from).y],
    to: [findPlayer(players, lane.to).x, findPlayer(players, lane.to).y],
    probability: lane.probability,
  }));
}

function createPitchRecommendations(
  players: PitchPlayer[],
  recommendationSeeds: RecommendationSeed[],
): PitchRecommendation[] {
  return recommendationSeeds.map((recommendation) => {
    const player = findPlayer(players, recommendation.playerId);
    return {
      player_id: recommendation.playerId,
      start: [player.x, player.y],
      end: [player.x + recommendation.dx, player.y + recommendation.dy],
      explanation: recommendation.explanation,
      confidence: recommendation.confidence,
    };
  });
}

function createTeamShapeOverlay(
  players: PitchPlayer[],
  lineHeights: PhaseScenarioSeed["lineHeights"],
): TeamShapeOverlay {
  return {
    homeHull: players
      .filter((player) => player.team === "home")
      .map((player) => [player.x, player.y] as [number, number]),
    awayHull: players
      .filter((player) => player.team === "away")
      .map((player) => [player.x, player.y] as [number, number]),
    homeLines: lineHeights.home,
    awayLines: lineHeights.away,
  };
}

function buildPhaseScenario(seed: PhaseScenarioSeed): PhaseScenario {
  return {
    ...seed,
    passingLanes: createPassingLanes(seed.players, seed.lanes),
    pitchRecommendations: createPitchRecommendations(seed.players, seed.recommendations),
    teamShapeOverlay: createTeamShapeOverlay(seed.players, seed.lineHeights),
  };
}

function createFatigueCurve(
  windowEnds: number[],
  meanSpeeds: number[],
  hiFractions: number[],
  accelRates: number[],
): FatigueWindow[] {
  return windowEnds.map((windowEnd, index) => ({
    window_start: windowEnd - 1,
    window_end: windowEnd,
    mean_speed: meanSpeeds[index] ?? meanSpeeds[meanSpeeds.length - 1] ?? 0,
    high_intensity_fraction: hiFractions[index] ?? hiFractions[hiFractions.length - 1] ?? 0,
    accel_event_rate: accelRates[index] ?? accelRates[accelRates.length - 1] ?? 0,
  }));
}

function createLoadReport(matchId: string, profiles: PlayerLoadProfile[]): LoadReportResponse {
  return {
    match_id: matchId,
    player_load_profiles: profiles,
  };
}

function buildPhaseWindows(phases: PhaseScenario[]): PhaseWindow[] {
  return phases.map((phase) => phase.window);
}

function selectScenario(
  matchId: string,
  referenceTimeS: number,
): {
  match: MatchScenario;
  phase: PhaseScenario;
} {
  const match = DEMO_MATCHES[matchId] ?? DEMO_MATCHES[DEFAULT_MATCH_ID];
  const phases = Object.values(match.phases);
  const fallbackPhase = match.phases[match.defaultWindowId];
  const phase =
    phases.reduce<PhaseScenario | null>((closest, candidate) => {
      if (!closest) {
        return candidate;
      }
      const candidateDistance = Math.abs(candidate.window.endTimeS - referenceTimeS);
      const closestDistance = Math.abs(closest.window.endTimeS - referenceTimeS);
      return candidateDistance < closestDistance ? candidate : closest;
    }, null) ?? fallbackPhase;

  return { match, phase };
}

function buildMatchReport(matchId: string, match: MatchScenario, phase: PhaseScenario): MatchReportResponse {
  const fatigueCurves = Object.fromEntries(
    match.loadReport.player_load_profiles.map((profile) => [profile.player_id, profile.fatigue_curve]),
  );

  return {
    match_id: matchId,
    phase_summary: match.phaseSummary,
    possession_chains: phase.possessionChains,
    pressing_report: phase.pressingReport,
    transition_report: phase.transitionReport,
    team_shape_report: phase.teamShapeReport,
    player_load_profiles: match.loadReport.player_load_profiles,
    fatigue_curves: fatigueCurves,
    formation_changes: phase.formationChanges,
  };
}

const matchOneProfiles: PlayerLoadProfile[] = [
  {
    player_id: "home_1",
    high_intensity_distance: 254,
    sharp_deceleration_events: 6,
    change_of_direction_load: 28,
    directional_asymmetry: { left_load: 9, right_load: 11, asymmetry_ratio: 0.1 },
    fatigue_curve: createFatigueCurve(
      [61, 62, 63, 64, 65],
      [4.2, 4.4, 4.8, 4.6, 4.3],
      [0.18, 0.22, 0.28, 0.24, 0.2],
      [0.26, 0.3, 0.35, 0.31, 0.28],
    ),
    load_flags: [],
  },
  {
    player_id: "home_4",
    high_intensity_distance: 362,
    sharp_deceleration_events: 10,
    change_of_direction_load: 45,
    directional_asymmetry: { left_load: 14, right_load: 18, asymmetry_ratio: 0.13 },
    fatigue_curve: createFatigueCurve(
      [61, 62, 63, 64, 65],
      [5.0, 5.3, 5.7, 5.4, 5.1],
      [0.3, 0.35, 0.43, 0.39, 0.34],
      [0.37, 0.41, 0.48, 0.45, 0.4],
    ),
    load_flags: ["hi_distance"],
  },
  {
    player_id: "home_5",
    high_intensity_distance: 318,
    sharp_deceleration_events: 12,
    change_of_direction_load: 49,
    directional_asymmetry: { left_load: 12, right_load: 19, asymmetry_ratio: 0.23 },
    fatigue_curve: createFatigueCurve(
      [61, 62, 63, 64, 65],
      [4.8, 5.0, 5.4, 5.1, 4.9],
      [0.27, 0.32, 0.4, 0.36, 0.31],
      [0.34, 0.38, 0.46, 0.43, 0.37],
    ),
    load_flags: ["decel_events"],
  },
];

const matchTwoProfiles: PlayerLoadProfile[] = [
  {
    player_id: "home_1",
    high_intensity_distance: 266,
    sharp_deceleration_events: 7,
    change_of_direction_load: 31,
    directional_asymmetry: { left_load: 10, right_load: 11, asymmetry_ratio: 0.05 },
    fatigue_curve: createFatigueCurve(
      [70, 71, 72, 73, 74],
      [4.1, 4.3, 4.6, 4.7, 4.5],
      [0.19, 0.23, 0.29, 0.31, 0.27],
      [0.28, 0.31, 0.35, 0.36, 0.33],
    ),
    load_flags: [],
  },
  {
    player_id: "home_4",
    high_intensity_distance: 334,
    sharp_deceleration_events: 8,
    change_of_direction_load: 39,
    directional_asymmetry: { left_load: 11, right_load: 16, asymmetry_ratio: 0.19 },
    fatigue_curve: createFatigueCurve(
      [70, 71, 72, 73, 74],
      [4.9, 5.1, 5.4, 5.6, 5.2],
      [0.28, 0.33, 0.38, 0.42, 0.36],
      [0.35, 0.39, 0.44, 0.47, 0.41],
    ),
    load_flags: ["cod_load"],
  },
  {
    player_id: "home_5",
    high_intensity_distance: 346,
    sharp_deceleration_events: 13,
    change_of_direction_load: 52,
    directional_asymmetry: { left_load: 13, right_load: 20, asymmetry_ratio: 0.21 },
    fatigue_curve: createFatigueCurve(
      [70, 71, 72, 73, 74],
      [5.0, 5.2, 5.6, 5.8, 5.4],
      [0.3, 0.34, 0.4, 0.45, 0.39],
      [0.36, 0.4, 0.47, 0.5, 0.44],
    ),
    load_flags: ["decel_events", "hi_distance"],
  },
];

const matchOnePlayerProfiles: Record<string, PlayerProfileResponse> = {
  home_3: createPlayerProfile("home_3", "midfielder", 0.72, 0.69, 4.1, ["support", "diagonal"], [4, 4]),
  home_4: createPlayerProfile("home_4", "winger", 0.79, 0.84, 4.9, ["overlap", "stretching"], [6, 3]),
  home_5: createPlayerProfile("home_5", "forward", 0.69, 0.74, 4.5, ["pinning", "diagonal"], [7, 4]),
};

const matchTwoPlayerProfiles: Record<string, PlayerProfileResponse> = {
  home_3: createPlayerProfile("home_3", "midfielder", 0.74, 0.72, 4.4, ["support", "half_space"], [5, 4]),
  home_4: createPlayerProfile("home_4", "winger", 0.73, 0.78, 4.6, ["inside_out", "stretching"], [5, 3]),
  home_5: createPlayerProfile("home_5", "forward", 0.77, 0.8, 4.8, ["channel_run", "pinning"], [7, 3]),
};

const sampleGameOnePhases: PhaseScenario[] = [
  buildPhaseScenario({
    window: { id: "build_up", phase: "build_up", startTimeS: 3690, endTimeS: 3705 },
    players: createPlayers(
      [
        { id: "home_1", x: 16, y: 32, team: "home" },
        { id: "home_2", x: 24, y: 18, team: "home" },
        { id: "home_3", x: 34, y: 46, team: "home" },
        { id: "home_4", x: 46, y: 21, team: "home" },
        { id: "home_5", x: 61, y: 34, team: "home" },
        { id: "away_1", x: 42, y: 26, team: "away" },
        { id: "away_2", x: 54, y: 18, team: "away" },
        { id: "away_3", x: 57, y: 45, team: "away" },
        { id: "away_4", x: 73, y: 22, team: "away" },
        { id: "away_5", x: 77, y: 47, team: "away" },
      ],
      "home_1",
    ),
    lanes: [
      { from: "home_1", to: "home_2", probability: 0.91 },
      { from: "home_1", to: "home_3", probability: 0.87 },
      { from: "home_3", to: "home_4", probability: 0.68 },
    ],
    recommendations: [
      {
        playerId: "home_2",
        dx: 4,
        dy: -1,
        improvement: 0.05,
        confidence: 0.79,
        explanation: "Step higher on the first line to open a clean progression lane into midfield.",
      },
    ],
    overloads: [{ x: 20, y: 10, width: 18, height: 18, team: "home", label: "Build-up exit" }],
    heatMap: createHeatMap(3, 4),
    lineHeights: {
      home: [18, 31, 50],
      away: [45, 59, 74],
    },
    analyzeSequence: {
      state_score: 0.59,
      pitch_control: 0.54,
      recommendations: [
        {
          player_id: "home_2",
          dx: 4,
          dy: -1,
          improvement: 0.05,
          confidence: 0.79,
          explanation: "Step higher on the first line to open a clean progression lane into midfield.",
        },
      ],
      predicted_improvement: 0.05,
      explanation: "The possession is secure but still flat. Advancing the full back improves the second-line connection.",
      load_snapshot: {
        player_id: "home_2",
        high_intensity_distance: 212,
        sharp_deceleration_events: 4,
        change_of_direction_load: 21,
        load_flags: [],
      },
      phase_classification: "build_up",
      confidence: 0.81,
    },
    searchSequences: {
      reference_match_id: "sample_game_1",
      similar_sequences: [
        {
          match_id: "sample_game_2",
          time: 4275,
          similarity_score: 0.87,
          phase: "build_up",
          outcome: "progression",
        },
        {
          match_id: "sample_game_1",
          time: 3660,
          similarity_score: 0.79,
          phase: "build_up",
          outcome: "recycle",
        },
      ],
    },
    pressingReport: {
      ppda: 7.2,
      counter_press_speed_s: 2.8,
      pressing_effectiveness: 0.41,
    },
    transitionReport: {
      transition_speed_s: 4.1,
      defensive_shape_recovery_s: 4.6,
    },
    teamShapeReport: {
      compactness: 1450,
      width: 38,
      depth: 45,
      defensive_line_height: 18,
      inter_line_distance: 12,
    },
    possessionChains: [
      {
        team: "home",
        start_time: 3690,
        end_time: 3705,
        start_x: 14,
        end_x: 47,
        event_count: 5,
      },
    ],
    formationChanges: [
      { team: "home", timestamp_s: 3690, formation: "2-2-1" },
      { team: "away", timestamp_s: 3690, formation: "2-2-1" },
    ],
  }),
  buildPhaseScenario({
    window: { id: "progression", phase: "progression", startTimeS: 3735, endTimeS: 3750 },
    players: createPlayers(
      [
        { id: "home_1", x: 18, y: 31, team: "home" },
        { id: "home_2", x: 32, y: 16, team: "home" },
        { id: "home_3", x: 42, y: 41, team: "home" },
        { id: "home_4", x: 58, y: 18, team: "home" },
        { id: "home_5", x: 73, y: 31, team: "home" },
        { id: "away_1", x: 49, y: 25, team: "away" },
        { id: "away_2", x: 60, y: 18, team: "away" },
        { id: "away_3", x: 64, y: 42, team: "away" },
        { id: "away_4", x: 80, y: 20, team: "away" },
        { id: "away_5", x: 83, y: 46, team: "away" },
      ],
      "home_3",
    ),
    lanes: [
      { from: "home_3", to: "home_4", probability: 0.84 },
      { from: "home_3", to: "home_5", probability: 0.69 },
      { from: "home_2", to: "home_3", probability: 0.8 },
    ],
    recommendations: [
      {
        playerId: "home_4",
        dx: 5,
        dy: 2,
        improvement: 0.06,
        confidence: 0.8,
        explanation: "Keep driving the weak-side lane to stretch the back line before the next pass.",
      },
    ],
    overloads: [{ x: 50, y: 8, width: 20, height: 18, team: "home", label: "Half-space lane" }],
    heatMap: createHeatMap(5, 3),
    lineHeights: {
      home: [22, 39, 60],
      away: [48, 64, 82],
    },
    analyzeSequence: {
      state_score: 0.65,
      pitch_control: 0.58,
      recommendations: [
        {
          player_id: "home_4",
          dx: 5,
          dy: 2,
          improvement: 0.06,
          confidence: 0.8,
          explanation: "Keep driving the weak-side lane to stretch the back line before the next pass.",
        },
      ],
      predicted_improvement: 0.06,
      explanation: "The team has broken the first line. Width on the far side keeps the sequence moving into advantage.",
      load_snapshot: {
        player_id: "home_4",
        high_intensity_distance: 301,
        sharp_deceleration_events: 7,
        change_of_direction_load: 34,
        load_flags: [],
      },
      phase_classification: "progression",
      confidence: 0.84,
    },
    searchSequences: {
      reference_match_id: "sample_game_1",
      similar_sequences: [
        {
          match_id: "sample_game_2",
          time: 4305,
          similarity_score: 0.9,
          phase: "progression",
          outcome: "territory_gain",
        },
        {
          match_id: "sample_game_1",
          time: 3720,
          similarity_score: 0.81,
          phase: "progression",
          outcome: "switch",
        },
      ],
    },
    pressingReport: {
      ppda: 5.1,
      counter_press_speed_s: 2.3,
      pressing_effectiveness: 0.52,
    },
    transitionReport: {
      transition_speed_s: 3.4,
      defensive_shape_recovery_s: 4.1,
    },
    teamShapeReport: {
      compactness: 1360,
      width: 42,
      depth: 50,
      defensive_line_height: 22,
      inter_line_distance: 13,
    },
    possessionChains: [
      {
        team: "home",
        start_time: 3735,
        end_time: 3750,
        start_x: 28,
        end_x: 74,
        event_count: 4,
      },
    ],
    formationChanges: [
      { team: "home", timestamp_s: 3735, formation: "2-2-1" },
      { team: "away", timestamp_s: 3735, formation: "2-2-1" },
    ],
  }),
  buildPhaseScenario({
    window: { id: "chance_creation", phase: "chance_creation", startTimeS: 3765, endTimeS: 3780 },
    players: createPlayers(
      [
        { id: "home_1", x: 18, y: 30, team: "home" },
        { id: "home_2", x: 30, y: 18, team: "home" },
        { id: "home_3", x: 39, y: 48, team: "home" },
        { id: "home_4", x: 59, y: 16, team: "home" },
        { id: "home_5", x: 79, y: 34, team: "home" },
        { id: "away_1", x: 46, y: 27, team: "away" },
        { id: "away_2", x: 61, y: 20, team: "away" },
        { id: "away_3", x: 66, y: 45, team: "away" },
        { id: "away_4", x: 82, y: 22, team: "away" },
        { id: "away_5", x: 86, y: 47, team: "away" },
      ],
      "home_4",
    ),
    lanes: [
      { from: "home_3", to: "home_4", probability: 0.88 },
      { from: "home_4", to: "home_5", probability: 0.74 },
      { from: "home_2", to: "home_3", probability: 0.71 },
    ],
    recommendations: [
      {
        playerId: "home_4",
        dx: 3,
        dy: 2,
        improvement: 0.07,
        confidence: 0.83,
        explanation: "Move forward and wider to stretch the back line and create a stronger switch angle.",
      },
      {
        playerId: "home_3",
        dx: -2,
        dy: 4,
        improvement: 0.04,
        confidence: 0.71,
        explanation: "Shift wider to receive outside pressure and open the half-space lane for the ball side eight.",
      },
    ],
    overloads: [
      { x: 58, y: 8, width: 24, height: 20, team: "home", label: "Wide overload" },
      { x: 34, y: 40, width: 18, height: 18, team: "home", label: "Third-man pocket" },
    ],
    heatMap: createHeatMap(7, 3),
    lineHeights: {
      home: [22, 38, 63],
      away: [50, 68, 84],
    },
    analyzeSequence: {
      state_score: 0.67,
      pitch_control: 0.61,
      recommendations: [
        {
          player_id: "home_4",
          dx: 3,
          dy: 2,
          improvement: 0.07,
          confidence: 0.83,
          explanation: "Move forward and wider to stretch the back line and create a stronger switch angle.",
        },
        {
          player_id: "home_3",
          dx: -2,
          dy: 4,
          improvement: 0.04,
          confidence: 0.71,
          explanation: "Shift wider to receive outside pressure and open the half-space lane for the ball side eight.",
        },
      ],
      predicted_improvement: 0.07,
      explanation: "The strongest movement widens the final line, increases lane quality, and improves territorial leverage.",
      load_snapshot: {
        player_id: "home_4",
        high_intensity_distance: 348,
        sharp_deceleration_events: 9,
        change_of_direction_load: 42,
        load_flags: ["hi_distance"],
      },
      phase_classification: "chance_creation",
      confidence: 0.83,
    },
    searchSequences: {
      reference_match_id: "sample_game_1",
      similar_sequences: [
        {
          match_id: "sample_game_2",
          time: 4335,
          similarity_score: 0.91,
          phase: "chance_creation",
          outcome: "shot",
        },
        {
          match_id: "sample_game_2",
          time: 4305,
          similarity_score: 0.84,
          phase: "progression",
          outcome: "territory_gain",
        },
      ],
    },
    pressingReport: {
      ppda: 2.8,
      counter_press_speed_s: 2.1,
      pressing_effectiveness: 0.67,
    },
    transitionReport: {
      transition_speed_s: 2.8,
      defensive_shape_recovery_s: 3.5,
    },
    teamShapeReport: {
      compactness: 1320,
      width: 41,
      depth: 54,
      defensive_line_height: 24,
      inter_line_distance: 14,
    },
    possessionChains: [
      {
        team: "home",
        start_time: 3765,
        end_time: 3780,
        start_x: 35,
        end_x: 86,
        event_count: 3,
      },
      {
        team: "away",
        start_time: 3782,
        end_time: 3788,
        start_x: 58,
        end_x: 36,
        event_count: 2,
      },
    ],
    formationChanges: [
      { team: "home", timestamp_s: 3765, formation: "2-2-1" },
      { team: "away", timestamp_s: 3765, formation: "2-2-1" },
    ],
  }),
  buildPhaseScenario({
    window: { id: "transition", phase: "transition", startTimeS: 3780, endTimeS: 3795 },
    players: createPlayers(
      [
        { id: "home_1", x: 20, y: 31, team: "home" },
        { id: "home_2", x: 34, y: 17, team: "home" },
        { id: "home_3", x: 46, y: 46, team: "home" },
        { id: "home_4", x: 63, y: 18, team: "home" },
        { id: "home_5", x: 82, y: 33, team: "home" },
        { id: "away_1", x: 47, y: 29, team: "away" },
        { id: "away_2", x: 59, y: 23, team: "away" },
        { id: "away_3", x: 63, y: 44, team: "away" },
        { id: "away_4", x: 78, y: 25, team: "away" },
        { id: "away_5", x: 84, y: 48, team: "away" },
      ],
      "home_4",
    ),
    lanes: [
      { from: "home_4", to: "home_5", probability: 0.79 },
      { from: "home_3", to: "home_4", probability: 0.77 },
      { from: "home_2", to: "home_4", probability: 0.63 },
    ],
    recommendations: [
      {
        playerId: "home_5",
        dx: 5,
        dy: -1,
        improvement: 0.08,
        confidence: 0.85,
        explanation: "Attack the channel immediately to convert the transition edge before the line resets.",
      },
      {
        playerId: "home_3",
        dx: 2,
        dy: -3,
        improvement: 0.03,
        confidence: 0.7,
        explanation: "Fold underneath the break to preserve rest-defense coverage after the first action.",
      },
    ],
    overloads: [{ x: 60, y: 10, width: 22, height: 20, team: "home", label: "Fast-break lane" }],
    heatMap: createHeatMap(8, 3),
    lineHeights: {
      home: [24, 44, 68],
      away: [48, 63, 81],
    },
    analyzeSequence: {
      state_score: 0.71,
      pitch_control: 0.57,
      recommendations: [
        {
          player_id: "home_5",
          dx: 5,
          dy: -1,
          improvement: 0.08,
          confidence: 0.85,
          explanation: "Attack the channel immediately to convert the transition edge before the line resets.",
        },
        {
          player_id: "home_3",
          dx: 2,
          dy: -3,
          improvement: 0.03,
          confidence: 0.7,
          explanation: "Fold underneath the break to preserve rest-defense coverage after the first action.",
        },
      ],
      predicted_improvement: 0.08,
      explanation: "The transition window is open on the ball side. The best action is an immediate run behind the recovering line.",
      load_snapshot: {
        player_id: "home_5",
        high_intensity_distance: 356,
        sharp_deceleration_events: 8,
        change_of_direction_load: 39,
        load_flags: ["hi_distance"],
      },
      phase_classification: "transition",
      confidence: 0.86,
    },
    searchSequences: {
      reference_match_id: "sample_game_1",
      similar_sequences: [
        {
          match_id: "sample_game_2",
          time: 4365,
          similarity_score: 0.89,
          phase: "transition",
          outcome: "shot",
        },
        {
          match_id: "sample_game_1",
          time: 3810,
          similarity_score: 0.82,
          phase: "transition",
          outcome: "territory_gain",
        },
      ],
    },
    pressingReport: {
      ppda: 3.4,
      counter_press_speed_s: 1.8,
      pressing_effectiveness: 0.61,
    },
    transitionReport: {
      transition_speed_s: 2.2,
      defensive_shape_recovery_s: 3.2,
    },
    teamShapeReport: {
      compactness: 1280,
      width: 43,
      depth: 58,
      defensive_line_height: 26,
      inter_line_distance: 16,
    },
    possessionChains: [
      {
        team: "home",
        start_time: 3780,
        end_time: 3795,
        start_x: 43,
        end_x: 90,
        event_count: 3,
      },
    ],
    formationChanges: [
      { team: "home", timestamp_s: 3780, formation: "2-1-2" },
      { team: "away", timestamp_s: 3780, formation: "2-2-1" },
    ],
  }),
  buildPhaseScenario({
    window: { id: "pressing", phase: "pressing", startTimeS: 3810, endTimeS: 3825 },
    players: createPlayers(
      [
        { id: "home_1", x: 32, y: 31, team: "home" },
        { id: "home_2", x: 44, y: 18, team: "home" },
        { id: "home_3", x: 51, y: 44, team: "home" },
        { id: "home_4", x: 66, y: 19, team: "home" },
        { id: "home_5", x: 78, y: 33, team: "home" },
        { id: "away_1", x: 56, y: 27, team: "away" },
        { id: "away_2", x: 63, y: 20, team: "away" },
        { id: "away_3", x: 69, y: 46, team: "away" },
        { id: "away_4", x: 84, y: 24, team: "away" },
        { id: "away_5", x: 88, y: 47, team: "away" },
      ],
      "away_2",
    ),
    lanes: [
      { from: "away_2", to: "away_4", probability: 0.42 },
      { from: "away_2", to: "away_3", probability: 0.37 },
      { from: "home_4", to: "home_5", probability: 0.51 },
    ],
    recommendations: [
      {
        playerId: "home_3",
        dx: 4,
        dy: -2,
        improvement: 0.05,
        confidence: 0.77,
        explanation: "Jump the passing lane earlier to keep the trap compact and prevent the outlet.",
      },
    ],
    overloads: [{ x: 54, y: 14, width: 18, height: 18, team: "away", label: "Press trap" }],
    heatMap: createHeatMap(6, 4),
    lineHeights: {
      home: [30, 48, 70],
      away: [55, 70, 86],
    },
    analyzeSequence: {
      state_score: 0.62,
      pitch_control: 0.49,
      recommendations: [
        {
          player_id: "home_3",
          dx: 4,
          dy: -2,
          improvement: 0.05,
          confidence: 0.77,
          explanation: "Jump the passing lane earlier to keep the trap compact and prevent the outlet.",
        },
      ],
      predicted_improvement: 0.05,
      explanation: "The press is nearly set. One extra step from the interior midfielder closes the release valve.",
      load_snapshot: {
        player_id: "home_3",
        high_intensity_distance: 298,
        sharp_deceleration_events: 10,
        change_of_direction_load: 44,
        load_flags: ["decel_events"],
      },
      phase_classification: "pressing",
      confidence: 0.8,
    },
    searchSequences: {
      reference_match_id: "sample_game_1",
      similar_sequences: [
        {
          match_id: "sample_game_2",
          time: 4395,
          similarity_score: 0.86,
          phase: "pressing",
          outcome: "turnover",
        },
        {
          match_id: "sample_game_1",
          time: 3832,
          similarity_score: 0.8,
          phase: "pressing",
          outcome: "forced_back_pass",
        },
      ],
    },
    pressingReport: {
      ppda: 2.4,
      counter_press_speed_s: 1.6,
      pressing_effectiveness: 0.73,
    },
    transitionReport: {
      transition_speed_s: 3.0,
      defensive_shape_recovery_s: 2.9,
    },
    teamShapeReport: {
      compactness: 1240,
      width: 39,
      depth: 47,
      defensive_line_height: 30,
      inter_line_distance: 12,
    },
    possessionChains: [
      {
        team: "away",
        start_time: 3810,
        end_time: 3825,
        start_x: 53,
        end_x: 64,
        event_count: 2,
      },
    ],
    formationChanges: [
      { team: "home", timestamp_s: 3810, formation: "2-3-0" },
      { team: "away", timestamp_s: 3810, formation: "2-2-1" },
    ],
  }),
];

const sampleGameTwoPhases: PhaseScenario[] = [
  buildPhaseScenario({
    window: { id: "build_up", phase: "build_up", startTimeS: 4260, endTimeS: 4275 },
    players: createPlayers(
      [
        { id: "home_1", x: 19, y: 33, team: "home" },
        { id: "home_2", x: 27, y: 20, team: "home" },
        { id: "home_3", x: 37, y: 43, team: "home" },
        { id: "home_4", x: 48, y: 24, team: "home" },
        { id: "home_5", x: 65, y: 36, team: "home" },
        { id: "away_1", x: 45, y: 30, team: "away" },
        { id: "away_2", x: 56, y: 22, team: "away" },
        { id: "away_3", x: 60, y: 44, team: "away" },
        { id: "away_4", x: 74, y: 24, team: "away" },
        { id: "away_5", x: 79, y: 46, team: "away" },
      ],
      "home_1",
    ),
    lanes: [
      { from: "home_1", to: "home_2", probability: 0.88 },
      { from: "home_1", to: "home_3", probability: 0.84 },
      { from: "home_3", to: "home_4", probability: 0.66 },
    ],
    recommendations: [
      {
        playerId: "home_3",
        dx: 4,
        dy: -2,
        improvement: 0.05,
        confidence: 0.76,
        explanation: "Receive on the half-turn and carry into the inside lane before pressure sets.",
      },
    ],
    overloads: [{ x: 24, y: 14, width: 18, height: 18, team: "home", label: "Exit lane" }],
    heatMap: createHeatMap(4, 4),
    lineHeights: {
      home: [19, 33, 53],
      away: [47, 61, 76],
    },
    analyzeSequence: {
      state_score: 0.57,
      pitch_control: 0.53,
      recommendations: [
        {
          player_id: "home_3",
          dx: 4,
          dy: -2,
          improvement: 0.05,
          confidence: 0.76,
          explanation: "Receive on the half-turn and carry into the inside lane before pressure sets.",
        },
      ],
      predicted_improvement: 0.05,
      explanation: "The first pass is available, but the next gain depends on a midfielder turning under light pressure.",
      load_snapshot: {
        player_id: "home_3",
        high_intensity_distance: 241,
        sharp_deceleration_events: 5,
        change_of_direction_load: 24,
        load_flags: [],
      },
      phase_classification: "build_up",
      confidence: 0.79,
    },
    searchSequences: {
      reference_match_id: "sample_game_2",
      similar_sequences: [
        {
          match_id: "sample_game_1",
          time: 3705,
          similarity_score: 0.84,
          phase: "build_up",
          outcome: "progression",
        },
      ],
    },
    pressingReport: {
      ppda: 6.7,
      counter_press_speed_s: 2.6,
      pressing_effectiveness: 0.44,
    },
    transitionReport: {
      transition_speed_s: 3.8,
      defensive_shape_recovery_s: 4.4,
    },
    teamShapeReport: {
      compactness: 1430,
      width: 40,
      depth: 47,
      defensive_line_height: 19,
      inter_line_distance: 12,
    },
    possessionChains: [
      {
        team: "home",
        start_time: 4260,
        end_time: 4275,
        start_x: 17,
        end_x: 44,
        event_count: 4,
      },
    ],
    formationChanges: [
      { team: "home", timestamp_s: 4260, formation: "2-2-1" },
      { team: "away", timestamp_s: 4260, formation: "2-2-1" },
    ],
  }),
  buildPhaseScenario({
    window: { id: "progression", phase: "progression", startTimeS: 4290, endTimeS: 4305 },
    players: createPlayers(
      [
        { id: "home_1", x: 21, y: 32, team: "home" },
        { id: "home_2", x: 35, y: 18, team: "home" },
        { id: "home_3", x: 45, y: 40, team: "home" },
        { id: "home_4", x: 54, y: 30, team: "home" },
        { id: "home_5", x: 74, y: 30, team: "home" },
        { id: "away_1", x: 50, y: 30, team: "away" },
        { id: "away_2", x: 60, y: 24, team: "away" },
        { id: "away_3", x: 65, y: 43, team: "away" },
        { id: "away_4", x: 81, y: 24, team: "away" },
        { id: "away_5", x: 84, y: 46, team: "away" },
      ],
      "home_4",
    ),
    lanes: [
      { from: "home_4", to: "home_5", probability: 0.82 },
      { from: "home_3", to: "home_4", probability: 0.79 },
      { from: "home_2", to: "home_3", probability: 0.74 },
    ],
    recommendations: [
      {
        playerId: "home_5",
        dx: 4,
        dy: -2,
        improvement: 0.06,
        confidence: 0.81,
        explanation: "Hold the last line a second longer to keep the passing lane open for the ball carrier.",
      },
    ],
    overloads: [{ x: 52, y: 20, width: 20, height: 18, team: "home", label: "Interior carry" }],
    heatMap: createHeatMap(6, 4),
    lineHeights: {
      home: [23, 41, 62],
      away: [49, 66, 82],
    },
    analyzeSequence: {
      state_score: 0.66,
      pitch_control: 0.6,
      recommendations: [
        {
          player_id: "home_5",
          dx: 4,
          dy: -2,
          improvement: 0.06,
          confidence: 0.81,
          explanation: "Hold the last line a second longer to keep the passing lane open for the ball carrier.",
        },
      ],
      predicted_improvement: 0.06,
      explanation: "The carrying midfielder has an interior lane. The next gain depends on synchronizing the forward run.",
      load_snapshot: {
        player_id: "home_4",
        high_intensity_distance: 318,
        sharp_deceleration_events: 6,
        change_of_direction_load: 33,
        load_flags: [],
      },
      phase_classification: "progression",
      confidence: 0.83,
    },
    searchSequences: {
      reference_match_id: "sample_game_2",
      similar_sequences: [
        {
          match_id: "sample_game_1",
          time: 3750,
          similarity_score: 0.88,
          phase: "progression",
          outcome: "territory_gain",
        },
      ],
    },
    pressingReport: {
      ppda: 4.8,
      counter_press_speed_s: 2.2,
      pressing_effectiveness: 0.56,
    },
    transitionReport: {
      transition_speed_s: 3.1,
      defensive_shape_recovery_s: 3.8,
    },
    teamShapeReport: {
      compactness: 1340,
      width: 44,
      depth: 52,
      defensive_line_height: 23,
      inter_line_distance: 13,
    },
    possessionChains: [
      {
        team: "home",
        start_time: 4290,
        end_time: 4305,
        start_x: 29,
        end_x: 79,
        event_count: 4,
      },
    ],
    formationChanges: [
      { team: "home", timestamp_s: 4290, formation: "2-2-1" },
      { team: "away", timestamp_s: 4290, formation: "2-2-1" },
    ],
  }),
  buildPhaseScenario({
    window: { id: "chance_creation", phase: "chance_creation", startTimeS: 4320, endTimeS: 4335 },
    players: createPlayers(
      [
        { id: "home_1", x: 20, y: 32, team: "home" },
        { id: "home_2", x: 34, y: 17, team: "home" },
        { id: "home_3", x: 43, y: 46, team: "home" },
        { id: "home_4", x: 61, y: 27, team: "home" },
        { id: "home_5", x: 81, y: 29, team: "home" },
        { id: "away_1", x: 48, y: 29, team: "away" },
        { id: "away_2", x: 63, y: 24, team: "away" },
        { id: "away_3", x: 67, y: 45, team: "away" },
        { id: "away_4", x: 84, y: 25, team: "away" },
        { id: "away_5", x: 87, y: 47, team: "away" },
      ],
      "home_4",
    ),
    lanes: [
      { from: "home_4", to: "home_5", probability: 0.77 },
      { from: "home_3", to: "home_4", probability: 0.75 },
      { from: "home_2", to: "home_4", probability: 0.62 },
    ],
    recommendations: [
      {
        playerId: "home_4",
        dx: 3,
        dy: -4,
        improvement: 0.07,
        confidence: 0.82,
        explanation: "Drive inside the full back to open the cutback lane and force the center back to step.",
      },
    ],
    overloads: [{ x: 59, y: 16, width: 22, height: 18, team: "home", label: "Cutback pocket" }],
    heatMap: createHeatMap(7, 4),
    lineHeights: {
      home: [24, 40, 65],
      away: [49, 67, 84],
    },
    analyzeSequence: {
      state_score: 0.69,
      pitch_control: 0.62,
      recommendations: [
        {
          player_id: "home_4",
          dx: 3,
          dy: -4,
          improvement: 0.07,
          confidence: 0.82,
          explanation: "Drive inside the full back to open the cutback lane and force the center back to step.",
        },
      ],
      predicted_improvement: 0.07,
      explanation: "This attack has the back line turned. The next edge comes from attacking the inside shoulder, not just the touchline.",
      load_snapshot: {
        player_id: "home_4",
        high_intensity_distance: 332,
        sharp_deceleration_events: 8,
        change_of_direction_load: 38,
        load_flags: ["cod_load"],
      },
      phase_classification: "chance_creation",
      confidence: 0.84,
    },
    searchSequences: {
      reference_match_id: "sample_game_2",
      similar_sequences: [
        {
          match_id: "sample_game_1",
          time: 3780,
          similarity_score: 0.9,
          phase: "chance_creation",
          outcome: "shot",
        },
      ],
    },
    pressingReport: {
      ppda: 3.1,
      counter_press_speed_s: 1.9,
      pressing_effectiveness: 0.65,
    },
    transitionReport: {
      transition_speed_s: 2.7,
      defensive_shape_recovery_s: 3.4,
    },
    teamShapeReport: {
      compactness: 1305,
      width: 42,
      depth: 55,
      defensive_line_height: 25,
      inter_line_distance: 15,
    },
    possessionChains: [
      {
        team: "home",
        start_time: 4320,
        end_time: 4335,
        start_x: 38,
        end_x: 88,
        event_count: 3,
      },
    ],
    formationChanges: [
      { team: "home", timestamp_s: 4320, formation: "2-2-1" },
      { team: "away", timestamp_s: 4320, formation: "2-2-1" },
    ],
  }),
  buildPhaseScenario({
    window: { id: "transition", phase: "transition", startTimeS: 4350, endTimeS: 4365 },
    players: createPlayers(
      [
        { id: "home_1", x: 23, y: 32, team: "home" },
        { id: "home_2", x: 36, y: 18, team: "home" },
        { id: "home_3", x: 48, y: 44, team: "home" },
        { id: "home_4", x: 58, y: 24, team: "home" },
        { id: "home_5", x: 84, y: 29, team: "home" },
        { id: "away_1", x: 49, y: 31, team: "away" },
        { id: "away_2", x: 61, y: 26, team: "away" },
        { id: "away_3", x: 66, y: 45, team: "away" },
        { id: "away_4", x: 80, y: 28, team: "away" },
        { id: "away_5", x: 86, y: 48, team: "away" },
      ],
      "home_5",
    ),
    lanes: [
      { from: "home_4", to: "home_5", probability: 0.82 },
      { from: "home_3", to: "home_5", probability: 0.7 },
      { from: "home_2", to: "home_4", probability: 0.65 },
    ],
    recommendations: [
      {
        playerId: "home_4",
        dx: 5,
        dy: 1,
        improvement: 0.08,
        confidence: 0.84,
        explanation: "Sprint beyond the ball to create a second wave option if the first run gets matched.",
      },
    ],
    overloads: [{ x: 64, y: 18, width: 20, height: 18, team: "home", label: "Second-wave lane" }],
    heatMap: createHeatMap(8, 3),
    lineHeights: {
      home: [25, 43, 69],
      away: [50, 64, 81],
    },
    analyzeSequence: {
      state_score: 0.7,
      pitch_control: 0.56,
      recommendations: [
        {
          player_id: "home_4",
          dx: 5,
          dy: 1,
          improvement: 0.08,
          confidence: 0.84,
          explanation: "Sprint beyond the ball to create a second wave option if the first run gets matched.",
        },
      ],
      predicted_improvement: 0.08,
      explanation: "The transition is balanced on the first and second wave. A supporting burst preserves the overload if the direct path closes.",
      load_snapshot: {
        player_id: "home_5",
        high_intensity_distance: 341,
        sharp_deceleration_events: 9,
        change_of_direction_load: 41,
        load_flags: ["hi_distance"],
      },
      phase_classification: "transition",
      confidence: 0.85,
    },
    searchSequences: {
      reference_match_id: "sample_game_2",
      similar_sequences: [
        {
          match_id: "sample_game_1",
          time: 3795,
          similarity_score: 0.88,
          phase: "transition",
          outcome: "shot",
        },
      ],
    },
    pressingReport: {
      ppda: 3.7,
      counter_press_speed_s: 1.7,
      pressing_effectiveness: 0.6,
    },
    transitionReport: {
      transition_speed_s: 2.1,
      defensive_shape_recovery_s: 3.0,
    },
    teamShapeReport: {
      compactness: 1270,
      width: 45,
      depth: 57,
      defensive_line_height: 27,
      inter_line_distance: 16,
    },
    possessionChains: [
      {
        team: "home",
        start_time: 4350,
        end_time: 4365,
        start_x: 41,
        end_x: 92,
        event_count: 3,
      },
    ],
    formationChanges: [
      { team: "home", timestamp_s: 4350, formation: "2-1-2" },
      { team: "away", timestamp_s: 4350, formation: "2-2-1" },
    ],
  }),
  buildPhaseScenario({
    window: { id: "pressing", phase: "pressing", startTimeS: 4380, endTimeS: 4395 },
    players: createPlayers(
      [
        { id: "home_1", x: 35, y: 33, team: "home" },
        { id: "home_2", x: 46, y: 20, team: "home" },
        { id: "home_3", x: 54, y: 43, team: "home" },
        { id: "home_4", x: 67, y: 24, team: "home" },
        { id: "home_5", x: 79, y: 31, team: "home" },
        { id: "away_1", x: 57, y: 31, team: "away" },
        { id: "away_2", x: 66, y: 25, team: "away" },
        { id: "away_3", x: 71, y: 45, team: "away" },
        { id: "away_4", x: 84, y: 28, team: "away" },
        { id: "away_5", x: 88, y: 48, team: "away" },
      ],
      "away_1",
    ),
    lanes: [
      { from: "away_1", to: "away_2", probability: 0.39 },
      { from: "away_1", to: "away_3", probability: 0.34 },
      { from: "home_3", to: "home_4", probability: 0.47 },
    ],
    recommendations: [
      {
        playerId: "home_2",
        dx: 4,
        dy: -1,
        improvement: 0.05,
        confidence: 0.78,
        explanation: "Step into the outside lane to complete the trap and stop the easy release.",
      },
    ],
    overloads: [{ x: 58, y: 18, width: 18, height: 16, team: "away", label: "Escape lane" }],
    heatMap: createHeatMap(6, 4),
    lineHeights: {
      home: [32, 49, 71],
      away: [57, 71, 86],
    },
    analyzeSequence: {
      state_score: 0.61,
      pitch_control: 0.47,
      recommendations: [
        {
          player_id: "home_2",
          dx: 4,
          dy: -1,
          improvement: 0.05,
          confidence: 0.78,
          explanation: "Step into the outside lane to complete the trap and stop the easy release.",
        },
      ],
      predicted_improvement: 0.05,
      explanation: "The pressing shape is close to locking the ball on one side. The final movement needs to come from the weak-side full back.",
      load_snapshot: {
        player_id: "home_2",
        high_intensity_distance: 274,
        sharp_deceleration_events: 9,
        change_of_direction_load: 37,
        load_flags: ["decel_events"],
      },
      phase_classification: "pressing",
      confidence: 0.81,
    },
    searchSequences: {
      reference_match_id: "sample_game_2",
      similar_sequences: [
        {
          match_id: "sample_game_1",
          time: 3825,
          similarity_score: 0.83,
          phase: "pressing",
          outcome: "turnover",
        },
      ],
    },
    pressingReport: {
      ppda: 2.6,
      counter_press_speed_s: 1.5,
      pressing_effectiveness: 0.75,
    },
    transitionReport: {
      transition_speed_s: 2.9,
      defensive_shape_recovery_s: 2.8,
    },
    teamShapeReport: {
      compactness: 1225,
      width: 40,
      depth: 48,
      defensive_line_height: 31,
      inter_line_distance: 12,
    },
    possessionChains: [
      {
        team: "away",
        start_time: 4380,
        end_time: 4395,
        start_x: 56,
        end_x: 68,
        event_count: 2,
      },
    ],
    formationChanges: [
      { team: "home", timestamp_s: 4380, formation: "2-3-0" },
      { team: "away", timestamp_s: 4380, formation: "2-2-1" },
    ],
  }),
];

const sampleGameOne: MatchScenario = {
  label: "Sample Game 1",
  defaultPlayerId: "home_4",
  defaultWindowId: "transition",
  phaseSummary: {
    build_up: 6,
    progression: 11,
    chance_creation: 8,
    transition: 5,
    pressing: 4,
  },
  loadReport: createLoadReport("sample_game_1", matchOneProfiles),
  playerProfiles: matchOnePlayerProfiles,
  efficiencyScatter: [
    { playerId: "home_1", tacticalValue: 0.52, movementEfficiency: 0.63, role: "pivot", team: "home" },
    { playerId: "home_2", tacticalValue: 0.58, movementEfficiency: 0.67, role: "full_back", team: "home" },
    { playerId: "home_3", tacticalValue: 0.66, movementEfficiency: 0.72, role: "midfielder", team: "home" },
    { playerId: "home_4", tacticalValue: 0.81, movementEfficiency: 0.79, role: "winger", team: "home" },
    { playerId: "home_5", tacticalValue: 0.76, movementEfficiency: 0.69, role: "forward", team: "home" },
  ],
  runBreakdown: [
    { runType: "Overlap", count: 8, share: 0.32 },
    { runType: "Stretching", count: 6, share: 0.24 },
    { runType: "Diagonal", count: 5, share: 0.2 },
    { runType: "Support", count: 4, share: 0.16 },
    { runType: "Dropping", count: 2, share: 0.08 },
  ],
  comparisonRows: [
    { playerId: "home_3", role: "midfielder", tacticalValue: 0.66, movementEfficiency: 0.72, offBallValue: 0.69, loadFlagCount: 0 },
    { playerId: "home_4", role: "winger", tacticalValue: 0.81, movementEfficiency: 0.79, offBallValue: 0.84, loadFlagCount: 1 },
    { playerId: "home_5", role: "forward", tacticalValue: 0.76, movementEfficiency: 0.69, offBallValue: 0.74, loadFlagCount: 1 },
  ],
  phases: Object.fromEntries(sampleGameOnePhases.map((phase) => [phase.window.id, phase])),
};

const sampleGameTwo: MatchScenario = {
  label: "Sample Game 2",
  defaultPlayerId: "home_5",
  defaultWindowId: "progression",
  phaseSummary: {
    build_up: 5,
    progression: 9,
    chance_creation: 7,
    transition: 6,
    pressing: 5,
  },
  loadReport: createLoadReport("sample_game_2", matchTwoProfiles),
  playerProfiles: matchTwoPlayerProfiles,
  efficiencyScatter: [
    { playerId: "home_1", tacticalValue: 0.54, movementEfficiency: 0.65, role: "pivot", team: "home" },
    { playerId: "home_2", tacticalValue: 0.57, movementEfficiency: 0.68, role: "full_back", team: "home" },
    { playerId: "home_3", tacticalValue: 0.68, movementEfficiency: 0.74, role: "midfielder", team: "home" },
    { playerId: "home_4", tacticalValue: 0.75, movementEfficiency: 0.73, role: "winger", team: "home" },
    { playerId: "home_5", tacticalValue: 0.82, movementEfficiency: 0.77, role: "forward", team: "home" },
  ],
  runBreakdown: [
    { runType: "Channel Run", count: 7, share: 0.28 },
    { runType: "Pinning", count: 6, share: 0.24 },
    { runType: "Inside Out", count: 5, share: 0.2 },
    { runType: "Support", count: 4, share: 0.16 },
    { runType: "Drop To Link", count: 3, share: 0.12 },
  ],
  comparisonRows: [
    { playerId: "home_3", role: "midfielder", tacticalValue: 0.68, movementEfficiency: 0.74, offBallValue: 0.72, loadFlagCount: 0 },
    { playerId: "home_4", role: "winger", tacticalValue: 0.75, movementEfficiency: 0.73, offBallValue: 0.78, loadFlagCount: 1 },
    { playerId: "home_5", role: "forward", tacticalValue: 0.82, movementEfficiency: 0.77, offBallValue: 0.8, loadFlagCount: 2 },
  ],
  phases: Object.fromEntries(sampleGameTwoPhases.map((phase) => [phase.window.id, phase])),
};

const DEMO_MATCHES: Record<string, MatchScenario> = {
  sample_game_1: sampleGameOne,
  sample_game_2: sampleGameTwo,
};

export function getDefaultPlayerId(matchId: string): string {
  return (DEMO_MATCHES[matchId] ?? DEMO_MATCHES[DEFAULT_MATCH_ID]).defaultPlayerId;
}

export function getDemoPhaseWindows(matchId: string): PhaseWindow[] {
  const match = DEMO_MATCHES[matchId] ?? DEMO_MATCHES[DEFAULT_MATCH_ID];
  return buildPhaseWindows(Object.values(match.phases));
}

export function getDefaultReferenceTime(matchId: string): number {
  const match = DEMO_MATCHES[matchId] ?? DEMO_MATCHES[DEFAULT_MATCH_ID];
  const defaultPhase = match.phases[match.defaultWindowId];
  return defaultPhase?.window.endTimeS ?? Object.values(match.phases)[0]?.window.endTimeS ?? 0;
}

export function getActivePhaseWindow(matchId: string, referenceTimeS: number): PhaseWindow {
  return selectScenario(matchId, referenceTimeS).phase.window;
}

export function getDemoAnalyzeSequence(
  matchId: string,
  referenceTimeS: number,
): AnalyzeSequenceResponse {
  return selectScenario(matchId, referenceTimeS).phase.analyzeSequence;
}

export function getDemoMatchReport(matchId: string, referenceTimeS: number): MatchReportResponse {
  const { match, phase } = selectScenario(matchId, referenceTimeS);
  return buildMatchReport(matchId, match, phase);
}

export function getDemoLoadReport(matchId: string): LoadReportResponse {
  return (DEMO_MATCHES[matchId] ?? DEMO_MATCHES[DEFAULT_MATCH_ID]).loadReport;
}

export function getDemoSearchSequences(
  matchId: string,
  referenceTimeS: number,
): SearchSequencesResponse {
  return selectScenario(matchId, referenceTimeS).phase.searchSequences;
}

export function getDemoPlayerProfile(
  matchId: string,
  playerId: string,
): PlayerProfileResponse {
  const match = DEMO_MATCHES[matchId] ?? DEMO_MATCHES[DEFAULT_MATCH_ID];
  return match.playerProfiles[playerId] ?? match.playerProfiles[match.defaultPlayerId];
}

export function getDemoDashboardData(
  matchId: string,
  referenceTimeS: number,
  playerId: string,
): DashboardData {
  const { match, phase } = selectScenario(matchId, referenceTimeS);
  const effectivePlayerId = match.playerProfiles[playerId] ? playerId : match.defaultPlayerId;

  return {
    health: demoHealth,
    modelInfo: demoModelInfo,
    analyzeSequence: phase.analyzeSequence,
    matchReport: buildMatchReport(matchId, match, phase),
    loadReport: match.loadReport,
    searchSequences: phase.searchSequences,
    playerProfile: getDemoPlayerProfile(matchId, effectivePlayerId),
    pitchPlayers: phase.players,
    pitchHeatMap: phase.heatMap,
    pitchPassingLanes: phase.passingLanes,
    pitchRecommendations: phase.pitchRecommendations,
    pitchOverloads: phase.overloads,
    teamShapeOverlay: phase.teamShapeOverlay,
    efficiencyScatter: match.efficiencyScatter,
    runBreakdown: match.runBreakdown,
    comparisonRows: match.comparisonRows,
  };
}

export const demoDashboardData = getDemoDashboardData(
  DEFAULT_MATCH_ID,
  getDefaultReferenceTime(DEFAULT_MATCH_ID),
  getDefaultPlayerId(DEFAULT_MATCH_ID),
);

export function getMatchLabel(matchId: string): string {
  return (DEMO_MATCHES[matchId] ?? DEMO_MATCHES[DEFAULT_MATCH_ID]).label;
}

export function getScenarioOrder(): string[] {
  return MATCH_SCENARIO_ORDER;
}
