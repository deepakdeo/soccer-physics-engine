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
          tooltip="How quickly the team turns a regain or loose-ball win into an attacking advantage. Lower times usually mean the first forward action happens immediately."
          tone="accent"
        />
        <MetricCard
          label="Shape Recovery"
          value={`${recoverySpeed.toFixed(1)}s`}
          helper="Lower is faster defensive restabilization after loss."
          tooltip="How quickly the team regains compact defensive spacing after losing the ball. Lower times suggest stronger recovery runs and better rest defense."
          tone="warning"
        />
      </div>
    </Card>
  );
}
