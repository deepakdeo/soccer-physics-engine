import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";
import type { RunBreakdownRow } from "@/types";

interface RunClassificationProps {
  rows: RunBreakdownRow[];
}

export function RunClassification({ rows }: RunClassificationProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Run Classification</CardTitle>
          <CardDescription>
            Distribution of off-ball run types for the current intelligence profile.
          </CardDescription>
        </div>
      </CardHeader>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.runType} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[var(--ink)]">{row.runType}</span>
              <span className="text-[var(--muted)]">
                {row.count} runs · {formatPercent(row.share, 0)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${row.share * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
