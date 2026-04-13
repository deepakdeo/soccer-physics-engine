import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
}

export function MetricCard({
  label,
  value,
  helper,
  tone = "neutral",
}: MetricCardProps) {
  return (
    <Card className="h-full">
      <div className="space-y-3">
        <Badge tone={tone}>{label}</Badge>
        <CardTitle className="text-4xl">{value}</CardTitle>
        <CardDescription>{helper}</CardDescription>
      </div>
    </Card>
  );
}
