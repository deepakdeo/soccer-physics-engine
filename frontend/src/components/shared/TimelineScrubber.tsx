import { formatMatchClock, formatTimeWindowLabel } from "@/lib/utils";
import type { PhaseWindow } from "@/types";

import { Slider } from "@/components/ui/slider";

interface TimelineScrubberProps {
  value: number;
  activeWindow: PhaseWindow;
  range: PhaseWindow[];
  onChange: (value: number) => void;
}

export function TimelineScrubber({
  value,
  activeWindow,
  range,
  onChange,
}: TimelineScrubberProps) {
  const min = range[0]?.endTimeS ?? activeWindow.endTimeS;
  const max = range[range.length - 1]?.endTimeS ?? activeWindow.endTimeS;

  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-white/70 px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Sequence Window
          </p>
          <p className="text-lg font-semibold text-[var(--ink)]">
            {formatTimeWindowLabel(activeWindow.startTimeS, activeWindow.endTimeS, activeWindow.phase)}
          </p>
        </div>
        <div className="text-sm text-[var(--muted)]">
          {formatMatchClock(min)} to {formatMatchClock(max)} range
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={15}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
