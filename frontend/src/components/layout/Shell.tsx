import type { PropsWithChildren } from "react";

import { Navigation } from "@/components/layout/Navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { HealthResponse, ModelInfoResponse, TabKey } from "@/types";

interface ShellProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  loading: boolean;
  error: string | null;
  health: HealthResponse;
  modelInfo: ModelInfoResponse;
}

export function Shell({
  children,
  activeTab,
  onTabChange,
  loading,
  error,
  health,
  modelInfo,
}: PropsWithChildren<ShellProps>) {
  const showHero = activeTab === "match-analysis";
  const modelVersion = modelInfo.models[0]?.version ?? 1;

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1480px] space-y-6">
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
