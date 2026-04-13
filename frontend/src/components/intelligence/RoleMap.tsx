import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLabel, formatPercent } from "@/lib/utils";
import type { ComparisonRow, PlayerProfileResponse } from "@/types";

interface RoleMapProps {
  playerProfile: PlayerProfileResponse;
  comparisonRows: ComparisonRow[];
}

export function RoleMap({ playerProfile, comparisonRows }: RoleMapProps) {
  const roles = Array.from(new Set(comparisonRows.map((row) => row.role)));
  const density = playerProfile.heat_map_data.density;

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
            <p className="mt-3 text-sm text-[var(--muted)]">
              Off-ball value {formatPercent(playerProfile.off_ball_value, 0)} and space
              creation {playerProfile.space_creation_score.toFixed(1)}.
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
        <div className="grid grid-cols-10 gap-2 rounded-[24px] border border-[var(--line)] bg-white/50 p-4">
          {density.flatMap((row, rowIndex) =>
            row.map((value, columnIndex) => (
              <div
                key={`${rowIndex}-${columnIndex}`}
                className="aspect-square rounded-md"
                style={{
                  backgroundColor: `rgba(15,118,110,${0.12 + value * 0.55})`,
                }}
                title={`x${columnIndex} y${rowIndex}: ${value.toFixed(2)}`}
              />
            )),
          )}
        </div>
      </div>
    </Card>
  );
}
