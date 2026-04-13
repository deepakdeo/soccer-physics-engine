import type { ChangeEventHandler } from "react";

import { cn } from "@/lib/utils";

interface SelectProps {
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

export function Select({ value, onChange, options, className }: SelectProps) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(
        "rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm text-[var(--ink)] outline-none",
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
