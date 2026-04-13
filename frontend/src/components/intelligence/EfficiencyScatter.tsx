import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLabel } from "@/lib/utils";
import type { EfficiencyPoint } from "@/types";

interface EfficiencyScatterProps {
  points: EfficiencyPoint[];
  selectedPlayerId?: string;
}

export function EfficiencyScatter({
  points,
  selectedPlayerId,
}: EfficiencyScatterProps) {
  const home = points.filter((point) => point.team === "home");
  const away = points.filter((point) => point.team === "away");

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Efficiency Scatter</CardTitle>
          <CardDescription>
            Experimental composite movement efficiency against tactical value.
          </CardDescription>
        </div>
      </CardHeader>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgba(17,34,29,0.08)" />
            <XAxis
              type="number"
              dataKey="movementEfficiency"
              name="Movement efficiency"
              domain={[0.4, 0.9]}
              tick={{ fill: "#5c6b64", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey="tacticalValue"
              name="Tactical value"
              domain={[0.4, 0.9]}
              tick={{ fill: "#5c6b64", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ strokeDasharray: "4 4" }} />
            <Scatter name="Home" data={home} fill="#0f766e" />
            <Scatter name="Away" data={away} fill="#c2410c" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {selectedPlayerId ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          Focus player: <span className="font-semibold text-[var(--ink)]">{formatLabel(selectedPlayerId)}</span>
        </p>
      ) : null}
    </Card>
  );
}
