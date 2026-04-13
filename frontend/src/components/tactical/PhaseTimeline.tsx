import { formatLabel, formatTimeWindowLabel } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PhaseWindow } from "@/types";

const PHASE_COLORS: Record<string, string> = {
  build_up: "#0f766e",
  progression: "#14b8a6",
  chance_creation: "#f97316",
  pressing: "#dc2626",
  transition: "#2563eb",
};

interface PhaseTimelineProps {
  phases: Record<string, number>;
  windows: PhaseWindow[];
  selectedWindowId: string;
  onSelectWindow: (window: PhaseWindow) => void;
}

export function PhaseTimeline({
  phases,
  windows,
  selectedWindowId,
  onSelectWindow,
}: PhaseTimelineProps) {
  const entries = Object.entries(phases);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const windowsByPhase = Object.fromEntries(windows.map((window) => [window.phase, window]));

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
            <button
              key={phase}
              type="button"
              onClick={() => {
                const window = windowsByPhase[phase];
                if (window) {
                  onSelectWindow(window);
                }
              }}
              className="relative transition-transform hover:scale-y-105"
              style={{
                width: `${(count / Math.max(total, 1)) * 100}%`,
                backgroundColor: PHASE_COLORS[phase] ?? "#64748b",
              }}
              title={
                windowsByPhase[phase]
                  ? formatTimeWindowLabel(
                      windowsByPhase[phase].startTimeS,
                      windowsByPhase[phase].endTimeS,
                      phase,
                    )
                  : `${formatLabel(phase)}: ${count}`
              }
            >
              {selectedWindowId === windowsByPhase[phase]?.id ? (
                <span className="absolute inset-0 border-2 border-white/90" />
              ) : null}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {entries.map(([phase, count]) => {
            const window = windowsByPhase[phase];
            const isSelected = selectedWindowId === window?.id;

            return (
              <button
                key={phase}
                type="button"
                onClick={() => {
                  if (window) {
                    onSelectWindow(window);
                  }
                }}
                className={`rounded-[20px] border px-4 py-3 text-left transition ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_12px_30px_rgba(244,114,32,0.12)]"
                    : "border-[var(--line)] bg-white/60 hover:border-[var(--accent)]/40"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: PHASE_COLORS[phase] ?? "#64748b" }}
                  />
                  <p className="text-sm font-semibold text-[var(--ink)]">{formatLabel(phase)}</p>
                </div>
                <p className="text-2xl font-semibold text-[var(--ink)]">{count}</p>
                {window ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {formatTimeWindowLabel(window.startTimeS, window.endTimeS, phase)}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
