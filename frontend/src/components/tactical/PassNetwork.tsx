import { scaleLinear } from "d3";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLabel } from "@/lib/utils";
import type { PitchLane, PitchPlayer } from "@/types";

const WIDTH = 860;
const HEIGHT = 560;
const PADDING = 30;
const HOME_COLOR = "#0f766e";
const AWAY_COLOR = "#ea580c";

type TeamSide = "home" | "away";

interface LayoutPlayer extends PitchPlayer {
  screenX: number;
  screenY: number;
}

interface NetworkConnection {
  fromId: string;
  toId: string;
  team: TeamSide;
  probability: number;
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value));
}

function pairKey(leftId: string, rightId: string): string {
  return [leftId, rightId].sort().join("|");
}

function distance(left: [number, number], right: [number, number]): number {
  return Math.hypot(left[0] - right[0], left[1] - right[1]);
}

function nearestPlayer(point: [number, number], players: PitchPlayer[]): PitchPlayer | null {
  return players.reduce<PitchPlayer | null>((closest, candidate) => {
    if (!closest) {
      return candidate;
    }

    return distance(point, [candidate.x, candidate.y]) < distance(point, [closest.x, closest.y])
      ? candidate
      : closest;
  }, null);
}

function buildConnections(players: PitchPlayer[], lanes: PitchLane[]): NetworkConnection[] {
  const connections = new Map<string, NetworkConnection>();

  for (const lane of lanes) {
    const fromPlayer = nearestPlayer(lane.from, players);
    const toPlayer = nearestPlayer(lane.to, players);

    if (!fromPlayer || !toPlayer || fromPlayer.id === toPlayer.id || fromPlayer.team !== toPlayer.team) {
      continue;
    }

    const key = pairKey(fromPlayer.id, toPlayer.id);
    const existing = connections.get(key);

    if (!existing || lane.probability > existing.probability) {
      connections.set(key, {
        fromId: fromPlayer.id,
        toId: toPlayer.id,
        team: fromPlayer.team,
        probability: lane.probability,
      });
    }
  }

  for (const team of ["home", "away"] as const) {
    const teamPlayers = players.filter((player) => player.team === team);
    const teamConnections = [...connections.values()].filter((connection) => connection.team === team);

    if (teamConnections.length >= 5) {
      continue;
    }

    const fallbackCandidates: NetworkConnection[] = [];
    for (const player of teamPlayers) {
      const nearestTeammates = teamPlayers
        .filter((candidate) => candidate.id !== player.id)
        .sort(
          (left, right) =>
            distance([player.x, player.y], [left.x, left.y]) -
            distance([player.x, player.y], [right.x, right.y]),
        )
        .slice(0, 3);

      for (const teammate of nearestTeammates) {
        const spacing = distance([player.x, player.y], [teammate.x, teammate.y]);
        fallbackCandidates.push({
          fromId: player.id,
          toId: teammate.id,
          team,
          probability: clamp(0.86 - spacing / 85, 0.34, 0.78),
        });
      }
    }

    fallbackCandidates
      .sort((left, right) => right.probability - left.probability)
      .forEach((candidate) => {
        if ([...connections.values()].filter((connection) => connection.team === team).length >= 5) {
          return;
        }

        const key = pairKey(candidate.fromId, candidate.toId);
        if (!connections.has(key)) {
          connections.set(key, candidate);
        }
      });
  }

  return [...connections.values()].sort((left, right) => right.probability - left.probability);
}

function buildPlayerLayout(
  players: PitchPlayer[],
  xScale: (value: number) => number,
  yScale: (value: number) => number,
): LayoutPlayer[] {
  const offsets: Array<[number, number]> = [
    [0, 0],
    [14, 0],
    [-14, 0],
    [0, 14],
    [0, -14],
    [10, 10],
    [-10, 10],
    [10, -10],
    [-10, -10],
  ];
  const laidOut: LayoutPlayer[] = [];

  for (const player of players) {
    const baseX = xScale(player.x);
    const baseY = yScale(player.y);
    let screenX = baseX;
    let screenY = baseY;

    for (const [dx, dy] of offsets) {
      const candidateX = baseX + dx;
      const candidateY = baseY + dy;
      const overlaps = laidOut.some(
        (placed) => Math.hypot(candidateX - placed.screenX, candidateY - placed.screenY) < 24,
      );

      if (!overlaps) {
        screenX = candidateX;
        screenY = candidateY;
        break;
      }
    }

    laidOut.push({
      ...player,
      screenX,
      screenY,
    });
  }

  return laidOut;
}

function renderPitchMarkings(
  xScale: (value: number) => number,
  yScale: (value: number) => number,
): JSX.Element {
  const centerX = xScale(52.5);
  const centerY = yScale(34);

  return (
    <g opacity={0.55}>
      <rect
        x={xScale(0)}
        y={yScale(0)}
        width={xScale(105) - xScale(0)}
        height={yScale(68) - yScale(0)}
        rx={18}
        fill="rgba(255,255,255,0.82)"
        stroke="rgba(15,23,42,0.18)"
        strokeWidth={2}
      />
      <line
        x1={centerX}
        y1={yScale(0)}
        x2={centerX}
        y2={yScale(68)}
        stroke="rgba(15,23,42,0.16)"
        strokeWidth={2}
      />
      <circle
        cx={centerX}
        cy={centerY}
        r={48}
        fill="none"
        stroke="rgba(15,23,42,0.16)"
        strokeWidth={2}
      />
      <circle cx={centerX} cy={centerY} r={3.5} fill="rgba(15,23,42,0.18)" />
      <rect
        x={xScale(0)}
        y={yScale(13.84)}
        width={xScale(16.5) - xScale(0)}
        height={yScale(54.16) - yScale(13.84)}
        fill="none"
        stroke="rgba(15,23,42,0.16)"
        strokeWidth={2}
      />
      <rect
        x={xScale(0)}
        y={yScale(24.84)}
        width={xScale(5.5) - xScale(0)}
        height={yScale(43.16) - yScale(24.84)}
        fill="none"
        stroke="rgba(15,23,42,0.16)"
        strokeWidth={2}
      />
      <rect
        x={xScale(88.5)}
        y={yScale(13.84)}
        width={xScale(105) - xScale(88.5)}
        height={yScale(54.16) - yScale(13.84)}
        fill="none"
        stroke="rgba(15,23,42,0.16)"
        strokeWidth={2}
      />
      <rect
        x={xScale(99.5)}
        y={yScale(24.84)}
        width={xScale(105) - xScale(99.5)}
        height={yScale(43.16) - yScale(24.84)}
        fill="none"
        stroke="rgba(15,23,42,0.16)"
        strokeWidth={2}
      />
    </g>
  );
}

export function PassNetwork({ players, lanes }: { players: PitchPlayer[]; lanes: PitchLane[] }) {
  const xScale = scaleLinear<number>().domain([0, 105]).range([PADDING, WIDTH - PADDING]);
  const yScale = scaleLinear<number>().domain([0, 68]).range([PADDING, HEIGHT - PADDING]);
  const layoutPlayers = buildPlayerLayout(players, xScale, yScale);
  const playerLookup = Object.fromEntries(
    layoutPlayers.map((player) => [player.id, player]),
  ) as Record<string, LayoutPlayer>;
  const connections = buildConnections(players, lanes);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Pass Network</CardTitle>
          <CardDescription>
            Passing connections between players — thicker lines show stronger passing relationships.
          </CardDescription>
        </div>
      </CardHeader>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="aspect-[4/3] w-full rounded-[24px] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(226,232,240,0.88))]"
      >
        {renderPitchMarkings(xScale, yScale)}
        {connections.map((connection) => {
          const fromPlayer = playerLookup[connection.fromId];
          const toPlayer = playerLookup[connection.toId];

          if (!fromPlayer || !toPlayer) {
            return null;
          }

          const midX = (fromPlayer.screenX + toPlayer.screenX) / 2;
          const midY = (fromPlayer.screenY + toPlayer.screenY) / 2;
          const stroke = connection.team === "home" ? HOME_COLOR : AWAY_COLOR;
          const label = `${Math.round(connection.probability * 100)}%`;

          return (
            <g key={`${connection.fromId}-${connection.toId}`}>
              <line
                x1={fromPlayer.screenX}
                y1={fromPlayer.screenY}
                x2={toPlayer.screenX}
                y2={toPlayer.screenY}
                stroke={stroke}
                strokeWidth={2 + connection.probability * 5}
                opacity={0.28 + connection.probability * 0.55}
                strokeLinecap="round"
              />
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x={-14}
                  y={-9}
                  width={28}
                  height={18}
                  rx={9}
                  fill="rgba(255,255,255,0.95)"
                  stroke="rgba(15,23,42,0.14)"
                  strokeWidth={1}
                />
                <text
                  x={0}
                  y={0.5}
                  fill="#334155"
                  fontSize={8.5}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {label}
                </text>
              </g>
            </g>
          );
        })}
        {layoutPlayers.map((player) => (
          <g key={player.id}>
            <circle
              cx={player.screenX}
              cy={player.screenY}
              r={player.team === "home" ? 12 : 10}
              fill={player.team === "home" ? HOME_COLOR : AWAY_COLOR}
              opacity={0.94}
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
            />
            <text
              x={player.screenX}
              y={player.screenY + 1}
              fill="#f8fafc"
              fontSize={10}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {player.label}
            </text>
            <title>{formatLabel(player.id)}</title>
          </g>
        ))}
      </svg>
      <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-[var(--muted)]">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-10 rounded-full bg-[var(--home)]" />
          Home passing links
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-10 rounded-full bg-[var(--away)]" />
          Away passing links
        </span>
        <span>
          Line thickness = passing connection strength. Thicker = more frequent or higher-probability passing link.
        </span>
      </div>
    </Card>
  );
}
