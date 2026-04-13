import type { PropsWithChildren } from "react";

import { Navigation } from "@/components/layout/Navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { HealthResponse, MatchOption, ModelInfoResponse, TabKey } from "@/types";

interface ShellProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  loading: boolean;
  error: string | null;
  health: HealthResponse;
  modelInfo: ModelInfoResponse;
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
  health,
  modelInfo,
  matchOptions,
  selectedMatchId,
  onMatchChange,
}: PropsWithChildren<ShellProps>) {
  const showHero = activeTab === "match-analysis";
  const modelVersion = modelInfo.models[0]?.version ?? 1;

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1480px] space-y-6">
        <Card className="space-y-4 px-5 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Match Selector
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--ink)]">
                Switch the full dashboard context between demo matches.
              </p>
            </div>
            <Select
              value={selectedMatchId}
              onChange={(event) => onMatchChange(event.target.value)}
              options={matchOptions}
              className="min-w-[220px]"
            />
          </div>
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
        <Card className="overflow-hidden p-0">
          <div
            className={
              showHero
                ? "space-y-5 bg-[linear-gradient(135deg,rgba(255,255,255,0.76),rgba(255,247,235,0.92))] p-6 md:p-8"
                : "flex flex-col gap-4 bg-[linear-gradient(135deg,rgba(255,255,255,0.76),rgba(255,247,235,0.92))] p-5 md:flex-row md:items-center md:justify-between"
            }
          >
            <div className={showHero ? "space-y-5" : "space-y-3"}>
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="accent">Physics-First Dashboard</Badge>
                <Badge tone={health.status === "ok" ? "success" : "danger"}>
                  API {health.status}
                </Badge>
                <Badge tone="neutral">Models v{modelVersion}.0.0</Badge>
                {loading ? <Badge tone="warning">Refreshing Data</Badge> : null}
                {error ? <Badge tone="danger">Using Demo Fallback</Badge> : null}
              </div>
              {showHero ? (
                <div className="space-y-3">
                  <h1 className="section-title max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
                    Tactical intelligence, biomechanical load monitoring, and player movement in one operating view.
                  </h1>
                  <p className="max-w-3xl text-base text-[var(--muted)] md:text-lg">
                    This interface layers pitch control, recommendation logic, load flags, and player intelligence onto one
                    match narrative so coaches can move from context to action without switching tools.
                  </p>
                </div>
              ) : null}
              <Navigation activeTab={activeTab} onTabChange={onTabChange} />
            </div>
          </div>
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
