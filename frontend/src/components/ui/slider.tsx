import type { ChangeEventHandler } from "react";

import { cn } from "@/lib/utils";

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: ChangeEventHandler<HTMLInputElement>;
  className?: string;
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  className,
}: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className={cn("h-2 w-full cursor-pointer accent-[var(--accent)]", className)}
    />
  );
}
