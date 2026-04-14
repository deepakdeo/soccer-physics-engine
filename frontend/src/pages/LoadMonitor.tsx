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
          tooltip="How many players are included in this monitoring snapshot. A full match report should usually cover both teams, so a lower count often means the incoming feed is partial."
          tone="neutral"
        />
        <MetricCard
          label="HI Distance"
          value={`${totalHighIntensity.toFixed(0)}m`}
          helper="Total high-intensity distance across monitored players."
          tooltip="Combined meters covered at high speed by the squad in this match. Higher totals usually point to a more open game with more transitions and repeated recovery runs."
          tone="accent"
        />
        <MetricCard
          label="Sharp Decels"
          value={String(totalDecels)}
          helper="Aggregate deceleration events in the sample windows."
          tooltip="Hard braking actions across the squad. These are mechanically demanding because stopping quickly places more stress on joints and soft tissue than steady running."
          tone="warning"
        />
        <MetricCard
          label="Load Flags"
          value={String(flaggedPlayers)}
          helper="Players currently marked for monitoring."
          tooltip="Number of players whose physical workload has crossed monitoring thresholds during this match. These players may benefit from substitution or reduced training load."
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
        <FatigueCurves
          fatigueCurves={data.matchReport.fatigue_curves}
          profiles={profiles}
        />
        <AsymmetryView profiles={profiles} />
      </section>
    </div>
  );
}
