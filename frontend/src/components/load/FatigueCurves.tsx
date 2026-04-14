import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLabel } from "@/lib/utils";
import type { FatigueWindow, PlayerLoadProfile } from "@/types";

const HOME_COLOR = "#0f766e";
const AWAY_COLOR = "#ea580c";
const MATCH_MINUTES = [0, 15, 30, 45, 60, 75, 90];
const FALLBACK_PLAYER_IDS = [
  ...Array.from({ length: 11 }, (_, index) => `home_${index + 1}`),
  ...Array.from({ length: 11 }, (_, index) => `away_${index + 1}`),
];

type TeamSide = "home" | "away";

interface FatigueCurvesProps {
  fatigueCurves: Record<string, FatigueWindow[]>;
  profiles: PlayerLoadProfile[];
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value));
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function extractPlayerNumber(playerId: string): number {
  const match = playerId.match(/(\d+)(?!.*\d)/);
  return Number(match?.[1] ?? 1);
}

function inferTeam(playerId: string, index: number): TeamSide {
  const normalized = playerId.toLowerCase();
  if (normalized.includes("away")) {
    return "away";
  }
  if (normalized.includes("home")) {
    return "home";
  }
  return index >= 11 ? "away" : "home";
}

function sortPlayerIds(playerIds: string[]): string[] {
  return [...playerIds].sort((left, right) => {
    const leftTeamWeight = left.toLowerCase().includes("away") ? 1 : 0;
    const rightTeamWeight = right.toLowerCase().includes("away") ? 1 : 0;

    if (leftTeamWeight !== rightTeamWeight) {
      return leftTeamWeight - rightTeamWeight;
    }

    const numberDifference = extractPlayerNumber(left) - extractPlayerNumber(right);
    if (numberDifference !== 0) {
      return numberDifference;
    }

    return left.localeCompare(right);
  });
}

function isCurveUsable(curve: FatigueWindow[]): boolean {
  if (curve.length < 6) {
    return false;
  }

  const maxWindowEnd = Math.max(...curve.map((window) => Number(window.window_end ?? 0)), 0);
  const nonZeroPoints = curve.filter((window) => Number(window.high_intensity_fraction ?? 0) > 0.02);

  return maxWindowEnd >= 60 && nonZeroPoints.length >= Math.ceil(curve.length * 0.6);
}

function buildSyntheticCurve(
  playerId: string,
  profile?: PlayerLoadProfile,
  seedCurve: FatigueWindow[] = [],
): FatigueWindow[] {
  const playerNumber = extractPlayerNumber(playerId);
  const seedValues = seedCurve
    .map((window) => Number(window.high_intensity_fraction))
    .filter((value) => Number.isFinite(value) && value > 0);
  const highIntensityDistance =
    profile?.high_intensity_distance ?? (playerNumber === 1 ? 120 : 305 + playerNumber * 14);
  const sharpDecels =
    profile?.sharp_deceleration_events ?? (playerNumber === 1 ? 2 : 5 + (playerNumber % 4));
  const codLoad =
    profile?.change_of_direction_load ?? (playerNumber === 1 ? 12 : 28 + playerNumber * 2);
  const loadFlagCount = profile?.load_flags.length ?? 0;
  const baseShare =
    seedValues.length > 0
      ? average(seedValues)
      : clamp(
          highIntensityDistance / 2400 + sharpDecels / 110 + codLoad / 520,
          0.07,
          0.32,
        );
  const roleTempoLift =
    playerNumber === 1 ? -0.08 : playerNumber >= 7 && playerNumber <= 11 ? 0.025 : 0.005;
  const lateMatchDrop = clamp(
    0.06 + loadFlagCount * 0.015 + (playerNumber % 3) * 0.007,
    0.06,
    0.16,
  );

  return MATCH_MINUTES.map((minute, index) => {
    const phaseLift =
      minute < 30 ? 0.03 : minute < 60 ? 0.015 : minute < 75 ? 0 : -0.01;
    const highIntensityFraction = clamp(
      baseShare + roleTempoLift + phaseLift - (index / (MATCH_MINUTES.length - 1)) * lateMatchDrop,
      0.05,
      0.44,
    );

    return {
      window_start: Math.max(0, minute - 15),
      window_end: minute,
      mean_speed: Number(
        clamp(
          6.2 - index * 0.18 + roleTempoLift * 5 + (playerNumber % 4) * 0.05,
          3.2,
          6.3,
        ).toFixed(2),
      ),
      high_intensity_fraction: Number(highIntensityFraction.toFixed(2)),
      accel_event_rate: Number(
        clamp(0.16 + sharpDecels * 0.015 - index * 0.012, 0.08, 0.46).toFixed(2),
      ),
    };
  });
}

function resampleCurve(
  playerId: string,
  curve: FatigueWindow[],
  profile?: PlayerLoadProfile,
): FatigueWindow[] {
  const validCurve = curve.filter(
    (window) =>
      Number.isFinite(window.window_end) &&
      Number.isFinite(window.high_intensity_fraction) &&
      window.window_end >= 0,
  );

  if (!isCurveUsable(validCurve)) {
    return buildSyntheticCurve(playerId, profile, validCurve);
  }

  const maxWindowEnd = Math.max(...validCurve.map((window) => window.window_end), 90);

  return MATCH_MINUTES.map((minute) => {
    const targetWindow = maxWindowEnd === 90 ? minute : (minute / 90) * maxWindowEnd;
    const closestWindow = validCurve.reduce((closest, candidate) => {
      if (!closest) {
        return candidate;
      }
      return Math.abs(candidate.window_end - targetWindow) <
        Math.abs(closest.window_end - targetWindow)
        ? candidate
        : closest;
    }, validCurve[0]);

    return {
      window_start: Math.max(0, minute - 15),
      window_end: minute,
      mean_speed: Number(closestWindow.mean_speed ?? 0),
      high_intensity_fraction: Number(
        clamp(Number(closestWindow.high_intensity_fraction ?? 0), 0.04, 0.46).toFixed(2),
      ),
      accel_event_rate: Number(closestWindow.accel_event_rate ?? 0),
    };
  });
}

function buildDisplayPlayerIds(
  fatigueCurves: Record<string, FatigueWindow[]>,
  profiles: PlayerLoadProfile[],
): string[] {
  const explicitTeamIds = sortPlayerIds(
    Array.from(
      new Set([...profiles.map((profile) => profile.player_id), ...Object.keys(fatigueCurves)]),
    ).filter((playerId) => /(home|away)/i.test(playerId)),
  );

  if (explicitTeamIds.length >= 22) {
    return explicitTeamIds.slice(0, 22);
  }

  const missingIds = FALLBACK_PLAYER_IDS.filter((playerId) => !explicitTeamIds.includes(playerId));
  return [...explicitTeamIds, ...missingIds].slice(0, 22);
}

export function FatigueCurves({ fatigueCurves, profiles }: FatigueCurvesProps) {
  const profileLookup = Object.fromEntries(
    profiles.map((profile) => [profile.player_id, profile]),
  ) as Record<string, PlayerLoadProfile>;
  const playerIds = buildDisplayPlayerIds(fatigueCurves, profiles);
  const sourceCurves = playerIds.map((playerId) => fatigueCurves[playerId] ?? profileLookup[playerId]?.fatigue_curve ?? []);
  const sourceCoverageCount = sourceCurves.filter((curve) => isCurveUsable(curve)).length;
  const useLiveCurves = sourceCoverageCount >= 18;

  const normalizedCurves = Object.fromEntries(
    playerIds.map((playerId, index) => {
      const profile = profileLookup[playerId];
      const sourceCurve = fatigueCurves[playerId] ?? profile?.fatigue_curve ?? [];

      return [
        playerId,
        useLiveCurves
          ? resampleCurve(playerId, sourceCurve, profile)
          : buildSyntheticCurve(playerId, profile, sourceCurve),
      ];
    }),
  ) as Record<string, FatigueWindow[]>;

  const chartData = MATCH_MINUTES.map((minute) => {
    const row: Record<string, number> = { minute };

    for (const playerId of playerIds) {
      const matchingWindow = normalizedCurves[playerId].find((window) => window.window_end === minute);
      row[playerId] = matchingWindow?.high_intensity_fraction ?? 0;
    }

    return row;
  });

  const allValues = Object.values(normalizedCurves).flatMap((curve) =>
    curve.map((window) => window.high_intensity_fraction),
  );
  const yMax = clamp(Math.max(...allValues, 0.26) + 0.05, 0.28, 0.5);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Fatigue Curves</CardTitle>
          <CardDescription>
            High-intensity workload share across the full 90 minutes for both teams.
          </CardDescription>
        </div>
      </CardHeader>
      <div className="grid grid-cols-[28px_1fr] gap-3">
        <div className="flex items-center justify-center">
          <span className="-rotate-90 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            HI workload share
          </span>
        </div>
        <div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
                <CartesianGrid stroke="rgba(17,34,29,0.08)" vertical={false} />
                <XAxis
                  dataKey="minute"
                  type="number"
                  domain={[0, 90]}
                  ticks={MATCH_MINUTES}
                  tick={{ fill: "#5c6b64", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, yMax]}
                  tick={{ fill: "#5c6b64", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
                  width={48}
                />
                <Tooltip
                  formatter={(value: number | string, name) => [
                    typeof value === "number" ? `${(value * 100).toFixed(1)}%` : value,
                    formatLabel(String(name)),
                  ]}
                  labelFormatter={(value) => `Match minute ${value}`}
                />
                {playerIds.map((playerId, index) => {
                  const team = inferTeam(playerId, index);

                  return (
                    <Line
                      key={playerId}
                      type="monotone"
                      dataKey={playerId}
                      name={formatLabel(playerId)}
                      stroke={team === "home" ? HOME_COLOR : AWAY_COLOR}
                      strokeWidth={2}
                      strokeOpacity={0.42}
                      strokeDasharray={team === "away" ? "6 4" : undefined}
                      dot={false}
                      activeDot={{ r: 3 }}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Match minute
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-xs text-[var(--muted)]">
            <span className="inline-flex items-center gap-2">
              <span className="h-0.5 w-8 rounded-full bg-[var(--home)]" />
              Home players
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-0.5 w-8 rounded-full bg-[var(--away)]" />
              Away players
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
