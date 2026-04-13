import { Slider } from "@/components/ui/slider";

interface TimelineScrubberProps {
  value: number;
  onChange: (value: number) => void;
}

export function TimelineScrubber({ value, onChange }: TimelineScrubberProps) {
  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-white/70 px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Sequence Window
          </p>
          <p className="text-lg font-semibold text-[var(--ink)]">
            {value.toFixed(0)}s reference point
          </p>
        </div>
        <div className="text-sm text-[var(--muted)]">0s to 30s demo range</div>
      </div>
      <Slider
        min={0}
        max={30}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
