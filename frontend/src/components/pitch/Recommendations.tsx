import type { PitchRecommendation } from "@/types";

interface RecommendationsProps {
  recommendations: PitchRecommendation[];
  selectedPlayerId?: string;
  xScale: (value: number) => number;
  yScale: (value: number) => number;
}

export function Recommendations({
  recommendations,
  selectedPlayerId,
  xScale,
  yScale,
}: RecommendationsProps) {
  return (
    <g>
      <defs>
        <marker
          id="recommendation-arrow"
          markerWidth="9"
          markerHeight="9"
          refX="7"
          refY="4.5"
          orient="auto"
        >
          <path d="M0,0 L9,4.5 L0,9 z" fill="#f97316" />
        </marker>
      </defs>
      {recommendations.map((recommendation) => {
        const isActive =
          selectedPlayerId === undefined || recommendation.player_id === selectedPlayerId;
        const label = `${Math.round(recommendation.confidence * 100)}%`;
        const labelX = xScale(recommendation.end[0]) + 18;
        const labelY = yScale(recommendation.end[1]) - 16;

        return (
          <g
            key={`${recommendation.player_id}-${recommendation.start.join("-")}`}
            opacity={isActive ? 1 : 0.42}
          >
            <line
              x1={xScale(recommendation.start[0])}
              y1={yScale(recommendation.start[1])}
              x2={xScale(recommendation.end[0])}
              y2={yScale(recommendation.end[1])}
              stroke="#f97316"
              strokeWidth={4}
              markerEnd="url(#recommendation-arrow)"
            />
            <circle
              cx={xScale(recommendation.end[0])}
              cy={yScale(recommendation.end[1])}
              r={10}
              fill="#f97316"
            />
            <g transform={`translate(${labelX}, ${labelY})`}>
              <rect
                x={-16}
                y={-9}
                width={32}
                height={18}
                rx={9}
                fill="rgba(249,115,22,0.94)"
                stroke="rgba(255,247,237,0.55)"
                strokeWidth={1}
              />
              <text
                x={0}
                y={0.5}
                fill="#fff7ed"
                fontSize={8.5}
                fontWeight={700}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {label}
              </text>
            </g>
            <title>{recommendation.explanation}</title>
          </g>
        );
      })}
    </g>
  );
}
