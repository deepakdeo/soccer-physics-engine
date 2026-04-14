import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/shared/InfoTooltip";

interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
  tooltip?: string;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
}

export function MetricCard({
  label,
  value,
  helper,
  tooltip,
  tone = "neutral",
}: MetricCardProps) {
  return (
    <Card className="h-full">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge tone={tone}>{label}</Badge>
          {tooltip ? <InfoTooltip content={tooltip} /> : null}
        </div>
        <CardTitle className="text-4xl">{value}</CardTitle>
        <CardDescription>{helper}</CardDescription>
      </div>
    </Card>
  );
}
