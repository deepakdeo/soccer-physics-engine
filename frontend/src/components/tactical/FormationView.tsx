import { formatLabel } from "@/lib/utils";
import type { FormationChange } from "@/types";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FormationViewProps {
  formationChanges: FormationChange[];
  teamShapeReport: Record<string, number>;
}

export function FormationView({
  formationChanges,
  teamShapeReport,
}: FormationViewProps) {
  const shapeMetrics = [
    { label: "Width", value: Number(teamShapeReport.width ?? 0), max: 60 },
    { label: "Depth", value: Number(teamShapeReport.depth ?? 0), max: 80 },
    {
      label: "Inter Line Distance",
      value: Number(teamShapeReport.inter_line_distance ?? 0),
      max: 30,
    },
    {
      label: "Defensive Line Height",
      value: Number(teamShapeReport.defensive_line_height ?? 0),
      max: 45,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Formation View</CardTitle>
          <CardDescription>
            Formation calls paired with shape metrics from the reporting layer.
          </CardDescription>
        </div>
      </CardHeader>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {formationChanges.map((change) => (
            <div
              key={`${change.team}-${change.timestamp_s}`}
              className="rounded-[20px] border border-[var(--line)] bg-white/60 px-4 py-3"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                {formatLabel(change.team)}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                {change.formation}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Stable from {change.timestamp_s}s onward in the sample.
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {shapeMetrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[var(--ink)]">{metric.label}</span>
                <span className="text-[var(--muted)]">{metric.value.toFixed(1)}m</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--accent-soft)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${(metric.value / metric.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm text-[var(--muted)]">
        Sample data uses reduced squad size.
      </p>
    </Card>
  );
}
