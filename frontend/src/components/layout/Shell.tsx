import type { PropsWithChildren } from "react";

import { Navigation } from "@/components/layout/Navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { MatchOption, TabKey } from "@/types";

interface ShellProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  isLiveData: boolean;
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
  isLiveData,
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
                <Badge tone={isLiveData ? "success" : "neutral"}>
                  {isLiveData ? "v1.0.0 | Live" : "v1.0.0 | Demo data"}
                </Badge>
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
                className="w-full min-w-[280px] max-w-[560px] lg:min-w-[420px]"
              />
            </div>
          </div>
          <Navigation activeTab={activeTab} onTabChange={onTabChange} />
          <details className="rounded-[22px] border border-[var(--line)] bg-white/60 px-4 py-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--ink)]">
              How to use this tool
            </summary>
            <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--muted)]">
              <p>
                This tool analyzes real player tracking data — the position of every player on
                the pitch, captured 25 times per second by stadium cameras.
              </p>
              <p>
                <span className="font-semibold text-[var(--ink)]">What you&apos;re seeing:</span>{" "}
                Two sample matches from Metrica Sports with anonymized players. The data is real
                match footage — real movements, real tactics — but team and player names are
                hidden.
              </p>
              <p>
                <span className="font-semibold text-[var(--ink)]">How a club would use this:</span>{" "}
                Connect your own tracking data from Second Spectrum, Hawkeye, or Stats Perform and
                see your actual players, matches, and tactical patterns analyzed automatically.
              </p>
            </div>
            <p className="mt-3 text-sm font-semibold text-[var(--ink)]">Try it now:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--muted)]">
              <li>Use the timeline slider to scrub through the match</li>
              <li>Switch between Match Analysis, Load Monitor, and Player Intelligence tabs</li>
              <li>Read the Recommendations panel for suggested tactical adjustments</li>
              <li>Check the Load Monitor to see which players are under physical strain</li>
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
