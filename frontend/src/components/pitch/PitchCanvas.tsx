import { scaleLinear } from "d3";

import { Overloads } from "@/components/pitch/Overloads";
import { PassingLanes } from "@/components/pitch/PassingLanes";
import { PitchControl } from "@/components/pitch/PitchControl";
import { PlayerDots } from "@/components/pitch/PlayerDots";
import { Recommendations } from "@/components/pitch/Recommendations";
import { TeamShape } from "@/components/pitch/TeamShape";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  PitchLane,
  PitchPlayer,
  PitchRecommendation,
  PitchZone,
  TeamShapeOverlay,
} from "@/types";

const SVG_WIDTH = 860;
const SVG_HEIGHT = 560;
const PADDING = 28;

interface PitchCanvasProps {
  players: PitchPlayer[];
  heatMap: number[][];
  lanes: PitchLane[];
  recommendations: PitchRecommendation[];
  overloads: PitchZone[];
  teamShape: TeamShapeOverlay;
  selectedPlayerId?: string;
  windowLabel: string;
}

export function PitchCanvas({
  players,
  heatMap,
  lanes,
  recommendations,
  overloads,
  teamShape,
  selectedPlayerId,
  windowLabel,
}: PitchCanvasProps) {
  const xScale = scaleLinear<number>()
    .domain([0, 105])
    .range([PADDING, SVG_WIDTH - PADDING]);
  const yScale = scaleLinear<number>()
    .domain([0, 68])
    .range([PADDING, SVG_HEIGHT - PADDING]);

  const centerX = xScale(52.5);
  const centerY = yScale(34);

  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="grid gap-4 border-b border-[var(--line)] px-6 py-5 md:grid-cols-[1fr_auto]">
        <div>
          <CardTitle className="text-3xl">Pitch State</CardTitle>
          <CardDescription>
            D3-scaled field geometry with pitch control, passing lanes, team shape, and
            movement recommendations over one reference sequence.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[var(--home)]" />
            Home
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[var(--away)]" />
            Away
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
            Recommendation
          </span>
        </div>
      </CardHeader>
      <div className="relative p-4 md:p-6">
        <div className="absolute left-8 top-8 z-10 rounded-full border border-white/25 bg-[rgba(10,31,22,0.72)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">
          {windowLabel}
        </div>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="aspect-[4/3] w-full rounded-[26px]"
          role="img"
          aria-label="Soccer pitch state visualization"
        >
          <defs>
            <linearGradient id="pitch-grass" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#14532d" />
              <stop offset="100%" stopColor="#0f3d23" />
            </linearGradient>
            <pattern id="pitch-stripes" width="140" height={SVG_HEIGHT} patternUnits="userSpaceOnUse">
              <rect width="70" height={SVG_HEIGHT} fill="#1d6f42" />
              <rect x="70" width="70" height={SVG_HEIGHT} fill="#195f39" />
            </pattern>
          </defs>

          <rect width={SVG_WIDTH} height={SVG_HEIGHT} rx={28} fill="url(#pitch-grass)" />
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} rx={28} fill="url(#pitch-stripes)" opacity={0.22} />

          <PitchControl heatMap={heatMap} xScale={xScale} yScale={yScale} />
          <Overloads zones={overloads} xScale={xScale} yScale={yScale} />
          <TeamShape overlay={teamShape} xScale={xScale} yScale={yScale} />
          <PassingLanes lanes={lanes} xScale={xScale} yScale={yScale} />
          <Recommendations
            recommendations={recommendations}
            selectedPlayerId={selectedPlayerId}
            xScale={xScale}
            yScale={yScale}
          />

          <rect
            x={xScale(0)}
            y={yScale(0)}
            width={xScale(105) - xScale(0)}
            height={yScale(68) - yScale(0)}
            fill="none"
            stroke="#f8fafc"
            strokeWidth={3}
            rx={18}
          />
          <line
            x1={centerX}
            y1={yScale(0)}
            x2={centerX}
            y2={yScale(68)}
            stroke="#f8fafc"
            strokeWidth={2}
            opacity={0.9}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={48}
            fill="none"
            stroke="#f8fafc"
            strokeWidth={2}
          />
          <circle cx={centerX} cy={centerY} r={4} fill="#f8fafc" />

          <rect
            x={xScale(0)}
            y={yScale(13.84)}
            width={xScale(16.5) - xScale(0)}
            height={yScale(54.16) - yScale(13.84)}
            fill="none"
            stroke="#f8fafc"
            strokeWidth={2}
          />
          <rect
            x={xScale(0)}
            y={yScale(24.84)}
            width={xScale(5.5) - xScale(0)}
            height={yScale(43.16) - yScale(24.84)}
            fill="none"
            stroke="#f8fafc"
            strokeWidth={2}
          />
          <rect
            x={xScale(88.5)}
            y={yScale(13.84)}
            width={xScale(105) - xScale(88.5)}
            height={yScale(54.16) - yScale(13.84)}
            fill="none"
            stroke="#f8fafc"
            strokeWidth={2}
          />
          <rect
            x={xScale(99.5)}
            y={yScale(24.84)}
            width={xScale(105) - xScale(99.5)}
            height={yScale(43.16) - yScale(24.84)}
            fill="none"
            stroke="#f8fafc"
            strokeWidth={2}
          />
          <rect
            x={xScale(0) - 8}
            y={yScale(30.34)}
            width={8}
            height={yScale(37.66) - yScale(30.34)}
            fill="none"
            stroke="#f8fafc"
            strokeWidth={2}
          />
          <rect
            x={xScale(105)}
            y={yScale(30.34)}
            width={8}
            height={yScale(37.66) - yScale(30.34)}
            fill="none"
            stroke="#f8fafc"
            strokeWidth={2}
          />

          <PlayerDots
            players={players}
            selectedPlayerId={selectedPlayerId}
            xScale={xScale}
            yScale={yScale}
          />
        </svg>
      </div>
    </Card>
  );
}
