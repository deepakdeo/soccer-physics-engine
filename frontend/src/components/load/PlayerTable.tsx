import { useState } from "react";

import { RiskBadge } from "@/components/shared/RiskBadge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead } from "@/components/ui/table";
import { cn, formatLabel } from "@/lib/utils";
import type { PlayerLoadProfile } from "@/types";

type SortKey =
  | "player_id"
  | "high_intensity_distance"
  | "sharp_deceleration_events"
  | "change_of_direction_load"
  | "load_flags";

interface PlayerTableProps {
  profiles: PlayerLoadProfile[];
  selectedPlayerId?: string;
  onSelectPlayer?: (playerId: string) => void;
}

function getRiskLevel(profile: PlayerLoadProfile): "green" | "amber" | "red" {
  if (
    profile.load_flags.length >= 2 ||
    profile.sharp_deceleration_events >= 10 ||
    profile.change_of_direction_load >= 45
  ) {
    return "red";
  }
  if (profile.load_flags.length === 1 || profile.high_intensity_distance >= 320) {
    return "amber";
  }
  return "green";
}

export function PlayerTable({
  profiles,
  selectedPlayerId,
  onSelectPlayer,
}: PlayerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("high_intensity_distance");
  const [ascending, setAscending] = useState(false);

  const sortedProfiles = [...profiles].sort((left, right) => {
    const direction = ascending ? 1 : -1;

    if (sortKey === "player_id") {
      return direction * left.player_id.localeCompare(right.player_id);
    }
    if (sortKey === "load_flags") {
      return direction * (left.load_flags.length - right.load_flags.length);
    }

    const leftValue = Number(left[sortKey]);
    const rightValue = Number(right[sortKey]);
    return direction * (leftValue - rightValue);
  });

  function handleSort(nextKey: SortKey): void {
    if (nextKey === sortKey) {
      setAscending((value) => !value);
      return;
    }
    setSortKey(nextKey);
    setAscending(false);
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Player Load Table</CardTitle>
          <CardDescription>
            Sortable biomechanical monitoring view with flag state by player.
          </CardDescription>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <tr>
              {[
                ["player_id", "Player"],
                ["high_intensity_distance", "HI Distance"],
                ["sharp_deceleration_events", "Decels"],
                ["change_of_direction_load", "COD Load"],
                ["load_flags", "Flags"],
              ].map(([key, label]) => (
                <th key={key} className="px-3 py-2">
                  <button
                    type="button"
                    className="font-semibold"
                    onClick={() => handleSort(key as SortKey)}
                  >
                    {label}
                  </button>
                </th>
              ))}
              <th className="px-3 py-2">Status</th>
            </tr>
          </TableHead>
          <TableBody>
            {sortedProfiles.map((profile) => {
              const riskLevel = getRiskLevel(profile);

              return (
                <tr
                  key={profile.player_id}
                  className={cn(
                    "rounded-[18px] bg-white/60 transition-colors",
                    selectedPlayerId === profile.player_id && "bg-[var(--accent-soft)]",
                    onSelectPlayer !== undefined && "cursor-pointer hover:bg-white/80",
                  )}
                  onClick={() => onSelectPlayer?.(profile.player_id)}
                >
                  <td className="rounded-l-[18px] px-3 py-3 font-semibold text-[var(--ink)]">
                    {formatLabel(profile.player_id)}
                  </td>
                  <td className="px-3 py-3">{profile.high_intensity_distance.toFixed(0)}m</td>
                  <td className="px-3 py-3">{profile.sharp_deceleration_events}</td>
                  <td className="px-3 py-3">{profile.change_of_direction_load.toFixed(0)}</td>
                  <td className="px-3 py-3">
                    {profile.load_flags.length > 0
                      ? profile.load_flags.map(formatLabel).join(", ")
                      : "None"}
                  </td>
                  <td className="rounded-r-[18px] px-3 py-3">
                    <RiskBadge
                      level={riskLevel}
                      label={
                        riskLevel === "green"
                          ? "Stable"
                          : riskLevel === "amber"
                            ? "Monitor"
                            : "Flagged"
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
