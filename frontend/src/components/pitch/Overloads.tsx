import { formatLabel } from "@/lib/utils";
import type { PitchZone } from "@/types";

interface OverloadsProps {
  zones: PitchZone[];
  xScale: (value: number) => number;
  yScale: (value: number) => number;
}

export function Overloads({ zones, xScale, yScale }: OverloadsProps) {
  return (
    <g>
      {zones.map((zone) => {
        const fill = zone.team === "home" ? "#2dd4bf" : "#fb923c";
        const displayLabel =
          zone.label.trim().toLowerCase() === "transition lane"
            ? "Open channel"
            : formatLabel(zone.label);

        return (
          <g key={`${zone.label}-${zone.x}-${zone.y}`}>
            <rect
              x={xScale(zone.x)}
              y={yScale(zone.y)}
              width={xScale(zone.x + zone.width) - xScale(zone.x)}
              height={yScale(zone.y + zone.height) - yScale(zone.y)}
              rx={18}
              fill={fill}
              opacity={0.16}
              stroke={fill}
              strokeWidth={2}
              strokeDasharray="10 8"
            />
            <text
              x={xScale(zone.x + zone.width / 2)}
              y={yScale(zone.y + zone.height / 2)}
              fill="#ecfeff"
              fontSize={11}
              fontWeight={700}
              textAnchor="middle"
            >
              {displayLabel}
            </text>
          </g>
        );
      })}
    </g>
  );
}
