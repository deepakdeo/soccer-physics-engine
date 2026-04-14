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

type TeamSide = "home" | "away";

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

interface PositionAdjustment {
  x?: number;
  y?: number;
}

interface RoleMetrics {
  tacticalBase: number;
  efficiencyBase: number;
  offBallBase: number;
  highIntensityBase: number;
  decelBase: number;
  codBase: number;
  hiShareBase: number;
  meanSpeedBase: number;
}

interface PlayerTemplate extends RoleMetrics {
  id: string;
  number: number;
  role: string;
  team: TeamSide;
  y: number;
  heatMapCenter: [number, number];
  runTypes: string[];
}

interface PhaseConfig {
  window: PhaseWindow;
  ballHolderId: string;
  focusPlayerId: string;
  homeX: Record<number, number>;
  awayX: Record<number, number>;
  adjustments?: Record<string, PositionAdjustment>;
  lanes: LaneSeed[];
  recommendations: RecommendationSeed[];
  overloads: PitchZone[];
  heatMapCenter: [number, number];
  lineHeights: {
    home: number[];
    away: number[];
  };
  stateScore: number;
  pitchControl: number;
  predictedImprovement: number;
  confidence: number;
  explanation: string;
  similarSequences: SearchSequencesResponse["similar_sequences"];
  pressingReport: Record<string, number>;
  transitionReport: Record<string, unknown>;
  possessionChains: Array<Record<string, unknown>>;
}

interface PhaseScenario {
  window: PhaseWindow;
  players: PitchPlayer[];
  passingLanes: PitchLane[];
  pitchRecommendations: PitchRecommendation[];
  overloads: PitchZone[];
  heatMap: number[][];
  teamShapeOverlay: TeamShapeOverlay;
  analyzeSequence: AnalyzeSequenceResponse;
  searchSequences: SearchSequencesResponse;
  pressingReport: Record<string, number>;
  transitionReport: Record<string, unknown>;
  teamShapeReport: Record<string, number>;
  possessionChains: Array<Record<string, unknown>>;
  formationChanges: FormationChange[];
}

interface MatchBlueprint {
  id: string;
  label: string;
  defaultPlayerId: string;
  defaultWindowId: string;
  phaseSummary: Record<string, number>;
  windowEnds: number[];
  tacticalBias: number;
  efficiencyBias: number;
  loadBias: number;
  homeFormation: string;
  awayFormation: string;
  phaseConfigs: PhaseConfig[];
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

const MATCH_SCENARIO_ORDER: string[] = ["sample_game_1", "sample_game_2"];

export const MATCH_OPTIONS: MatchOption[] = [
  {
    value: "sample_game_1",
    label: "Sample Match 1 (anonymized tracking data — 22 players, 90 minutes, 25fps)",
  },
  {
    value: "sample_game_2",
    label: "Sample Match 2 (anonymized tracking data — 22 players, 90 minutes, 25fps)",
  },
];

export const DEFAULT_MATCH_ID = "sample_game_1";

const ROLE_METRICS: Record<string, RoleMetrics> = {
  goalkeeper: {
    tacticalBase: 0.44,
    efficiencyBase: 0.63,
    offBallBase: 0.35,
    highIntensityBase: 110,
    decelBase: 2,
    codBase: 12,
    hiShareBase: 0.05,
    meanSpeedBase: 3.8,
  },
  full_back: {
    tacticalBase: 0.58,
    efficiencyBase: 0.69,
    offBallBase: 0.61,
    highIntensityBase: 345,
    decelBase: 8,
    codBase: 36,
    hiShareBase: 0.18,
    meanSpeedBase: 5.3,
  },
  center_back: {
    tacticalBase: 0.53,
    efficiencyBase: 0.65,
    offBallBase: 0.47,
    highIntensityBase: 255,
    decelBase: 5,
    codBase: 24,
    hiShareBase: 0.11,
    meanSpeedBase: 4.7,
  },
  defensive_midfielder: {
    tacticalBase: 0.65,
    efficiencyBase: 0.72,
    offBallBase: 0.63,
    highIntensityBase: 370,
    decelBase: 8,
    codBase: 39,
    hiShareBase: 0.2,
    meanSpeedBase: 5.2,
  },
  central_midfielder: {
    tacticalBase: 0.69,
    efficiencyBase: 0.75,
    offBallBase: 0.68,
    highIntensityBase: 392,
    decelBase: 10,
    codBase: 44,
    hiShareBase: 0.23,
    meanSpeedBase: 5.5,
  },
  attacking_midfielder: {
    tacticalBase: 0.75,
    efficiencyBase: 0.74,
    offBallBase: 0.73,
    highIntensityBase: 382,
    decelBase: 9,
    codBase: 40,
    hiShareBase: 0.24,
    meanSpeedBase: 5.4,
  },
  winger: {
    tacticalBase: 0.78,
    efficiencyBase: 0.77,
    offBallBase: 0.8,
    highIntensityBase: 418,
    decelBase: 11,
    codBase: 46,
    hiShareBase: 0.27,
    meanSpeedBase: 5.8,
  },
  striker: {
    tacticalBase: 0.74,
    efficiencyBase: 0.71,
    offBallBase: 0.72,
    highIntensityBase: 362,
    decelBase: 9,
    codBase: 38,
    hiShareBase: 0.22,
    meanSpeedBase: 5.4,
  },
};

function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value));
}

function makeTemplate(
  team: TeamSide,
  number: number,
  role: string,
  y: number,
  heatMapCenter: [number, number],
  runTypes: string[],
): PlayerTemplate {
  return {
    id: `${team}_${number}`,
    team,
    number,
    role,
    y,
    heatMapCenter,
    runTypes,
    ...ROLE_METRICS[role],
  };
}

const HOME_PLAYER_TEMPLATES: PlayerTemplate[] = [
  makeTemplate("home", 1, "goalkeeper", 34, [1, 4], ["support"]),
  makeTemplate("home", 2, "full_back", 12, [4, 1], ["overlap", "support"]),
  makeTemplate("home", 3, "center_back", 24, [2, 2], ["support", "dropping"]),
  makeTemplate("home", 4, "center_back", 44, [2, 5], ["support", "dropping"]),
  makeTemplate("home", 5, "full_back", 56, [4, 6], ["overlap", "support"]),
  makeTemplate("home", 6, "defensive_midfielder", 34, [4, 4], ["support", "dropping"]),
  makeTemplate("home", 7, "winger", 14, [7, 1], ["stretching", "overlap"]),
  makeTemplate("home", 8, "central_midfielder", 24, [5, 2], ["diagonal", "support"]),
  makeTemplate("home", 9, "striker", 34, [8, 4], ["stretching", "dropping"]),
  makeTemplate("home", 10, "attacking_midfielder", 44, [6, 5], ["diagonal", "support"]),
  makeTemplate("home", 11, "winger", 54, [7, 6], ["stretching", "diagonal"]),
];

const AWAY_PLAYER_TEMPLATES: PlayerTemplate[] = [
  makeTemplate("away", 1, "goalkeeper", 34, [8, 4], ["support"]),
  makeTemplate("away", 2, "full_back", 12, [6, 1], ["overlap", "support"]),
  makeTemplate("away", 3, "center_back", 24, [8, 2], ["support", "dropping"]),
  makeTemplate("away", 4, "center_back", 44, [8, 5], ["support", "dropping"]),
  makeTemplate("away", 5, "full_back", 56, [6, 6], ["overlap", "support"]),
  makeTemplate("away", 6, "defensive_midfielder", 28, [6, 3], ["support", "dropping"]),
  makeTemplate("away", 7, "winger", 16, [4, 1], ["stretching", "overlap"]),
  makeTemplate("away", 8, "defensive_midfielder", 40, [6, 5], ["support", "dropping"]),
  makeTemplate("away", 9, "striker", 34, [3, 4], ["stretching", "dropping"]),
  makeTemplate("away", 10, "attacking_midfielder", 34, [5, 4], ["diagonal", "support"]),
  makeTemplate("away", 11, "winger", 52, [4, 6], ["stretching", "diagonal"]),
];

const ALL_PLAYER_TEMPLATES = [...HOME_PLAYER_TEMPLATES, ...AWAY_PLAYER_TEMPLATES];

function createHeatMap(centerColumn: number, centerRow: number): number[][] {
  return Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 12 }, (_, column) =>
      Number(
        clamp(
          0.96 - Math.abs(column - centerColumn) * 0.11 - Math.abs(row - centerRow) * 0.13,
          0.05,
          0.96,
        ).toFixed(2),
      ),
    ),
  );
}

function createPlayerHeatMap(
  centerColumn: number,
  centerRow: number,
): PlayerProfileResponse["heat_map_data"] {
  return {
    x_grid: Array.from({ length: 10 }, (_, index) => index * 10),
    y_grid: Array.from({ length: 8 }, (_, index) => index * 8.5),
    density: Array.from({ length: 8 }, (_, row) =>
      Array.from({ length: 10 }, (_, column) =>
        Number(
          clamp(
            0.94 - Math.abs(column - centerColumn) * 0.14 - Math.abs(row - centerRow) * 0.16,
            0.04,
            0.94,
          ).toFixed(2),
        ),
      ),
    ),
  };
}

function toXMap(values: number[]): Record<number, number> {
  return Object.fromEntries(values.map((value, index) => [index + 1, value])) as Record<
    number,
    number
  >;
}

function createPhasePlayers(
  homeX: Record<number, number>,
  awayX: Record<number, number>,
  ballHolderId: string,
  adjustments: Record<string, PositionAdjustment> = {},
): PitchPlayer[] {
  const buildPlayer = (template: PlayerTemplate, xPositions: Record<number, number>): PitchPlayer => {
    const adjustment = adjustments[template.id] ?? {};

    return {
      id: template.id,
      label: String(template.number),
      x: Number(((xPositions[template.number] ?? 0) + (adjustment.x ?? 0)).toFixed(1)),
      y: Number((template.y + (adjustment.y ?? 0)).toFixed(1)),
      team: template.team,
      role: template.role,
      hasBall: template.id === ballHolderId,
    };
  };

  return [
    ...HOME_PLAYER_TEMPLATES.map((template) => buildPlayer(template, homeX)),
    ...AWAY_PLAYER_TEMPLATES.map((template) => buildPlayer(template, awayX)),
  ];
}

function findPlayer(players: PitchPlayer[], playerId: string): PitchPlayer {
  const player = players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error(`Unknown player ${playerId}.`);
  }
  return player;
}

function createPassingLanes(players: PitchPlayer[], seeds: LaneSeed[]): PitchLane[] {
  return seeds.map((seed) => ({
    from: [findPlayer(players, seed.from).x, findPlayer(players, seed.from).y],
    to: [findPlayer(players, seed.to).x, findPlayer(players, seed.to).y],
    probability: seed.probability,
  }));
}

function createPitchRecommendations(
  players: PitchPlayer[],
  recommendations: RecommendationSeed[],
): PitchRecommendation[] {
  return recommendations.map((recommendation) => {
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

function sortHullPoints(players: PitchPlayer[]): Array<[number, number]> {
  const outfield = players.filter((player) => player.role !== "goalkeeper");
  const centroidX =
    outfield.reduce((sum, player) => sum + player.x, 0) / Math.max(outfield.length, 1);
  const centroidY =
    outfield.reduce((sum, player) => sum + player.y, 0) / Math.max(outfield.length, 1);

  return [...outfield]
    .sort(
      (left, right) =>
        Math.atan2(left.y - centroidY, left.x - centroidX) -
        Math.atan2(right.y - centroidY, right.x - centroidX),
    )
    .map((player) => [player.x, player.y] as [number, number]);
}

function createTeamShapeOverlay(
  players: PitchPlayer[],
  lineHeights: PhaseConfig["lineHeights"],
): TeamShapeOverlay {
  return {
    homeHull: sortHullPoints(players.filter((player) => player.team === "home")),
    awayHull: sortHullPoints(players.filter((player) => player.team === "away")),
    homeLines: lineHeights.home,
    awayLines: lineHeights.away,
  };
}

function createFatigueCurve(
  template: PlayerTemplate,
  windowEnds: number[],
  loadBias: number,
): FatigueWindow[] {
  const variance = (template.number % 4) - 1.5;

  return windowEnds.map((windowEnd, index) => ({
    window_start: windowEnd - 1,
    window_end: windowEnd,
    mean_speed: Number(
      clamp(
        template.meanSpeedBase - index * 0.08 + variance * 0.04 + loadBias * 0.002,
        3.1,
        6.4,
      ).toFixed(2),
    ),
    high_intensity_fraction: Number(
      clamp(
        template.hiShareBase - index * 0.012 + variance * 0.008 + loadBias * 0.0006,
        0.04,
        0.46,
      ).toFixed(2),
    ),
    accel_event_rate: Number(
      clamp(0.16 + template.decelBase * 0.02 - index * 0.01 + variance * 0.01, 0.08, 0.52).toFixed(
        2,
      ),
    ),
  }));
}

function createLoadFlags(
  highIntensityDistance: number,
  sharpDecelerationEvents: number,
  changeOfDirectionLoad: number,
): string[] {
  const flags: string[] = [];

  if (highIntensityDistance >= 390) {
    flags.push("hi_distance");
  }
  if (sharpDecelerationEvents >= 10) {
    flags.push("decel_events");
  }
  if (changeOfDirectionLoad >= 46) {
    flags.push("cod_load");
  }

  return flags;
}

function buildLoadProfiles(blueprint: MatchBlueprint): Record<string, PlayerLoadProfile> {
  return Object.fromEntries(
    ALL_PLAYER_TEMPLATES.map((template) => {
      const variance = ((template.number % 5) - 2) * 9;
      const teamDelta = template.team === "home" ? 8 : -4;
      const highIntensityDistance = Math.round(
        template.highIntensityBase + blueprint.loadBias + variance + teamDelta,
      );
      const sharpDecelerationEvents = Math.max(
        1,
        Math.round(template.decelBase + blueprint.loadBias * 0.04 + variance / 16),
      );
      const changeOfDirectionLoad = Math.round(
        template.codBase + blueprint.loadBias * 0.18 + variance / 7,
      );
      const leftLoad = Math.max(
        4,
        Math.round(changeOfDirectionLoad * (0.47 - variance / 500 + (template.team === "home" ? 0.01 : -0.01))),
      );
      const rightLoad = Math.max(4, changeOfDirectionLoad - leftLoad);
      const asymmetryRatio = Number(
        (Math.abs(leftLoad - rightLoad) / Math.max(leftLoad + rightLoad, 1)).toFixed(2),
      );

      return [
        template.id,
        {
          player_id: template.id,
          high_intensity_distance: highIntensityDistance,
          sharp_deceleration_events: sharpDecelerationEvents,
          change_of_direction_load: changeOfDirectionLoad,
          directional_asymmetry: {
            left_load: leftLoad,
            right_load: rightLoad,
            asymmetry_ratio: asymmetryRatio,
          },
          fatigue_curve: createFatigueCurve(template, blueprint.windowEnds, blueprint.loadBias),
          load_flags: createLoadFlags(
            highIntensityDistance,
            sharpDecelerationEvents,
            changeOfDirectionLoad,
          ),
        },
      ];
    }),
  ) as Record<string, PlayerLoadProfile>;
}

function buildPlayerProfiles(
  blueprint: MatchBlueprint,
): Record<string, PlayerProfileResponse> {
  return Object.fromEntries(
    ALL_PLAYER_TEMPLATES.map((template) => {
      const variance = ((template.number % 4) - 1.5) * 0.015;
      const teamBias = template.team === "home" ? 0.02 : -0.01;
      const tacticalValue = clamp(
        template.tacticalBase + blueprint.tacticalBias + variance + teamBias,
        0.42,
        0.88,
      );
      const movementEfficiency = clamp(
        template.efficiencyBase + blueprint.efficiencyBias + variance * 0.8,
        0.45,
        0.86,
      );
      const offBallValue = clamp(
        template.offBallBase + blueprint.tacticalBias * 0.5 + teamBias * 0.7,
        0.36,
        0.88,
      );

      return [
        template.id,
        {
          player_id: template.id,
          role_detected: template.role,
          run_types: template.runTypes,
          space_creation_score: Number((tacticalValue * 6).toFixed(1)),
          movement_efficiency: Number(movementEfficiency.toFixed(2)),
          heat_map_data: createPlayerHeatMap(
            template.heatMapCenter[0],
            template.heatMapCenter[1],
          ),
          off_ball_value: Number(offBallValue.toFixed(2)),
        },
      ];
    }),
  ) as Record<string, PlayerProfileResponse>;
}

function buildEfficiencyScatter(
  playerProfiles: Record<string, PlayerProfileResponse>,
): EfficiencyPoint[] {
  return ALL_PLAYER_TEMPLATES.map((template) => ({
    playerId: template.id,
    tacticalValue: Number((playerProfiles[template.id].space_creation_score / 6).toFixed(2)),
    movementEfficiency: playerProfiles[template.id].movement_efficiency,
    role: template.role,
    team: template.team,
  }));
}

function buildComparisonRows(
  playerProfiles: Record<string, PlayerProfileResponse>,
  loadProfiles: Record<string, PlayerLoadProfile>,
): ComparisonRow[] {
  return ALL_PLAYER_TEMPLATES.map((template) => ({
    playerId: template.id,
    role: template.role,
    tacticalValue: Number((playerProfiles[template.id].space_creation_score / 6).toFixed(2)),
    movementEfficiency: playerProfiles[template.id].movement_efficiency,
    offBallValue: playerProfiles[template.id].off_ball_value,
    loadFlagCount: loadProfiles[template.id].load_flags.length,
  })).sort((left, right) => right.tacticalValue - left.tacticalValue);
}

function buildRunBreakdown(): RunBreakdownRow[] {
  const counts = new Map<string, number>();

  for (const template of ALL_PLAYER_TEMPLATES) {
    if (template.role === "goalkeeper") {
      continue;
    }
    for (const runType of template.runTypes) {
      counts.set(runType, (counts.get(runType) ?? 0) + 1);
    }
  }

  const entries = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return entries.slice(0, 5).map(([runType, count]) => ({
    runType: runType
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    count,
    share: Number((count / Math.max(total, 1)).toFixed(2)),
  }));
}

function computeTeamShapeReport(players: PitchPlayer[]): Record<string, number> {
  const homeOutfield = players.filter(
    (player) => player.team === "home" && player.role !== "goalkeeper",
  );
  const sortedByX = [...homeOutfield].sort((left, right) => left.x - right.x);
  const defenders = sortedByX.slice(0, 4);
  const midfield = sortedByX.slice(4, 7);
  const width = Math.max(...homeOutfield.map((player) => player.y)) - Math.min(...homeOutfield.map((player) => player.y));
  const depth = Math.max(...homeOutfield.map((player) => player.x)) - Math.min(...homeOutfield.map((player) => player.x));
  const defensiveLineHeight =
    defenders.reduce((sum, player) => sum + player.x, 0) / Math.max(defenders.length, 1);
  const midfieldLineHeight =
    midfield.reduce((sum, player) => sum + player.x, 0) / Math.max(midfield.length, 1);

  return {
    compactness: Number((width * depth).toFixed(0)),
    width: Number(width.toFixed(1)),
    depth: Number(depth.toFixed(1)),
    defensive_line_height: Number(defensiveLineHeight.toFixed(1)),
    inter_line_distance: Number((midfieldLineHeight - defensiveLineHeight).toFixed(1)),
  };
}

function buildAnalyzeSequenceRecommendations(
  recommendations: RecommendationSeed[],
): AnalyzeSequenceResponse["recommendations"] {
  return recommendations.map((recommendation) => ({
    player_id: recommendation.playerId,
    dx: recommendation.dx,
    dy: recommendation.dy,
    improvement: recommendation.improvement,
    confidence: recommendation.confidence,
    explanation: recommendation.explanation,
  }));
}

function buildPhaseScenario(
  blueprint: MatchBlueprint,
  config: PhaseConfig,
  loadProfiles: Record<string, PlayerLoadProfile>,
): PhaseScenario {
  const players = createPhasePlayers(
    config.homeX,
    config.awayX,
    config.ballHolderId,
    config.adjustments,
  );
  const recommendations = buildAnalyzeSequenceRecommendations(config.recommendations);
  const pitchRecommendations = createPitchRecommendations(players, config.recommendations);
  const teamShapeReport = computeTeamShapeReport(players);

  return {
    window: config.window,
    players,
    passingLanes: createPassingLanes(players, config.lanes),
    pitchRecommendations,
    overloads: config.overloads,
    heatMap: createHeatMap(config.heatMapCenter[0], config.heatMapCenter[1]),
    teamShapeOverlay: createTeamShapeOverlay(players, config.lineHeights),
    analyzeSequence: {
      state_score: config.stateScore,
      pitch_control: config.pitchControl,
      recommendations,
      predicted_improvement: config.predictedImprovement,
      explanation: config.explanation,
      load_snapshot: {
        player_id: config.focusPlayerId,
        high_intensity_distance: loadProfiles[config.focusPlayerId].high_intensity_distance,
        sharp_deceleration_events: loadProfiles[config.focusPlayerId].sharp_deceleration_events,
        change_of_direction_load: loadProfiles[config.focusPlayerId].change_of_direction_load,
        load_flags: loadProfiles[config.focusPlayerId].load_flags,
      },
      phase_classification: config.window.phase,
      confidence: config.confidence,
    },
    searchSequences: {
      reference_match_id: blueprint.id,
      similar_sequences: config.similarSequences,
    },
    pressingReport: config.pressingReport,
    transitionReport: config.transitionReport,
    teamShapeReport,
    possessionChains: config.possessionChains,
    formationChanges: [
      { team: "home", timestamp_s: config.window.startTimeS, formation: blueprint.homeFormation },
      { team: "away", timestamp_s: config.window.startTimeS, formation: blueprint.awayFormation },
    ],
  };
}

function buildMatchScenario(blueprint: MatchBlueprint): MatchScenario {
  const loadProfiles = buildLoadProfiles(blueprint);
  const playerProfiles = buildPlayerProfiles(blueprint);
  const phaseScenarios = blueprint.phaseConfigs.map((config) =>
    buildPhaseScenario(blueprint, config, loadProfiles),
  );

  return {
    label: blueprint.label,
    defaultPlayerId: blueprint.defaultPlayerId,
    defaultWindowId: blueprint.defaultWindowId,
    phaseSummary: blueprint.phaseSummary,
    loadReport: {
      match_id: blueprint.id,
      player_load_profiles: ALL_PLAYER_TEMPLATES.map((template) => loadProfiles[template.id]),
    },
    playerProfiles,
    efficiencyScatter: buildEfficiencyScatter(playerProfiles),
    runBreakdown: buildRunBreakdown(),
    comparisonRows: buildComparisonRows(playerProfiles, loadProfiles),
    phases: Object.fromEntries(phaseScenarios.map((phase) => [phase.window.id, phase])),
  };
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

function buildMatchReport(
  matchId: string,
  match: MatchScenario,
  phase: PhaseScenario,
): MatchReportResponse {
  return {
    match_id: matchId,
    phase_summary: match.phaseSummary,
    possession_chains: phase.possessionChains,
    pressing_report: phase.pressingReport,
    transition_report: phase.transitionReport,
    team_shape_report: phase.teamShapeReport,
    player_load_profiles: match.loadReport.player_load_profiles,
    fatigue_curves: Object.fromEntries(
      match.loadReport.player_load_profiles.map((profile) => [profile.player_id, profile.fatigue_curve]),
    ),
    formation_changes: phase.formationChanges,
  };
}

const sampleGameOneBlueprint: MatchBlueprint = {
  id: "sample_game_1",
  label: "Sample Match 1",
  defaultPlayerId: "home_2",
  defaultWindowId: "transition",
  phaseSummary: {
    build_up: 21,
    progression: 29,
    chance_creation: 14,
    transition: 10,
    pressing: 8,
  },
  windowEnds: [61, 62, 63, 64, 65],
  tacticalBias: 0.02,
  efficiencyBias: 0.01,
  loadBias: 14,
  homeFormation: "4-3-3",
  awayFormation: "4-2-3-1",
  phaseConfigs: [
    {
      window: { id: "build_up", phase: "build_up", startTimeS: 3690, endTimeS: 3705 },
      ballHolderId: "home_1",
      focusPlayerId: "home_2",
      homeX: toXMap([8, 22, 18, 18, 22, 34, 44, 46, 58, 62, 56]),
      awayX: toXMap([96, 82, 86, 86, 82, 70, 62, 74, 50, 58, 62]),
      adjustments: {
        home_9: { y: 2 },
        home_11: { y: -2 },
        away_7: { y: 1 },
        away_11: { y: -1 },
      },
      lanes: [
        { from: "home_1", to: "home_3", probability: 0.9 },
        { from: "home_1", to: "home_4", probability: 0.88 },
        { from: "home_6", to: "home_7", probability: 0.8 },
        { from: "home_6", to: "home_8", probability: 0.78 },
        { from: "home_7", to: "home_9", probability: 0.64 },
      ],
      recommendations: [
        {
          playerId: "home_2",
          dx: 4,
          dy: 1,
          improvement: 0.05,
          confidence: 0.79,
          explanation: "Step beyond the first line to give the center back a cleaner exit lane on the right side.",
        },
        {
          playerId: "home_6",
          dx: 3,
          dy: -2,
          improvement: 0.03,
          confidence: 0.71,
          explanation: "Check higher into the pocket to shorten the first progression pass.",
        },
      ],
      overloads: [
        { x: 20, y: 10, width: 18, height: 18, team: "home", label: "Build-up exit" },
      ],
      heatMapCenter: [3, 4],
      lineHeights: {
        home: [20, 41, 59],
        away: [56, 73, 86],
      },
      stateScore: 0.58,
      pitchControl: 0.56,
      predictedImprovement: 0.05,
      confidence: 0.81,
      explanation: "The first circulation is stable, but the right back is still flat. One higher starting point improves the exit angle into midfield.",
      similarSequences: [
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
      pressingReport: {
        ppda: 7.3,
        counter_press_speed_s: 2.9,
        pressing_effectiveness: 0.42,
      },
      transitionReport: {
        transition_speed_s: 4.2,
        defensive_shape_recovery_s: 4.7,
      },
      possessionChains: [
        {
          team: "home",
          start_time: 3690,
          end_time: 3705,
          start_x: 8,
          end_x: 54,
          event_count: 6,
        },
      ],
    },
    {
      window: { id: "progression", phase: "progression", startTimeS: 3735, endTimeS: 3750 },
      ballHolderId: "home_8",
      focusPlayerId: "home_7",
      homeX: toXMap([10, 28, 24, 24, 28, 44, 52, 56, 72, 78, 68]),
      awayX: toXMap([96, 78, 82, 82, 78, 66, 58, 70, 48, 56, 60]),
      adjustments: {
        home_7: { y: 1 },
        home_11: { y: -1 },
        home_8: { y: -2 },
      },
      lanes: [
        { from: "home_6", to: "home_8", probability: 0.82 },
        { from: "home_8", to: "home_11", probability: 0.77 },
        { from: "home_7", to: "home_9", probability: 0.79 },
        { from: "home_8", to: "home_10", probability: 0.68 },
        { from: "home_2", to: "home_7", probability: 0.63 },
      ],
      recommendations: [
        {
          playerId: "home_7",
          dx: 5,
          dy: -1,
          improvement: 0.06,
          confidence: 0.81,
          explanation: "Hold the width one line higher so the central midfielder can play forward earlier.",
        },
      ],
      overloads: [
        { x: 52, y: 8, width: 20, height: 18, team: "home", label: "Wide progression lane" },
      ],
      heatMapCenter: [5, 3],
      lineHeights: {
        home: [25, 50, 73],
        away: [52, 69, 82],
      },
      stateScore: 0.65,
      pitchControl: 0.59,
      predictedImprovement: 0.06,
      confidence: 0.84,
      explanation: "The ball has reached the midfield line. The next gain comes from keeping the winger high enough to stretch the full back.",
      similarSequences: [
        {
          match_id: "sample_game_2",
          time: 4305,
          similarity_score: 0.89,
          phase: "progression",
          outcome: "territory_gain",
        },
        {
          match_id: "sample_game_1",
          time: 3720,
          similarity_score: 0.82,
          phase: "progression",
          outcome: "switch",
        },
      ],
      pressingReport: {
        ppda: 5.2,
        counter_press_speed_s: 2.4,
        pressing_effectiveness: 0.53,
      },
      transitionReport: {
        transition_speed_s: 3.5,
        defensive_shape_recovery_s: 4.1,
      },
      possessionChains: [
        {
          team: "home",
          start_time: 3735,
          end_time: 3750,
          start_x: 24,
          end_x: 79,
          event_count: 5,
        },
      ],
    },
    {
      window: { id: "chance_creation", phase: "chance_creation", startTimeS: 3765, endTimeS: 3780 },
      ballHolderId: "home_11",
      focusPlayerId: "home_11",
      homeX: toXMap([12, 48, 34, 34, 52, 58, 68, 70, 84, 92, 86]),
      awayX: toXMap([98, 84, 88, 88, 84, 72, 66, 76, 60, 64, 68]),
      adjustments: {
        home_2: { y: -2 },
        home_5: { y: 2 },
        home_11: { y: -3 },
        away_2: { y: 1 },
      },
      lanes: [
        { from: "home_8", to: "home_11", probability: 0.83 },
        { from: "home_7", to: "home_9", probability: 0.76 },
        { from: "home_11", to: "home_10", probability: 0.74 },
        { from: "home_9", to: "home_10", probability: 0.7 },
        { from: "home_2", to: "home_9", probability: 0.62 },
      ],
      recommendations: [
        {
          playerId: "home_11",
          dx: 3,
          dy: -3,
          improvement: 0.08,
          confidence: 0.84,
          explanation: "Attack the inside shoulder of the full back to open the cutback lane before the back line resets.",
        },
        {
          playerId: "home_9",
          dx: 2,
          dy: 0,
          improvement: 0.03,
          confidence: 0.72,
          explanation: "Pin the center backs a half-step deeper to preserve the cutback window.",
        },
      ],
      overloads: [
        { x: 60, y: 10, width: 22, height: 18, team: "home", label: "Left-side overload" },
        { x: 72, y: 24, width: 16, height: 16, team: "home", label: "Cutback pocket" },
      ],
      heatMapCenter: [7, 3],
      lineHeights: {
        home: [34, 65, 86],
        away: [60, 75, 88],
      },
      stateScore: 0.69,
      pitchControl: 0.63,
      predictedImprovement: 0.08,
      confidence: 0.84,
      explanation: "The attack has reached the box line. The highest-value action is an inside burst from the left winger, not another touch toward the corner.",
      similarSequences: [
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
          similarity_score: 0.83,
          phase: "progression",
          outcome: "territory_gain",
        },
      ],
      pressingReport: {
        ppda: 3.0,
        counter_press_speed_s: 2.0,
        pressing_effectiveness: 0.66,
      },
      transitionReport: {
        transition_speed_s: 2.9,
        defensive_shape_recovery_s: 3.6,
      },
      possessionChains: [
        {
          team: "home",
          start_time: 3765,
          end_time: 3780,
          start_x: 37,
          end_x: 92,
          event_count: 5,
        },
      ],
    },
    {
      window: { id: "transition", phase: "transition", startTimeS: 3780, endTimeS: 3795 },
      ballHolderId: "home_9",
      focusPlayerId: "home_9",
      homeX: toXMap([14, 38, 30, 30, 44, 52, 62, 58, 82, 88, 74]),
      awayX: toXMap([98, 80, 84, 84, 80, 68, 60, 72, 52, 58, 64]),
      adjustments: {
        home_9: { y: -1 },
        home_11: { y: -3 },
        away_5: { y: 1 },
      },
      lanes: [
        { from: "home_7", to: "home_9", probability: 0.81 },
        { from: "home_8", to: "home_11", probability: 0.78 },
        { from: "home_9", to: "home_10", probability: 0.72 },
        { from: "home_11", to: "home_10", probability: 0.68 },
      ],
      recommendations: [
        {
          playerId: "home_9",
          dx: 5,
          dy: -1,
          improvement: 0.08,
          confidence: 0.85,
          explanation: "Attack the channel immediately while the back line is still recovering toward its own goal.",
        },
        {
          playerId: "home_8",
          dx: 3,
          dy: -2,
          improvement: 0.03,
          confidence: 0.7,
          explanation: "Support underneath the break to keep the second action connected if the first run gets matched.",
        },
      ],
      overloads: [
        { x: 64, y: 10, width: 22, height: 18, team: "home", label: "Transition lane" },
      ],
      heatMapCenter: [8, 3],
      lineHeights: {
        home: [30, 57, 81],
        away: [56, 71, 84],
      },
      stateScore: 0.72,
      pitchControl: 0.58,
      predictedImprovement: 0.08,
      confidence: 0.86,
      explanation: "The transition edge is live on the right side. The best option is a direct channel run while the nearest defender is still square.",
      similarSequences: [
        {
          match_id: "sample_game_2",
          time: 4365,
          similarity_score: 0.9,
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
      pressingReport: {
        ppda: 3.5,
        counter_press_speed_s: 1.8,
        pressing_effectiveness: 0.6,
      },
      transitionReport: {
        transition_speed_s: 2.2,
        defensive_shape_recovery_s: 3.2,
      },
      possessionChains: [
        {
          team: "home",
          start_time: 3780,
          end_time: 3795,
          start_x: 42,
          end_x: 94,
          event_count: 4,
        },
      ],
    },
    {
      window: { id: "pressing", phase: "pressing", startTimeS: 3810, endTimeS: 3825 },
      ballHolderId: "away_4",
      focusPlayerId: "home_7",
      homeX: toXMap([28, 60, 54, 54, 60, 68, 76, 72, 84, 90, 82]),
      awayX: toXMap([94, 86, 82, 82, 86, 72, 64, 76, 52, 60, 66]),
      adjustments: {
        home_7: { y: -1 },
        home_9: { y: 1 },
        away_4: { y: -2 },
      },
      lanes: [
        { from: "away_1", to: "away_6", probability: 0.41 },
        { from: "away_6", to: "away_10", probability: 0.36 },
        { from: "away_6", to: "away_7", probability: 0.34 },
        { from: "home_6", to: "home_10", probability: 0.49 },
      ],
      recommendations: [
        {
          playerId: "home_7",
          dx: 4,
          dy: -1,
          improvement: 0.05,
          confidence: 0.78,
          explanation: "Jump earlier from the right wing into the pivot lane to keep the trap tight and deny the easy outlet.",
        },
      ],
      overloads: [
        { x: 66, y: 16, width: 18, height: 16, team: "away", label: "Escape lane" },
      ],
      heatMapCenter: [6, 4],
      lineHeights: {
        home: [54, 72, 85],
        away: [58, 73, 86],
      },
      stateScore: 0.63,
      pitchControl: 0.49,
      predictedImprovement: 0.05,
      confidence: 0.8,
      explanation: "The press is close to locking the opponent on one side. The missing movement is the right-sided midfielder stepping onto the pivot.",
      similarSequences: [
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
      pressingReport: {
        ppda: 2.4,
        counter_press_speed_s: 1.6,
        pressing_effectiveness: 0.74,
      },
      transitionReport: {
        transition_speed_s: 3.0,
        defensive_shape_recovery_s: 2.9,
      },
      possessionChains: [
        {
          team: "away",
          start_time: 3810,
          end_time: 3825,
          start_x: 54,
          end_x: 68,
          event_count: 3,
        },
      ],
    },
  ],
};

const sampleGameTwoBlueprint: MatchBlueprint = {
  id: "sample_game_2",
  label: "Sample Match 2",
  defaultPlayerId: "home_2",
  defaultWindowId: "chance_creation",
  phaseSummary: {
    build_up: 18,
    progression: 24,
    chance_creation: 16,
    transition: 12,
    pressing: 9,
  },
  windowEnds: [71, 72, 73, 74, 75],
  tacticalBias: 0.04,
  efficiencyBias: 0.015,
  loadBias: 10,
  homeFormation: "4-3-3",
  awayFormation: "4-2-3-1",
  phaseConfigs: [
    {
      window: { id: "build_up", phase: "build_up", startTimeS: 4260, endTimeS: 4275 },
      ballHolderId: "home_4",
      focusPlayerId: "home_6",
      homeX: toXMap([9, 24, 20, 20, 24, 36, 46, 48, 60, 64, 58]),
      awayX: toXMap([95, 81, 85, 85, 81, 69, 61, 73, 49, 57, 61]),
      adjustments: {
        home_6: { y: -1 },
        home_9: { y: 1 },
      },
      lanes: [
        { from: "home_4", to: "home_6", probability: 0.86 },
        { from: "home_6", to: "home_7", probability: 0.8 },
        { from: "home_6", to: "home_8", probability: 0.77 },
        { from: "home_5", to: "home_11", probability: 0.62 },
      ],
      recommendations: [
        {
          playerId: "home_6",
          dx: 3,
          dy: -2,
          improvement: 0.05,
          confidence: 0.77,
          explanation: "Receive slightly higher to let the left center back play through the first line instead of around it.",
        },
      ],
      overloads: [
        { x: 24, y: 18, width: 18, height: 16, team: "home", label: "Left-side exit" },
      ],
      heatMapCenter: [4, 4],
      lineHeights: {
        home: [22, 44, 61],
        away: [57, 72, 85],
      },
      stateScore: 0.6,
      pitchControl: 0.55,
      predictedImprovement: 0.05,
      confidence: 0.8,
      explanation: "The circulation shape is balanced, but the single pivot is still too deep to connect the next line cleanly.",
      similarSequences: [
        {
          match_id: "sample_game_1",
          time: 3705,
          similarity_score: 0.85,
          phase: "build_up",
          outcome: "progression",
        },
      ],
      pressingReport: {
        ppda: 6.8,
        counter_press_speed_s: 2.6,
        pressing_effectiveness: 0.45,
      },
      transitionReport: {
        transition_speed_s: 3.8,
        defensive_shape_recovery_s: 4.4,
      },
      possessionChains: [
        {
          team: "home",
          start_time: 4260,
          end_time: 4275,
          start_x: 10,
          end_x: 49,
          event_count: 6,
        },
      ],
    },
    {
      window: { id: "progression", phase: "progression", startTimeS: 4290, endTimeS: 4305 },
      ballHolderId: "home_7",
      focusPlayerId: "home_7",
      homeX: toXMap([11, 30, 24, 24, 30, 44, 56, 54, 74, 78, 70]),
      awayX: toXMap([96, 79, 83, 83, 79, 67, 59, 71, 48, 56, 60]),
      adjustments: {
        home_7: { y: -2 },
        home_9: { y: 2 },
        home_11: { y: -1 },
      },
      lanes: [
        { from: "home_6", to: "home_7", probability: 0.82 },
        { from: "home_7", to: "home_9", probability: 0.79 },
        { from: "home_7", to: "home_10", probability: 0.71 },
        { from: "home_8", to: "home_11", probability: 0.76 },
      ],
      recommendations: [
        {
          playerId: "home_7",
          dx: 4,
          dy: -2,
          improvement: 0.06,
          confidence: 0.8,
          explanation: "Carry into the half-space a touch earlier to force the away pivot off the center line.",
        },
      ],
      overloads: [
        { x: 50, y: 16, width: 18, height: 18, team: "home", label: "Interior carry lane" },
      ],
      heatMapCenter: [5, 4],
      lineHeights: {
        home: [24, 52, 75],
        away: [54, 70, 83],
      },
      stateScore: 0.67,
      pitchControl: 0.6,
      predictedImprovement: 0.06,
      confidence: 0.83,
      explanation: "The progression shape is strong, but the central carrier still has time to drive one line further before releasing the ball.",
      similarSequences: [
        {
          match_id: "sample_game_1",
          time: 3750,
          similarity_score: 0.88,
          phase: "progression",
          outcome: "territory_gain",
        },
      ],
      pressingReport: {
        ppda: 4.9,
        counter_press_speed_s: 2.2,
        pressing_effectiveness: 0.57,
      },
      transitionReport: {
        transition_speed_s: 3.1,
        defensive_shape_recovery_s: 3.8,
      },
      possessionChains: [
        {
          team: "home",
          start_time: 4290,
          end_time: 4305,
          start_x: 26,
          end_x: 82,
          event_count: 5,
        },
      ],
    },
    {
      window: { id: "chance_creation", phase: "chance_creation", startTimeS: 4320, endTimeS: 4335 },
      ballHolderId: "home_10",
      focusPlayerId: "home_10",
      homeX: toXMap([12, 50, 36, 36, 54, 60, 68, 72, 82, 90, 84]),
      awayX: toXMap([98, 85, 89, 89, 85, 73, 67, 77, 61, 65, 69]),
      adjustments: {
        home_10: { y: -2 },
        home_11: { y: -4 },
        away_3: { y: -1 },
      },
      lanes: [
        { from: "home_8", to: "home_11", probability: 0.8 },
        { from: "home_10", to: "home_9", probability: 0.74 },
        { from: "home_10", to: "home_11", probability: 0.77 },
        { from: "home_7", to: "home_10", probability: 0.71 },
      ],
      recommendations: [
        {
          playerId: "home_10",
          dx: 3,
          dy: -2,
          improvement: 0.07,
          confidence: 0.83,
          explanation: "Check off the front line and receive facing forward before spinning into the box.",
        },
        {
          playerId: "home_11",
          dx: 2,
          dy: -3,
          improvement: 0.03,
          confidence: 0.71,
          explanation: "Hold the width one beat longer to keep the full back pinned and preserve the passing lane.",
        },
      ],
      overloads: [
        { x: 62, y: 16, width: 20, height: 18, team: "home", label: "Central overload" },
      ],
      heatMapCenter: [7, 4],
      lineHeights: {
        home: [36, 66, 85],
        away: [62, 76, 89],
      },
      stateScore: 0.71,
      pitchControl: 0.64,
      predictedImprovement: 0.07,
      confidence: 0.85,
      explanation: "The ball-side overload is in place. The highest-value movement is the striker checking in before attacking the gap behind the center back.",
      similarSequences: [
        {
          match_id: "sample_game_1",
          time: 3780,
          similarity_score: 0.9,
          phase: "chance_creation",
          outcome: "shot",
        },
      ],
      pressingReport: {
        ppda: 3.1,
        counter_press_speed_s: 1.9,
        pressing_effectiveness: 0.66,
      },
      transitionReport: {
        transition_speed_s: 2.8,
        defensive_shape_recovery_s: 3.4,
      },
      possessionChains: [
        {
          team: "home",
          start_time: 4320,
          end_time: 4335,
          start_x: 40,
          end_x: 90,
          event_count: 5,
        },
      ],
    },
    {
      window: { id: "transition", phase: "transition", startTimeS: 4350, endTimeS: 4365 },
      ballHolderId: "home_9",
      focusPlayerId: "home_11",
      homeX: toXMap([13, 40, 30, 32, 46, 54, 62, 60, 80, 86, 78]),
      awayX: toXMap([98, 81, 85, 85, 81, 69, 61, 73, 53, 58, 65]),
      adjustments: {
        home_11: { y: -4 },
        home_9: { y: 2 },
      },
      lanes: [
        { from: "home_8", to: "home_11", probability: 0.79 },
        { from: "home_7", to: "home_9", probability: 0.77 },
        { from: "home_9", to: "home_10", probability: 0.71 },
        { from: "home_11", to: "home_10", probability: 0.69 },
      ],
      recommendations: [
        {
          playerId: "home_11",
          dx: 5,
          dy: -2,
          improvement: 0.08,
          confidence: 0.84,
          explanation: "Burst behind the recovering full back to turn the wide recovery run into a direct attack on goal.",
        },
      ],
      overloads: [
        { x: 68, y: 8, width: 22, height: 18, team: "home", label: "Open-side channel" },
      ],
      heatMapCenter: [8, 3],
      lineHeights: {
        home: [32, 58, 80],
        away: [56, 72, 85],
      },
      stateScore: 0.7,
      pitchControl: 0.57,
      predictedImprovement: 0.08,
      confidence: 0.85,
      explanation: "The transition is balanced toward the left side. The best action is an immediate run beyond the last line before the full back recovers.",
      similarSequences: [
        {
          match_id: "sample_game_1",
          time: 3795,
          similarity_score: 0.88,
          phase: "transition",
          outcome: "shot",
        },
      ],
      pressingReport: {
        ppda: 3.8,
        counter_press_speed_s: 1.7,
        pressing_effectiveness: 0.61,
      },
      transitionReport: {
        transition_speed_s: 2.2,
        defensive_shape_recovery_s: 3.0,
      },
      possessionChains: [
        {
          team: "home",
          start_time: 4350,
          end_time: 4365,
          start_x: 44,
          end_x: 95,
          event_count: 4,
        },
      ],
    },
    {
      window: { id: "pressing", phase: "pressing", startTimeS: 4380, endTimeS: 4395 },
      ballHolderId: "away_6",
      focusPlayerId: "home_8",
      homeX: toXMap([30, 62, 56, 56, 62, 70, 76, 74, 83, 89, 82]),
      awayX: toXMap([94, 85, 81, 81, 85, 71, 63, 75, 53, 59, 65]),
      adjustments: {
        home_8: { y: 2 },
        away_6: { y: -2 },
      },
      lanes: [
        { from: "away_1", to: "away_6", probability: 0.4 },
        { from: "away_6", to: "away_10", probability: 0.35 },
        { from: "away_6", to: "away_7", probability: 0.33 },
        { from: "home_6", to: "home_10", probability: 0.48 },
      ],
      recommendations: [
        {
          playerId: "home_8",
          dx: 3,
          dy: 2,
          improvement: 0.05,
          confidence: 0.79,
          explanation: "Step onto the far pivot to eliminate the switch and keep the press locked to one side.",
        },
      ],
      overloads: [
        { x: 64, y: 18, width: 18, height: 16, team: "away", label: "Release pocket" },
      ],
      heatMapCenter: [6, 4],
      lineHeights: {
        home: [56, 74, 84],
        away: [58, 73, 85],
      },
      stateScore: 0.62,
      pitchControl: 0.48,
      predictedImprovement: 0.05,
      confidence: 0.81,
      explanation: "The press is forcing the build-up inside. The final tightening action is the far-side midfielder stepping across to remove the switch option.",
      similarSequences: [
        {
          match_id: "sample_game_1",
          time: 3825,
          similarity_score: 0.84,
          phase: "pressing",
          outcome: "turnover",
        },
      ],
      pressingReport: {
        ppda: 2.6,
        counter_press_speed_s: 1.5,
        pressing_effectiveness: 0.76,
      },
      transitionReport: {
        transition_speed_s: 2.9,
        defensive_shape_recovery_s: 2.8,
      },
      possessionChains: [
        {
          team: "away",
          start_time: 4380,
          end_time: 4395,
          start_x: 55,
          end_x: 70,
          event_count: 3,
        },
      ],
    },
  ],
};

const DEMO_MATCHES: Record<string, MatchScenario> = {
  sample_game_1: buildMatchScenario(sampleGameOneBlueprint),
  sample_game_2: buildMatchScenario(sampleGameTwoBlueprint),
};

export function getDefaultPlayerId(matchId: string): string {
  return (DEMO_MATCHES[matchId] ?? DEMO_MATCHES[DEFAULT_MATCH_ID]).defaultPlayerId;
}

export function getDemoPhaseWindows(matchId: string): PhaseWindow[] {
  const match = DEMO_MATCHES[matchId] ?? DEMO_MATCHES[DEFAULT_MATCH_ID];
  return Object.values(match.phases).map((phase) => phase.window);
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
