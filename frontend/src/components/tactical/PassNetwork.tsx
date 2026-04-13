import { scaleLinear } from "d3";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PitchLane, PitchPlayer } from "@/types";

const WIDTH = 420;
const HEIGHT = 280;
const PADDING = 24;

interface PassNetworkProps {
  players: PitchPlayer[];
  lanes: PitchLane[];
}

export function PassNetwork({ players, lanes }: PassNetworkProps) {
  const xScale = scaleLinear<number>().domain([0, 105]).range([PADDING, WIDTH - PADDING]);
  const yScale = scaleLinear<number>().domain([0, 68]).range([PADDING, HEIGHT - PADDING]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Pass Network</CardTitle>
          <CardDescription>
            Simplified network view of the strongest available lanes in the sample.
          </CardDescription>
        </div>
      </CardHeader>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full rounded-[24px] bg-[linear-gradient(135deg,rgba(15,118,110,0.12),rgba(255,255,255,0.9))]"
      >
        {lanes.map((lane, index) => (
          <line
            key={`${lane.from.join("-")}-${lane.to.join("-")}-${index}`}
            x1={xScale(lane.from[0])}
            y1={yScale(lane.from[1])}
            x2={xScale(lane.to[0])}
            y2={yScale(lane.to[1])}
            stroke="#0f766e"
            strokeWidth={2 + lane.probability * 4}
            opacity={0.2 + lane.probability * 0.6}
          />
        ))}
        {players.map((player) => (
          <g key={player.id}>
            <circle
              cx={xScale(player.x)}
              cy={yScale(player.y)}
              r={player.team === "home" ? 11 : 9}
              fill={player.team === "home" ? "#0f766e" : "#c2410c"}
              opacity={0.92}
            />
            <text
              x={xScale(player.x)}
              y={yScale(player.y) + 1}
              fill="#f8fafc"
              fontSize={10}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {player.label}
            </text>
          </g>
        ))}
      </svg>
    </Card>
  );
}
