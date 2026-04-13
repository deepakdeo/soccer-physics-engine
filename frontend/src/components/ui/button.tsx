import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5",
        variant === "primary" &&
          "border-transparent bg-[var(--accent)] text-white shadow-lg shadow-orange-200/70",
        variant === "secondary" &&
          "border-[var(--line)] bg-[var(--surface-strong)] text-[var(--ink)]",
        variant === "ghost" && "border-transparent bg-transparent text-[var(--muted)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
