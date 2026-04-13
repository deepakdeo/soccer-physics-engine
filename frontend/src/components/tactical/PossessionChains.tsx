import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLabel } from "@/lib/utils";

interface PossessionChainsProps {
  chains: Array<Record<string, unknown>>;
}

export function PossessionChains({ chains }: PossessionChainsProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Possession Chains</CardTitle>
          <CardDescription>
            Territory progression and event density for representative possessions.
          </CardDescription>
        </div>
      </CardHeader>
      <div className="space-y-3">
        {chains.map((chain, index) => {
          const startX = Number(chain.start_x ?? 0);
          const endX = Number(chain.end_x ?? 0);
          const eventCount = Number(chain.event_count ?? 0);
          const gain = endX - startX;

          return (
            <div
              key={`${String(chain.team)}-${index}`}
              className="rounded-[22px] border border-[var(--line)] bg-white/65 px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    {formatLabel(String(chain.team ?? "unknown"))}
                  </p>
                  <p className="text-lg font-semibold text-[var(--ink)]">
                    {Number(chain.start_time ?? 0)}s to {Number(chain.end_time ?? 0)}s
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[var(--muted)]">Territory Gain</p>
                  <p className="text-xl font-semibold text-[var(--ink)]">
                    {gain >= 0 ? "+" : ""}
                    {gain.toFixed(0)}m
                  </p>
                </div>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[var(--home)]"
                  style={{ width: `${Math.min(100, (Math.abs(gain) / 105) * 100)}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {eventCount} events contributed to this chain.
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
