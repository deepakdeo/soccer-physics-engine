import { formatLabel } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PHASE_COLORS: Record<string, string> = {
  build_up: "#0f766e",
  progression: "#14b8a6",
  chance_creation: "#f97316",
  pressing: "#dc2626",
  transition: "#2563eb",
};

interface PhaseTimelineProps {
  phases: Record<string, number>;
}

export function PhaseTimeline({ phases }: PhaseTimelineProps) {
  const entries = Object.entries(phases);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Phase Timeline</CardTitle>
          <CardDescription>
            Color-coded phase occupancy across the match sample.
          </CardDescription>
        </div>
      </CardHeader>
      <div className="space-y-4">
        <div className="flex h-6 overflow-hidden rounded-full border border-[var(--line)]">
          {entries.map(([phase, count]) => (
            <div
              key={phase}
              style={{
                width: `${(count / Math.max(total, 1)) * 100}%`,
                backgroundColor: PHASE_COLORS[phase] ?? "#64748b",
              }}
              title={`${formatLabel(phase)}: ${count}`}
            />
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {entries.map(([phase, count]) => (
            <div
              key={phase}
              className="rounded-[20px] border border-[var(--line)] bg-white/60 px-4 py-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: PHASE_COLORS[phase] ?? "#64748b" }}
                />
                <p className="text-sm font-semibold text-[var(--ink)]">{formatLabel(phase)}</p>
              </div>
              <p className="text-2xl font-semibold text-[var(--ink)]">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
