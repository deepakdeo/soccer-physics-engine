import { useDeferredValue } from "react";

import { EfficiencyScatter } from "@/components/intelligence/EfficiencyScatter";
import { PlayerComparison } from "@/components/intelligence/PlayerComparison";
import { RoleMap } from "@/components/intelligence/RoleMap";
import { RunClassification } from "@/components/intelligence/RunClassification";
import { InsightBox } from "@/components/shared/InsightBox";
import { MetricCard } from "@/components/shared/MetricCard";
import { Select } from "@/components/ui/select";
import { formatLabel, formatPercent } from "@/lib/utils";
import type { DashboardData } from "@/types";

interface PlayerIntelligenceProps {
  data: DashboardData;
  selectedPlayerId: string;
  onPlayerChange: (playerId: string) => void;
}

export function PlayerIntelligence({
  data,
  selectedPlayerId,
  onPlayerChange,
}: PlayerIntelligenceProps) {
  const deferredPlayerId = useDeferredValue(selectedPlayerId);
  const selectedComparison =
    data.comparisonRows.find((row) => row.playerId === deferredPlayerId) ??
    data.comparisonRows[0] ?? {
      playerId: data.playerProfile.player_id,
      role: data.playerProfile.role_detected,
      tacticalValue: data.playerProfile.space_creation_score / 6,
      movementEfficiency: data.playerProfile.movement_efficiency,
      offBallValue: data.playerProfile.off_ball_value,
      loadFlagCount: data.analyzeSequence.load_snapshot.load_flags.length,
    };
  const displayProfile =
    data.playerProfile.player_id === deferredPlayerId
      ? data.playerProfile
      : {
          ...data.playerProfile,
          player_id: selectedComparison.playerId,
          role_detected: selectedComparison.role,
          movement_efficiency: selectedComparison.movementEfficiency,
          off_ball_value: selectedComparison.offBallValue,
          space_creation_score: selectedComparison.tacticalValue * 6,
        };

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-[var(--line)] bg-white/70 px-5 py-4">
        <p className="text-sm text-[var(--muted)]">
          Movement profiles — role, efficiency, off-ball value, run types.
        </p>
      </section>

      <section className="rounded-[28px] border border-[var(--line)] bg-white/65 px-5 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Player Selection
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Choose a player to compare movement profile outputs against the current match cohort.
            </p>
          </div>
          <Select
            value={selectedPlayerId}
            onChange={(event) => onPlayerChange(event.target.value)}
            options={data.comparisonRows.map((row) => ({
              value: row.playerId,
              label: formatLabel(row.playerId),
            }))}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Role"
          value={formatLabel(selectedComparison.role)}
          helper="Detected functional role in the current profile window."
          tone="neutral"
        />
        <MetricCard
          label="Tactical Value"
          value={formatPercent(selectedComparison.tacticalValue, 0)}
          helper="Composite tactical value within peer context."
          tone="accent"
        />
        <MetricCard
          label="Efficiency"
          value={formatPercent(selectedComparison.movementEfficiency, 0)}
          helper="Experimental composite movement metric."
          tone="success"
        />
        <MetricCard
          label="Off-Ball Value"
          value={formatPercent(selectedComparison.offBallValue, 0)}
          helper={`${selectedComparison.loadFlagCount} load flags in the comparison set.`}
          tone="warning"
        />
      </section>

      <InsightBox
        kicker="Experimental Composite"
        title="Movement efficiency is hypothesis-generating"
      >
        Use the efficiency score to compare movement patterns, not as a final truth. The
        value is most useful when paired with role context, run taxonomy, and the tactical
        phase around each action.
      </InsightBox>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <EfficiencyScatter
          points={data.efficiencyScatter}
          selectedPlayerId={deferredPlayerId}
        />
        <RoleMap
          playerProfile={displayProfile}
          comparisonRows={data.comparisonRows}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <RunClassification rows={data.runBreakdown} />
        <PlayerComparison
          rows={data.comparisonRows}
          selectedPlayerId={deferredPlayerId}
        />
      </section>
    </div>
  );
}
