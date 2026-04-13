import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FatigueWindow } from "@/types";

const COLORS = ["#0f766e", "#f97316", "#2563eb", "#7c3aed", "#dc2626"];

interface FatigueCurvesProps {
  fatigueCurves: Record<string, FatigueWindow[]>;
}

export function FatigueCurves({ fatigueCurves }: FatigueCurvesProps) {
  const playerIds = Object.keys(fatigueCurves);
  const windows = Array.from(
    new Set(
      Object.values(fatigueCurves).flatMap((curve) => curve.map((window) => window.window_end)),
    ),
  ).sort((left, right) => left - right);

  const chartData = windows.map((windowEnd) => {
    const row: Record<string, number | string | null> = {
      minute: `${windowEnd}m`,
    };

    for (const playerId of playerIds) {
      row[playerId] =
        fatigueCurves[playerId]?.find((window) => window.window_end === windowEnd)
          ?.high_intensity_fraction ?? null;
    }

    return row;
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Fatigue Curves</CardTitle>
          <CardDescription>
            High-intensity workload share across rolling windows.
          </CardDescription>
        </div>
      </CardHeader>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid stroke="rgba(17,34,29,0.08)" vertical={false} />
            <XAxis
              dataKey="minute"
              tick={{ fill: "#5c6b64", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#5c6b64", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip />
            <Legend />
            {playerIds.map((playerId, index) => (
              <Line
                key={playerId}
                type="monotone"
                dataKey={playerId}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={3}
                dot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
