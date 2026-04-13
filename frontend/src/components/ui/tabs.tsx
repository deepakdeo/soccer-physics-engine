import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";
import type { TabKey } from "@/types";

interface TabsProps {
  activeTab: TabKey;
  items: Array<{ key: TabKey; label: string }>;
  onChange: (value: TabKey) => void;
}

export function Tabs({ activeTab, items, onChange }: TabsProps) {
  return (
    <div className="inline-flex rounded-full border border-[var(--line)] bg-white/70 p-1">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === item.key
              ? "bg-[var(--ink)] text-white"
              : "text-[var(--muted)] hover:text-[var(--ink)]",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function TabsPanel({ children }: PropsWithChildren) {
  return <div className="space-y-6">{children}</div>;
}
