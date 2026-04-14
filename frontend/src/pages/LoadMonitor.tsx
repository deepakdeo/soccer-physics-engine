import { AsymmetryView } from "@/components/load/AsymmetryView";
import { DecelChart } from "@/components/load/DecelChart";
import { FatigueCurves } from "@/components/load/FatigueCurves";
import { PlayerTable } from "@/components/load/PlayerTable";
import { InsightBox } from "@/components/shared/InsightBox";
import { MetricCard } from "@/components/shared/MetricCard";
import type { DashboardData } from "@/types";

interface LoadMonitorProps {
  data: DashboardData;
}

export function LoadMonitor({ data }: LoadMonitorProps) {
  const profiles = data.loadReport.player_load_profiles;
  const totalHighIntensity = profiles.reduce(
    (sum, profile) => sum + profile.high_intensity_distance,
    0,
  );
  const totalDecels = profiles.reduce(
    (sum, profile) => sum + profile.sharp_deceleration_events,
    0,
  );
  const flaggedPlayers = profiles.filter((profile) => profile.load_flags.length > 0).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-[var(--line)] bg-white/70 px-5 py-4">
        <p className="text-sm text-[var(--muted)]">
          This tracks how hard each player is working during the match. Players flagged as
          MONITOR or FLAGGED have accumulated more physical stress than usual — consider them
          for substitution or reduced intensity.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tracked Players"
          value={String(profiles.length)}
          helper="Players with load monitoring output in this report."
          tone="neutral"
        />
        <MetricCard
          label="HI Distance"
          value={`${totalHighIntensity.toFixed(0)}m`}
          helper="Total high-intensity distance across monitored players."
          tone="accent"
        />
        <MetricCard
          label="Sharp Decels"
          value={String(totalDecels)}
          helper="Aggregate deceleration events in the sample windows."
          tone="warning"
        />
        <MetricCard
          label="Load Flags"
          value={String(flaggedPlayers)}
          helper="Players currently marked for monitoring."
          tone={flaggedPlayers > 0 ? "danger" : "success"}
        />
      </section>

      <InsightBox
        kicker="Monitoring Frame"
        title="Biomechanical Load Monitoring"
      >
        These panels track workload proxies and load flags. They are intended to guide
        monitoring conversations, not to make deterministic claims about player outcomes.
      </InsightBox>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <PlayerTable profiles={profiles} />
        <DecelChart profiles={profiles} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <FatigueCurves fatigueCurves={data.matchReport.fatigue_curves} />
        <AsymmetryView profiles={profiles} />
      </section>
    </div>
  );
}
