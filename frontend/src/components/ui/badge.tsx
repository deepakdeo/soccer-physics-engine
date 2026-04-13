import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
}

export function Badge({
  children,
  className,
  tone = "neutral",
  ...props
}: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        tone === "neutral" && "border-[var(--line)] bg-white/60 text-[var(--muted)]",
        tone === "accent" && "border-transparent bg-[var(--accent-soft)] text-[var(--accent)]",
        tone === "success" && "border-transparent bg-green-100 text-[var(--success)]",
        tone === "warning" && "border-transparent bg-amber-100 text-[var(--warn)]",
        tone === "danger" && "border-transparent bg-red-100 text-[var(--danger)]",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
