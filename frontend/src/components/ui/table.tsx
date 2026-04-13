import type { HTMLAttributes, PropsWithChildren, TableHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Table({
  children,
  className,
  ...props
}: PropsWithChildren<TableHTMLAttributes<HTMLTableElement>>) {
  return (
    <table className={cn("w-full border-separate border-spacing-y-2 text-sm", className)} {...props}>
      {children}
    </table>
  );
}

export function TableHead({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLTableSectionElement>>) {
  return (
    <thead className={cn("text-left uppercase tracking-[0.14em] text-[var(--muted)]", className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLTableSectionElement>>) {
  return (
    <tbody className={cn("text-[var(--ink)]", className)} {...props}>
      {children}
    </tbody>
  );
}
