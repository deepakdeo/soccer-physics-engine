import type { PropsWithChildren } from "react";

import { Navigation } from "@/components/layout/Navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { MatchOption, TabKey } from "@/types";

interface ShellProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  loading: boolean;
  error: string | null;
  matchOptions: MatchOption[];
  selectedMatchId: string;
  onMatchChange: (matchId: string) => void;
}

export function Shell({
  children,
  activeTab,
  onTabChange,
  loading,
  error,
  matchOptions,
  selectedMatchId,
  onMatchChange,
}: PropsWithChildren<ShellProps>) {
  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1480px] space-y-6">
        <Card className="space-y-4 px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="section-title text-2xl font-semibold md:text-3xl">
                  Soccer Physics Engine
                </h1>
                <Badge tone="neutral">v1.0.0 | Demo data</Badge>
                {loading ? <Badge tone="warning">Refreshing</Badge> : null}
                {error ? <Badge tone="danger">Fallback active</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Match-based decision support for tactical analysis, physical load monitoring, and player movement intelligence.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Match
              </p>
              <Select
                value={selectedMatchId}
                onChange={(event) => onMatchChange(event.target.value)}
                options={matchOptions}
                className="min-w-[220px]"
              />
            </div>
          </div>
          <Navigation activeTab={activeTab} onTabChange={onTabChange} />
          <details className="rounded-[22px] border border-[var(--line)] bg-white/60 px-4 py-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--ink)]">
              How to use this tool
            </summary>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--muted)]">
              <li>Select a match and time window to analyze tactical patterns</li>
              <li>Switch to Load Monitor to check player physical status</li>
              <li>Use Player Intelligence to compare movement profiles</li>
            </ul>
          </details>
        </Card>
        {error ? (
          <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}
        <main>{children}</main>
      </div>
    </div>
  );
}
