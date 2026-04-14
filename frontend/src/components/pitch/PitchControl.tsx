interface PitchControlProps {
  heatMap: number[][];
  xScale: (value: number) => number;
  yScale: (value: number) => number;
}

export function PitchControl({ heatMap, xScale, yScale }: PitchControlProps) {
  const rows = heatMap.length;
  const columns = heatMap[0]?.length ?? 0;

  if (rows === 0 || columns === 0) {
    return null;
  }

  const pitchWidth = xScale(105) - xScale(0);
  const pitchHeight = yScale(68) - yScale(0);
  const cellWidth = pitchWidth / columns;
  const cellHeight = pitchHeight / rows;

  return (
    <g>
      {heatMap.map((row, rowIndex) =>
        row.map((value, columnIndex) => {
          const dominance = Math.abs(value - 0.5) * 2;
          const opacity = 0.16 + dominance * 0.38;
          const fill = value >= 0.5 ? "#14b8a6" : "#fb923c";

          return (
            <rect
              key={`${rowIndex}-${columnIndex}`}
              x={xScale((columnIndex * 105) / columns)}
              y={yScale((rowIndex * 68) / rows)}
              width={cellWidth}
              height={cellHeight}
              fill={fill}
              opacity={opacity}
            />
          );
        }),
      )}
    </g>
  );
}
