import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLabel } from "@/lib/utils";

interface PressingReportProps {
  report: Record<string, number>;
}

export function PressingReport({ report }: PressingReportProps) {
  const chartData = Object.entries(report).map(([metric, value]) => ({
    metric: formatLabel(metric.replace(/_s$/, "")),
    value,
  }));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Pressing Report</CardTitle>
          <CardDescription>
            Pressing pressure proxies from the tactical report endpoint.
          </CardDescription>
        </div>
      </CardHeader>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid stroke="rgba(17,34,29,0.08)" vertical={false} />
            <XAxis
              dataKey="metric"
              tick={{ fill: "#5c6b64", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#5c6b64", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: "rgba(227,100,20,0.08)" }} />
            <Bar dataKey="value" fill="#e36414" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
