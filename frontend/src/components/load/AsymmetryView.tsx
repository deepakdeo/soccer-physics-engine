import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLabel, formatPercent } from "@/lib/utils";
import type { PlayerLoadProfile } from "@/types";

interface AsymmetryViewProps {
  profiles: PlayerLoadProfile[];
}

export function AsymmetryView({ profiles }: AsymmetryViewProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Asymmetry View</CardTitle>
          <CardDescription>
            Left versus right directional load balance for each player.
          </CardDescription>
        </div>
      </CardHeader>
      <div className="space-y-4">
        {profiles.map((profile) => {
          const leftLoad = Number(profile.directional_asymmetry.left_load ?? 0);
          const rightLoad = Number(profile.directional_asymmetry.right_load ?? 0);
          const total = Math.max(leftLoad + rightLoad, 1);
          const asymmetryRatio = Number(
            profile.directional_asymmetry.asymmetry_ratio ?? 0,
          );

          return (
            <div key={profile.player_id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[var(--ink)]">
                  {formatLabel(profile.player_id)}
                </span>
                <span className="text-[var(--muted)]">{formatPercent(asymmetryRatio, 0)}</span>
              </div>
              <div className="flex h-4 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-[var(--home)]"
                  style={{ width: `${(leftLoad / total) * 100}%` }}
                />
                <div
                  className="h-full bg-[var(--away)]"
                  style={{ width: `${(rightLoad / total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[var(--muted)]">
                <span>Left {leftLoad.toFixed(0)}</span>
                <span>Right {rightLoad.toFixed(0)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
