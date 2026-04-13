import { formatLabel } from "@/lib/utils";
import type { PitchPlayer } from "@/types";

interface PlayerDotsProps {
  players: PitchPlayer[];
  selectedPlayerId?: string;
  xScale: (value: number) => number;
  yScale: (value: number) => number;
}

export function PlayerDots({
  players,
  selectedPlayerId,
  xScale,
  yScale,
}: PlayerDotsProps) {
  return (
    <g>
      {players.map((player) => {
        const isSelected = player.id === selectedPlayerId;
        const fill = player.team === "home" ? "#0f766e" : "#c2410c";
        const x = xScale(player.x);
        const y = yScale(player.y);

        return (
          <g key={player.id}>
            {player.hasBall ? (
              <circle cx={x} cy={y} r={18} fill="none" stroke="#f8fafc" strokeWidth={2} />
            ) : null}
            <circle
              cx={x}
              cy={y}
              r={isSelected ? 14 : 11}
              fill={fill}
              stroke={isSelected ? "#f8fafc" : "rgba(255,255,255,0.72)"}
              strokeWidth={isSelected ? 3 : 2}
            />
            <text
              x={x}
              y={y + 1}
              fill="#f8fafc"
              fontSize={11}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {player.label}
            </text>
            <title>{`${formatLabel(player.id)}${player.role ? ` · ${formatLabel(player.role)}` : ""}`}</title>
          </g>
        );
      })}
    </g>
  );
}
