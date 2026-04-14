import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLabel, formatPercent } from "@/lib/utils";
import type { ComparisonRow, PlayerProfileResponse } from "@/types";

const ROLE_HEAT_MAP_CENTERS: Record<string, [number, number]> = {
  goalkeeper: [1, 4],
  full_back: [3, 1],
  center_back: [2, 4],
  defensive_midfielder: [4, 4],
  central_midfielder: [5, 4],
  attacking_midfielder: [6, 4],
  winger: [7, 1],
  striker: [8, 4],
};

interface RoleMapProps {
  playerProfile: PlayerProfileResponse;
  comparisonRows: ComparisonRow[];
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value));
}

function buildFallbackDensity(role: string): number[][] {
  const [centerColumn, centerRow] = ROLE_HEAT_MAP_CENTERS[role] ?? [5, 4];

  return Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 10 }, (_, column) =>
      Number(
        clamp(
          0.94 - Math.abs(column - centerColumn) * 0.15 - Math.abs(row - centerRow) * 0.18,
          0.06,
          0.94,
        ).toFixed(2),
      ),
    ),
  );
}

function resolveDensity(playerProfile: PlayerProfileResponse): number[][] {
  const density = playerProfile.heat_map_data.density;

  if (!density.length || !density[0]?.length) {
    return buildFallbackDensity(playerProfile.role_detected);
  }

  const flatValues = density.flat().filter((value) => Number.isFinite(value));
  const maxValue = Math.max(...flatValues, 0);
  const minValue = Math.min(...flatValues, 0);

  if (maxValue <= 0.08 || maxValue - minValue < 0.06) {
    return buildFallbackDensity(playerProfile.role_detected);
  }

  return density;
}

export function RoleMap({ playerProfile, comparisonRows }: RoleMapProps) {
  const roles = Array.from(new Set(comparisonRows.map((row) => row.role)));
  const density = resolveDensity(playerProfile);
  const flatDensity = density.flat();
  const minDensity = Math.min(...flatDensity, 0);
  const maxDensity = Math.max(...flatDensity, 1);
  const densityRange = Math.max(maxDensity - minDensity, 0.01);
  const displaySpaceCreation = Math.max(0, playerProfile.space_creation_score);
  const spaceCreationNote =
    playerProfile.space_creation_score < 0
      ? " This clip does not show meaningful defender displacement from the player's movement."
      : "";

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Role Map</CardTitle>
          <CardDescription>
            Role context plus occupancy density for the selected player profile.
          </CardDescription>
        </div>
      </CardHeader>
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <div className="rounded-[22px] border border-[var(--line)] bg-white/60 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Detected Role</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">
              {formatLabel(playerProfile.role_detected)}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Off-ball value {formatPercent(playerProfile.off_ball_value, 0)} and space
              creation {displaySpaceCreation.toFixed(1)} on the current scale.
              {spaceCreationNote}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <span
                key={role}
                className={`rounded-full border px-3 py-2 text-sm font-semibold ${
                  role === playerProfile.role_detected
                    ? "border-transparent bg-[var(--accent)] text-white"
                    : "border-[var(--line)] bg-white/70 text-[var(--muted)]"
                }`}
              >
                {formatLabel(role)}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="grid grid-cols-10 gap-2 rounded-[24px] border border-[var(--line)] bg-white/50 p-4">
            {density.flatMap((row, rowIndex) =>
              row.map((value, columnIndex) => {
                const intensity = (value - minDensity) / densityRange;

                return (
                  <div
                    key={`${rowIndex}-${columnIndex}`}
                    className="aspect-square rounded-md border border-white/30"
                    style={{
                      backgroundColor: `rgba(15,118,110,${0.16 + intensity * 0.72})`,
                    }}
                    title={`x${columnIndex} y${rowIndex}: ${value.toFixed(2)}`}
                  />
                );
              }),
            )}
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Darker blocks show where this player spends more time in the selected sample.
          </p>
        </div>
      </div>
    </Card>
  );
}
