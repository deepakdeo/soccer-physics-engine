import { curveLinearClosed, line } from "d3";

import type { TeamShapeOverlay } from "@/types";

interface TeamShapeProps {
  overlay: TeamShapeOverlay;
  xScale: (value: number) => number;
  yScale: (value: number) => number;
}

export function TeamShape({ overlay, xScale, yScale }: TeamShapeProps) {
  const buildHullPath = line<[number, number]>()
    .x(([x]) => xScale(x))
    .y(([, y]) => yScale(y))
    .curve(curveLinearClosed);

  return (
    <g>
      {overlay.homeLines.map((value) => (
        <line
          key={`home-line-${value}`}
          x1={xScale(value)}
          y1={yScale(0)}
          x2={xScale(value)}
          y2={yScale(68)}
          stroke="#99f6e4"
          strokeDasharray="10 8"
          opacity={0.4}
        />
      ))}
      {overlay.awayLines.map((value) => (
        <line
          key={`away-line-${value}`}
          x1={xScale(value)}
          y1={yScale(0)}
          x2={xScale(value)}
          y2={yScale(68)}
          stroke="#fdba74"
          strokeDasharray="10 8"
          opacity={0.4}
        />
      ))}
      <path
        d={buildHullPath(overlay.homeHull) ?? ""}
        fill="#2dd4bf"
        opacity={0.11}
        stroke="#ccfbf1"
        strokeWidth={2}
      />
      <path
        d={buildHullPath(overlay.awayHull) ?? ""}
        fill="#fb923c"
        opacity={0.1}
        stroke="#ffedd5"
        strokeWidth={2}
      />
    </g>
  );
}
