import type { PitchLane } from "@/types";

interface PassingLanesProps {
  lanes: PitchLane[];
  xScale: (value: number) => number;
  yScale: (value: number) => number;
}

export function PassingLanes({ lanes, xScale, yScale }: PassingLanesProps) {
  return (
    <g>
      {lanes.map((lane, index) => {
        const midX = (lane.from[0] + lane.to[0]) / 2;
        const midY = (lane.from[1] + lane.to[1]) / 2;

        return (
          <g key={`${lane.from.join("-")}-${lane.to.join("-")}-${index}`}>
            <line
              x1={xScale(lane.from[0])}
              y1={yScale(lane.from[1])}
              x2={xScale(lane.to[0])}
              y2={yScale(lane.to[1])}
              stroke="#f8fafc"
              strokeWidth={2}
              strokeDasharray="8 8"
              opacity={0.18 + lane.probability * 0.62}
            />
            <text
              x={xScale(midX)}
              y={yScale(midY) - 8}
              fill="#f8fafc"
              fontSize={10}
              fontWeight={600}
              opacity={0.86}
              textAnchor="middle"
            >
              {Math.round(lane.probability * 100)}%
            </text>
          </g>
        );
      })}
    </g>
  );
}
