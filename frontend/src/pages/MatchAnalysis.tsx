import { PitchCanvas } from "@/components/pitch/PitchCanvas";
import { InsightBox } from "@/components/shared/InsightBox";
import { MetricCard } from "@/components/shared/MetricCard";
import { TimelineScrubber } from "@/components/shared/TimelineScrubber";
import { FormationView } from "@/components/tactical/FormationView";
import { PassNetwork } from "@/components/tactical/PassNetwork";
import { PhaseTimeline } from "@/components/tactical/PhaseTimeline";
import { PossessionChains } from "@/components/tactical/PossessionChains";
import { PressingReport } from "@/components/tactical/PressingReport";
import { TransitionReport } from "@/components/tactical/TransitionReport";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLabel, formatPercent, formatTimeWindowLabel } from "@/lib/utils";
import type { DashboardData, PhaseWindow } from "@/types";

interface MatchAnalysisProps {
  data: DashboardData;
  phaseWindows: PhaseWindow[];
  activePhaseWindow: PhaseWindow;
  selectedWindow: number;
  onWindowChange: (value: number) => void;
  onPhaseWindowChange: (window: PhaseWindow) => void;
}

export function MatchAnalysis({
  data,
  phaseWindows,
  activePhaseWindow,
  selectedWindow,
  onWindowChange,
  onPhaseWindowChange,
}: MatchAnalysisProps) {
  const focusPlayerId = data.analyzeSequence.load_snapshot.player_id;
  const windowLabel = formatTimeWindowLabel(
    activePhaseWindow.startTimeS,
    activePhaseWindow.endTimeS,
    activePhaseWindow.phase,
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="State Score"
          value={formatPercent(data.analyzeSequence.state_score, 0)}
          helper="Unified tactical state score for the selected sequence."
          tone="accent"
        />
        <MetricCard
          label="Pitch Control"
          value={formatPercent(data.analyzeSequence.pitch_control, 0)}
          helper="Home team territorial control estimate."
          tone="success"
        />
        <MetricCard
          label="Predicted Gain"
          value={`+${formatPercent(data.analyzeSequence.predicted_improvement, 0)}`}
          helper="Expected improvement from the best recommendation."
          tone="warning"
        />
        <MetricCard
          label="Phase Class"
          value={formatLabel(data.analyzeSequence.phase_classification)}
          helper={`Confidence ${formatPercent(data.analyzeSequence.confidence, 0)}.`}
          tone="neutral"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.85fr]">
        <PitchCanvas
          players={data.pitchPlayers}
          heatMap={data.pitchHeatMap}
          lanes={data.pitchPassingLanes}
          recommendations={data.pitchRecommendations}
          overloads={data.pitchOverloads}
          teamShape={data.teamShapeOverlay}
          selectedPlayerId={focusPlayerId}
          windowLabel={windowLabel}
        />
        <div className="space-y-6">
          <TimelineScrubber
            value={selectedWindow}
            activeWindow={activePhaseWindow}
            range={phaseWindows}
            onChange={onWindowChange}
          />
          <InsightBox
            kicker="Sequence Insight"
            title={formatLabel(data.analyzeSequence.phase_classification)}
          >
            {data.analyzeSequence.explanation}
          </InsightBox>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Counterfactual movement suggestions for the current snapshot.
                </CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-4">
              {data.analyzeSequence.recommendations.map((recommendation) => (
                <div
                  key={`${recommendation.player_id}-${recommendation.dx}-${recommendation.dy}`}
                  className="rounded-[22px] border border-[var(--line)] bg-white/60 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        {formatLabel(recommendation.player_id)}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[var(--ink)]">
                        +{formatPercent(recommendation.improvement, 0)} expected gain
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--accent)]">
                      {formatPercent(recommendation.confidence, 0)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {recommendation.explanation}
                  </p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Similar Sequences</CardTitle>
                <CardDescription>
                  Nearest-neighbor retrieval from the sequence search endpoint.
                </CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-3">
              {data.searchSequences.similar_sequences.map((sequence) => (
                <div
                  key={`${sequence.match_id}-${sequence.time}`}
                  className="rounded-[22px] border border-[var(--line)] bg-white/60 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-[var(--ink)]">
                      {sequence.match_id} at {sequence.time}s
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {formatPercent(sequence.similarity_score, 0)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {formatLabel(sequence.phase)} led to {formatLabel(sequence.outcome)}.
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <PhaseTimeline
          phases={data.matchReport.phase_summary}
          windows={phaseWindows}
          selectedWindowId={activePhaseWindow.id}
          onSelectWindow={onPhaseWindowChange}
        />
        <PressingReport report={data.matchReport.pressing_report} />
        <TransitionReport report={data.matchReport.transition_report} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <FormationView
          formationChanges={data.matchReport.formation_changes}
          teamShapeReport={data.matchReport.team_shape_report}
        />
        <PossessionChains chains={data.matchReport.possession_chains} />
      </section>

      <section>
        <PassNetwork players={data.pitchPlayers} lanes={data.pitchPassingLanes} />
      </section>
    </div>
  );
}
