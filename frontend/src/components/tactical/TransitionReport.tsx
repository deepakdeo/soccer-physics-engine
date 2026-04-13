import { MetricCard } from "@/components/shared/MetricCard";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TransitionReportProps {
  report: Record<string, unknown>;
}

export function TransitionReport({ report }: TransitionReportProps) {
  const transitionSpeed = Number(report.transition_speed_s ?? 0);
  const recoverySpeed = Number(report.defensive_shape_recovery_s ?? 0);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Transition Report</CardTitle>
          <CardDescription>
            Attack-to-defense recovery timing and transition speed proxies.
          </CardDescription>
        </div>
      </CardHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label="Transition Speed"
          value={`${transitionSpeed.toFixed(1)}s`}
          helper="Lower is faster progression to a threatening state."
          tone="accent"
        />
        <MetricCard
          label="Shape Recovery"
          value={`${recoverySpeed.toFixed(1)}s`}
          helper="Lower is faster defensive restabilization after loss."
          tone="warning"
        />
      </div>
    </Card>
  );
}
