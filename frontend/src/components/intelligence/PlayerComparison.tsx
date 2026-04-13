import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead } from "@/components/ui/table";
import { cn, formatPercent, formatLabel } from "@/lib/utils";
import type { ComparisonRow } from "@/types";

interface PlayerComparisonProps {
  rows: ComparisonRow[];
  selectedPlayerId?: string;
}

export function PlayerComparison({
  rows,
  selectedPlayerId,
}: PlayerComparisonProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Player Comparison</CardTitle>
          <CardDescription>
            Peer comparison across tactical value, off-ball value, and load flags.
          </CardDescription>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <tr>
              <th className="px-3 py-2">Player</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Tactical</th>
              <th className="px-3 py-2">Efficiency</th>
              <th className="px-3 py-2">Off-Ball</th>
              <th className="px-3 py-2">Flags</th>
            </tr>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <tr
                key={row.playerId}
                className={cn(
                  "rounded-[18px] bg-white/60",
                  selectedPlayerId === row.playerId && "bg-[var(--accent-soft)]",
                )}
              >
                <td className="rounded-l-[18px] px-3 py-3 font-semibold text-[var(--ink)]">
                  {formatLabel(row.playerId)}
                </td>
                <td className="px-3 py-3">{formatLabel(row.role)}</td>
                <td className="px-3 py-3">{formatPercent(row.tacticalValue, 0)}</td>
                <td className="px-3 py-3">{formatPercent(row.movementEfficiency, 0)}</td>
                <td className="px-3 py-3">{formatPercent(row.offBallValue, 0)}</td>
                <td className="rounded-r-[18px] px-3 py-3">{row.loadFlagCount}</td>
              </tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
