import { Badge } from "@/components/ui/badge";

interface RiskBadgeProps {
  level: "green" | "amber" | "red";
  label?: string;
}

export function RiskBadge({ level, label }: RiskBadgeProps) {
  const tone = level === "green" ? "success" : level === "amber" ? "warning" : "danger";
  return <Badge tone={tone}>{label ?? level}</Badge>;
}
