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
import type { PlayerLoadProfile } from "@/types";

interface DecelChartProps {
  profiles: PlayerLoadProfile[];
}

export function DecelChart({ profiles }: DecelChartProps) {
  const chartData = profiles.map((profile) => ({
    player: formatLabel(profile.player_id),
    decels: profile.sharp_deceleration_events,
  }));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Deceleration Load</CardTitle>
          <CardDescription>
            Sharp deceleration events by player for the current report.
          </CardDescription>
        </div>
      </CardHeader>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid stroke="rgba(17,34,29,0.08)" vertical={false} />
            <XAxis
              dataKey="player"
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
            <Bar dataKey="decels" fill="#c2410c" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
