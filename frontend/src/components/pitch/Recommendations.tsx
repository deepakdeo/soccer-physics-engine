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
              r={12}
              fill="#f97316"
            />
            <text
              x={xScale(recommendation.end[0])}
              y={yScale(recommendation.end[1]) + 1}
              fill="#fff7ed"
              fontSize={10}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {Math.round(recommendation.confidence * 100)}
            </text>
            <title>{recommendation.explanation}</title>
          </g>
        );
      })}
    </g>
  );
}
